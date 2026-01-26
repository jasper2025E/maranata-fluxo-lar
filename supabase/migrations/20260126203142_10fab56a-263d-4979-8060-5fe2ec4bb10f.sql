-- Create a view that only exposes safe public fields (no PII or tracking IDs)
CREATE OR REPLACE VIEW public.school_website_config_public
WITH (security_invoker = on) AS
SELECT 
  id,
  tenant_id,
  slug,
  enabled,
  -- Hero section (safe to expose)
  hero_title,
  hero_subtitle,
  hero_cta_primary,
  hero_cta_secondary,
  hero_background_url,
  hero_badge_text,
  -- About section (safe)
  about_title,
  about_description,
  about_features,
  -- Content sections (safe)
  differentials,
  gallery_images,
  steps,
  testimonials,
  -- Contact (safe - no phone numbers)
  contact_title,
  contact_subtitle,
  show_map,
  map_embed_url,
  -- Pre-matricula (safe)
  prematricula_enabled,
  prematricula_title,
  prematricula_subtitle,
  prematricula_fields,
  -- SEO (safe - meant to be public)
  seo_title,
  seo_description,
  seo_keywords,
  og_image_url,
  -- Style settings (safe)
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  social_links,
  footer_text,
  show_powered_by,
  -- Timestamps
  created_at,
  updated_at
FROM public.school_website_config
WHERE enabled = true;

-- SENSITIVE FIELDS NOT EXPOSED:
-- whatsapp_number (PII)
-- custom_domain, custom_domain_verified, custom_domain_ssl_status (infrastructure info)
-- google_analytics_id, google_tag_manager_id, facebook_pixel_id (tracking IDs)

-- Create a restrictive policy for direct table access using school_users
CREATE POLICY "Tenant members can read their own website config"
ON public.school_website_config
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.school_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);