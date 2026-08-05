-- Step 2 of places/photos split: optional photo → place link.
-- Applied remotely via Supabase migration; this file is the local record.

alter table photos
  add column if not exists place_id uuid references places(id) on delete set null;

create index if not exists photos_place_id_idx on photos(place_id);
