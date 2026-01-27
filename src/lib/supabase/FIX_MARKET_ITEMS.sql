-- CRITICAL FIX: Market Items Table and Policies

-- 1. Ensure Table Exists
create table if not exists public.market_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.market_items enable row level security;

-- 3. Drop Existing Policies to Clean Slate
drop policy if exists "Public Read" on public.market_items;
drop policy if exists "Enable Read Access" on public.market_items;
drop policy if exists "Enable Insert Access" on public.market_items;
drop policy if exists "Enable Update Access" on public.market_items;
drop policy if exists "Enable Delete Access" on public.market_items;

-- 4. Create Full Access Policies (For Admin Panel Usage)
create policy "Enable Read Access" on public.market_items for select using (true);
create policy "Enable Insert Access" on public.market_items for insert with check (true);
create policy "Enable Update Access" on public.market_items for update using (true);
create policy "Enable Delete Access" on public.market_items for delete using (true);

-- Safety Check for Services Table (often related)
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

drop policy if exists "Enable Read Access" on public.services;
drop policy if exists "Enable Insert Access" on public.services;
drop policy if exists "Enable Update Access" on public.services;
drop policy if exists "Enable Delete Access" on public.services;

create policy "Enable Read Access" on public.services for select using (true);
create policy "Enable Insert Access" on public.services for insert with check (true);
create policy "Enable Update Access" on public.services for update using (true);
create policy "Enable Delete Access" on public.services for delete using (true);

-- Force cache reload
NOTIFY pgrst, 'reload schema';
