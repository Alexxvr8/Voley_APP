-- Players who are not part of the team but come sometimes (decision 2026-11-09):
-- * `member`: part of the team (as until now).
-- * `regular`: comes on some weekdays (`visit_weekdays`, 1 = Monday … 7 = Sunday), e.g. a younger
--   player who trains on Mondays. Can be called up to any match; only asked about trainings on
--   their days.
-- * `one_off`: comes on one specific day (`visit_date`) to a match or a training.
-- The app decides who is offered where; the database only keeps the data consistent. The unused
-- `training_days` column is dropped.

alter table public.players
  add column membership text not null default 'member'
    check (membership in ('member', 'regular', 'one_off')),
  add column visit_weekdays smallint[] not null default '{}'
    check (visit_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  add column visit_date date,
  add constraint players_membership_details check (
    (membership = 'member')
    or (membership = 'regular' and cardinality(visit_weekdays) > 0)
    or (membership = 'one_off' and visit_date is not null)
  ),
  drop column training_days;
