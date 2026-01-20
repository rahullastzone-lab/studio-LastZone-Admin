-- FIX: Ensure Tournaments are in the Future
-- The website hides tournaments that have already "started" or are in the past.

-- 1. Update all 'Open' tournaments to start 24 hours from now
-- This ensures they appear in the "Upcoming" list.
UPDATE public.tournaments
SET start_time = NOW() + interval '1 day'
WHERE status = 'Open' 
AND start_time < NOW();

-- 2. Also update the linked Matches to have the same start time
UPDATE public.matches m
SET start_time = t.start_time
FROM public.tournaments t
WHERE m.tournament_id = t.id
AND t.status = 'Open';

-- 3. Verify the changes
SELECT name, start_time, status FROM public.tournaments WHERE status = 'Open';
