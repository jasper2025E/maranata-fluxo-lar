-- =====================================================
-- SECURITY HARDENING MIGRATION
-- SEC-04: Create secure public view for school websites
-- SEC-05: Restrict log table INSERT policies
-- SEC-09: Add RLS to public views
-- =====================================================

-- SEC-04: Create minimal public view for school websites
-- Only exposes fields needed for public rendering, no sensitive data
CREATE OR REPLACE VIEW public.school_website_public_minimal AS
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
  swc.prematricula_enabled,
  swc.prematricula_title,
  swc.prematricula_subtitle,
  swc.primary_color,
  swc.secondary_color,
  swc.accent_color,
  swc.font_family,
  swc.footer_text,
  swc.show_powered_by,
  swc.social_links,
  swc.seo_title,
  swc.seo_description,
  swc.seo_keywords,
  swc.og_image_url
  -- OMITTED: tenant_id, custom_domain, whatsapp_number, contact_*, map_embed_url, analytics IDs
FROM school_website_config swc
WHERE swc.enabled = true;

-- Grant public access to the minimal view
GRANT SELECT ON public.school_website_public_minimal TO anon, authenticated;

-- SEC-05: Restrict webhook_logs INSERT to service_role only
-- First drop existing permissive policy if exists
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Allow insert for all" ON public.webhook_logs;

-- Create restrictive INSERT policy (only via Edge Functions with service_role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'webhook_logs' 
    AND policyname = 'Only backend can insert webhook logs'
  ) THEN
    CREATE POLICY "Only backend can insert webhook logs" 
    ON public.webhook_logs 
    FOR INSERT 
    WITH CHECK (
      current_setting('role', true) = 'service_role'
      OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
  END IF;
END $$;

-- SEC-05: Same for gateway_transaction_logs
DROP POLICY IF EXISTS "Service role insert logs" ON public.gateway_transaction_logs;
DROP POLICY IF EXISTS "Allow backend insert" ON public.gateway_transaction_logs;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gateway_transaction_logs' 
    AND policyname = 'Only backend can insert transaction logs'
  ) THEN
    CREATE POLICY "Only backend can insert transaction logs" 
    ON public.gateway_transaction_logs 
    FOR INSERT 
    WITH CHECK (
      current_setting('role', true) = 'service_role'
      OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
  END IF;
END $$;

-- SEC-05: Restrict api_request_logs INSERT
DROP POLICY IF EXISTS "Anyone can insert" ON public.api_request_logs;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'api_request_logs' 
    AND policyname = 'Only backend can insert api logs'
  ) THEN
    CREATE POLICY "Only backend can insert api logs" 
    ON public.api_request_logs 
    FOR INSERT 
    WITH CHECK (
      current_setting('role', true) = 'service_role'
      OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
  END IF;
END $$;

-- SEC-09: Ensure escola_public_branding allows public read (intentional for login branding)
GRANT SELECT ON public.escola_public_branding TO anon, authenticated;

-- Create index for faster public slug lookups (security + performance)
CREATE INDEX IF NOT EXISTS idx_school_website_config_slug_enabled 
ON public.school_website_config(slug) 
WHERE enabled = true;

-- Add audit logging for security-sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_access_logs (
    event_type,
    user_id,
    resource_type,
    details,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    p_event_type,
    auth.uid(),
    p_details->>'resource_type',
    p_details,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
EXCEPTION WHEN OTHERS THEN
  -- Don't fail main operation if logging fails
  RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;

-- Revoke direct function access from anon (security)
REVOKE EXECUTE ON FUNCTION public.log_security_event FROM anon;

-- Documentation comments
COMMENT ON VIEW public.school_website_public_minimal IS 
'SEC-04: Minimal public view for school websites. Excludes tenant_id, contact info, domain config, and analytics IDs.';

COMMENT ON FUNCTION public.log_security_event IS 
'Security event logging function. SECURITY DEFINER to ensure logs are always written.';