-- Phase 2: set plans are saved on the server, also from edits made offline and synced later.
-- save_set_plan() upserts one set and tells the caller when someone else had changed that set
-- after the version their edit was based on: the last save wins, and the app warns about it.

create function public.save_set_plan(
  match uuid,
  set_number int,
  system text,
  start_rotation int,
  rotation jsonb,
  libero_id uuid,
  second_libero_id uuid,
  planned_subs jsonb,
  base_updated_at timestamptz
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  existing public.set_plans;
  saved public.set_plans;
  overwritten_name text;
begin
  select * into existing from public.set_plans p
  where p.match_id = match and p.set_number = save_set_plan.set_number
  for update;

  -- Someone else saved this set after the version this edit started from.
  if found and existing.updated_by is distinct from (select auth.uid())
     and (base_updated_at is null or existing.updated_at > base_updated_at) then
    select display_name into overwritten_name from public.profiles where id = existing.updated_by;
  end if;

  insert into public.set_plans as p (
    match_id, set_number, system, start_rotation, rotation, libero_id, second_libero_id,
    planned_subs, updated_at, updated_by
  )
  values (
    match, save_set_plan.set_number, save_set_plan.system, save_set_plan.start_rotation,
    save_set_plan.rotation, save_set_plan.libero_id, save_set_plan.second_libero_id,
    save_set_plan.planned_subs, now(), (select auth.uid())
  )
  on conflict (match_id, set_number) do update set
    system = excluded.system,
    start_rotation = excluded.start_rotation,
    rotation = excluded.rotation,
    libero_id = excluded.libero_id,
    second_libero_id = excluded.second_libero_id,
    planned_subs = excluded.planned_subs,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by
  returning * into saved;

  return jsonb_build_object(
    'updated_at', saved.updated_at,
    'overwritten', overwritten_name is not null,
    'overwritten_by', overwritten_name
  );
end;
$$;

revoke execute on function public.save_set_plan(uuid, int, text, int, jsonb, uuid, uuid, jsonb, timestamptz)
  from public, anon;
grant execute on function public.save_set_plan(uuid, int, text, int, jsonb, uuid, uuid, jsonb, timestamptz)
  to authenticated;
