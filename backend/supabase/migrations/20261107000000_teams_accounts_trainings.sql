-- Phase 1 changes requested on 2026-11-07:
-- * Players who join with a code stay pending (no access to team data) until the coach accepts them.
-- * my_teams() lists the caller's teams with their role and whether they are pending.
-- * Roster entries can be marked as "only trains" (competes = false): no availability or call-ups.
-- * Weekly training schedule per team, with single-day cancellations.
-- * Self-service password recovery with a recovery code, plus a coach reset as fallback.

-- ---------------------------------------------------------------------------
-- Roster: competes / only trains
-- ---------------------------------------------------------------------------

alter table public.players add column competes boolean not null default true;

-- The team module (codes, members, schedule) is on for every team.
alter table public.teams alter column enabled_modules set default array['teams', 'roster', 'matches', 'lineup'];
update public.teams set enabled_modules = array_prepend('teams', enabled_modules)
where not ('teams' = any (enabled_modules));

-- ---------------------------------------------------------------------------
-- Pending players get no access until accepted
-- ---------------------------------------------------------------------------

/** True if the current user belongs to the team with at least the given role. Pending players do not count. */
create or replace function public.has_team_role(team uuid, min_role text default 'player')
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
      and (m.role <> 'player' or m.player_id is not null)
  )
$$;

/** True if the player belongs to the match's team and competes (players who only train are left out of matches). */
create or replace function public.player_in_match_team(match uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    join public.matches mt on mt.team_id = p.team_id
    where mt.id = match and p.id = player and p.competes
  )
$$;

