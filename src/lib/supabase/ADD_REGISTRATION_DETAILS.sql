-- Add player_details column to registrations table to store Solo/Duo/Squad details
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS player_details JSONB DEFAULT '{}'::jsonb;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
