-- Gallery photos: only id + src required. Alt and metadata optional.

alter table photos
  alter column alt drop not null,
  alter column city drop not null,
  alter column country drop not null,
  alter column date drop not null,
  alter column roll drop not null,
  alter column frame drop not null;
