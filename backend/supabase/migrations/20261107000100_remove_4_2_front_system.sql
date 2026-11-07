-- Removes the "4-2 con posiciones delanteras" system (requested on 2026-11-07): the remaining
-- systems are 5-1, 6-0, 4-2 and 6-2. Rows still using it fall back to 4-2 (none existed).

update public.teams set default_system = '4-2' where default_system = '4-2-front';
update public.set_plans set system = '4-2' where system = '4-2-front';

alter table public.teams drop constraint teams_default_system_check;
alter table public.teams add constraint teams_default_system_check
  check (default_system in ('5-1', '6-0', '4-2', '6-2'));

alter table public.set_plans drop constraint set_plans_system_check;
alter table public.set_plans add constraint set_plans_system_check
  check (system in ('5-1', '6-0', '4-2', '6-2'));
