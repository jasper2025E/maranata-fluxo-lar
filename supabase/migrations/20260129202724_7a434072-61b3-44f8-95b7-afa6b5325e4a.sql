-- Fix: Security Definer View issue - recreate security_summary with SECURITY INVOKER
-- The view was created with security_invoker = on but need to verify it's correct

-- Drop and recreate the view explicitly with SECURITY INVOKER
DROP VIEW IF EXISTS public.security_summary;

-- Create view with explicit SECURITY INVOKER (not DEFINER)
CREATE OR REPLACE VIEW public.security_summary AS
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

-- Set security invoker explicitly
ALTER VIEW public.security_summary SET (security_invoker = on);

-- Revoke all public access
REVOKE ALL ON public.security_summary FROM anon;
REVOKE ALL ON public.security_summary FROM authenticated;

-- Grant only to authenticated (RLS on security_access_logs will filter)
GRANT SELECT ON public.security_summary TO authenticated;

COMMENT ON VIEW public.security_summary IS 'Security metrics summary - protected by security_access_logs RLS policies via SECURITY INVOKER';