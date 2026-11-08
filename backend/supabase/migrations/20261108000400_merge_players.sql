-- Merging two roster entries of the same person (e.g. a player created by hand who later joined with
-- an account and was accepted with a new entry by mistake). Everything of the duplicate moves to the
-- entry that stays: account link, availability, call-ups, training attendance and set plans
-- (liberos, rotation and planned subs). Then the duplicate is deleted. Coach only.

/**
 * Moves everything of `duplicate` onto `keep` and deletes `duplicate`. When both entries answered the
 * same match or training, the most recent answer wins; when both were called up, `keep`'s call-up
 * stays. Empty fields of `keep` (number, birth year, last name) are filled from `duplicate`.
 */
create function public.merge_players(team uuid, keep uuid, duplicate uuid)
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

  -- Account link.
  update public.team_members set player_id = keep where team_id = team and player_id = duplicate;

  -- Match availability: the newest answer wins.
  update public.availability k set status = d.status, comment = d.comment, updated_at = d.updated_at
  from public.availability d
  where d.player_id = duplicate and k.player_id = keep and k.match_id = d.match_id
    and d.updated_at > k.updated_at;
  update public.availability d set player_id = keep
  where d.player_id = duplicate
    and not exists (select 1 from public.availability k where k.player_id = keep and k.match_id = d.match_id);

  -- Call-ups: keep's own call-up (with its per-match number and positions) stays.
  update public.callups d set player_id = keep
  where d.player_id = duplicate
    and not exists (select 1 from public.callups k where k.player_id = keep and k.match_id = d.match_id);

  -- Training attendance: the newest answer wins.
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

  -- Set plans of the team's matches. Ids inside the JSON are uuids, so a text replace is exact.
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

  -- Fill empty fields of the entry that stays.
  update public.players k set
    number = coalesce(k.number, d.number),
    birth_year = coalesce(k.birth_year, d.birth_year),
    last_name = case when k.last_name = '' then d.last_name else k.last_name end
  from public.players d
  where k.id = keep and d.id = duplicate;

  -- Whatever could not move (answers older than keep's, duplicated call-ups) goes with it.
  delete from public.players where id = duplicate;
end;
$$;

revoke execute on function public.merge_players(uuid, uuid, uuid) from public, anon;
grant execute on function public.merge_players(uuid, uuid, uuid) to authenticated;
