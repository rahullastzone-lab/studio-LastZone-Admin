-- Add referral_code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
