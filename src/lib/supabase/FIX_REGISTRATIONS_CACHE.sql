-- FIX: Match Registrations Relationship & Schema Cache

-- 1. Clean up orphaned records that might prevent type conversion or FK creation
-- Deletes registrations where the match_id does not exist in the matches table
DELETE FROM public.match_registrations mr
WHERE NOT EXISTS (
    SELECT 1 FROM public.matches m WHERE m.id::text = mr.match_id::text
);

-- 2. Convert match_id from TEXT to UUID (if it isn't already)
-- This is critical because PostgREST needs proper FKs which require matching types
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'match_registrations' 
        AND column_name = 'match_id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.match_registrations 
        ALTER COLUMN match_id TYPE uuid USING match_id::uuid;
    END IF;
END $$;

-- 3. Re-create the Foreign Key Constraint
-- We drop it first to be sure, then recreate it
DO $$
BEGIN
    -- Try to drop if exists to ensure clean slate
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_registrations_match_id_fkey'
    ) THEN
        ALTER TABLE public.match_registrations DROP CONSTRAINT match_registrations_match_id_fkey;
    END IF;

    -- Add the constraint
    ALTER TABLE public.match_registrations
    ADD CONSTRAINT match_registrations_match_id_fkey
    FOREIGN KEY (match_id)
    REFERENCES public.matches(id)
    ON DELETE CASCADE;
END $$;

-- 4. IMPORTANT: Force PostgREST to reload the schema
-- This updates the API cache so it "sees" the new relationship immediately
NOTIFY pgrst, 'reload';
