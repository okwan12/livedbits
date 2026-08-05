-- Step 6 of places/photos split: drop retired map coordinates from photos.
-- Applied remotely via Supabase migration; this file is the local record.

alter table photos
  drop column if exists lat,
  drop column if exists lng;
