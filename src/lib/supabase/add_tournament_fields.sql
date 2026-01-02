-- Add category column to tournaments table if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Normal';

-- Add is_coming_soon column to tournaments table if it doesn't exist
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS is_coming_soon boolean DEFAULT false;
