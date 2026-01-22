-- FIX USER STATUS COLUMN
-- This script explicitly ensures the 'status' column exists and refreshes the schema cache.

-- 1. Ensure 'status' column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status text DEFAULT 'Active';
    END IF;
END $$;

-- 2. Ensure RLS Policy allows updating 'status'
-- We already have a broad update policy from the previous fix, but let's be specific just in case.
GRANT UPDATE (status) ON public.profiles TO authenticated;
GRANT UPDATE (status) ON public.profiles TO anon;

-- 3. Force Schema Cache Reload (Critical for the client to see the new column)
NOTIFY pgrst, 'reload schema';
