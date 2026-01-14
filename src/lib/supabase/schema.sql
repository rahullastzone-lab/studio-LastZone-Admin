-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (User Data)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  email text,
  phone text,
  avatar_url text,
  wallet_balance numeric default 0,
  is_admin boolean default false,
  status text default 'Active', -- 'Active', 'Banned'
  created_at timestamptz default now()
);

-- 2. App Settings (Global Config)
create table if not exists public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  setting_key text unique not null,
  setting_value text,
  description text,
  created_at timestamptz default now()
);

-- 3. Banners (Home Slider)
create table if not exists public.banners (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  target_url text,
  is_active boolean default true,
  position integer default 0,
  created_at timestamptz default now()
);

-- 4. FAQs
create table if not exists public.faqs (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  answer text not null,
  category text,
  created_at timestamptz default now()
);

-- 5. Games (Supported Games List)
create table if not exists public.games (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g. 'BGMI', 'FreeFire'
  icon_url text,
  package_name text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 6. Market Items (Shop/Store)
create table if not exists public.market_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 7. Tournaments (Main Event)
create table if not exists public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  game_id uuid references public.games(id),
  game_type text, -- 'Solo', 'Duo', 'Squad'
  map text,
  entry_fee numeric default 0,
  prize_pool numeric default 0,
  per_kill numeric default 0,
  start_time timestamptz,
  status text default 'Open', -- 'Open', 'Closed', 'Completed'
  created_at timestamptz default now()
);

-- 8. Matches (Sub-unit of Tournaments or Standalone)
create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id),
  room_id text,
  room_password text,
  start_time timestamptz,
  status text default 'Scheduled', -- 'Scheduled', 'Live', 'Completed'
  created_at timestamptz default now()
);

-- 9. Registrations (Tournament Level)
create table if not exists public.registrations (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id),
  user_id uuid references public.profiles(id),
  team_name text,
  status text default 'Confirmed',
  created_at timestamptz default now()
);

-- 10. Match Registrations (Match Level)
create table if not exists public.match_registrations (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id),
  user_id uuid references public.profiles(id),
  slot_number integer,
  status text default 'Confirmed',
  created_at timestamptz default now()
);

-- 11. Transactions (Wallet History)
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  amount numeric not null,
  type text not null, -- 'Deposit', 'Withdrawal', 'Refund', 'Winnings', 'Entry Fee'
  status text default 'Pending',
  description text,
  created_at timestamptz default now()
);

-- 12. Withdrawals (Payout Requests)
create table if not exists public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  amount numeric not null,
  upi_id text,
  status text default 'Pending', -- 'Pending', 'Approved', 'Rejected'
  created_at timestamptz default now()
);

-- 13. Notify Subscribers (Alerts)
create table if not exists public.notify_subscribers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  game_interest text,
  whatsapp_number text,
  fcm_token text, -- For push notifications
  created_at timestamptz default now()
);

-- 14. Policies (Terms, Privacy)
create table if not exists public.policies (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  type text unique, -- 'privacy_policy', 'terms_conditions'
  created_at timestamptz default now()
);

-- 15. Services (Other offerings like Boosting)
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- SAFETY AUTOMATION: Ensure columns and defaults exist
-- Fix for 'null value in column id'
alter table public.profiles alter column id set default uuid_generate_v4();
alter table public.app_settings alter column id set default uuid_generate_v4();
alter table public.banners alter column id set default uuid_generate_v4();
alter table public.faqs alter column id set default uuid_generate_v4();
alter table public.games alter column id set default uuid_generate_v4();
alter table public.market_items alter column id set default uuid_generate_v4();
alter table public.tournaments alter column id set default uuid_generate_v4();
alter table public.matches alter column id set default uuid_generate_v4();
alter table public.registrations alter column id set default uuid_generate_v4();
alter table public.match_registrations alter column id set default uuid_generate_v4();
alter table public.transactions alter column id set default uuid_generate_v4();
alter table public.withdrawals alter column id set default uuid_generate_v4();
alter table public.notify_subscribers alter column id set default uuid_generate_v4();
alter table public.policies alter column id set default uuid_generate_v4();
alter table public.services alter column id set default uuid_generate_v4();


