-- Convert places.category from plural → singular canonical slugs.

update places set category = 'restaurant' where lower(category) in ('restaurants', 'restaurant');
update places set category = 'cafe' where lower(category) in ('cafes', 'cafe', 'cafés', 'café');
update places set category = 'bakery' where lower(category) in ('bakeries', 'bakery');
update places set category = 'shop' where lower(category) in ('shops', 'shop');
update places set category = 'site' where lower(category) in ('sites', 'site');
update places set category = 'drink' where lower(category) in ('drinks', 'drink', 'bar', 'bars');
update places set category = 'market' where lower(category) in ('markets', 'market');
update places set category = 'sweet treat' where lower(category) in ('sweet-treats', 'sweet-treat', 'sweet treats', 'sweet treat', 'sweets');
