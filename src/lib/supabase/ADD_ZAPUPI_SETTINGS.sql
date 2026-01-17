-- Add ZapUPI Payment Settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
  ('ZAPUPI_TOKEN_KEY', '', 'ZapUPI Token Key (Public)'),
  ('ZAPUPI_SECRET_KEY', '', 'ZapUPI Secret Key (Private)')
ON CONFLICT (setting_key) DO NOTHING;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
