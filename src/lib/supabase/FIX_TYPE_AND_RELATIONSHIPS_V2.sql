-- Fix Column Type Link Mismatch (V2)

-- 1. Drop potential conflicting constraints first
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
        ALTER TABLE public.match_registrations
        ALTER COLUMN match_id TYPE uuid USING match_id::uuid;
    END IF;
END $$;

-- 3. Add Foreign Key: match_registrations -> matches
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

-- 4. Ensure Foreign Key from matches -> tournaments exists
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
