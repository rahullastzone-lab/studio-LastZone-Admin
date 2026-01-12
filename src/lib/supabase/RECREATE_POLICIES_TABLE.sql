-- RECREATE POLICIES TABLE (Fix for PGRST204 Schema Cache Error)
-- WARNING: This will delete existing policy text. Ensure you have backups if needed.

-- 1. Drop the table entirely to clear any schema mismatch
drop table if exists public.policies cascade;

-- 2. Create the table again with explicit columns
create table public.policies (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  type text unique not null, -- 'privacy_policy', 'terms_conditions', 'refund_policy'
  created_at timestamptz default now()
);

-- 3. Disable RLS immediately to prevent permission errors
alter table public.policies disable row level security;

-- 4. Force Schema Cache Reload (Crucial step for PGRST204 error)
NOTIFY pgrst, 'reload schema';
