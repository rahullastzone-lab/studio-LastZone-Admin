-- Check and Fix Missing game_id in Tournaments

-- 1. Check for tournaments with NULL game_id
SELECT id, name, game_type, game_id 
FROM public.tournaments 
WHERE game_id IS NULL;

-- 2. Update game_id based on game_type matching games.name
-- This assumes public.games has entries like 'BGMI', 'FreeFire', 'COD Mobile' matching the game_type strings.
UPDATE public.tournaments t
SET game_id = g.id
FROM public.games g
WHERE t.game_id IS NULL 
AND lower(t.game_type) = lower(g.name);

-- 3. Check again to see if any are still null (e.g. mismatch in spelling)
SELECT id, name, game_type, game_id 
FROM public.tournaments 
WHERE game_id IS NULL;
