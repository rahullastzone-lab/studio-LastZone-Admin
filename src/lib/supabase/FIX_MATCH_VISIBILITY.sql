-- Fix Match Visibility (Status & RLS)

-- 1. Update existing 'Scheduled' matches to 'Open'
-- This ensures the tournament created by the user becomes visible immediately.
UPDATE public.matches
SET status = 'Open'
WHERE status = 'Scheduled';

-- 2. Ensure Public Read Access (RLS) for Tournaments
DO $$
BEGIN
    -- Enable RLS on tournaments if not already enabled
    ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

    -- Create policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' AND policyname = 'Public can view tournaments'
    ) THEN
        CREATE POLICY "Public can view tournaments" 
        ON public.tournaments FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 3. Ensure Public Read Access (RLS) for Matches
DO $$
BEGIN
    -- Enable RLS on matches if not already enabled
    ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

    -- Create policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'matches' AND policyname = 'Public can view matches'
    ) THEN
        CREATE POLICY "Public can view matches" 
        ON public.matches FOR SELECT 
        USING (true);
    END IF;
END $$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
