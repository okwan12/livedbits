-- Add nullable category slug for place pins (restaurants, cafes, etc.).
-- Canonical values: restaurant, cafe, bakery, shop, site, bar,
-- market, sweet treat.

alter table places
  add column if not exists category text;