/** Teams of the current user, including the ones where they are still pending. */
create function public.my_teams()
returns table (
  team_id uuid,
  name text,
  category text,
  season text,
  role text,
  player_id uuid,
  pending boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.name, t.category, t.season, m.role, m.player_id,
         (m.role = 'player' and m.player_id is null)
  from public.team_members m
  join public.teams t on t.id = m.team_id
  where m.user_id = (select auth.uid())
  order by t.name
$$;

/** Members of a team with their names, for the staff screens. Staff only. */
create function public.team_members_overview(team uuid)
returns table (
  user_id uuid,
  username text,
  display_name text,
  role text,
  player_id uuid,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(team, 'assistant') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select m.user_id, p.username, p.display_name, m.role, m.player_id, m.joined_at
    from public.team_members m
    join public.profiles p on p.id = m.user_id
    where m.team_id = team
    order by m.joined_at;
end;
$$;

/** Accepts a pending player by linking their account to a roster entry of the same team. Coach only. */
create function public.accept_member(team uuid, member uuid, player uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.players where id = player and team_id = team) then
    raise exception 'player not in team' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.team_members
    where team_id = team and player_id = player and user_id <> member
  ) then
    raise exception 'player already linked' using errcode = '23505';
  end if;
  update public.team_members set player_id = player
  where team_id = team and user_id = member and role = 'player';
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekly training schedule
-- ---------------------------------------------------------------------------

create table public.training_slots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  -- ISO weekday: 1 = Monday … 7 = Sunday.
  weekday int not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  venue text not null default '',
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index training_slots_team_id_idx on public.training_slots (team_id);

-- A single date on which a weekly training does not happen.
create table public.training_cancellations (
  slot_id uuid not null references public.training_slots (id) on delete cascade,
  date date not null,
  primary key (slot_id, date)
);

create function public.slot_team(slot uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.training_slots where id = slot
$$;

alter table public.training_slots enable row level security;
alter table public.training_cancellations enable row level security;

create policy "training_slots_select" on public.training_slots for select to authenticated
  using (public.has_team_role(team_id));
create policy "training_slots_insert" on public.training_slots for insert to authenticated
  with check (public.has_team_role(team_id, 'assistant'));
create policy "training_slots_update" on public.training_slots for update to authenticated
  using (public.has_team_role(team_id, 'assistant')) with check (public.has_team_role(team_id, 'assistant'));
create policy "training_slots_delete" on public.training_slots for delete to authenticated
  using (public.has_team_role(team_id, 'assistant'));

create policy "training_cancellations_select" on public.training_cancellations for select to authenticated
  using (public.has_team_role(public.slot_team(slot_id)));
create policy "training_cancellations_insert" on public.training_cancellations for insert to authenticated
  with check (public.has_team_role(public.slot_team(slot_id), 'assistant'));
create policy "training_cancellations_delete" on public.training_cancellations for delete to authenticated
  using (public.has_team_role(public.slot_team(slot_id), 'assistant'));

-- ---------------------------------------------------------------------------
-- Password recovery
-- ---------------------------------------------------------------------------

-- One recovery code per account, stored only as a bcrypt hash. No policies: reached only through the functions below.
create table public.account_recovery (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.account_recovery enable row level security;

/** Random string from an alphabet without look-alike symbols (0/O, 1/I), using a secure random source. */
create function public.random_code(length int)
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + get_byte(bytes, i) % 32, 1), '' order by i)
  from (select extensions.gen_random_bytes(length) as bytes) b,
       generate_series(0, length - 1) as i
$$;

/** Replaces the user's recovery code and returns it formatted as XXXX-XXXX-XXXX. Internal. */
create function public.issue_recovery_code(account uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  code text := public.random_code(12);
begin
  insert into public.account_recovery (user_id, code_hash)
  values (account, extensions.crypt(code, extensions.gen_salt('bf')))
  on conflict (user_id) do update
    set code_hash = excluded.code_hash, failed_attempts = 0, locked_until = null, updated_at = now();
  return substr(code, 1, 4) || '-' || substr(code, 5, 4) || '-' || substr(code, 9, 4);
end;
$$;

/** Creates or replaces the current user's recovery code. The plain code is only returned here, once. */
create function public.create_recovery_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  return public.issue_recovery_code((select auth.uid()));
end;
$$;

/**
 * Sets a new password using the username and recovery code. Callable without a session.
 * Returns {"ok": true, "code": <new recovery code>} or {"ok": false}. It returns instead of raising
 * so failed attempts are counted: 5 failures lock the code for 15 minutes.
 */
create function public.reset_password_with_code(username text, code text, new_password text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  account uuid;
  recovery public.account_recovery;
  clean_code text := upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g'));
begin
  if char_length(new_password) < 6 then
    return jsonb_build_object('ok', false, 'reason', 'weak_password');
  end if;
  select id into account from public.profiles where profiles.username = lower(trim(reset_password_with_code.username));
  select * into recovery from public.account_recovery where user_id = account for update;
  if not found or (recovery.locked_until is not null and recovery.locked_until > now()) then
    return jsonb_build_object('ok', false);
  end if;
  if extensions.crypt(clean_code, recovery.code_hash) <> recovery.code_hash then
    update public.account_recovery
    set failed_attempts = failed_attempts + 1,
        locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' end
    where user_id = account;
    return jsonb_build_object('ok', false);
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
  where id = account;
  -- The used code is replaced so it cannot be used again.
  return jsonb_build_object('ok', true, 'code', public.issue_recovery_code(account));
end;
$$;

/** Coach fallback: sets a temporary password for a non-coach member of the team and returns it. */
create function public.coach_reset_password(team uuid, member uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  temporary_password text := lower(public.random_code(8));
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.team_members where team_id = team and user_id = member and role <> 'coach'
  ) then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(temporary_password, extensions.gen_salt('bf')), updated_at = now()
  where id = member;
  return temporary_password;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function
  public.random_code(int),
  public.issue_recovery_code(uuid)
from public, anon, authenticated;

revoke execute on function
  public.my_teams(),
  public.team_members_overview(uuid),
  public.accept_member(uuid, uuid, uuid),
  public.slot_team(uuid),
  public.create_recovery_code(),
  public.coach_reset_password(uuid, uuid),
  public.reset_password_with_code(text, text, text)
from public, anon;

grant execute on function
  public.my_teams(),
  public.team_members_overview(uuid),
  public.accept_member(uuid, uuid, uuid),
  public.slot_team(uuid),
  public.create_recovery_code(),
  public.coach_reset_password(uuid, uuid)
to authenticated;

-- Password reset is for people who cannot sign in.
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;
