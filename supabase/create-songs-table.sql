-- Hand-maintained "Listening to" list for the CURRENTLY card.

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  url text, -- optional YouTube / Spotify / etc. link
  sort_order integer not null default 0, -- lower = higher in the list
  created_at timestamptz default now()
);

alter table songs enable row level security;

create policy "Public songs are viewable by everyone"
on songs for select
using (true);
