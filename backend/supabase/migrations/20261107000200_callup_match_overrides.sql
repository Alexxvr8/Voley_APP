-- Per-match shirt number and position for called-up players (requested on 2026-11-07).
-- Null means "use the roster value". Staff can now update call-ups to change them.

alter table public.callups
  add column number int check (number between 0 and 99),
  add column position text check (position in ('setter', 'outside', 'middle', 'opposite', 'libero'));

create policy "callups_update" on public.callups for update to authenticated
  using (public.has_team_role(public.match_team(match_id), 'assistant'))
  with check (
    public.player_in_match_team(match_id, player_id)
    and public.has_team_role(public.match_team(match_id), 'assistant')
  );
