-- Seasons inside the team (decision 2026-11-09):
-- * Each team has a list of seasons and a current one. Every match belongs to the season that was
--   current when it was created. Results, league table and MVP ranking are per season.
-- * The coach starts a new season with start_season(): names it and says who leaves. Leavers become
--   inactive roster entries ("bajas"): out of the roster, availability, call-ups and trainings, and
--   their account loses access, but their history (call-ups, MVP...) stays. Accepting them again
--   with the same roster entry brings them back.
-- * `teams.season` stays as the name of the current season (my_teams, team cards); renaming it
--   renames the current season.

-- ---------------------------------------------------------------------------
-- Seasons
-- ---------------------------------------------------------------------------

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null default '',
  started_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (id, team_id)
);
create index seasons_team_id_idx on public.seasons (team_id);

alter table public.seasons enable row level security;
-- Readable by the team; created only through create_team (trigger) and start_season().
create policy "seasons_select" on public.seasons for select to authenticated
  using (public.has_team_role(team_id));

alter table public.teams add column current_season_id uuid references public.seasons (id);

-- One season per existing team, named after `teams.season`.
insert into public.seasons (team_id, name, started_on)
select t.id, t.season, coalesce((select min(m.date) from public.matches m where m.team_id = t.id), t.created_at::date)
from public.teams t;
update public.teams t set current_season_id = s.id from public.seasons s where s.team_id = t.id;

-- ---------------------------------------------------------------------------
-- Matches and league table belong to a season of the same team
-- ---------------------------------------------------------------------------

alter table public.matches add column season_id uuid;
update public.matches m set season_id = t.current_season_id from public.teams t where t.id = m.team_id;
alter table public.matches
  alter column season_id set not null,
  add constraint matches_season_fk foreign key (season_id, team_id)
    references public.seasons (id, team_id) on delete cascade;
create index matches_season_id_idx on public.matches (season_id);

alter table public.league_table add column season_id uuid;
update public.league_table l set season_id = t.current_season_id from public.teams t where t.id = l.team_id;
alter table public.league_table
  drop constraint league_table_pkey,
  alter column season_id set not null,
  add primary key (season_id),
  add constraint league_table_season_fk foreign key (season_id, team_id)
    references public.seasons (id, team_id) on delete cascade;
create index league_table_team_id_idx on public.league_table (team_id);

/** New matches (and league tables) go to the team's current season unless one is given. */
create function public.default_current_season()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.season_id is null then
    select current_season_id into new.season_id from public.teams where id = new.team_id;
  end if;
  return new;
end;
$$;

create trigger matches_default_season
before insert on public.matches
for each row execute function public.default_current_season();

create trigger league_table_default_season
before insert on public.league_table
for each row execute function public.default_current_season();

-- ---------------------------------------------------------------------------
-- Team <-> current season
-- ---------------------------------------------------------------------------

/** A new team starts with its first season, named like `teams.season`. */
create function public.create_first_season()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first uuid;
begin
  insert into public.seasons (team_id, name) values (new.id, new.season) returning id into first;
  perform set_config('app.start_season', 'on', true);
  update public.teams set current_season_id = first where id = new.id;
  perform set_config('app.start_season', 'off', true);
  return null;
end;
$$;

create trigger teams_create_first_season
after insert on public.teams
for each row execute function public.create_first_season();

/**
 * Renaming `teams.season` renames the current season. The current season itself only changes
 * through start_season() (it must be one of the team's seasons).
 */
create function public.sync_current_season()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.current_season_id is distinct from old.current_season_id
    and coalesce(current_setting('app.start_season', true), '') <> 'on'
  then
    new.current_season_id := old.current_season_id;
  end if;
  if new.season is distinct from old.season then
    update public.seasons set name = new.season where id = new.current_season_id;
  end if;
  return new;
end;
$$;

create trigger teams_sync_current_season
before update on public.teams
for each row execute function public.sync_current_season();

revoke execute on function
  public.default_current_season(),
  public.create_first_season(),
  public.sync_current_season()
from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Leavers ("bajas")
-- ---------------------------------------------------------------------------

alter table public.players add column active boolean not null default true;

-- Inactive entries can't answer, be called up or answer trainings.
create or replace function public.player_in_match_team(match uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    join public.matches mt on mt.team_id = p.team_id
    where mt.id = match and p.id = player and p.competes and p.active
  )
$$;

create or replace function public.player_in_slot_team(slot uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    join public.training_slots s on s.team_id = p.team_id
    where s.id = slot and p.id = player and p.active
  )
$$;

/** Accepting a member with a former player's roster entry brings that entry back to the roster. */
create or replace function public.accept_member(team uuid, member uuid, player uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.players where id = player and team_id = team) then
    raise exception 'player not in team' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.team_members
    where team_id = team and player_id = player and user_id <> member
  ) then
    raise exception 'player already linked' using errcode = '23505';
  end if;
  update public.team_members set player_id = player
  where team_id = team and user_id = member and role = 'player';
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  update public.players set active = true where id = player and not active;
end;
$$;

/**
 * Starts a new season (coach only): it becomes the current one and the given roster entries leave.
 * Leavers lose their pending answers and call-ups and, if they are players with an account, their
 * access to the team (staff on the roster only get unlinked). Returns the new season's id.
 */
create function public.start_season(team uuid, season_name text, leaving uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_season uuid;
  gone uuid[] := coalesce(leaving, '{}');
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(season_name, ''))) not between 1 and 40 then
    raise exception 'season name required' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(gone) x
    where not exists (select 1 from public.players p where p.id = x and p.team_id = team)
  ) then
    raise exception 'player not in team' using errcode = 'P0002';
  end if;

  insert into public.seasons (team_id, name) values (team, trim(season_name))
  returning id into new_season;
  perform set_config('app.start_season', 'on', true);
  update public.teams set current_season_id = new_season, season = trim(season_name) where id = team;
  perform set_config('app.start_season', 'off', true);

  update public.players set active = false where id = any (gone);
  delete from public.callups c using public.matches m
  where c.match_id = m.id and m.status = 'scheduled' and c.player_id = any (gone);
  delete from public.availability a using public.matches m
  where a.match_id = m.id and m.status = 'scheduled' and a.player_id = any (gone);
  delete from public.training_attendance where player_id = any (gone) and date >= current_date;
  delete from public.team_members
  where team_id = team and role = 'player' and player_id = any (gone);
  update public.team_members set player_id = null
  where team_id = team and role <> 'player' and player_id = any (gone);

  return new_season;
end;
$$;

revoke execute on function public.start_season(uuid, text, uuid[]) from public, anon;
grant execute on function public.start_season(uuid, text, uuid[]) to authenticated;
