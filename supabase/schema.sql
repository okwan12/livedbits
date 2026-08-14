-- Run this in Supabase: Project > SQL Editor > New query > paste > Run
-- (For an existing project, prefer the incremental migrations in this folder.)

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  visited_date date,
  category text, -- slug: restaurant, cafe, bakery, shop, site, bar, market, sweet treat
  city text,
  country text,
  created_at timestamptz default now()
);

alter table places enable row level security;

create policy "Public places are viewable by everyone"
on places for select
using (true);

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

create table if not exists photos (
  id text primary key,
  src text not null,
  alt text,
  city text,
  country text,
  date date,
  roll text,
  frame integer,
  featured boolean default false,
  place_id uuid references places(id) on delete set null,
  album_id uuid references albums(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists photos_place_id_idx on photos(place_id);
create index if not exists photos_album_id_idx on photos(album_id);

-- Allow anyone to read photos (this is a public portfolio, not private data).
-- Writes still require your service role key, which stays server-side only.
alter table photos enable row level security;

create policy "Public photos are viewable by everyone"
on photos for select
using (true);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  url text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table songs enable row level security;

create policy "Public songs are viewable by everyone"
on songs for select
using (true);

-- Seed with the same sample rows as data/photos.ts, so the site works
-- immediately once you connect it. Delete these once you add real photos.
insert into photos (id, src, alt, city, country, date, roll, frame, featured) values
  ('p1', 'https://picsum.photos/id/1015/1200/1500', 'River valley at dusk', 'Kyoto', 'Japan', '2026-03-14', 'kyoto-spring', 1, true),
  ('p2', 'https://picsum.photos/id/1016/1200/900', 'Mountain ridge line', 'Kyoto', 'Japan', '2026-03-15', 'kyoto-spring', 2, false),
  ('p3', 'https://picsum.photos/id/1024/1200/1500', 'Street corner, wet pavement', 'Berlin', 'Germany', '2025-10-02', 'berlin-fall', 1, true),
  ('p4', 'https://picsum.photos/id/1041/1200/1500', 'Old bridge over canal', 'Amsterdam', 'Netherlands', '2025-09-20', 'amsterdam-canals', 1, false),
  ('p5', 'https://picsum.photos/id/1043/1200/900', 'Fog over the bay', 'San Francisco', 'USA', '2026-05-11', 'sf-goodbye', 1, true),
  ('p6', 'https://picsum.photos/id/1050/1200/1500', 'Neon signage at night', 'Tokyo', 'Japan', '2026-03-18', 'kyoto-spring', 3, false)
on conflict (id) do nothing;
