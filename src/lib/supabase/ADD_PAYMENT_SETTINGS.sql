-- Add Payment Gateway Settings
-- Run this to enable Payment configuration in Admin Panel

-- 1. Insert default keys if they don't exist
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
  ('razorpay_key_id', '', 'Razorpay API Key ID (Public)'),
  ('razorpay_key_secret', '', 'Razorpay API Key Secret (Private)')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Force schema reload to ensure API sees new data immediately
NOTIFY pgrst, 'reload schema';
