-- COMPREHENSIVE FIX FOR DATABASE ISSUES (v2 - Fixed Types)
-- Run this ENTIRE file in the Supabase SQL Editor.

-- Drop tables if they exist with wrong schema to ensure clean slate
drop table if exists public.registrations cascade;
drop table if exists public.matches cascade;

-- 1. Create 'matches' table
-- Note: tournament_id is TEXT because tournaments.id is TEXT in your database
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id text references public.tournaments(id),
  room_id text,
  room_password text,
  start_time timestamptz,
  status text default 'Scheduled',
  created_at timestamptz default now()
);

-- 2. Create 'registrations' table
-- Note: tournament_id is TEXT, user_id is UUID (standard for profiles)
create table public.registrations (
  id uuid default uuid_generate_v4() primary key,
  tournament_id text references public.tournaments(id),
  user_id uuid references public.profiles(id),
  team_name text,
  status text default 'Confirmed',
  created_at timestamptz default now()
);

-- 3. Enable RLS
alter table public.matches enable row level security;
alter table public.registrations enable row level security;

-- 4. Create Policies
create policy "Public Read" on public.matches for select using (true);
create policy "Anon Insert" on public.matches for insert with check (true);

create policy "Public Read" on public.registrations for select using (true);
create policy "Anon Insert" on public.registrations for insert with check (true);

-- 5. FORCE SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';
