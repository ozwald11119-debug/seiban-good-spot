create extension if not exists pgcrypto;
create table if not exists public.spots (id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,area text not null,genre text not null,lead text not null default '',description text not null default '',address text,website_url text,instagram_url text,post_url text,maps_url text,image_url text,tags text[] not null default '{}',featured boolean not null default false,published boolean not null default true,sort_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.spots enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.spots to anon, authenticated;
create policy "published spots are publicly readable" on public.spots for select to anon, authenticated using (published = true);
