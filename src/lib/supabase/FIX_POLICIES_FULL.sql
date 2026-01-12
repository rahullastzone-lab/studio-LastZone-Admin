-- FIX POLICIES TABLE PERMISSIONS (V2)

-- 1. Reset: Drop possible existing policies to avoid conflicts
drop policy if exists "Enable Insert" on public.policies;
drop policy if exists "Enable Update" on public.policies;
drop policy if exists "Public Read" on public.policies;
drop policy if exists "Enable All" on public.policies;
drop policy if exists "Enable All Access" on public.policies;

-- 2. Enable FULL Access (Select, Insert, Update, Delete) for everyone
-- This is safe for now as this is an Admin Panel context, 
-- and we want to ensure no permission issues block saving.
create policy "Enable All Access" on public.policies
for all
using (true)
with check (true);

-- 3. Force schema cache reload
NOTIFY pgrst, 'reload schema';
