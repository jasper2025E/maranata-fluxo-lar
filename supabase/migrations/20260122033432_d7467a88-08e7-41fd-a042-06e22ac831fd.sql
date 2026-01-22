-- Add language column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-BR';

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.language IS 'User preferred language code (pt-BR, en, es, fr, de)';