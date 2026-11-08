-- Training attendance and score-only match results.
-- * Every accepted player (also the ones who only train) answers whether they come to a training on
--   a specific date: yes / no / maybe. Staff see the answers and can set anyone's.
-- * Matches get their format (best of 5, best of 3, always 3 sets, 1 set) and an optional final score
--   in sets (`{"us": 2, "them": 1}`) for when the points of each set are not recorded.

-- ---------------------------------------------------------------------------
-- Training attendance
-- ---------------------------------------------------------------------------

create table public.training_attendance (
  slot_id uuid not null references public.training_slots (id) on delete cascade,
  date date not null,
  player_id uuid not null references public.players (id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  updated_at timestamptz not null default now(),
  primary key (slot_id, date, player_id)
);
create index training_attendance_player_id_idx on public.training_attendance (player_id);

/** True if the player belongs to the team of the training slot (prevents cross-team references). */
create function public.player_in_slot_team(slot uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    join public.training_slots s on s.team_id = p.team_id
    where s.id = slot and p.id = player
  )
$$;

/** True if the player is the roster entry linked to the current user in the slot's team. */
create function public.is_own_slot_player(slot uuid, player uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    join public.training_slots s on s.team_id = m.team_id
    where s.id = slot and m.user_id = (select auth.uid()) and m.player_id = player
  )
$$;

-- RLS helpers only need to run for signed-in users (policies are evaluated as the caller).
revoke execute on function
  public.player_in_slot_team(uuid, uuid),
  public.is_own_slot_player(uuid, uuid)
from public, anon;
grant execute on function
  public.player_in_slot_team(uuid, uuid),
  public.is_own_slot_player(uuid, uuid)
to authenticated;

alter table public.training_attendance enable row level security;

-- Visible to the team; a player sets their own answer, staff can set anyone's.
create policy "training_attendance_select" on public.training_attendance for select to authenticated
  using (public.has_team_role(public.slot_team(slot_id)));
create policy "training_attendance_insert" on public.training_attendance for insert to authenticated
  with check (
    public.player_in_slot_team(slot_id, player_id)
    and (public.is_own_slot_player(slot_id, player_id) or public.has_team_role(public.slot_team(slot_id), 'assistant'))
  );
create policy "training_attendance_update" on public.training_attendance for update to authenticated
  using (public.is_own_slot_player(slot_id, player_id) or public.has_team_role(public.slot_team(slot_id), 'assistant'))
  with check (
    public.player_in_slot_team(slot_id, player_id)
    and (public.is_own_slot_player(slot_id, player_id) or public.has_team_role(public.slot_team(slot_id), 'assistant'))
  );
create policy "training_attendance_delete" on public.training_attendance for delete to authenticated
  using (public.is_own_slot_player(slot_id, player_id) or public.has_team_role(public.slot_team(slot_id), 'assistant'));

-- ---------------------------------------------------------------------------
-- Match format and score-only results
-- ---------------------------------------------------------------------------

alter table public.matches
  add column sets_format text not null default 'best_of_5'
    check (sets_format in ('best_of_5', 'best_of_3', 'fixed_3', 'fixed_1')),
  -- Sets won by each side when only the final score is recorded; null when the points of each set
  -- are in sets_result (or there is no result yet).
  add column final_score jsonb
    check (
      final_score is null
      or (jsonb_typeof(final_score -> 'us') = 'number' and jsonb_typeof(final_score -> 'them') = 'number')
    );
