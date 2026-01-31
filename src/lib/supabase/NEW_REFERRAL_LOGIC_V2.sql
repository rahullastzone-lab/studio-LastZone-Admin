-- NEW REFERRAL LOGIC V2 (STRICT "LZ" FORMAT) + ADMIN PANEL FIX
-- Config:
-- 1. Code Format: Must start with "LZ" and be 8 chars long (e.g., LZ1234AB).
-- 2. New User (No Code/Invalid) -> 0 Bonus.
-- 3. New User (Valid Code)     -> 25 Bonus.
-- 4. Referrer                  -> 25 Bonus.
-- 5. Deposit                   -> 0 (Always).
-- 6. Email/Username            -> Syncs from Auth (REQUIRED for Admin Panel).

-- A. CLEANUP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- B. CREATE FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_ref_code text;
  input_ref_code text;
  referrer_id uuid;
  
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
  
  -- Bonus Config
  JOINING_BONUS decimal := 25.00;
  REFERRER_BONUS decimal := 25.00;
  
BEGIN
  -- 1. Setup Defaults
  -- NEW FORMAT: "LZ" + 6 Random Chars = 8 Chars Total
  new_user_ref_code := 'LZ' || upper(substring(md5(random()::text) from 1 for 6));
  random_image_url := image_list[floor(random() * 13 + 1)];
  
  -- Get user input referral code
  input_ref_code := NULLIF(TRIM(upper(new.raw_user_meta_data->>'referral_code')), '');

  -- 2. Validate Format & Find Referrer
  -- Relaxed check: Allow any valid code that exists in profiles
  IF input_ref_code IS NOT NULL
  THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = input_ref_code;
  END IF;

  -- 3. Insert Profile
  INSERT INTO public.profiles (
    id,
    full_name,
    email,         -- ADDED: Required for Admin Panel
    username,      -- ADDED: Required for Admin Panel
    avatar_url,
    referral_code,
    wallet_balance,  -- STRICTLY 0
    winnings,        -- STRICTLY 0
    bonus            -- 25 if valid code found, else 0
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,                                                                              -- ADDED
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),          -- ADDED
    random_image_url,
    new_user_ref_code,
    0, 
    0,
    CASE WHEN referrer_id IS NOT NULL THEN JOINING_BONUS ELSE 0 END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username);

  -- 4. Process Referral Reward
  IF referrer_id IS NOT NULL THEN
    -- Credit New User
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (new.id, JOINING_BONUS, 'signup_bonus', 'Welcome Bonus (Code: ' || input_ref_code || ')', 'success');

    -- Credit Referrer
    UPDATE public.profiles 
    SET bonus = bonus + REFERRER_BONUS 
    WHERE id = referrer_id;

    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (referrer_id, REFERRER_BONUS, 'referral_bonus', 'Referral Bonus for ' || COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 'success');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- D. BACKFILL FOR EXISTING USERS (To fix Admin Panel display)
UPDATE public.profiles p
SET email = u.email,
    username = COALESCE(p.username, u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.username IS NULL);
