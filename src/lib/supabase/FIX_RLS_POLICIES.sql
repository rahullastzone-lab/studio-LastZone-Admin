-- Fix RLS Policies for 'policies' table
-- The error "Failed to save policy" is occurring because write access was not enabled.

-- 1. Enable Insert (Create new policy)
create policy "Enable Insert" on public.policies for insert with check (true);

-- 2. Enable Update (Edit existing policy)
create policy "Enable Update" on public.policies for update using (true);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
