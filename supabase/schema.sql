-- Run this in Supabase: Project > SQL Editor > New query > paste > Run

create table if not exists photos (
  id text primary key,
  src text not null,
  alt text not null,
  city text not null,
  country text not null,
  date date not null,
  roll text not null,
  frame integer not null,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Allow anyone to read photos (this is a public portfolio, not private data).
-- Writes still require your service role key, which stays server-side only.
alter table photos enable row level security;

create policy "Public photos are viewable by everyone"
on photos for select
using (true);

-- Seed with the same sample rows as data/photos.ts, so the site works
-- immediately once you connect it. Delete these once you add real photos.
insert into photos (id, src, alt, city, country, date, roll, frame, lat, lng) values
  ('p1', 'https://picsum.photos/id/1015/1200/1500', 'River valley at dusk', 'Kyoto', 'Japan', '2026-03-14', 'kyoto-spring', 1, 35.0116, 135.7681),
  ('p2', 'https://picsum.photos/id/1016/1200/900', 'Mountain ridge line', 'Kyoto', 'Japan', '2026-03-15', 'kyoto-spring', 2, 35.0116, 135.7681),
  ('p3', 'https://picsum.photos/id/1024/1200/1500', 'Street corner, wet pavement', 'Berlin', 'Germany', '2025-10-02', 'berlin-fall', 1, 52.52, 13.405),
  ('p4', 'https://picsum.photos/id/1041/1200/1500', 'Old bridge over canal', 'Amsterdam', 'Netherlands', '2025-09-20', 'amsterdam-canals', 1, 52.3676, 4.9041),
  ('p5', 'https://picsum.photos/id/1043/1200/900', 'Fog over the bay', 'San Francisco', 'USA', '2026-05-11', 'sf-goodbye', 1, 37.7749, -122.4194),
  ('p6', 'https://picsum.photos/id/1050/1200/1500', 'Neon signage at night', 'Tokyo', 'Japan', '2026-03-18', 'kyoto-spring', 3, 35.0116, 135.7681)
on conflict (id) do nothing;
