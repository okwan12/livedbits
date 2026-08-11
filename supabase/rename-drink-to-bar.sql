-- Rename category slug drink → bar.
update places
set category = 'bar'
where lower(category) in ('drink', 'drinks');
