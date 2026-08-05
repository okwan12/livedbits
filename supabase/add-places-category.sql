-- Add nullable category slug for place pins (restaurants, cafes, etc.).
-- Canonical values: restaurants, cafes, bakeries, shops, sites, drinks,
-- markets, sweet-treats. Null/unknown → neutral gray on the map.

alter table places
  add column if not exists category text;
