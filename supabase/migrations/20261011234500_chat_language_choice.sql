ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language_choice_enabled_at TIMESTAMPTZ;
