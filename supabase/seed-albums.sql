-- Optional sample albums (covers are placeholders — replace with your own URLs).
insert into albums (title, slug, cover_image, sort_order) values
  ('Kyoto Spring', 'kyoto-spring', 'https://picsum.photos/id/1015/1200/1500', 1),
  ('Berlin Fall', 'berlin-fall', 'https://picsum.photos/id/1024/1200/1500', 2),
  ('San Francisco', 'sf-goodbye', 'https://picsum.photos/id/1043/1200/900', 3)
on conflict (slug) do update set
  title = excluded.title,
  cover_image = excluded.cover_image,
  sort_order = excluded.sort_order;
