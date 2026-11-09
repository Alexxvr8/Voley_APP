-- Security: the helper functions of the RLS policies were callable as API endpoints
-- (/rest/v1/rpc/has_team_role, match_team…), which they are not meant to be. They move to the
-- `private` schema, which the API does not expose:
-- * Policies keep working: they point at the functions themselves, not at their names.
-- * Signed-in users keep EXECUTE on them (policies run with the caller's rights) and get USAGE on
--   the schema, but can no longer call them through the API.
-- * The RPC functions call `public.has_team_role` / `public.match_team` by name, so thin wrappers
--   with those names stay in public, callable only by their owner (RPCs run as the owner).

create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.role_rank(text) set schema private;
alter function public.has_team_role(uuid, text) set schema private;
alter function public.match_team(uuid) set schema private;
alter function public.is_own_player(uuid, uuid) set schema private;
alter function public.player_in_match_team(uuid, uuid) set schema private;
alter function public.slot_team(uuid) set schema private;
alter function public.is_own_slot_player(uuid, uuid) set schema private;
alter function public.player_in_slot_team(uuid, uuid) set schema private;

-- has_team_role called role_rank by its old name.
create or replace function private.has_team_role(team uuid, min_role text default 'player')
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
      and private.role_rank(m.role) >= private.role_rank(min_role)
      and (m.role <> 'player' or m.player_id is not null)
  )
$$;

/** Wrapper used by the RPC functions (they run as the owner). Not callable through the API. */
create function public.has_team_role(team uuid, min_role text default 'player')
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.has_team_role(team, min_role)
$$;

/** Wrapper used by the RPC functions (they run as the owner). Not callable through the API. */
create function public.match_team(match uuid)
returns uuid
language sql
stable
set search_path = ''
as $$
  select private.match_team(match)
$$;

revoke execute on function public.has_team_role(uuid, text), public.match_team(uuid)
from public, anon, authenticated;
