-- Step 1 of places/photos split: create the places table.
-- Applied remotely via Supabase migration; this file is the local record.

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  visited_date date,
  created_at timestamptz default now()
);

-- Public portfolio data: anyone can read; writes stay service-role only.
alter table places enable row level security;

create policy "Public places are viewable by everyone"
on places for select
using (true);
