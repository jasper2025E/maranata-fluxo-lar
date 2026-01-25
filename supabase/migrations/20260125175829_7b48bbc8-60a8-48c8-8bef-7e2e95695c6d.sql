-- Add custom_colors column to user_preferences for storing user color customizations
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_preferences.custom_colors IS 'Stores user-defined color customizations for the theme (primary, accent, sidebar colors, etc.)';