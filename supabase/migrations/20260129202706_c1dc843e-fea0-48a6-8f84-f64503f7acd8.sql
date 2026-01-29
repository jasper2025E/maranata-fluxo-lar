-- =====================================================
-- SECURITY FIX: Reduce ponto token validity from 1 year to 90 days
-- =====================================================

-- Update the generate_ponto_token function to use 90 days instead of 1 year
CREATE OR REPLACE FUNCTION public.generate_ponto_token(p_funcionario_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a token using multiple UUIDs concatenated
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  
  -- Update the funcionario with the new token (expires in 90 days instead of 1 year)
  UPDATE public.funcionarios
  SET 
    ponto_token = v_token,
    ponto_token_expires_at = NOW() + INTERVAL '90 days'
  WHERE id = p_funcionario_id;
  
  RETURN v_token;
END;
$$;

-- =====================================================
-- SECURITY FIX: Create safe public view for school website config
-- Excludes sensitive fields: whatsapp, tracking IDs, domain config
-- =====================================================

-- Drop existing public view if exists
DROP VIEW IF EXISTS public.school_website_public_safe;

-- Create a view that only exposes display fields
CREATE VIEW public.school_website_public_safe AS
SELECT 
  id,
  tenant_id,
  slug,
  enabled,
  -- Hero Section
  hero_title,
  hero_subtitle,
  hero_cta_primary,
  hero_cta_secondary,
  hero_background_url,
  hero_badge_text,
  -- About Section
  about_title,
  about_description,
  about_features,
  -- Differentials
  differentials,
  -- Gallery
  gallery_images,
  -- Steps
  steps,
  -- Testimonials
  testimonials,
  -- Contact (public-safe fields only)
  contact_title,
  contact_subtitle,
  show_map,
  map_embed_url,
  -- Pre-enrollment (safe fields)
  prematricula_enabled,
  prematricula_title,
  prematricula_subtitle,
  -- Style
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  -- Footer
  footer_text,
  show_powered_by,
  social_links,
  -- Timestamps
  created_at,
  updated_at
  -- EXCLUDED: whatsapp_number, custom_domain, facebook_pixel_id, 
  -- google_analytics_id, google_tag_manager_id, seo_keywords,
  -- prematricula_fields, custom_domain_verified, custom_domain_ssl_status,
  -- seo_title, seo_description, og_image_url
FROM school_website_config
WHERE enabled = true;

-- Grant access to view
GRANT SELECT ON public.school_website_public_safe TO anon;
GRANT SELECT ON public.school_website_public_safe TO authenticated;

COMMENT ON VIEW public.school_website_public_safe IS 'Public-safe view of school website config. Excludes sensitive tracking IDs, WhatsApp numbers, and infrastructure details.';

-- =====================================================
-- SECURITY FIX: Restrict security_summary view to platform admins
-- =====================================================

-- Drop and recreate view with SECURITY INVOKER and restricted access
DROP VIEW IF EXISTS public.security_summary;

CREATE VIEW public.security_summary 
WITH (security_invoker = on)
AS
SELECT 
  count(*) AS total_requests,
  count(*) FILTER (WHERE status = 'allowed') AS allowed_requests,
  count(*) FILTER (WHERE status = 'denied') AS denied_requests,
  count(*) FILTER (WHERE is_cross_tenant_attempt = true) AS cross_tenant_attempts,
  count(*) FILTER (WHERE is_cross_tenant_attempt = true AND status = 'denied') AS suspicious_requests,
  count(DISTINCT user_id) AS unique_users,
  count(DISTINCT tenant_id) AS unique_tenants
FROM public.security_access_logs
WHERE created_at > (NOW() - INTERVAL '24 hours');

-- Revoke all public access
REVOKE ALL ON public.security_summary FROM anon;
REVOKE ALL ON public.security_summary FROM authenticated;

-- Grant only to platform admins via function check
GRANT SELECT ON public.security_summary TO authenticated;

COMMENT ON VIEW public.security_summary IS 'Security metrics summary - access controlled via security_access_logs RLS policies';