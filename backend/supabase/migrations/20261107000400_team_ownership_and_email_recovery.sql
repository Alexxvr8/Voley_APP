-- Requested on 2026-11-07:
-- * A team can never be left without a coach: removing or demoting the last coach is refused
--   (deleting the whole team is still allowed). The coach hands the team over with transfer_team().
-- * Optional recovery email: a user who lost their recovery code gets a one-hour reset link by
--   email, without asking the coach. The email is sent by the `send-reset-email` Edge Function.

-- ---------------------------------------------------------------------------
-- Last coach guard and transfer
-- ---------------------------------------------------------------------------

create function public.keep_a_coach()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'coach' or (tg_op = 'UPDATE' and new.role = 'coach') then
    return coalesce(new, old);
  end if;
  -- Rows removed because the team itself is being deleted.
  if not exists (select 1 from public.teams where id = old.team_id) then
    return old;
  end if;
  if not exists (
    select 1 from public.team_members
    where team_id = old.team_id and role = 'coach' and user_id <> old.user_id
  ) then
    raise exception 'team needs a coach' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger keep_a_coach
  before update of role or delete on public.team_members
  for each row execute function public.keep_a_coach();

/** Makes another member the coach; the current coach becomes assistant. Coach only. */
create function public.transfer_team(team uuid, new_coach uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_role(team, 'coach') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if new_coach = (select auth.uid()) then
    raise exception 'already coach' using errcode = 'P0001';
  end if;
  update public.team_members set role = 'coach' where team_id = team and user_id = new_coach;
  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  update public.team_members set role = 'assistant' where team_id = team and user_id = (select auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- Recovery email
-- ---------------------------------------------------------------------------

-- The email lives with the other recovery data: private, reached only through functions.
create table public.account_recovery_email (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  token_hash text,
  token_expires_at timestamptz,
  last_sent_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.account_recovery_email enable row level security;

/** Sets (or, with null/empty, removes) the current user's recovery email. */
create function public.set_recovery_email(email text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(email), '') = '' then
    delete from public.account_recovery_email where user_id = (select auth.uid());
    return;
  end if;
  insert into public.account_recovery_email (user_id, email)
  values ((select auth.uid()), lower(trim(email)))
  on conflict (user_id) do update
    set email = excluded.email, token_hash = null, token_expires_at = null, updated_at = now();
end;
$$;

/** The current user's recovery email, or null. */
create function public.my_recovery_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select email from public.account_recovery_email where user_id = (select auth.uid())
$$;

/**
 * Called only by the send-reset-email Edge Function (service role). Creates a one-hour reset token
 * for the username and returns where to send it, or null if there is no recovery email or one was
 * sent less than a minute ago.
 */
create function public.issue_email_reset_token(username text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  account uuid;
  recovery public.account_recovery_email;
  token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  select id into account from public.profiles
  where profiles.username = lower(trim(issue_email_reset_token.username));
  select * into recovery from public.account_recovery_email where user_id = account for update;
  if not found or (recovery.last_sent_at is not null and recovery.last_sent_at > now() - interval '1 minute') then
    return null;
  end if;
  update public.account_recovery_email
  set token_hash = extensions.crypt(token, extensions.gen_salt('bf')),
      token_expires_at = now() + interval '1 hour',
      last_sent_at = now()
  where user_id = account;
  return jsonb_build_object('email', recovery.email, 'token', token);
end;
$$;

/**
 * Sets a new password with the token from the email. Callable without a session. The token works
 * once and for one hour. Returns {"ok": true, "code": <new recovery code>} or {"ok": false}.
 */
create function public.reset_password_with_email_token(username text, token text, new_password text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  account uuid;
  recovery public.account_recovery_email;
begin
  if char_length(new_password) < 6 then
    return jsonb_build_object('ok', false, 'reason', 'weak_password');
  end if;
  select id into account from public.profiles
  where profiles.username = lower(trim(reset_password_with_email_token.username));
  select * into recovery from public.account_recovery_email where user_id = account for update;
  if not found or recovery.token_hash is null or recovery.token_expires_at < now()
     or extensions.crypt(token, recovery.token_hash) <> recovery.token_hash then
    return jsonb_build_object('ok', false);
  end if;
  update public.account_recovery_email set token_hash = null, token_expires_at = null where user_id = account;
  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
  where id = account;
  return jsonb_build_object('ok', true, 'code', public.issue_recovery_code(account));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.keep_a_coach() from public, anon, authenticated;

revoke execute on function
  public.transfer_team(uuid, uuid),
  public.set_recovery_email(text),
  public.my_recovery_email(),
  public.issue_email_reset_token(text),
  public.reset_password_with_email_token(text, text, text)
from public, anon, authenticated;

grant execute on function
  public.transfer_team(uuid, uuid),
  public.set_recovery_email(text),
  public.my_recovery_email()
to authenticated;

grant execute on function public.reset_password_with_email_token(text, text, text) to anon, authenticated;
grant execute on function public.issue_email_reset_token(text) to service_role;
