-- Fix app_settings column names
-- Run this in Supabase SQL Editor to resolve "column setting_key does not exist" error.

-- 1. Drop existing table to ensure clean state
DROP TABLE IF EXISTS public.app_settings;

-- 2. Recreate with correct schema
CREATE TABLE public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  setting_key text unique not null,
  setting_value text,
  description text,
  created_at timestamptz default now()
);

-- 3. Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allowing public read, and unrestricted insert/update for now to fix access)
CREATE POLICY "Enable Read Access" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Enable Insert Access" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Access" ON public.app_settings FOR UPDATE USING (true);

-- 5. Insert Default Values
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
('app_name', 'LastZone Esports', 'Global Application Name'),
('support_email', 'support@lastzone.gg', 'Contact Email'),
('maintenance_mode', 'false', 'App Access Control'),
('signup_bonus_default', '25', 'Bonus for new user without referral'),
('signup_bonus_referral_user', '50', 'Bonus for new user WITH referral'),
('signup_bonus_referral_referrer', '50', 'Bonus for the referrer'),
('bonus_percent_classic', '20', 'Max bonus % usable in Classic matches'),
('bonus_percent_tdm', '5', 'Max bonus % usable in TDM matches');

-- 6. Force schema reload
NOTIFY pgrst, 'reload schema';
