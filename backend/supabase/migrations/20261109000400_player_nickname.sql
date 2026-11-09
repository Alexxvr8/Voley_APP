-- Nickname of a roster entry ("Solis", "Rodri"), set by the staff in the player form. When present,
-- the app shows it instead of the full name in compact places (call-ups, court, changes, MVP).
alter table public.players
  add column nickname text not null default '' check (char_length(nickname) <= 20);
