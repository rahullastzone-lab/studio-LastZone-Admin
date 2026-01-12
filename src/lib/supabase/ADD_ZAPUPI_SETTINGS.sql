-- Add ZapUPI Payment Settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
  ('zapupi_token', '', 'ZapUPI Token Key (Public)'),
  ('zapupi_secret', '', 'ZapUPI Secret Key (Private)')
ON CONFLICT (setting_key) DO NOTHING;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
