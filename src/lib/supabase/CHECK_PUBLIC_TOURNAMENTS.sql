-- CHECK_PUBLIC_TOURNAMENTS.sql
-- This script helps debug why tournaments might not show up on the frontend

-- 1. Check Current Server Time
SELECT NOW() as server_time, current_setting('TIMEZONE') as server_timezone;

-- 2. Fetch the tournaments (Debugging ALL columns)
SELECT 
    t.id, 
    t.name, 
    g.name as linked_game_name, -- Should be 'BGMI'
    t.game_type,                -- Should be 'BGMI'
    t.mode,                     -- Should be 'Solo'
    t.status,                   -- Should be 'Open'
    t.start_time
FROM public.tournaments t
LEFT JOIN public.games g ON t.game_id = g.id
WHERE 
    t.status = 'Open' 
ORDER BY t.created_at DESC
LIMIT 10;
