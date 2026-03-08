-- Add Top 5 Prize Pool Fields to tournaments table

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS prize_1st integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_2nd integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_3rd integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_4th integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_5th integer DEFAULT 0;

-- Optional: You could update existing tournaments with some default values if needed,
-- but the DEFAULT 0 clause covers new/existing rows that don't have these explicitly set.
