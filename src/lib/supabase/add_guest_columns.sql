-- Add guest_name column to notify_subscribers table if it doesn't exist
ALTER TABLE notify_subscribers 
ADD COLUMN IF NOT EXISTS guest_name text;

-- Add email column to notify_subscribers table if it doesn't exist
-- Note: 'email' column is added here directly to storing guest emails
ALTER TABLE notify_subscribers 
ADD COLUMN IF NOT EXISTS email text;
