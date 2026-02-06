-- EMERGENCY FIX: RESET APP SETTINGS TABLE
-- The error "null value in column setting_key... violates not-null constraint"
-- implies the table STILL HAS 'setting_key' column but you are trying to insert into 'key'.

-- 1. NUKE THE TABLE (Force Drop)
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- 2. RECREATE WITH CORRECT COLUMNS (key, value)
CREATE TABLE public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value text,
  description text,
  created_at timestamptz default now()
);

-- 3. ENABLE RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable Read Access" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Enable Insert Access" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update Access" ON public.app_settings FOR UPDATE USING (true);

-- 4. INSERT DATA (Using 'key' and 'value')
INSERT INTO public.app_settings (key, value, description) VALUES
('app_name', 'LastZone Esports', 'Global Application Name'),
('support_email', 'support@lastzone.gg', 'Contact Email'),
('maintenance_mode', 'false', 'App Access Control'),
('signup_bonus_default', '0', 'Bonus for new user without referral'),
('signup_bonus_referral_user', '25', 'Bonus for new user WITH referral'),
('signup_bonus_referral_referrer', '25', 'Bonus for the referrer'),
('bonus_percent_classic', '20', 'Max bonus % usable in Classic matches'),
('bonus_percent_tdm', '5', 'Max bonus % usable in TDM matches'),
('ZAPUPI_TOKEN_KEY', '', 'ZapUPI Token Key'),
('ZAPUPI_SECRET_KEY', '', 'ZapUPI Secret Key'),
('social_instagram', '', 'Instagram URL'),
('social_facebook', '', 'Facebook URL'),
('social_twitter', '', 'Twitter/X URL'),
('social_youtube', '', 'YouTube URL'),
('social_discord', '', 'Discord URL'),
('logo_header', '', 'Header Logo URL'),
('logo_footer', '', 'Footer Logo URL');

-- 5. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
