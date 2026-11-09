-- MVP module: secret vote for the best player of a played match.
-- * Voters: the coach and every called-up player with a linked account (same weight). Each voter
--   picks 1 or 2 called-up players, never themselves, and can change their vote while it is open.
-- * The vote opens when the match is marked as played (if the team has the `mvp` module on) or when
--   the coach opens it, and closes after 48 h or earlier if the coach closes it. Closing happens
--   lazily: any call that looks at the vote after the deadline closes it first (no cron needed).
-- * On closing: no votes → no MVP; a single leader → MVP; a tie at the top → the coach picks one or
--   more of the tied players (co-MVP).
-- * Votes are only reachable through the functions below; nobody sees who voted whom.

-- ---------------------------------------------------------------------------
-- Columns and table
-- ---------------------------------------------------------------------------

alter table public.matches
  add column mvp_status text not null default 'closed'
    check (mvp_status in ('closed', 'open', 'tie_pending', 'finished')),
  add column mvp_closes_at timestamptz,
  add column mvp_winners uuid[] not null default '{}';

-- Whether players see the season MVP ranking (the coach always does).
alter table public.teams add column mvp_ranking_visible boolean not null default true;

create table public.mvp_votes (
  match_id uuid not null references public.matches (id) on delete cascade,
  voter_user_id uuid not null references auth.users (id) on delete cascade,
  voted_player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, voter_user_id, voted_player_id)
);
create index mvp_votes_voted_player_id_idx on public.mvp_votes (voted_player_id);
create index mvp_votes_voter_user_id_idx on public.mvp_votes (voter_user_id);

-- No policies: only the security definer functions below read or write votes.
alter table public.mvp_votes enable row level security;

-- ---------------------------------------------------------------------------
-- Guard of the MVP columns and automatic opening
-- ---------------------------------------------------------------------------

/**
 * Staff can update matches directly, but the MVP columns only change through the MVP functions
 * (which set `app.mvp_rpc`). Marking a match as played opens its vote if the team uses the module.
 */
create function public.matches_mvp_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.mvp_rpc', true), '') <> 'on' then
    if tg_op = 'INSERT' then
      new.mvp_status := 'closed';
      new.mvp_closes_at := null;
      new.mvp_winners := '{}';
    else
      new.mvp_status := old.mvp_status;
      new.mvp_closes_at := old.mvp_closes_at;
      new.mvp_winners := old.mvp_winners;
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'played' and old.status <> 'played'
    and new.mvp_status = 'closed'
    and exists (
      select 1 from public.teams t where t.id = new.team_id and 'mvp' = any (t.enabled_modules)
    )
  then
    new.mvp_status := 'open';
    new.mvp_closes_at := now() + interval '48 hours';
  end if;
  return new;
end;
$$;

create trigger matches_mvp_guard
before insert or update on public.matches
for each row execute function public.matches_mvp_guard();

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable through the API)
-- ---------------------------------------------------------------------------

