-- LIMIT PASSWORD RESET ATTEMPTS
-- Goal: Restrict users to 3 password reset requests per 24 hours.

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.reset_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.reset_attempts ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (Strict: Only Service Role can Access)
-- This ensures users cannot read other people's attempts or spam insert easily from client side without API enforcement.

-- Allow Service Role full access
CREATE POLICY "Service Role Full Access"
ON public.reset_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Deny Anon/Authenticated (Explicitly, though default is deny if no policy matches)
-- We do NOT want public users querying this table.

-- 4. Index for Performance
CREATE INDEX IF NOT EXISTS idx_reset_attempts_email ON public.reset_attempts(email);
CREATE INDEX IF NOT EXISTS idx_reset_attempts_created_at ON public.reset_attempts(created_at);

-- Force Schema Refresh
NOTIFY pgrst, 'reload schema';
