-- Nullable city/country for map popup location line.

alter table places
  add column if not exists city text,
  add column if not exists country text;