/** Players with the most votes in a match (empty if nobody voted). */
create function public.mvp_leaders(match uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  with tally as (
    select voted_player_id, count(*) as votes
    from public.mvp_votes where match_id = match
    group by voted_player_id
  )
  select coalesce(array_agg(voted_player_id order by voted_player_id), '{}')
  from tally where votes = (select max(votes) from tally)
$$;

/** Closes an open vote: no votes → no MVP, one leader → MVP, tie → waits for the coach. */
create function public.finish_mvp_vote(match uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  leaders uuid[] := public.mvp_leaders(match);
begin
  perform set_config('app.mvp_rpc', 'on', true);
  update public.matches set
    mvp_status = case when cardinality(leaders) > 1 then 'tie_pending' else 'finished' end,
    mvp_winners = case when cardinality(leaders) = 1 then leaders else '{}' end,
    mvp_closes_at = least(coalesce(mvp_closes_at, now()), now())
  where id = match and mvp_status = 'open';
end;
$$;

revoke execute on function public.mvp_leaders(uuid), public.finish_mvp_vote(uuid)
from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- API
-- ---------------------------------------------------------------------------

/** Closes the vote if its 48 h are over. Any team member can call it (screens do on load). */
create function public.settle_mvp(match uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(public.match_team(match)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.matches
    where id = match and mvp_status = 'open' and mvp_closes_at <= now()
  ) then
    perform public.finish_mvp_vote(match);
  end if;
end;
$$;

/** Saves the caller's vote (1 or 2 called-up players, not themselves), replacing the previous one. */
create function public.cast_mvp_vote(match uuid, ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  team uuid := public.match_team(match);
  voter record;
  picked int := coalesce(cardinality(ids), 0);
begin
  perform public.settle_mvp(match);
  if not exists (select 1 from public.matches where id = match and mvp_status = 'open') then
    raise exception 'vote closed' using errcode = '55000';
  end if;

  select m.role, m.player_id into voter
  from public.team_members m
  where m.team_id = team and m.user_id = (select auth.uid());
  if not found or not (
    voter.role = 'coach'
    or (
      voter.role = 'player' and voter.player_id is not null
      and exists (
        select 1 from public.callups c where c.match_id = match and c.player_id = voter.player_id
      )
    )
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if picked < 1 or picked > 2 or (select count(distinct x) from unnest(ids) x) <> picked then
    raise exception 'pick 1 or 2 different players' using errcode = '22023';
  end if;
  if voter.player_id is not null and voter.player_id = any (ids) then
    raise exception 'cannot vote for yourself' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(ids) x
    where not exists (select 1 from public.callups c where c.match_id = match and c.player_id = x)
  ) then
    raise exception 'only called-up players' using errcode = '22023';
  end if;

  delete from public.mvp_votes where match_id = match and voter_user_id = (select auth.uid());
  insert into public.mvp_votes (match_id, voter_user_id, voted_player_id)
  select match, (select auth.uid()), x from unnest(ids) x;
end;
$$;

/** The players the caller voted for in a match (empty if they have not voted). */
create function public.my_mvp_vote(match uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(voted_player_id), '{}')
  from public.mvp_votes
  where match_id = match and voter_user_id = (select auth.uid())
    and public.has_team_role(public.match_team(match))
$$;

/** Opens the vote of a played match that never had one (e.g. the module was turned on later). */
create function public.open_mvp_vote(match uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(public.match_team(match), 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform set_config('app.mvp_rpc', 'on', true);
  update public.matches
  set mvp_status = 'open', mvp_closes_at = now() + interval '48 hours'
  where id = match and status = 'played' and mvp_status = 'closed';
  if not found then
    raise exception 'cannot open' using errcode = '55000';
  end if;
end;
$$;

/** Closes the vote before its 48 h. Coach only. */
create function public.close_mvp_vote(match uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(public.match_team(match), 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform public.finish_mvp_vote(match);
end;
$$;

/** Breaks a tie: the coach picks one or more of the tied leaders (several = co-MVP). */
create function public.resolve_mvp_tie(match uuid, ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  leaders uuid[] := public.mvp_leaders(match);
begin
  if not public.has_team_role(public.match_team(match), 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(cardinality(ids), 0) = 0 or not (ids <@ leaders) then
    raise exception 'pick among the tied players' using errcode = '22023';
  end if;
  perform set_config('app.mvp_rpc', 'on', true);
  update public.matches
  set mvp_status = 'finished',
      mvp_winners = array(select distinct x from unnest(ids) x order by x)
  where id = match and mvp_status = 'tie_pending';
  if not found then
    raise exception 'no tie to resolve' using errcode = '55000';
  end if;
end;
$$;

/**
 * Count of the vote for the coach: votes per player (never who voted whom), how many voted and how
 * many can vote (coaches plus called-up players with an account).
 */
create function public.mvp_results(match uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  team uuid := public.match_team(match);
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'tally', coalesce((
      select jsonb_agg(jsonb_build_object('player_id', voted_player_id, 'votes', votes) order by votes desc)
      from (
        select voted_player_id, count(*) as votes from public.mvp_votes
        where match_id = match group by voted_player_id
      ) t
    ), '[]'::jsonb),
    'voters', (select count(distinct voter_user_id) from public.mvp_votes where match_id = match),
    'eligible', (
      select count(*) from public.team_members m
      where m.team_id = team and (
        m.role = 'coach'
        or (m.role = 'player' and exists (
          select 1 from public.callups c where c.match_id = match and c.player_id = m.player_id
        ))
      )
    )
  );
end;
$$;

revoke execute on function
  public.settle_mvp(uuid),
  public.cast_mvp_vote(uuid, uuid[]),
  public.my_mvp_vote(uuid),
  public.open_mvp_vote(uuid),
  public.close_mvp_vote(uuid),
  public.resolve_mvp_tie(uuid, uuid[]),
  public.mvp_results(uuid)
from public, anon;
grant execute on function
  public.settle_mvp(uuid),
  public.cast_mvp_vote(uuid, uuid[]),
  public.my_mvp_vote(uuid),
  public.open_mvp_vote(uuid),
  public.close_mvp_vote(uuid),
  public.resolve_mvp_tie(uuid, uuid[]),
  public.mvp_results(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Merging roster entries also moves MVP votes and wins
-- ---------------------------------------------------------------------------

create or replace function public.merge_players(team uuid, keep uuid, duplicate uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if keep = duplicate then
    raise exception 'same player' using errcode = '22023';
  end if;
  if (select count(*) from public.players where id in (keep, duplicate) and team_id = team) <> 2 then
    raise exception 'player not in team' using errcode = 'P0002';
  end if;
  if (select count(*) from public.team_members where team_id = team and player_id in (keep, duplicate)) > 1 then
    raise exception 'both linked' using errcode = '23505';
  end if;

  update public.team_members set player_id = keep where team_id = team and player_id = duplicate;

  update public.availability k set status = d.status, comment = d.comment, updated_at = d.updated_at
  from public.availability d
  where d.player_id = duplicate and k.player_id = keep and k.match_id = d.match_id
    and d.updated_at > k.updated_at;
  update public.availability d set player_id = keep
  where d.player_id = duplicate
    and not exists (select 1 from public.availability k where k.player_id = keep and k.match_id = d.match_id);

  update public.callups d set player_id = keep
  where d.player_id = duplicate
    and not exists (select 1 from public.callups k where k.player_id = keep and k.match_id = d.match_id);

  update public.training_attendance k set status = d.status, updated_at = d.updated_at
  from public.training_attendance d
  where d.player_id = duplicate and k.player_id = keep
    and k.slot_id = d.slot_id and k.date = d.date and d.updated_at > k.updated_at;
  update public.training_attendance d set player_id = keep
  where d.player_id = duplicate
    and not exists (
      select 1 from public.training_attendance k
      where k.player_id = keep and k.slot_id = d.slot_id and k.date = d.date
    );

  update public.set_plans p set
    libero_id = case when p.libero_id = duplicate then keep else p.libero_id end,
    second_libero_id = case when p.second_libero_id = duplicate then keep else p.second_libero_id end,
    rotation = replace(p.rotation::text, duplicate::text, keep::text)::jsonb,
    planned_subs = replace(p.planned_subs::text, duplicate::text, keep::text)::jsonb
  from public.matches m
  where m.id = p.match_id and m.team_id = team
    and (p.libero_id = duplicate or p.second_libero_id = duplicate
      or p.rotation::text like '%' || duplicate::text || '%'
      or p.planned_subs::text like '%' || duplicate::text || '%');

  -- MVP votes received (a voter who voted both keeps one vote) and MVP wins.
  update public.mvp_votes d set voted_player_id = keep
  where d.voted_player_id = duplicate
    and not exists (
      select 1 from public.mvp_votes k
      where k.match_id = d.match_id and k.voter_user_id = d.voter_user_id and k.voted_player_id = keep
    );
  perform set_config('app.mvp_rpc', 'on', true);
  update public.matches
  set mvp_winners = array(select distinct x from unnest(array_replace(mvp_winners, duplicate, keep)) x order by x)
  where team_id = team and duplicate = any (mvp_winners);

  update public.players k set
    number = coalesce(k.number, d.number),
    birth_year = coalesce(k.birth_year, d.birth_year),
    last_name = case when k.last_name = '' then d.last_name else k.last_name end
  from public.players d
  where k.id = keep and d.id = duplicate;

  delete from public.players where id = duplicate;
end;
$$;
