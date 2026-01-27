-- CRITICAL FIX: Add Email column to Notify Subscribers

-- 1. Add columns for guest users
ALTER TABLE public.notify_subscribers ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.notify_subscribers ADD COLUMN IF NOT EXISTS email text;

-- 2. Force schema cache reload
NOTIFY pgrst, 'reload schema';
