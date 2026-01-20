-- DEEP DIVE DEBUGGING
-- Check for any reason why data is hidden from public view

-- 1. Check if ANY tournaments exist
SELECT count(*) as total_tournaments FROM public.tournaments;

-- 2. Check if ANY matches exist
SELECT count(*) as total_matches FROM public.matches;

-- 3. Check specific recent tournaments and their match status
-- We want to see if matches are 'Open' and linked correctly
SELECT 
    t.name as tournament_name, 
    t.status as tournament_status,
    m.id as match_id,
    m.status as match_status,
    m.start_time
FROM public.tournaments t
LEFT JOIN public.matches m ON t.id = m.tournament_id
ORDER BY t.created_at DESC
LIMIT 5;

-- 4. Check RLS Policies specifically for ANON role
-- This simulates what the public website sees
-- Note: 'set local role anon' only works if anon role exists and has permissions.
-- If this fails, ignore step 4.
-- set local role anon; 
-- SELECT count(*) as visible_tournaments_anon FROM public.tournaments;
-- reset role;

-- 5. List all policies on tournaments
SELECT * FROM pg_policies WHERE tablename = 'tournaments';

-- 6. List all policies on matches
SELECT * FROM pg_policies WHERE tablename = 'matches';
