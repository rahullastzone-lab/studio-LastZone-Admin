-- CRITICAL FIX V2: Persistent Missing User Data

-- 1. Redefine the function to be absolutely sure it doesn't fail silently
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, wallet_balance)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1), 'User-' || SUBSTRING(new.id::text, 1, 8)),
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    0 -- Ensure wallet balance is initialized
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username, 'User-' || SUBSTRING(new.id::text, 1, 8));
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error (if you have an app_logs table, otherwise just return null to not block auth)
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Reforce the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Aggressive Backfill for Unknown/No Email users
-- Update Email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '' OR p.email = 'No Email');

-- Update Username
UPDATE public.profiles p
SET username = COALESCE(u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE p.id = u.id
AND (p.username IS NULL OR p.username = 'Unknown' OR p.username = '');

-- Insert missing profiles again (for any stragglers)
INSERT INTO public.profiles (id, email, username, wallet_balance)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
  0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Clean up "Unknown" display if possible (set default for display only if needed queries use it)
-- Note: This doesn't change data, just a safety check logic comment.
