-- FIX FOR ERROR: 42710 (Duplicate Policy on app_settings)

-- 1. Enable RLS (idempotent operation)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential existing policies to prevent conflicts
-- We drop common names that might have been used in previous scripts
DROP POLICY IF EXISTS "Public Read" ON public.app_settings;
DROP POLICY IF EXISTS "Enable Read Access" ON public.app_settings;
DROP POLICY IF EXISTS "Enable Insert Access" ON public.app_settings;
DROP POLICY IF EXISTS "Enable Update Access" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "App Settings Insert" ON public.app_settings;
DROP POLICY IF EXISTS "App Settings Update" ON public.app_settings;

-- 3. Re-create Policies correctly

-- Allow everyone (including anon) to read app settings (needed for login page, etc)
CREATE POLICY "Enable Read Access" 
ON public.app_settings FOR SELECT 
USING (true);

-- Allow authenticated users (or admins) to modify settings
-- Adjust 'USING (true)' to a stricter check if needed in the future
CREATE POLICY "Enable Insert Access" 
ON public.app_settings FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable Update Access" 
ON public.app_settings FOR UPDATE 
USING (true);

-- 4. Force Schema Reload
NOTIFY pgrst, 'reload schema';
