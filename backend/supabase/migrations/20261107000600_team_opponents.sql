-- Each team keeps a list of its usual opponents (requested on 2026-11-07). The match form suggests
-- them and still accepts any name typed by hand; matches keep their own copy of the name.

create table public.team_opponents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (team_id, name)
);

alter table public.team_opponents enable row level security;

create policy "team_opponents_select" on public.team_opponents for select to authenticated
  using (public.has_team_role(team_id));
create policy "team_opponents_insert" on public.team_opponents for insert to authenticated
  with check (public.has_team_role(team_id, 'assistant'));
create policy "team_opponents_delete" on public.team_opponents for delete to authenticated
  using (public.has_team_role(team_id, 'assistant'));
