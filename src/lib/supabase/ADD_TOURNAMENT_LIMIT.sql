-- ADD TOURNAMENT PLAYER LIMIT & PRESERVE BONUS LOGIC

-- 1. Add max_players column to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 100;

-- 2. Update join_match with Limit Check + Bonus Logic
CREATE OR REPLACE FUNCTION public.join_match(
  p_match_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_entry_fee DECIMAL;
  v_map TEXT;
  v_tournament_id UUID;
  v_max_players INTEGER;
  v_current_players INTEGER;
  v_bonus_balance DECIMAL;
  v_main_balance DECIMAL;
  v_bonus_deduction DECIMAL := 0;
  v_main_deduction DECIMAL := 0;
  v_bonus_limit_percent DECIMAL;
BEGIN
  -- A. Get Match & Tournament Details
  SELECT m.entry_fee, m.map, m.tournament_id, t.max_players
  INTO v_entry_fee, v_map, v_tournament_id, v_max_players
  FROM public.matches m
  JOIN public.tournaments t ON m.tournament_id = t.id
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Match or Tournament not found');
  END IF;

  -- B. Check Player Limit
  SELECT COUNT(*) INTO v_current_players
  FROM public.match_registrations
  WHERE match_id = p_match_id
  AND status = 'Registered';

  IF v_current_players >= v_max_players THEN
    RETURN json_build_object('success', false, 'message', 'Match is Full (' || v_max_players || ' players max)');
  END IF;

  -- C. Check if User Already Joined
  IF EXISTS (SELECT 1 FROM public.match_registrations WHERE match_id = p_match_id AND user_id = p_user_id) THEN
      RETURN json_build_object('success', false, 'message', 'Already joined this match');
  END IF;

  -- D. Get User Balances (Safe Check)
  SELECT wallet_balance, bonus INTO v_main_balance, v_bonus_balance FROM public.profiles WHERE id = p_user_id;
  
  IF v_main_balance IS NULL THEN
      RETURN json_build_object('success', false, 'message', 'User profile not found');
  END IF;

  -- E. Bonus Logic (from IMPLEMENT_BONUS_LOGIC.sql)
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

  -- F. Check Insufficient Funds
  IF v_main_balance < v_main_deduction THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient main wallet balance');
  END IF;

  -- G. Execute Deductions
  UPDATE public.profiles
  SET wallet_balance = wallet_balance - v_main_deduction,
      bonus = bonus - v_bonus_deduction
  WHERE id = p_user_id;

  -- H. Create Registration
  INSERT INTO public.match_registrations (match_id, user_id, status)
  VALUES (p_match_id, p_user_id, 'Registered');

  -- I. Log Transaction
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, -v_entry_fee, 'Entry Fee', 'Success', 'Match Join: ' || v_map || ' (Bonus: ' || v_bonus_deduction || ')');

  RETURN json_build_object('success', true, 'message', 'Joined successfully', 'bonus_used', v_bonus_deduction, 'main_deducted', v_main_deduction);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Force Refresh
NOTIFY pgrst, 'reload schema';
