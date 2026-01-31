-- FIX: Enforce Permanent & Random Avatars

-- 1. Update the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, wallet_balance)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1), 'User-' || SUBSTRING(new.id::text, 1, 8)),
    new.email,
    new.raw_user_meta_data->>'full_name',
    -- Logic: Use provided avatar OR generate random 'user-avatar-1' to 'user-avatar-13'
    COALESCE(
        new.raw_user_meta_data->>'avatar_url', 
        'user-avatar-' || floor(random() * 13 + 1)::text
    ),
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Only update username if the existing one is generic/unknown
    username = COALESCE(public.profiles.username, EXCLUDED.username);
    -- CRITICAL: We do NOT update avatar_url here, keeping it permanent.
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill existing users who have NO avatar
UPDATE public.profiles
SET avatar_url = 'user-avatar-' || floor(random() * 13 + 1)::text
WHERE avatar_url IS NULL OR avatar_url = '';

-- 3. Force schema reload
NOTIFY pgrst, 'reload schema';
