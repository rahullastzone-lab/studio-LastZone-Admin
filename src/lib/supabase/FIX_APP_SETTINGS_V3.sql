-- FIX APP SETTINGS V3 (FINAL SCHEMA ALIGNMENT + REFERRAL FIX)
-- 1. Drops 'app_settings' and recreates with 'key'/'value' (Main Website Standard)
-- 2. Inserts all default settings.
-- 3. Updates 'handle_new_user' to use the new schema.

-- A. RECREATE TABLE (MATCHING MAIN WEBSITE)
DROP TABLE IF EXISTS public.app_settings;

CREATE TABLE public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,    -- Standardized column name
  value text,                  -- Standardized column name
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable Read Access" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Enable Insert Access" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Access" ON public.app_settings FOR UPDATE USING (true);


-- B. INSERT DEFAULTS (INCLUDING USER RULES FOR BONUS)
INSERT INTO public.app_settings (key, value, description) VALUES
-- General
('app_name', 'LastZone Esports', 'Global Application Name'),
('support_email', 'support@lastzone.gg', 'Contact Email'),
('maintenance_mode', 'false', 'App Access Control'),

-- Bonus Rules (0 for default, 25 for referral)
('signup_bonus_default', '0', 'Bonus for new user without referral'),
('signup_bonus_referral_user', '25', 'Bonus for new user WITH referral'),
('signup_bonus_referral_referrer', '25', 'Bonus for the referrer'),
('bonus_percent_classic', '20', 'Max bonus % usable in Classic matches'),
('bonus_percent_tdm', '5', 'Max bonus % usable in TDM matches'),

-- Payment (ZapUPI)
('ZAPUPI_TOKEN_KEY', '', 'ZapUPI Token Key'),
('ZAPUPI_SECRET_KEY', '', 'ZapUPI Secret Key'),

-- Social
('social_instagram', '', 'Instagram URL'),
('social_facebook', '', 'Facebook URL'),
('social_twitter', '', 'Twitter/X URL'),
('social_youtube', '', 'YouTube URL'),
('social_discord', '', 'Discord URL'),

-- Branding
('logo_header', '', 'Header Logo URL'),
('logo_footer', '', 'Footer Logo URL');


-- C. ENSURE PROFILES COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;


-- D. FIX REFERRAL LOGIC (USING NEW SCHEMA)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_ref_code text;
  input_ref_code text;
  referrer_id uuid;
  
  -- Settings Variables
  bonus_default decimal := 0;
  bonus_referral_user decimal := 25;
  bonus_referral_referrer decimal := 25;
  
  -- Calculated Bonus
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
  -- 1. Fetch Settings (Fail-safe defaults if missing)
  -- Uses 'key' and 'value' columns now
  SELECT 
    COALESCE((SELECT value::decimal FROM public.app_settings WHERE key = 'signup_bonus_default'), 0),
    COALESCE((SELECT value::decimal FROM public.app_settings WHERE key = 'signup_bonus_referral_user'), 25),
    COALESCE((SELECT value::decimal FROM public.app_settings WHERE key = 'signup_bonus_referral_referrer'), 25)
  INTO 
    bonus_default,
    bonus_referral_user,
    bonus_referral_referrer;

  -- 2. Generate New User's Referral Code (LZ + 6 chars)
  new_user_ref_code := 'LZ' || upper(substring(md5(random()::text) from 1 for 6));
  random_image_url := image_list[floor(random() * 13 + 1)];
  
  -- 3. Get User Input Referral Code (Normalize: Trim + Upper)
  input_ref_code := NULLIF(TRIM(upper(new.raw_user_meta_data->>'referral_code')), '');
  
  -- 4. Validate Referrer
  IF input_ref_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = input_ref_code;
  END IF;

  -- 5. Determine Bonus Amount
  IF referrer_id IS NOT NULL THEN
    final_bonus := bonus_referral_user; -- Valid Code -> 25 (or setting)
  ELSE
    final_bonus := bonus_default;       -- No/Invalid Code -> 0 (or setting)
    input_ref_code := NULL;             -- Clear invalid code
  END IF;

  -- 6. Insert Profile
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    username,
    avatar_url,
    referral_code,
    wallet_balance,  -- Main Balance
    bonus,           -- Bonus Wallet
    referred_by      -- Storing who referred this user
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', random_image_url),
    new_user_ref_code,
    0,           -- Always 0 Main Balance
    final_bonus, -- 0 or 25 based on logic
    input_ref_code
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- 7. Credit Referrer (If exists)
  IF referrer_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET bonus = bonus + bonus_referral_referrer 
    WHERE id = referrer_id;

    -- Log Referrer Transaction
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (referrer_id, bonus_referral_referrer, 'referral_bonus', 'Referral Bonus for ' || COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 'success');
  END IF;

  -- 8. Log New User Transaction (Only if bonus > 0)
  IF final_bonus > 0 THEN
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (new.id, final_bonus, 'signup_bonus', 'Welcome Bonus (Code used: ' || COALESCE(input_ref_code, 'None') || ')', 'success');
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- E. RE-ATTACH TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- F. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
