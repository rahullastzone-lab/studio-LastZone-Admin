-- FIX: Tournament Time & Schema (V2)

-- 1. Fix schema: Ensure start_time is TIMESTAMP, not TEXT
-- The previous error "operator does not exist: text < timestamp" confirms the column is text.
-- We convert it to timestamptz to enable proper date comparisons and sorting.
DO $$
BEGIN
    -- Check if tournaments.start_time is text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tournaments' 
        AND column_name = 'start_time' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.tournaments
        ALTER COLUMN start_time TYPE timestamptz USING start_time::timestamptz;
    END IF;

    -- Check if matches.start_time is text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'matches' 
        AND column_name = 'start_time' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.matches
        ALTER COLUMN start_time TYPE timestamptz USING start_time::timestamptz;
    END IF;
END $$;

-- 2. Update 'Open' tournaments to start in the future (Tomorrow)
-- Now that the column type is fixed (or if it was already correct), this query will run without error.
UPDATE public.tournaments
SET start_time = NOW() + interval '1 day'
WHERE status = 'Open' 
AND start_time < NOW(); 

-- 3. Sync linked Matches to have the same start time
UPDATE public.matches m
SET start_time = t.start_time
FROM public.tournaments t
WHERE m.tournament_id = t.id
AND t.status = 'Open';

-- 4. Verification
SELECT name, start_time, status FROM public.tournaments WHERE status = 'Open';
