-- MASTER DEBUG & FIX SCRIPT
-- This script recompiles the entire user creation flow with logging to debug why avatars/referrals might fail.

-- 1. Create Debug Log Table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    message TEXT,
    payload JSONB
);

-- 2. Master Trigger Function with Logging
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
  -- Log Start
  raw_meta := new.raw_user_meta_data;
  INSERT INTO public.debug_logs (message, payload) VALUES ('handle_new_user started', row_to_json(new));

  -- A. Generate Code
  LOOP
    new_referral_code := generate_referral_code();
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- B. Avatar Logic
  -- Priority: 1. Provided URL, 2. Existing Profile (if update), 3. Random Avatar
  final_avatar_url := COALESCE(
    raw_meta->>'avatar_url', 
    'user-avatar-' || floor(random() * 13 + 1)::text
  );
  
  INSERT INTO public.debug_logs (message, payload) 
  VALUES ('Avatar Logic', jsonb_build_object('final_avatar', final_avatar_url, 'meta_avatar', raw_meta->>'avatar_url'));

  -- C. Referral Check
  used_referral_code := raw_meta->>'referral_code';
  IF used_referral_code IS NOT NULL AND used_referral_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = used_referral_code;
    
    IF referrer_id IS NOT NULL THEN
      welcome_bonus := new_user_bonus;
      INSERT INTO public.debug_logs (message, payload) VALUES ('Valid Referral Code Found', jsonb_build_object('code', used_referral_code, 'referrer', referrer_id));
    ELSE
      -- Invalid Code
      welcome_bonus := 0.00;
      used_referral_code := NULL;
      INSERT INTO public.debug_logs (message, payload) VALUES ('Invalid Referral Code', jsonb_build_object('code', used_referral_code));
    END IF;
  ELSE
    welcome_bonus := 0.00;
  END IF;

  -- D. Insert/Update Profile
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
    username = COALESCE(public.profiles.username, EXCLUDED.username);
    -- Note: We intentionally DO NOT update avatar_url on conflict to keep it permanent

  INSERT INTO public.debug_logs (message, payload) VALUES ('Profile Inserted/Updated', jsonb_build_object('id', new.id));

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
  INSERT INTO public.debug_logs (message, payload) VALUES ('ERROR in handle_new_user', jsonb_build_object('error', SQLERRM, 'state', SQLSTATE));
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-Verify Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Backfill Missing Data (Sanity Check)
UPDATE public.profiles
SET avatar_url = 'user-avatar-' || floor(random() * 13 + 1)::text
WHERE avatar_url IS NULL OR avatar_url = '';

UPDATE public.profiles
SET referral_code = 'LZ' || substr(md5(random()::text), 1, 6)
WHERE referral_code IS NULL OR referral_code = '';

-- 5. Force Reload
NOTIFY pgrst, 'reload schema';
