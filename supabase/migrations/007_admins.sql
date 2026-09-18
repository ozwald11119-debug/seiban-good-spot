create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.admins enable row level security;
create policy "admins can read own membership" on public.admins for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.admins to authenticated;
create policy "admins can manage spots" on public.spots for all to authenticated using (exists(select 1 from public.admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admins a where a.user_id=(select auth.uid())));