-- FIX FAQS COLUMNS
-- This script ensures 'created_at' and 'category' columns exist and refreshes the schema cache.

-- 1. Ensure 'created_at' column exists in faqs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'created_at') THEN
        ALTER TABLE public.faqs ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Ensure 'category' column exists (also used in code)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'category') THEN
        ALTER TABLE public.faqs ADD COLUMN category text DEFAULT 'General';
    END IF;
END $$;

-- 3. Ensure RLS Policies allow access
-- Grant specific update/select permissions just to be safe
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT SELECT ON public.faqs TO anon;

-- 4. Force Schema Cache Reload (Critical)
NOTIFY pgrst, 'reload schema';
