-- Set plan changes requested on 2026-10-27:
-- * The coach picks the rotation the set starts in (R1…R6), stored as start_rotation.
-- * Up to two liberos per set, with no fixed "replaces whom": libero_id + second_libero_id.
--   libero_replaces is dropped (the table was still empty).

alter table public.set_plans
  add column start_rotation int not null default 1 check (start_rotation between 1 and 6),
  add column second_libero_id uuid references public.players (id) on delete set null,
  drop column libero_replaces;

create index set_plans_second_libero_id_idx on public.set_plans (second_libero_id);
