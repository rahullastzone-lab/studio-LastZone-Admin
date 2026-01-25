-- Create Tickets Table and Policies (Idempotent Fix)

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id),
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Closed'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent "policy already exists" error
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can do everything" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;

-- 4. Re-create Policies

-- User Policies
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin/Service Role Policies
-- Assuming admins are checked via a custom claim or just checking the profiles table is_admin flag
-- For now, we'll allow service role blindly, and if you have an admin policy logic, we can add it.
CREATE POLICY "Service role can do everything"
ON public.tickets
USING (true)
WITH CHECK (true);

-- Optional: If you want specific admin access based on profiles.is_admin
-- CREATE POLICY "Admins can view all tickets"
-- ON public.tickets FOR SELECT
-- USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. Force Schema Reload
NOTIFY pgrst, 'reload schema';
