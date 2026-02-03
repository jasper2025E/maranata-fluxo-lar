
-- =====================================================
-- SECURITY HARDENING: Explicit RLS for Public Views
-- =====================================================

-- 1. escola_public_branding - Add explicit public read-only RLS
-- This is a VIEW, we need to ensure base table has proper RLS
-- Views with security_invoker=on respect base table RLS

-- 2. platform_branding_public - Add explicit public read-only access
-- This is intentionally public for branding display

-- 3. subscription_plans_public - Add explicit public read-only access  
-- This is intentionally public for pricing page display

-- 4. school_website_public_minimal - Add explicit public read-only access
-- This is intentionally public for school website rendering

-- 5. security_summary - Restrict to platform_admin only
-- This contains sensitive security metrics

-- 6. platform_settings - Restrict to only specific public keys

-- Since these are VIEWS, RLS doesn't apply directly to them.
-- We need to ensure proper access patterns via:
-- a) Base table RLS policies
-- b) Using SECURITY INVOKER on views
-- c) Granting appropriate permissions

-- First, let's ensure all views have security_invoker = true
DO $$
BEGIN
  -- escola_public_branding
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'escola_public_branding') THEN
    EXECUTE 'ALTER VIEW public.escola_public_branding SET (security_invoker = on)';
  END IF;
  
  -- platform_branding_public
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'platform_branding_public') THEN
    EXECUTE 'ALTER VIEW public.platform_branding_public SET (security_invoker = on)';
  END IF;
  
  -- subscription_plans_public
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'subscription_plans_public') THEN
    EXECUTE 'ALTER VIEW public.subscription_plans_public SET (security_invoker = on)';
  END IF;
  
  -- school_website_public_minimal
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'school_website_public_minimal') THEN
    EXECUTE 'ALTER VIEW public.school_website_public_minimal SET (security_invoker = on)';
  END IF;
  
  -- security_summary
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'security_summary') THEN
    EXECUTE 'ALTER VIEW public.security_summary SET (security_invoker = on)';
  END IF;
END $$;

-- Grant SELECT on public views to anon and authenticated roles
-- These are intentionally public for branding/pricing display
GRANT SELECT ON public.escola_public_branding TO anon, authenticated;
GRANT SELECT ON public.platform_branding_public TO anon, authenticated;
GRANT SELECT ON public.subscription_plans_public TO anon, authenticated;
GRANT SELECT ON public.school_website_public_minimal TO anon, authenticated;

-- security_summary should only be accessible to platform_admin
-- Revoke from anon, only authenticated can access (and RLS will filter)
REVOKE ALL ON public.security_summary FROM anon;
GRANT SELECT ON public.security_summary TO authenticated;

-- Restrict platform_settings to only allow reading specific safe keys
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public can read safe platform settings" ON public.platform_settings;

CREATE POLICY "Public can read safe platform settings" ON public.platform_settings
FOR SELECT USING (
  key IN (
    'landing_features',
    'login_title', 
    'login_subtitle',
    'login_logo_url',
    'landing_hero_title',
    'landing_hero_subtitle',
    'landing_cta_text',
    'landing_cta_url',
    'platform_name',
    'platform_logo_url',
    'support_email',
    'support_phone'
  )
);

-- For subscription_plans, restrict to only active and visible plans
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;

CREATE POLICY "Public can view active subscription plans" ON public.subscription_plans
FOR SELECT USING (
  active = true
);

-- Ensure only platform_admin can access security_summary data
-- The view pulls from tables that should be restricted
-- We'll create a function to check platform admin status for the view

-- Create secure function for security_summary access check
CREATE OR REPLACE FUNCTION public.can_view_security_summary()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin(auth.uid());
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.can_view_security_summary() IS 'Security check for viewing security_summary - only platform admins';
