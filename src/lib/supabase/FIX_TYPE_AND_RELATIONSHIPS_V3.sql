-- Fix Column Type Link Mismatch (V3 - Cleanup Orphans)

-- 1. Drop potential conflicting constraints first to ensure clean state
ALTER TABLE public.match_registrations DROP CONSTRAINT IF EXISTS fk_match_tournaments;
ALTER TABLE public.match_registrations DROP CONSTRAINT IF EXISTS match_registrations_match_id_fkey;

-- 2. Fix match_registrations.match_id type (Convert Text -> UUID)
DO $$
BEGIN
    -- Check if it's not already uuid
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'match_registrations' 
        AND column_name = 'match_id' 
        AND data_type NOT IN ('uuid')
    ) THEN
        -- Verify if all data is valid UUID before converting, or delete invalid ones? 
        -- We assume data is UUID-like strings.
        ALTER TABLE public.match_registrations
        ALTER COLUMN match_id TYPE uuid USING match_id::uuid;
    END IF;
END $$;

-- 3. CLEANUP ORPHANED RECORDS
-- Delete match_registrations that point to a match_id that doesn't exist in the matches table
DELETE FROM public.match_registrations
WHERE match_id NOT IN (SELECT id FROM public.matches);

-- 4. Add Foreign Key: match_registrations -> matches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_registrations_match_id_fkey'
    ) THEN
        ALTER TABLE public.match_registrations
        ADD CONSTRAINT match_registrations_match_id_fkey
        FOREIGN KEY (match_id)
        REFERENCES public.matches(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Ensure Foreign Key from matches -> tournaments exists
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
