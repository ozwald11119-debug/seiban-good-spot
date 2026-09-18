alter table public.spots add constraint spots_slug_length check (char_length(slug) between 1 and 100);
alter table public.spots add constraint spots_name_length check (char_length(name) between 1 and 160);
alter table public.spots add constraint spots_genre_length check (char_length(genre) between 1 and 60);