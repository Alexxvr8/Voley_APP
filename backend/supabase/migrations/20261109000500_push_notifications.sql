-- Push notifications (decision 2026-11-09). Free plan only:
-- * Each device that turns notifications on stores its Web Push subscription (push_subscriptions).
-- * The database decides who gets what and asks the Edge Function `send-push` to deliver it, through
--   pg_net (instant events: new match, call-up, MVP vote open) and pg_cron (daily reminders).
-- * Secrets live in Vault: the webhook secret (made here, never leaves the database) and the VAPID
--   keys (made by the Edge Function on its first run). Only the VAPID public key is readable.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Subscriptions and sent log
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions_own" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

/** Reminders already sent, so the daily job never repeats one. */
create table private.push_log (
  kind text not null,
  ref text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (kind, ref, user_id)
);

select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'push_webhook_secret');

-- ---------------------------------------------------------------------------
-- Sending
-- ---------------------------------------------------------------------------

/** "sáb 14 nov" for notification texts. */
create function private.es_date(day date)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'])[extract(isodow from day)::int]
    || ' ' || extract(day from day)::int || ' '
    || (array['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'])[extract(month from day)::int]
$$;

/** Asks the Edge Function to deliver a notification to these users' devices (asynchronously). */
create function private.push(users uuid[], title text, body text, url text, tag text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(cardinality(users), 0) = 0 then
    return;
  end if;
  perform net.http_post(
    url := 'https://djjeodajgsfvcisrrkzk.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_webhook_secret')
    ),
    body := jsonb_build_object('users', users, 'title', title, 'body', body, 'url', url, 'tag', tag)
  );
end;
$$;

/** Users with a linked roster entry among these players (players without account get nothing). */
create function private.users_of_players(team uuid, players uuid[])
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct m.user_id), '{}')
  from public.team_members m
  where m.team_id = team and m.player_id = any (players)
$$;

/** Roster entries who can play a match on `day` (same rule as the app: active, competing, guests). */
create function private.players_for_match(team uuid, day date)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(p.id), '{}')
  from public.players p
  where p.team_id = team and p.active and p.competes
    and (p.membership <> 'one_off' or p.visit_date = day)
$$;

/** "18:00 · Pau" (time and venue when known). */
create function private.when_where(match_time time, venue text)
returns text
language sql
immutable
set search_path = ''
as $$
  select concat_ws(' · ', to_char(match_time, 'HH24:MI'), nullif(venue, ''))
$$;

-- ---------------------------------------------------------------------------
-- Instant events
-- ---------------------------------------------------------------------------

/** New upcoming match: players who can play it are asked if they can come. */
create function private.push_new_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'scheduled' and new.date >= current_date then
    perform private.push(
      private.users_of_players(new.team_id, private.players_for_match(new.team_id, new.date)),
      'Nuevo partido: vs ' || new.opponent,
      concat_ws(' · ', private.es_date(new.date), private.when_where(new.match_time, new.venue))
        || '. ¿Puedes venir?',
      '/equipos/' || new.team_id || '/partidos/' || new.id,
      'match-' || new.id
    );
  end if;
  return null;
end;
$$;

create trigger matches_push_new
after insert on public.matches
for each row execute function private.push_new_match();

/** A player is called up to an upcoming match. */
create function private.push_callup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches;
begin
  select * into m from public.matches where id = new.match_id;
  if m.status = 'scheduled' and m.date >= current_date then
    perform private.push(
      private.users_of_players(m.team_id, array[new.player_id]),
      'Te han convocado: vs ' || m.opponent,
      concat_ws(' · ', private.es_date(m.date), private.when_where(m.match_time, m.venue)),
      '/equipos/' || m.team_id || '/partidos/' || m.id,
      'callup-' || m.id
    );
  end if;
  return null;
end;
$$;

create trigger callups_push
after insert on public.callups
for each row execute function private.push_callup();

/** Users who can vote a match's MVP: coaches and called-up players with an account. */
create function private.mvp_voters(match uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct tm.user_id), '{}')
  from public.matches mt
  join public.team_members tm on tm.team_id = mt.team_id
  where mt.id = match
    and (tm.role = 'coach' or exists (
      select 1 from public.callups c where c.match_id = mt.id and c.player_id = tm.player_id
    ))
$$;

/** The MVP vote of a match opens. */
create function private.push_mvp_open()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.mvp_status = 'open' and old.mvp_status is distinct from 'open' then
    perform private.push(
      private.mvp_voters(new.id),
      'Vota la MVP: vs ' || new.opponent,
      'Tienes 48 h. El voto es secreto.',
      '/equipos/' || new.team_id || '/mvp/' || new.id,
      'mvp-' || new.id
    );
  end if;
  return null;
end;
$$;

create trigger matches_push_mvp_open
after update on public.matches
for each row execute function private.push_mvp_open();

-- ---------------------------------------------------------------------------
-- Daily reminders (pg_cron, every morning)
-- ---------------------------------------------------------------------------

/** Keeps only the users not reminded yet of `kind` for `ref`, and records them as reminded. */
create function private.not_reminded(kind text, ref text, users uuid[])
returns uuid[]
language sql
security definer
set search_path = ''
as $$
  with fresh as (
    insert into private.push_log (kind, ref, user_id)
    select kind, ref, u from unnest(users) u
    on conflict do nothing
    returning user_id
  )
  select coalesce(array_agg(user_id), '{}') from fresh
$$;

create function private.daily_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m record;
  s record;
  users uuid[];
