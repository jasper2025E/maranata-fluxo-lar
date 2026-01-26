-- Add privacy_terms_url to the public read policy
DROP POLICY IF EXISTS "Anyone can read platform branding settings" ON public.platform_settings;

CREATE POLICY "Anyone can read platform branding settings"
ON public.platform_settings
FOR SELECT
USING (
  key IN (
    'platform_name',
    'platform_logo',
    'gradient_from',
    'gradient_via',
    'gradient_to',
    'favicon_url',
    'meta_title',
    'meta_description',
    'login_title',
    'login_subtitle',
    'landing_hero_title',
    'landing_hero_subtitle',
    'landing_features',
    'landing_cta_primary',
    'landing_cta_secondary',
    'privacy_terms_url'
  )
);