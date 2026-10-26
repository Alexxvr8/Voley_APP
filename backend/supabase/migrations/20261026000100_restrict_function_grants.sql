-- The trigger function is never called through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- RLS helpers only need to run for signed-in users (policies are evaluated as the caller).
revoke execute on function
  public.has_team_role(uuid, text),
  public.match_team(uuid),
  public.is_own_player(uuid, uuid),
  public.player_in_match_team(uuid, uuid)
from public, anon;
grant execute on function
  public.has_team_role(uuid, text),
  public.match_team(uuid),
  public.is_own_player(uuid, uuid),
  public.player_in_match_team(uuid, uuid)
to authenticated;