begin
  -- Tomorrow's matches: the called-up players.
  for m in
    select * from public.matches
    where status = 'scheduled' and date = current_date + 1
  loop
    users := private.not_reminded('tomorrow', m.id::text, private.users_of_players(
      m.team_id, array(select player_id from public.callups where match_id = m.id)));
    perform private.push(users, 'Mañana juegas: vs ' || m.opponent,
      coalesce(nullif(concat_ws(' · ',
        private.when_where(m.match_time, m.venue),
        case when m.warmup_minutes is not null and m.match_time is not null
          then 'calentamiento ' || to_char(m.match_time - make_interval(mins => m.warmup_minutes), 'HH24:MI') end
      ), ''), private.es_date(m.date)),
      '/equipos/' || m.team_id || '/partidos/' || m.id, 'tomorrow-' || m.id);
  end loop;

  -- Matches in the next three days: who has not said whether they can come (once per match).
  for m in
    select * from public.matches
    where status = 'scheduled' and date between current_date and current_date + 3
  loop
    users := private.not_reminded('availability', m.id::text, private.users_of_players(
      m.team_id,
      array(
        select x from unnest(private.players_for_match(m.team_id, m.date)) x
        where not exists (select 1 from public.availability a where a.match_id = m.id and a.player_id = x)
      )));
    perform private.push(users, '¿Puedes venir? vs ' || m.opponent,
      concat_ws(' · ', private.es_date(m.date), private.when_where(m.match_time, m.venue)),
      '/equipos/' || m.team_id || '/partidos/' || m.id, 'match-' || m.id);
  end loop;

  -- Today's trainings: who is expected that day and has not answered.
  for s in
    select * from public.training_slots ts
    where ts.weekday = extract(isodow from current_date)
      and not exists (
        select 1 from public.training_cancellations c where c.slot_id = ts.id and c.date = current_date
      )
  loop
    users := private.not_reminded('training', s.id || ':' || current_date, private.users_of_players(
      s.team_id,
      array(
        select p.id from public.players p
        where p.team_id = s.team_id and p.active
          and (p.membership = 'member'
            or (p.membership = 'regular' and extract(isodow from current_date)::smallint = any (p.visit_weekdays))
            or (p.membership = 'one_off' and p.visit_date = current_date))
          and not exists (
            select 1 from public.training_attendance a
            where a.slot_id = s.id and a.date = current_date and a.player_id = p.id
          )
      )));
    perform private.push(users, '¿Vienes hoy a entrenar?',
      to_char(s.start_time, 'HH24:MI') || '–' || to_char(s.end_time, 'HH24:MI')
        || coalesce(' · ' || nullif(s.venue, ''), ''),
      '/equipos/' || s.team_id || '/partidos', 'training-' || s.id);
  end loop;

  -- MVP votes closing within a day: voters who have not voted yet (once).
  for m in
    select * from public.matches
    where mvp_status = 'open' and mvp_closes_at between now() and now() + interval '24 hours'
  loop
    users := private.not_reminded('mvp-last', m.id::text, array(
      select u from unnest(private.mvp_voters(m.id)) u
      where not exists (select 1 from public.mvp_votes v where v.match_id = m.id and v.voter_user_id = u)
    ));
    perform private.push(users, 'Última oportunidad: vota la MVP',
      'vs ' || m.opponent || '. La votación cierra en menos de un día.',
      '/equipos/' || m.team_id || '/mvp/' || m.id, 'mvp-' || m.id);
  end loop;
end;
$$;

-- 08:00 UTC = 9:00 in winter / 10:00 in summer in Spain.
select cron.schedule('daily-push-reminders', '0 8 * * *', 'select private.daily_reminders()');

-- ---------------------------------------------------------------------------
-- API
-- ---------------------------------------------------------------------------

/** VAPID public key the browser needs to subscribe (null until the Edge Function made the keys). */
create function public.vapid_public_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select (decrypted_secret::jsonb) ->> 'publicKey' from vault.decrypted_secrets where name = 'vapid_keys'
$$;

/** Sends a test notification to the caller's own devices. */
create function public.send_test_push()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.push(array[(select auth.uid())], 'Avisos activados',
    'Así te llegarán las convocatorias, los partidos y la MVP.', '/', 'test');
end;
$$;

/** For the Edge Function only (service role): webhook secret and VAPID keys. */
create function public.push_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_webhook_secret'),
    'vapid', (select decrypted_secret::jsonb from vault.decrypted_secrets where name = 'vapid_keys')
  )
$$;

/** For the Edge Function only: stores the VAPID keys it generated (once). */
create function public.save_vapid_keys(keys jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from vault.secrets where name = 'vapid_keys') then
    perform vault.create_secret(keys::text, 'vapid_keys');
  end if;
end;
$$;

revoke execute on function public.push_config(), public.save_vapid_keys(jsonb)
from public, anon, authenticated;
grant execute on function public.push_config(), public.save_vapid_keys(jsonb) to service_role;
revoke execute on function public.vapid_public_key(), public.send_test_push() from public, anon;
grant execute on function public.vapid_public_key(), public.send_test_push() to authenticated;
-- The new private functions run from triggers and cron only (the policy helpers keep their grants).
revoke execute on function
  private.es_date(date),
  private.push(uuid[], text, text, text, text),
  private.users_of_players(uuid, uuid[]),
  private.players_for_match(uuid, date),
  private.when_where(time, text),
  private.push_new_match(),
  private.push_callup(),
  private.mvp_voters(uuid),
  private.push_mvp_open(),
  private.not_reminded(text, text, uuid[]),
  private.daily_reminders()
from public, anon, authenticated;
