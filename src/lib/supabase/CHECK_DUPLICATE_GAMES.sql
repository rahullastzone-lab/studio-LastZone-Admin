-- Check for Duplicate Games
SELECT id, name, is_active, created_at 
FROM public.games 
WHERE name = 'BGMI';
