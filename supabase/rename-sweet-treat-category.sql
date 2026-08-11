-- Rename category slug sweet-treat → sweet treat (no dash).
update places
set category = 'sweet treat'
where lower(category) in ('sweet-treat', 'sweet-treats');