alter table public.profiles add column if not exists wallet_balance numeric default 0;
alter table public.profiles add column if not exists balance numeric default 0; -- Main Deposit Balance
alter table public.profiles add column if not exists winnings numeric default 0;
alter table public.profiles add column if not exists bonus numeric default 0;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists status text default 'Active';
alter table public.profiles add column if not exists created_at timestamptz default now();

alter table public.banners add column if not exists target_url text;
alter table public.banners add column if not exists is_active boolean default true;
alter table public.banners add column if not exists created_at timestamptz default now();

alter table public.faqs add column if not exists category text;
alter table public.faqs add column if not exists created_at timestamptz default now();

-- Ensure 'games' table has correct columns and fix 'title'/'image_id'/'status'/'action_text' issues
alter table public.games add column if not exists name text;
alter table public.games add column if not exists cover_image text;
alter table public.games add column if not exists package_name text;
alter table public.games add column if not exists is_active boolean default true;
alter table public.games add column if not exists created_at timestamptz default now();

-- CRITICAL FIX: Drop ALL known legacy columns that enforce constraints but are unused
do $$
begin
  if exists(select 1 from information_schema.columns where table_name = 'games' and column_name = 'title') then
     alter table public.games drop column title;
  end if;

  if exists(select 1 from information_schema.columns where table_name = 'games' and column_name = 'image_id') then
     alter table public.games drop column image_id;
  end if;

  if exists(select 1 from information_schema.columns where table_name = 'games' and column_name = 'status') then
     alter table public.games drop column status;
  end if;

  if exists(select 1 from information_schema.columns where table_name = 'games' and column_name = 'action_text') then
     alter table public.games drop column action_text;
  end if;
  
  -- Proactively drop other potential legacy columns
  if exists(select 1 from information_schema.columns where table_name = 'games' and column_name = 'action_url') then
     alter table public.games drop column action_url;
  end if;
end $$;

alter table public.market_items add column if not exists created_at timestamptz default now();
alter table public.tournaments add column if not exists created_at timestamptz default now();
alter table public.matches add column if not exists created_at timestamptz default now();
alter table public.registrations add column if not exists created_at timestamptz default now();
alter table public.match_registrations add column if not exists created_at timestamptz default now();
alter table public.transactions add column if not exists created_at timestamptz default now();
alter table public.withdrawals add column if not exists created_at timestamptz default now();
alter table public.notify_subscribers add column if not exists created_at timestamptz default now();
alter table public.policies add column if not exists created_at timestamptz default now();
alter table public.services add column if not exists created_at timestamptz default now();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.banners enable row level security;
alter table public.faqs enable row level security;
alter table public.games enable row level security;
alter table public.market_items enable row level security;
alter table public.tournaments enable row level security;
alter table public.matches enable row level security;
alter table public.registrations enable row level security;
alter table public.match_registrations enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notify_subscribers enable row level security;
alter table public.policies enable row level security;
alter table public.services enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Read" on public.profiles;
drop policy if exists "Public Read" on public.app_settings;
drop policy if exists "Public Read" on public.banners;
drop policy if exists "Public Read" on public.faqs;
drop policy if exists "Public Read" on public.games;
drop policy if exists "Public Read" on public.market_items;
drop policy if exists "Public Read" on public.tournaments;
drop policy if exists "Public Read" on public.matches;
drop policy if exists "Public Read" on public.registrations;
drop policy if exists "Public Read" on public.match_registrations;
drop policy if exists "Public Read" on public.transactions;
drop policy if exists "Public Read" on public.withdrawals;
drop policy if exists "Public Read" on public.notify_subscribers;
drop policy if exists "Public Read" on public.policies;
drop policy if exists "Public Read" on public.services;

drop policy if exists "Anon Insert" on public.profiles;
drop policy if exists "Anon Insert" on public.tournaments;
drop policy if exists "Anon Insert" on public.matches;
drop policy if exists "Anon Insert" on public.games;
drop policy if exists "Anon Insert" on public.banners;
drop policy if exists "Anon Insert" on public.faqs;

