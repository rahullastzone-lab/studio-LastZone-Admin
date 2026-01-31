-- IMPLEMENT BONUS WALLET & MATCH JOIN LOGIC
-- 1. Add Bonus Column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonus DECIMAL DEFAULT 0.00;

-- 2. Update Referral Logic (V3) to use Bonus Wallet
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
BEGIN
  -- A. Generate Code
  LOOP
    new_referral_code := generate_referral_code();
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- B. Avatar Logic
  final_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url', 
    'user-avatar-' || floor(random() * 13 + 1)::text
  );

  -- C. Referral Check
  used_referral_code := new.raw_user_meta_data->>'referral_code';
  IF used_referral_code IS NOT NULL AND used_referral_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = used_referral_code;
    IF referrer_id IS NOT NULL THEN
      welcome_bonus := new_user_bonus;
    ELSE
      welcome_bonus := 0.00;
      used_referral_code := NULL;
    END IF;
  ELSE
    welcome_bonus := 0.00;
  END IF;

  -- D. Insert Profile (Credit Bonus to 'bonus' column, NOT wallet_balance)
  INSERT INTO public.profiles (
    id, username, email, full_name, avatar_url, wallet_balance, bonus, referral_code, referred_by
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1), 'User-' || SUBSTRING(new.id::text, 1, 8)),
    new.email,
    new.raw_user_meta_data->>'full_name',
    final_avatar_url,
    0, -- Main Balance starts at 0
    welcome_bonus, -- Bonus goes here
    new_referral_code,
    used_referral_code
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username);

  -- E. Handle Referrer Bonus
  IF referrer_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET bonus = bonus + referrer_bonus, -- Credit to Bonus Wallet
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
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Match Join Logic (The Main Requirement)
CREATE OR REPLACE FUNCTION public.join_match(
  p_match_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_entry_fee DECIMAL;
  v_map TEXT;
  v_bonus_balance DECIMAL;
  v_main_balance DECIMAL;
  v_bonus_deduction DECIMAL := 0;
  v_main_deduction DECIMAL := 0;
  v_bonus_limit_percent DECIMAL;
BEGIN
  -- A. Get Match Details
  SELECT entry_fee, map INTO v_entry_fee, v_map FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Match not found');
  END IF;

  -- B. Get User Balances
  SELECT wallet_balance, bonus INTO v_main_balance, v_bonus_balance FROM public.profiles WHERE id = p_user_id;

  -- C. Calculate Deduction Rules
  -- Classic: Erangel, Miramar, Livik, Sanhok -> 20%
  -- TDM/Arena -> 5%
  IF v_map IN ('Erangel', 'Miramar', 'Livik', 'Sanhok') THEN
    v_bonus_limit_percent := 0.20;
  ELSE
    -- TDM, Arena, etc.
    v_bonus_limit_percent := 0.05;
  END IF;

  -- Calculate Max Usable Bonus
  v_bonus_deduction := v_entry_fee * v_bonus_limit_percent;

  -- If user has less bonus than limit, use all available bonus
  IF v_bonus_balance < v_bonus_deduction THEN
    v_bonus_deduction := v_bonus_balance;
  END IF;

  -- Remaining amount from Main Balance
  v_main_deduction := v_entry_fee - v_bonus_deduction;

  -- D. Check Insufficient Funds
  IF v_main_balance < v_main_deduction THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient main wallet balance');
  END IF;

  -- E. Execute Deductions
  UPDATE public.profiles
  SET wallet_balance = wallet_balance - v_main_deduction,
      bonus = bonus - v_bonus_deduction
  WHERE id = p_user_id;

  -- F. Create Registration (Assuming match_registrations table exists)
  INSERT INTO public.match_registrations (match_id, user_id, status)
  VALUES (p_match_id, p_user_id, 'Registered');

  -- G. Log Transaction
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, -v_entry_fee, 'Entry Fee', 'Success', 'Match Join: ' || v_map || ' (Bonus: ' || v_bonus_deduction || ')');

  RETURN json_build_object('success', true, 'message', 'Joined successfully', 'bonus_used', v_bonus_deduction, 'main_deducted', v_main_deduction);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Force Reload
NOTIFY pgrst, 'reload schema';
