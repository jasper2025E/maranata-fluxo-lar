
-- =====================================================
-- FIX CRITICAL: Restrict school_website_config public access
-- =====================================================

-- Drop existing overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view enabled websites by slug" ON public.school_website_config;
DROP POLICY IF EXISTS "Anyone can view enabled websites" ON public.school_website_config;

-- Create a secure function that returns ONLY safe fields for public website display
CREATE OR REPLACE FUNCTION public.get_public_website_safe(p_slug text)
RETURNS TABLE (
  slug text,
  enabled boolean,
  hero_title text,
  hero_subtitle text,
  hero_cta_primary text,
  hero_cta_secondary text,
  hero_background_url text,
  hero_badge_text text,
  about_title text,
  about_description text,
  about_features jsonb,
  differentials jsonb,
  gallery_images jsonb,
  steps jsonb,
  testimonials jsonb,
  contact_title text,
  contact_subtitle text,
  show_map boolean,
  map_embed_url text,
  prematricula_enabled boolean,
  prematricula_title text,
  prematricula_subtitle text,
  prematricula_fields jsonb,
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_family text,
  footer_text text,
  show_powered_by boolean,
  social_links jsonb,
  facebook_pixel_id text,
  google_analytics_id text,
  google_tag_manager_id text,
  tenant_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    swc.slug,
    swc.enabled,
    swc.hero_title,
    swc.hero_subtitle,
    swc.hero_cta_primary,
    swc.hero_cta_secondary,
    swc.hero_background_url,
    swc.hero_badge_text,
    swc.about_title,
    swc.about_description,
    swc.about_features,
    swc.differentials,
    swc.gallery_images,
    swc.steps,
    swc.testimonials,
    swc.contact_title,
    swc.contact_subtitle,
    swc.show_map,
    swc.map_embed_url,
    swc.prematricula_enabled,
    swc.prematricula_title,
    swc.prematricula_subtitle,
    swc.prematricula_fields,
    swc.seo_title,
    swc.seo_description,
    swc.seo_keywords,
    swc.og_image_url,
    swc.primary_color,
    swc.secondary_color,
    swc.accent_color,
    swc.font_family,
    swc.footer_text,
    swc.show_powered_by,
    swc.social_links,
    swc.facebook_pixel_id,
    swc.google_analytics_id,
    swc.google_tag_manager_id,
    swc.tenant_id
  FROM school_website_config swc
  WHERE swc.slug = p_slug 
    AND swc.enabled = true;
$$;

-- Ensure only authenticated tenant users can read their config directly
DROP POLICY IF EXISTS "Tenant users can read their own website config" ON public.school_website_config;

CREATE POLICY "Tenant users can read their own website config"
ON public.school_website_config
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id()
);

-- Update management policy
DROP POLICY IF EXISTS "Tenant admins can manage website config" ON public.school_website_config;

CREATE POLICY "Tenant admins can manage website config"
ON public.school_website_config
FOR ALL
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Create a safer view for public website display
DROP VIEW IF EXISTS public.school_website_public_safe CASCADE;

CREATE VIEW public.school_website_public_safe
WITH (security_invoker = on)
AS
SELECT 
  slug,
  enabled,
  hero_title,
  hero_subtitle,
  hero_cta_primary,
  hero_cta_secondary,
  hero_background_url,
  hero_badge_text,
  about_title,
  about_description,
  about_features,
  differentials,
  gallery_images,
  steps,
  testimonials,
  contact_title,
  contact_subtitle,
  show_map,
  map_embed_url,
  prematricula_enabled,
  prematricula_title,
  prematricula_subtitle,
  prematricula_fields,
  seo_title,
  seo_description,
  seo_keywords,
  og_image_url,
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  footer_text,
  show_powered_by,
  social_links,
  facebook_pixel_id,
  google_analytics_id,
  google_tag_manager_id,
  tenant_id
  -- OMITTED: id, custom_domain, custom_domain_verified, custom_domain_ssl_status, whatsapp_number, created_at, updated_at
FROM school_website_config
WHERE enabled = true;

-- Grant access to the safe view for public website rendering
GRANT SELECT ON public.school_website_public_safe TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_website_safe IS 
'Returns only safe, display-ready fields from school_website_config. 
Hides: custom_domain, whatsapp_number, created_at, updated_at, SSL status';

COMMENT ON VIEW public.school_website_public_safe IS 
'Safe public view of school website config. Hides sensitive business data.';
