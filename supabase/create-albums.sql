-- Albums for Through My Eyes: cover index + per-album photo grids.
-- photos.album_id is nullable so a photo can stay unassigned.

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  cover_image text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table albums enable row level security;

create policy "Public albums are viewable by everyone"
on albums for select
using (true);

alter table photos
  add column if not exists album_id uuid references albums(id) on delete set null;

create index if not exists photos_album_id_idx on photos(album_id);
