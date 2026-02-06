-- FINAL REFERRAL FIX V4 (Referral + Admin Panel + Tracking)
-- 1. Adds 'referred_by' column (Critical for tracking)
-- 2. Backfills Email/Username (Critical for Admin Panel)
-- 3. Implements Dynamic Bonus (25/25/0)
-- 4. Uses 'completed' status for consistency

-- A. ENSURE COLUMNS EXIST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;

-- B. UPDATE SETTINGS (Dynamic Control)
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('signup_bonus_default', '0', 'Bonus for new user without referral'),
  ('signup_bonus_referral_user', '25', 'Bonus for new user WITH referral'),
  ('signup_bonus_referral_referrer', '25', 'Bonus for the referrer')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- C. CLEANUP OLD FUNCTIONS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- D. CREATE ROBUST FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_ref_code text;
  input_ref_code text;
  referrer_id uuid;
  
  -- Settings (Fetched Dynamically)
  bonus_user decimal := 25;
  bonus_referrer decimal := 25;
  
  -- Calculated
  final_bonus decimal := 0;
  
  -- Avatar Logic
  image_list text[] := ARRAY[
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/1a7737e1-05d8-4b52-91c7-1aa756c401e2.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/2186957b-7203-4180-954f-ec91d7589b63.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/31ae057d-1b16-4dd3-a949-cdeb25316948.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/364e105f-c3b9-43e0-ae4b-ad07795ef72a.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/4434e331-4dd1-471a-891c-50797a47416e.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/517a2045-f627-41af-8753-40af046cfc52.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/8ee0b5db-b61a-4b9a-bd1b-3f6d26f3a3fb.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/b098f9e9-2fe3-4f7b-b8c8-79575ef56a36.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/b28a596d-6a15-4bf5-b591-00b730ff4636.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/c94f27ee-e1ae-43b7-8e06-21a75880c4b0.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/cbd27595-650e-4de2-b6ce-3ff2f2bdd151.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/dc16bd20-0517-423b-8749-a0f25eaf9a88.png',
    'https://jadbjketgcaoogpkieab.supabase.co/storage/v1/object/public/images/e79d82b5-2c0e-4289-8704-a3f5de74e6e4.png'
  ];
  random_image_url text;
BEGIN
  -- 1. Fetch Settings
  SELECT 
    COALESCE((SELECT value::decimal FROM public.app_settings WHERE key = 'signup_bonus_referral_user'), 25),
    COALESCE((SELECT value::decimal FROM public.app_settings WHERE key = 'signup_bonus_referral_referrer'), 25)
  INTO bonus_user, bonus_referrer;

  -- 2. Defaults & Image
  new_user_ref_code := 'LZ' || upper(substring(md5(random()::text) from 1 for 6));
  random_image_url := image_list[floor(random() * 13 + 1)];
  
  -- 3. Validate Referral Code
  input_ref_code := NULLIF(TRIM(upper(new.raw_user_meta_data->>'referral_code')), '');
  IF input_ref_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = input_ref_code;
  END IF;

  -- 4. Calculate Final Bonus
  IF referrer_id IS NOT NULL THEN
    final_bonus := bonus_user;
  ELSE
    final_bonus := 0;
    input_ref_code := NULL; -- Clear if invalid/not found
  END IF;

  -- 5. Insert Record (Using EXPLICIT columns for Admin Panel)
  INSERT INTO public.profiles (
    id,
    full_name,
    email,          -- Syncing Email
    username,       -- Syncing Username
    avatar_url,
    referral_code,
    wallet_balance, -- Use Valid Column Name
    bonus,
    referred_by     -- TRACKING ADDED
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', random_image_url),
    new_user_ref_code,
    0,           -- Initial Balance 0
    final_bonus, -- 0 or 25
    input_ref_code
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username);

  -- 6. Rewards & Logging
  IF referrer_id IS NOT NULL THEN
    -- Credit Referrer
    UPDATE public.profiles 
    SET bonus = bonus + bonus_referrer 
    WHERE id = referrer_id;

    -- Log for Referrer
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (referrer_id, bonus_referrer, 'referral_bonus', 'Referral Bonus for ' || COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 'completed');
  END IF;

  -- Log for New User (if bonus received)
  IF final_bonus > 0 THEN
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (new.id, final_bonus, 'signup_bonus', 'Welcome Bonus (Code: ' || input_ref_code || ')', 'completed');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- F. BACKFILL ADMIN PANEL DATA (Fixes Missing Emails/Usernames)
UPDATE public.profiles p
SET 
  email = u.email,
  username = COALESCE(p.username, u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.username IS NULL);

-- G. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
