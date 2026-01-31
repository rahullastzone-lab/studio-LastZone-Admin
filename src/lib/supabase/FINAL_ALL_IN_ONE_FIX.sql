-- FINAL ALL-IN-ONE FIX
-- Solves conflict between "Fix Admin Data" (Simple Sync) and "Main Website Logic" (Referrals/Avatars).
-- RUN THIS SCRIPT ONLY. DO NOT RUN 'FIX_MISSING_USER_DATA.sql' AFTER THIS.

-- 1. Create Debug Log Table (if not exists)
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    message TEXT,
    payload JSONB
);

-- 2. Helper for Referral Code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'LZ';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. THE MASTER TRIGGER (Combines ALL Logic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
  referrer_id UUID;
  referrer_bonus DECIMAL := 25.00;
  new_user_bonus DECIMAL := 25.00;
  welcome_bonus DECIMAL := 0.00;
  used_referral_code TEXT;
  final_avatar_url TEXT;
  raw_meta JSONB;
BEGIN
  raw_meta := new.raw_user_meta_data;
  INSERT INTO public.debug_logs (message, payload) VALUES ('handle_new_user started', row_to_json(new));

  -- A. Generate Unique Referral Code
  LOOP
    new_referral_code := generate_referral_code();
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- B. Avatar Logic (Provided > Random 1-13)
  final_avatar_url := COALESCE(
    raw_meta->>'avatar_url', 
    'user-avatar-' || floor(random() * 13 + 1)::text
  );

  -- C. Check Referral Code (from metadata)
  used_referral_code := raw_meta->>'referral_code';
  IF used_referral_code IS NOT NULL AND used_referral_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = used_referral_code;
    
    IF referrer_id IS NOT NULL THEN
      welcome_bonus := new_user_bonus;
    ELSE
      -- Invalid Code
      welcome_bonus := 0.00;
      used_referral_code := NULL;
    END IF;
  ELSE
    welcome_bonus := 0.00;
  END IF;

  -- D. Insert OR Update Profile
  -- This handles BOTH new users AND "Unknown" users getting fixed
  INSERT INTO public.profiles (
    id, username, email, full_name, avatar_url, wallet_balance, bonus, referral_code, referred_by
  )
  VALUES (
    new.id,
    COALESCE(raw_meta->>'username', SPLIT_PART(new.email, '@', 1), 'User-' || SUBSTRING(new.id::text, 1, 8)),
    new.email,
    raw_meta->>'full_name',
    final_avatar_url,
    0, 
    welcome_bonus, 
    new_referral_code,
    used_referral_code
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Sync Username if missing or generic
    username = COALESCE(public.profiles.username, EXCLUDED.username);
    -- We do NOT overwrite avatar_url or wallet state on conflict

  -- E. Handle Referrer Bonus
  IF referrer_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET bonus = bonus + referrer_bonus,
        total_referrals = COALESCE(total_referrals, 0) + 1
    WHERE id = referrer_id;

    INSERT INTO public.transactions (user_id, amount, type, status, description)
    VALUES (referrer_id, referrer_bonus, 'Referral Bonus', 'Success', 'Referral Bonus for user ' || new_referral_code);
  END IF;

  -- F. Log Transaction for New User
  IF welcome_bonus > 0 THEN
    INSERT INTO public.transactions (user_id, amount, type, status, description)
    VALUES (new.id, welcome_bonus, 'Welcome Bonus', 'Success', 'Welcome Bonus using code ' || used_referral_code);
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.debug_logs (message, payload) VALUES ('ERROR', jsonb_build_object('msg', SQLERRM()));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-Apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. AGGRESSIVE BACKFILL (Fixes Admin Panel "Unknown" Users)
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

-- Fill missing profiles
INSERT INTO public.profiles (id, email, username, wallet_balance, bonus, referral_code, avatar_url)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
  0,
  0,
  'LZ' || substr(md5(random()::text), 1, 6), -- Generate code for backfill
  'user-avatar-' || floor(random() * 13 + 1)::text -- Generate avatar for backfill
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. Ensure Avatars and Referral Codes for Everyone
UPDATE public.profiles
SET avatar_url = 'user-avatar-' || floor(random() * 13 + 1)::text
WHERE avatar_url IS NULL OR avatar_url = '';

UPDATE public.profiles
SET referral_code = 'LZ' || substr(md5(random()::text), 1, 6)
WHERE referral_code IS NULL OR referral_code = '';

-- 7. Reload
NOTIFY pgrst, 'reload schema';
