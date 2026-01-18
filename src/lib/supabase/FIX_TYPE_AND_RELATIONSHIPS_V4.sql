-- Fix Column Type & Remove Orphans (V4 - Robust)

-- 1. Unconditionally drop the constraint if it exists to allow cleanup
ALTER TABLE public.match_registrations DROP CONSTRAINT IF EXISTS match_registrations_match_id_fkey;
ALTER TABLE public.match_registrations DROP CONSTRAINT IF EXISTS fk_match_tournaments;

-- 2. Convert to UUID (Iterative safety)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'match_registrations' 
        AND column_name = 'match_id' 
        AND data_type NOT IN ('uuid')
    ) THEN
        ALTER TABLE public.match_registrations
        ALTER COLUMN match_id TYPE uuid USING match_id::uuid;
    END IF;
END $$;

-- 3. AGGRESSIVE ORPHAN CLEANUP
-- Delete ANY match_registration where the match_id does not exist in matches table.
-- Using NOT EXISTS matches null handling better.
DELETE FROM public.match_registrations mr
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.matches m 
    WHERE m.id = mr.match_id
);

-- 4. Re-apply the Foreign Key Constraint
ALTER TABLE public.match_registrations
ADD CONSTRAINT match_registrations_match_id_fkey
FOREIGN KEY (match_id)
REFERENCES public.matches(id)
ON DELETE CASCADE;

-- 5. Helper: Re-add tournament FK just in case
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_tournament_id_fkey'
    ) THEN
        ALTER TABLE public.matches
        ADD CONSTRAINT matches_tournament_id_fkey
        FOREIGN KEY (tournament_id)
        REFERENCES public.tournaments(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
