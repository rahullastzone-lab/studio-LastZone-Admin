-- Inspect Tournaments and Matches

-- 1. Check Tournaments
SELECT id, name, game_type, status, start_time, map
FROM public.tournaments 
ORDER BY created_at DESC;

-- 2. Check Matches linked to recent tournaments
-- Fixed: m.map -> t.map (Map exists on Tournament, not Match)
SELECT m.id, m.room_id, t.map, m.status, t.name as tournament_name
FROM public.matches m
RIGHT JOIN public.tournaments t ON m.tournament_id = t.id
WHERE t.name IN ('BGMI', 'BGMI Final', 'BATTLEGROUND MOBILE INDIA');

-- 3. Check Policies
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('tournaments', 'matches');
