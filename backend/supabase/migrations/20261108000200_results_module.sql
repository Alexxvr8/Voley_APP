-- Results module (phase 2): played matches and an unofficial league table filled in by hand.
-- * The coach can remove the table (it is optional): delete policy on league_table.
-- * The module is on for new teams and for the existing ones.

create policy "league_table_delete" on public.league_table for delete to authenticated
  using (public.has_team_role(team_id, 'assistant'));

alter table public.teams
  alter column enabled_modules set default array['teams', 'roster', 'matches', 'lineup', 'results'];

update public.teams set enabled_modules = array_append(enabled_modules, 'results')
where not ('results' = any (enabled_modules));
