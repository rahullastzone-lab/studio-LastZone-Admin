-- FIX FOR ERROR: 42830 (Missing Unique Constraint) & Signup Bonus Implementation

-- 1. Ensure 'profiles' has a Primary Key
DO $$
BEGIN
    -- Check if 'id' is already a PK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- If not, make it one. This requires 'id' to be unique.
        -- If 'id' comes from auth.users, it is unique.
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 2. Ensure 'transactions' has a valid FK to 'profiles'
DO $$
BEGIN
    -- Drop old bad constraint if it exists partially
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
    
    -- Add the correct Foreign Key
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- 3. Implement the Signup Bonus Logic (Robust Version)
CREATE OR REPLACE FUNCTION public.handle_signup_bonus()
RETURNS TRIGGER AS $$
DECLARE
  bonus_amount numeric := 25; 
BEGIN
  -- Check if we already gave a signup bonus to this user (idempotency)
  IF EXISTS (SELECT 1 FROM public.transactions WHERE user_id = new.id AND type = 'signup_bonus') THEN
    RETURN new;
  END IF;

  -- 1. Log the transaction
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (new.id, bonus_amount, 'signup_bonus', 'completed', 'Welcome Bonus');

  -- 2. Update the user's wallet
  UPDATE public.profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + bonus_amount,
    bonus = COALESCE(bonus, 0) + bonus_amount
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the Trigger to PROFILES (fires after profile is created)
DROP TRIGGER IF EXISTS on_profile_created_bonus ON public.profiles;

CREATE TRIGGER on_profile_created_bonus
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_signup_bonus();

-- 5. Force Schema Reload
NOTIFY pgrst, 'reload schema';
