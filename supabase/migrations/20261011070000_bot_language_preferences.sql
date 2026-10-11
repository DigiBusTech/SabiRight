ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bot_language_mode TEXT NOT NULL DEFAULT 'auto';

UPDATE public.profiles
SET bot_language_mode = 'selected'
WHERE LOWER(BTRIM(COALESCE(language, ''))) NOT IN ('', 'english', 'auto', 'auto-detect');
