-- FIX MISSING USER DATA (Emails & Usernames)
-- Run this in your Supabase SQL Editor

-- 1. Backfill Email and Username from auth.users for existing profiles
UPDATE public.profiles p
SET
  email = au.email,
  username = COALESCE(
    p.username, 
    au.raw_user_meta_data->>'username', 
    au.raw_user_meta_data->>'name', -- Google auth often uses 'name'
    au.raw_user_meta_data->>'full_name', 
    'User-' || substring(au.id::text from 1 for 6)
  ),
  full_name = COALESCE(
    p.full_name, 
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name'
  )
FROM auth.users au
WHERE p.id = au.id
  AND (p.email IS NULL OR p.email = '' OR p.username IS NULL OR p.username = 'Unknown');

-- 2. Ensure the Trigger correctly syncs data for NEW users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, wallet_balance, winnings, bonus)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      'User-' || substring(NEW.id::text from 1 for 6)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    0, 0, 0
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify results
SELECT id, email, username FROM public.profiles WHERE email IS NULL OR username = 'Unknown';
