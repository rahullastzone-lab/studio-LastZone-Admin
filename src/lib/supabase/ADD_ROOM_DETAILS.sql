-- Add room_id and room_password columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS room_id text,
ADD COLUMN IF NOT EXISTS room_password text;

-- Force Schema Refresh
NOTIFY pgrst, 'reload schema';
