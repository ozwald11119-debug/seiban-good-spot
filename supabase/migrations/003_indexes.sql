create index if not exists spots_area_idx on public.spots(area);
create index if not exists spots_genre_idx on public.spots(genre);
create index if not exists spots_featured_idx on public.spots(featured) where published = true;