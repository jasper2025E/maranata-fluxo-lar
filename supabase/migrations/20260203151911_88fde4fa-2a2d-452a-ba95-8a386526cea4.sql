
-- =====================================================
-- FIX platform_settings access and document view security
-- =====================================================

-- 1. Restrict platform_settings to only safe keys for public
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public can read safe platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;

-- Create restrictive policy for public settings
CREATE POLICY "Public can read whitelisted platform settings"
ON public.platform_settings
FOR SELECT
USING (
  key IN (
    'landing_features',
    'login_title', 
    'login_subtitle',
    'login_logo_url',
    'landing_hero_title',
    'landing_hero_subtitle',
    'platform_name',
    'platform_logo_url'
  )
);

-- 2. Ensure subscription_plans has proper restrictions
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.subscription_plans;

CREATE POLICY "Public can view active plans" ON public.subscription_plans
FOR SELECT USING (active = true);

-- Note: Views cannot have RLS directly. They inherit RLS from base tables.
-- The views (escola_public_branding, platform_branding_public, subscription_plans_public,
-- school_website_public_safe, school_website_public_minimal, security_summary)
-- all use security_invoker=on, which means they respect the RLS of their base tables.
-- This is the correct PostgreSQL pattern for view security.

-- 3. Add comments documenting the security model for views
COMMENT ON VIEW public.escola_public_branding IS 
'PUBLIC VIEW: Exposes only school name and logo for branding. Uses security_invoker=on.';

COMMENT ON VIEW public.platform_branding_public IS 
'PUBLIC VIEW: Exposes only platform branding (name, logo). Uses security_invoker=on.';

COMMENT ON VIEW public.subscription_plans_public IS 
'PUBLIC VIEW: Exposes only active subscription plans for marketing. Uses security_invoker=on.';

COMMENT ON VIEW public.school_website_public_safe IS 
'PUBLIC VIEW: Exposes only safe website display fields. Hides domains, phone numbers. Uses security_invoker=on.';

COMMENT ON VIEW public.security_summary IS 
'RESTRICTED VIEW: Security metrics for platform admins only. Uses security_invoker=on and access is controlled by base table RLS.';
