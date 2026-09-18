create table if not exists public.recommendations (id uuid primary key default gen_random_uuid(),spot_name text not null,area text,comment text,contact text,status text not null default 'pending',created_at timestamptz not null default now());
alter table public.recommendations enable row level security;
grant insert on public.recommendations to anon, authenticated;
create policy "anyone can recommend a spot" on public.recommendations for insert to anon, authenticated with check (status = 'pending');