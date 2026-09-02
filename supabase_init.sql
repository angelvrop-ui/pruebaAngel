-- supabase_init.sql
-- Run this in Supabase SQL editor (Project -> SQL Editor -> New query)

-- 1) Optional: enable pgcrypto for UUID generation (may require privileges)
create extension if not exists "pgcrypto";

-- 2) Profiles table: store metadata for auth users
create table if not exists public.profiles (
  user_id uuid primary key,
  full_name text,
  email text,
  dob date,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 3) RLS policies: allow users to insert/select/update only their own profile
drop policy if exists "Insert own profile" on public.profiles;
create policy "Insert own profile"
  on public.profiles
  for insert
  with check ( user_id = auth.uid()::uuid );

drop policy if exists "Select own profile" on public.profiles;
create policy "Select own profile"
  on public.profiles
  for select
  using ( user_id = auth.uid()::uuid );

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
  on public.profiles
  for update
  using ( user_id = auth.uid()::uuid )
  with check ( user_id = auth.uid()::uuid );

-- 4) Optional: index on email for fast lookup (not unique because auth handles emails)
create index if not exists profiles_email_idx on public.profiles (email);

-- 5) Example: insert a test profile (only run for testing with a known uuid)
-- insert into public.profiles (user_id, full_name, email) values ('00000000-0000-0000-0000-000000000000','Test User','test@example.com');

-- Notes:
-- - Run this as a SQL query in Supabase. If CREATE EXTENSION fails, it's safe to remove that line and continue.
-- - After running, confirm under Table Editor that `profiles` exists and RLS is ENABLED.
-- - Policies use auth.uid()::uuid; clients authenticated with Supabase anon key will be able to insert/select/update their own rows.
