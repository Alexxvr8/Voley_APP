-- Requested on 2026-11-07:
-- * Warm-up is a duration before the match (15-minute steps), not a clock time:
--   matches.warmup_minutes replaces matches.warmup_time.
-- * Each team keeps a list of its usual venues with their Google Maps link (team_venues).
--   Matches and trainings still copy the name and link, so editing the list never changes history.
-- * Each team has a base colour, shown next to its name in the menu (teams.color).

-- Warm-up duration ------------------------------------------------------------

alter table public.matches
  add column warmup_minutes int check (warmup_minutes between 0 and 240 and warmup_minutes % 15 = 0);

-- Existing warm-up times become the gap to the match time, rounded to 15 minutes.
update public.matches
set warmup_minutes = least(240, greatest(0,
  round(extract(epoch from (match_time - warmup_time)) / 60 / 15) * 15))
where warmup_time is not null and match_time is not null and match_time > warmup_time;

alter table public.matches drop column warmup_time;

-- Team venues -----------------------------------------------------------------

create table public.team_venues (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  maps_url text not null default '',
  created_at timestamptz not null default now()
);
create index team_venues_team_id_idx on public.team_venues (team_id);

alter table public.team_venues enable row level security;

create policy "team_venues_select" on public.team_venues for select to authenticated
  using (public.has_team_role(team_id));
create policy "team_venues_insert" on public.team_venues for insert to authenticated
  with check (public.has_team_role(team_id, 'assistant'));
create policy "team_venues_update" on public.team_venues for update to authenticated
  using (public.has_team_role(team_id, 'assistant')) with check (public.has_team_role(team_id, 'assistant'));
create policy "team_venues_delete" on public.team_venues for delete to authenticated
  using (public.has_team_role(team_id, 'assistant'));

-- Team colour -----------------------------------------------------------------

alter table public.teams
  add column color text not null default '#1e40af' check (color ~ '^#[0-9a-f]{6}$');

-- my_teams() also returns the colour (the return type changes, so it is recreated).
drop function public.my_teams();

create function public.my_teams()
returns table (
  team_id uuid,
  name text,
  category text,
  season text,
  color text,
  role text,
  player_id uuid,
  pending boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.name, t.category, t.season, t.color, m.role, m.player_id,
         (m.role = 'player' and m.player_id is null)
  from public.team_members m
  join public.teams t on t.id = m.team_id
  where m.user_id = (select auth.uid())
  order by t.name
$$;

revoke execute on function public.my_teams() from public, anon;
grant execute on function public.my_teams() to authenticated;
