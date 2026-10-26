-- Initial schema (see docs/SPEC.md "Modelo de datos inicial").
-- Every RLS policy relies on team_members through the helper functions below.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  category text not null default '',
  season text not null default '',
  default_system text not null default '5-1'
    check (default_system in ('5-1', '6-0', '4-2', '6-2', '4-2-front')),
  enabled_modules text[] not null default array['roster', 'matches', 'lineup'],
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  birth_year int check (birth_year between 1900 and 2100),
  number int check (number between 0 and 99),
  main_position text not null check (main_position in ('setter', 'outside', 'middle', 'opposite', 'libero')),
  other_positions text[] not null default '{}'
    check (other_positions <@ array['setter', 'outside', 'middle', 'opposite', 'libero']),
  training_days text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index players_team_id_idx on public.players (team_id);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('coach', 'assistant', 'player')),
  -- Null for a player means "pending": the coach has not linked the account to a roster entry yet.
  player_id uuid references public.players (id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index team_members_user_id_idx on public.team_members (user_id);
create index team_members_player_id_idx on public.team_members (player_id);

create table public.join_codes (
  team_id uuid not null references public.teams (id) on delete cascade,
  role text not null check (role in ('assistant', 'player')),
  code text not null unique check (code ~ '^[A-Z0-9]{6,12}$'),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (team_id, role)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  opponent text not null,
  date date not null,
  warmup_time time,
  match_time time,
  venue text not null default '',
  maps_url text not null default '',
  home_away text not null default 'home' check (home_away in ('home', 'away')),
  status text not null default 'scheduled' check (status in ('scheduled', 'played', 'cancelled')),
  -- Array of {"us": int, "them": int}, one per set played.
  sets_result jsonb not null default '[]',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index matches_team_id_date_idx on public.matches (team_id, date);

create table public.availability (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  comment text not null default '',
  updated_at timestamptz not null default now(),
  primary key (match_id, player_id)
);
create index availability_player_id_idx on public.availability (player_id);

create table public.callups (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (match_id, player_id)
);
create index callups_player_id_idx on public.callups (player_id);

create table public.set_plans (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  set_number int not null check (set_number between 1 and 5),
  system text not null check (system in ('5-1', '6-0', '4-2', '6-2', '4-2-front')),
  -- Object zone ("1".."6") -> player_id.
  rotation jsonb not null default '{}',
  libero_id uuid references public.players (id) on delete set null,
  libero_replaces uuid references public.players (id) on delete set null,
  -- Array of {"out": player_id, "in": player_id, "note": text}.
  planned_subs jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (match_id, set_number)
);
create index set_plans_libero_id_idx on public.set_plans (libero_id);
create index set_plans_libero_replaces_idx on public.set_plans (libero_replaces);
create index set_plans_updated_by_idx on public.set_plans (updated_by);

create table public.league_table (
  team_id uuid primary key references public.teams (id) on delete cascade,
  rows jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create index teams_created_by_idx on public.teams (created_by);

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies can read team_members without recursion)
-- ---------------------------------------------------------------------------

create function public.role_rank(role text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case role when 'coach' then 2 when 'assistant' then 1 when 'player' then 0 else -1 end
$$;

/** True if the current user belongs to the team with at least the given role. */
create function public.has_team_role(team uuid, min_role text default 'player')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = team
      and m.user_id = (select auth.uid())
      and public.role_rank(m.role) >= public.role_rank(min_role)
  )
$$;

create function public.match_team(match uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.matches where id = match
$$;

/** True if the current user's membership in the match's team is linked to this roster entry. */
create function public.is_own_player(match uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    join public.matches mt on mt.team_id = m.team_id
    where mt.id = match and m.user_id = (select auth.uid()) and m.player_id = player
  )
$$;

/** True if the given player belongs to the match's team (prevents cross-team references). */
create function public.player_in_match_team(match uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    join public.matches mt on mt.team_id = p.team_id
    where mt.id = match and p.id = player
  )
$$;

-- ---------------------------------------------------------------------------
-- Auth: create the profile from the sign-up metadata
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

/** Creates a team and makes the caller its coach. */
create function public.create_team(name text, category text default '', season text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_team uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  insert into public.teams (name, category, season, created_by)
  values (name, category, season, (select auth.uid()))
  returning id into new_team;
  insert into public.team_members (team_id, user_id, role)
  values (new_team, (select auth.uid()), 'coach');
  return new_team;
end;
$$;

/** Joins the team owning an active join code. Players stay pending until linked to a roster entry. */
create function public.join_team(join_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  jc public.join_codes;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  select * into jc from public.join_codes
  where code = upper(trim(join_code))
    and active
    and (expires_at is null or expires_at > now());
  if not found then
    raise exception 'invalid join code' using errcode = 'P0002';
  end if;
  insert into public.team_members (team_id, user_id, role)
  values (jc.team_id, (select auth.uid()), jc.role)
  on conflict (team_id, user_id) do nothing;
  return jc.team_id;
end;
$$;

/** Creates or regenerates the join code for a role. Coach only. */
create function public.regenerate_join_code(team uuid, code_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- 8 chars without ambiguous symbols (0/O, 1/I).
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  into new_code
  from generate_series(1, 8);
  insert into public.join_codes (team_id, role, code)
  values (team, code_role, new_code)
  on conflict (team_id, role) do update set code = excluded.code, active = true, created_at = now();
  return new_code;
end;
$$;

revoke execute on function public.create_team, public.join_team, public.regenerate_join_code from public, anon;
grant execute on function public.create_team, public.join_team, public.regenerate_join_code to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.join_codes enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.availability enable row level security;
alter table public.callups enable row level security;
alter table public.set_plans enable row level security;
alter table public.league_table enable row level security;

-- profiles: own profile, plus profiles of people sharing a team.
create policy "profiles_select" on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.team_members other
      where other.user_id = profiles.id and public.has_team_role(other.team_id)
    )
  );
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- teams: created through create_team(); settings and deletion are coach only.
create policy "teams_select" on public.teams for select to authenticated
  using (public.has_team_role(id));
create policy "teams_update" on public.teams for update to authenticated
  using (public.has_team_role(id, 'coach')) with check (public.has_team_role(id, 'coach'));
create policy "teams_delete" on public.teams for delete to authenticated
  using (public.has_team_role(id, 'coach'));

-- team_members: joined through join_team(); the coach manages roles and links; anyone can leave.
create policy "team_members_select" on public.team_members for select to authenticated
  using (public.has_team_role(team_id));
create policy "team_members_update" on public.team_members for update to authenticated
  using (public.has_team_role(team_id, 'coach')) with check (public.has_team_role(team_id, 'coach'));
create policy "team_members_delete" on public.team_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_team_role(team_id, 'coach'));

-- join_codes: coach only; codes are created through regenerate_join_code().
create policy "join_codes_select" on public.join_codes for select to authenticated
  using (public.has_team_role(team_id, 'coach'));
create policy "join_codes_update" on public.join_codes for update to authenticated
  using (public.has_team_role(team_id, 'coach')) with check (public.has_team_role(team_id, 'coach'));
create policy "join_codes_delete" on public.join_codes for delete to authenticated
  using (public.has_team_role(team_id, 'coach'));

-- players: visible to the team, edited by coach and assistant.
create policy "players_select" on public.players for select to authenticated
  using (public.has_team_role(team_id));
create policy "players_insert" on public.players for insert to authenticated
  with check (public.has_team_role(team_id, 'assistant'));
create policy "players_update" on public.players for update to authenticated
  using (public.has_team_role(team_id, 'assistant')) with check (public.has_team_role(team_id, 'assistant'));
create policy "players_delete" on public.players for delete to authenticated
  using (public.has_team_role(team_id, 'assistant'));

-- matches: visible to the team, edited by coach and assistant.
create policy "matches_select" on public.matches for select to authenticated
  using (public.has_team_role(team_id));
create policy "matches_insert" on public.matches for insert to authenticated
  with check (public.has_team_role(team_id, 'assistant'));
create policy "matches_update" on public.matches for update to authenticated
  using (public.has_team_role(team_id, 'assistant')) with check (public.has_team_role(team_id, 'assistant'));
create policy "matches_delete" on public.matches for delete to authenticated
  using (public.has_team_role(team_id, 'assistant'));

-- availability: visible to the team; a player sets their own, staff can set anyone's.
create policy "availability_select" on public.availability for select to authenticated
  using (public.has_team_role(public.match_team(match_id)));
create policy "availability_insert" on public.availability for insert to authenticated
  with check (
    public.player_in_match_team(match_id, player_id)
    and (public.is_own_player(match_id, player_id) or public.has_team_role(public.match_team(match_id), 'assistant'))
  );
create policy "availability_update" on public.availability for update to authenticated
  using (public.is_own_player(match_id, player_id) or public.has_team_role(public.match_team(match_id), 'assistant'))
  with check (
    public.player_in_match_team(match_id, player_id)
    and (public.is_own_player(match_id, player_id) or public.has_team_role(public.match_team(match_id), 'assistant'))
  );
create policy "availability_delete" on public.availability for delete to authenticated
  using (public.is_own_player(match_id, player_id) or public.has_team_role(public.match_team(match_id), 'assistant'));

-- callups: visible to the team, managed by coach and assistant.
create policy "callups_select" on public.callups for select to authenticated
  using (public.has_team_role(public.match_team(match_id)));
create policy "callups_insert" on public.callups for insert to authenticated
  with check (
    public.player_in_match_team(match_id, player_id)
    and public.has_team_role(public.match_team(match_id), 'assistant')
  );
create policy "callups_delete" on public.callups for delete to authenticated
  using (public.has_team_role(public.match_team(match_id), 'assistant'));

-- set_plans: staff only for now (open question in SPEC: whether players see published plans).
create policy "set_plans_select" on public.set_plans for select to authenticated
  using (public.has_team_role(public.match_team(match_id), 'assistant'));
create policy "set_plans_insert" on public.set_plans for insert to authenticated
  with check (public.has_team_role(public.match_team(match_id), 'assistant'));
create policy "set_plans_update" on public.set_plans for update to authenticated
  using (public.has_team_role(public.match_team(match_id), 'assistant'))
  with check (public.has_team_role(public.match_team(match_id), 'assistant'));
create policy "set_plans_delete" on public.set_plans for delete to authenticated
  using (public.has_team_role(public.match_team(match_id), 'assistant'));

-- league_table: visible to the team, filled by hand by coach and assistant.
create policy "league_table_select" on public.league_table for select to authenticated
  using (public.has_team_role(team_id));
create policy "league_table_insert" on public.league_table for insert to authenticated
  with check (public.has_team_role(team_id, 'assistant'));
create policy "league_table_update" on public.league_table for update to authenticated
  using (public.has_team_role(team_id, 'assistant')) with check (public.has_team_role(team_id, 'assistant'));
