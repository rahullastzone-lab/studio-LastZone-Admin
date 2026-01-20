-- Inspect Games and Tournaments Data Mismatch

-- 1. List all Games
SELECT id, name, is_active FROM public.games;

-- 2. List Tournaments with their game_type and current game_id
SELECT id, name, game_type, game_id FROM public.tournaments;

-- 3. Check for failed matches
-- This shows tournaments that STILL have NULL game_id even after previous attempts
SELECT id, name, game_type 
FROM public.tournaments 
WHERE game_id IS NULL;
