-- Run this in Supabase: Project > SQL Editor > New query > paste > Run
-- (Only needed if you already ran the original schema.sql — this just
-- adds the new column on top of your existing photos table.)

alter table photos add column if not exists featured boolean default false;

-- Optional: mark a few existing rows as featured so /portfolio isn't
-- showing literally everything on your first visit. Replace the ids with
-- whichever photos you actually want to highlight.
update photos set featured = true where id in ('p1', 'p3', 'p5');
