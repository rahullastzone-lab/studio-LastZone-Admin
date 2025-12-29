-- FIX MISSING TABLES & RLS POLICIES
-- Run this in Supabase SQL Editor

-- 1. Transactions Table & Policy
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  amount numeric not null,
  type text not null,
  status text default 'Pending',
  description text,
  created_at timestamptz default now()
);
alter table public.transactions enable row level security;
drop policy if exists "Anon Insert" on public.transactions;
create policy "Anon Insert" on public.transactions for insert with check (true);
create policy "Public Read" on public.transactions for select using (true);

-- 2. Withdrawals Table & Policy
create table if not exists public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  amount numeric not null,
  upi_id text,
  status text default 'Pending',
  created_at timestamptz default now()
);
alter table public.withdrawals enable row level security;
drop policy if exists "Anon Insert" on public.withdrawals;
drop policy if exists "Anon Update" on public.withdrawals;
create policy "Anon Insert" on public.withdrawals for insert with check (true);
create policy "Anon Update" on public.withdrawals for update using (true);
create policy "Public Read" on public.withdrawals for select using (true);

-- 3. Notify Subscribers Table & Policy
create table if not exists public.notify_subscribers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  game_interest text,
  whatsapp_number text,
  fcm_token text,
  created_at timestamptz default now()
);
alter table public.notify_subscribers enable row level security;
drop policy if exists "Anon Insert" on public.notify_subscribers;
create policy "Anon Insert" on public.notify_subscribers for insert with check (true);
create policy "Public Read" on public.notify_subscribers for select using (true);

-- 4. Profiles Update Policy
drop policy if exists "Anon Update" on public.profiles;
create policy "Anon Update" on public.profiles for update using (true);

-- 5. Force Schema Refresh
NOTIFY pgrst, 'reload schema';
