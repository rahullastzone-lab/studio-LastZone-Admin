-- Fix missing relationships for match_registrations and matches

-- Ensure Foreign Key from match_registrations -> matches exists
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

-- Ensure Foreign Key from matches -> tournaments exists
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
