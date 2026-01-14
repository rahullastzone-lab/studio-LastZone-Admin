-- Fix 'Coming Soon' Toggle Issue (RLS Policies for Games Table)

-- 1. Ensure 'is_active' column exists (just in case)
alter table public.games add column if not exists is_active boolean default true;

-- 2. Enable RLS (standard practice, even if we make it public)
alter table public.games enable row level security;

-- 3. DROP ALL EXISTING POLICIES to remove conflicts/restrictions
drop policy if exists "Public Read" on public.games;
drop policy if exists "Anon Insert" on public.games;
drop policy if exists "Anon Update" on public.games;
drop policy if exists "Anon Delete" on public.games;
drop policy if exists "Enable Read Access" on public.games;
drop policy if exists "Enable Insert Access" on public.games;
drop policy if exists "Enable Update Access" on public.games;
drop policy if exists "Enable Delete Access" on public.games;
drop policy if exists "Enable update for all users" on public.games;

-- 4. CREATE NEW PERMISSIVE POLICIES (Allow everything for everyone for now to fix the bug)
create policy "Enable Read Access" on public.games for select using (true);
create policy "Enable Insert Access" on public.games for insert with check (true);
create policy "Enable Update Access" on public.games for update using (true);
create policy "Enable Delete Access" on public.games for delete using (true);

-- 5. Force Schema Cache Reload (Critical for immediate effect)
NOTIFY pgrst, 'reload schema';
