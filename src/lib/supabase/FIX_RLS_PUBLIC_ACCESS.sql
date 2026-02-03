-- FIX_RLS_PUBLIC_ACCESS.sql

-- 1. Tournaments Table
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent conflicts
DROP POLICY IF EXISTS "Public Select Tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tournaments;

-- Create new "Allow All" policy for Select
CREATE POLICY "Public Select Tournaments" 
ON public.tournaments 
FOR SELECT 
USING (true);

-- Grant select permission explicitly (just in case)
GRANT SELECT ON public.tournaments TO anon, authenticated;


-- 2. Matches Table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public Select Matches" ON public.matches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.matches;

-- Create new "Allow All" policy
CREATE POLICY "Public Select Matches" 
ON public.matches 
FOR SELECT 
USING (true);

-- Grant select permission
GRANT SELECT ON public.matches TO anon, authenticated;

-- 3. Games Table (Usually public too)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Games" ON public.games;
CREATE POLICY "Public Select Games" ON public.games FOR SELECT USING (true);
GRANT SELECT ON public.games TO anon, authenticated;
