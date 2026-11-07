-- Requested on 2026-11-07:
-- * A called-up player can cover several positions in a match (not just one): callups.positions
--   replaces callups.position. Null = the roster positions.
-- * Training slots can carry a Google Maps link, like matches.

alter table public.callups
  add column positions text[]
    check (positions <@ array['setter', 'outside', 'middle', 'opposite', 'libero'] and cardinality(positions) > 0);

update public.callups set positions = array[position] where position is not null;

alter table public.callups drop column position;

alter table public.training_slots add column maps_url text not null default '';
