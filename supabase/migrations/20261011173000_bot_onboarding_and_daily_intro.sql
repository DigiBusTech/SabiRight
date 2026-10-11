ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bot_language_onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bot_last_intro_date DATE;

UPDATE public.profiles
SET bot_language_onboarded_at = COALESCE(updated_at, NOW())
WHERE bot_language_mode = 'selected'
  AND bot_language_onboarded_at IS NULL;