-- Drop potentially conflicting separate policies (Fix for duplicate policy error)
drop policy if exists "Permissions" on public.app_settings;
drop policy if exists "App Settings Insert" on public.app_settings;
drop policy if exists "App Settings Update" on public.app_settings;

-- Public Read Access Policies (Simplified for Dev)
create policy "Public Read" on public.profiles for select using (true);
create policy "Public Read" on public.app_settings for select using (true);
create policy "Public Read" on public.banners for select using (true);
create policy "Public Read" on public.faqs for select using (true);
create policy "Public Read" on public.games for select using (true);
create policy "Public Read" on public.market_items for select using (true);
create policy "Public Read" on public.tournaments for select using (true);
create policy "Public Read" on public.matches for select using (true);
create policy "Public Read" on public.registrations for select using (true);
create policy "Public Read" on public.match_registrations for select using (true);
create policy "Public Read" on public.transactions for select using (true);
create policy "Public Read" on public.withdrawals for select using (true);
create policy "Public Read" on public.notify_subscribers for select using (true);
create policy "Public Read" on public.policies for select using (true);
create policy "Public Read" on public.services for select using (true);

-- Insert Access (For Dev/Admin) - Expanded as needed
create policy "Anon Insert" on public.profiles for insert with check (true);
create policy "Anon Insert" on public.tournaments for insert with check (true);
create policy "Anon Insert" on public.matches for insert with check (true);

-- Additional Policies for Game Management
-- Ensure full access for development (Fixes 'Coming Soon' toggle and Add Game issues)
DROP POLICY IF EXISTS "Anon Insert" ON public.games;
DROP POLICY IF EXISTS "Anon Update" ON public.games;
DROP POLICY IF EXISTS "Anon Delete" ON public.games;
DROP POLICY IF EXISTS "Enable Read Access" ON public.games;
DROP POLICY IF EXISTS "Enable Insert Access" ON public.games;
DROP POLICY IF EXISTS "Enable Update Access" ON public.games;
DROP POLICY IF EXISTS "Enable Delete Access" ON public.games;
DROP POLICY IF EXISTS "Enable update for all users" ON public.games;

CREATE POLICY "Enable Read Access" ON public.games FOR SELECT USING (true);
CREATE POLICY "Enable Insert Access" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Access" ON public.games FOR UPDATE USING (true);
CREATE POLICY "Enable Delete Access" ON public.games FOR DELETE USING (true);

create policy "Anon Insert" on public.banners for insert with check (true);
create policy "Anon Insert" on public.faqs for insert with check (true);

-- Enable Update for Profiles (Wallet Management)
create policy "Anon Update" on public.profiles for update using (true);
-- Enable Select for Profiles (Admin Search)
create policy "Anon Select" on public.profiles for select using (true);

-- Unique names for App Settings policies
create policy "App Settings Insert" on public.app_settings for insert with check (true);
create policy "App Settings Update" on public.app_settings for update using (true);

-- Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';

-- STORAGE BUCKET SETUP
-- Run this block to create the 'images' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage Policies
-- Drop existing to ensure no conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Auth Upload" on storage.objects;
drop policy if exists "Update Image" on storage.objects;
drop policy if exists "Delete Image" on storage.objects;
drop policy if exists "Allow Upload" on storage.objects;
drop policy if exists "Allow Update" on storage.objects;
drop policy if exists "Allow Delete" on storage.objects;

create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );
create policy "Allow Upload" on storage.objects for insert with check ( bucket_id = 'images' );
create policy "Allow Update" on storage.objects for update with check ( bucket_id = 'images' );
create policy "Allow Delete" on storage.objects for delete using ( bucket_id = 'images' );

-- AUTOMATION: Handle New User Signup (Trigger)
-- This ensures that whenever a user signs up via Auth, they are added to public.profiles

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- BACKFILL: Fix for existing users who are missing from profiles
-- This effectively syncs auth.users -> public.profiles for anyone missed
insert into public.profiles (id, email, username)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
