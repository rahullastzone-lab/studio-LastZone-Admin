-- Fix for 'column "id" of relation "app_settings" does not exist'
-- This safely adds the ID column if it's missing.

-- 1. Add ID column if missing
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();

-- 2. Make it Primary Key if not already (Optional but good)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_pkey') THEN
        ALTER TABLE public.app_settings ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. Force Cache Reload
NOTIFY pgrst, 'reload schema';
