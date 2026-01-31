-- EMERGENCY FIX: Create Missing Profiles
-- The error "transactions_user_id_fkey" happens because the user trying to make a transaction
-- exists in 'Auth' (Login) but does NOT exist in 'Public Profiles'.
-- This script finds all such broken users and creates their profiles instantly.

INSERT INTO public.profiles (id, email, username, full_name, avatar_url, wallet_balance, bonus, referral_code)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1), 'User-' || substr(id::text, 1, 8)),
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'user-avatar-' || floor(random() * 13 + 1)::text,
  0,
  0,
  'LZ' || upper(substring(md5(random()::text) from 1 for 6))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Also fix any null referal codes or avatars for existing users
UPDATE public.profiles
SET avatar_url = 'user-avatar-' || floor(random() * 13 + 1)::text
WHERE avatar_url IS NULL OR avatar_url = '';

UPDATE public.profiles
SET referral_code = 'LZ' || upper(substring(md5(random()::text) from 1 for 6))
WHERE referral_code IS NULL OR referral_code = '';

-- Force Schema Refresh
NOTIFY pgrst, 'reload schema';
