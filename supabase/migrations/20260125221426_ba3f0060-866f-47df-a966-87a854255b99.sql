-- Corrigir view para usar security_invoker
DROP VIEW IF EXISTS public.security_summary;

CREATE VIEW public.security_summary
WITH (security_invoker = on)
AS
SELECT
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'allowed') as allowed_requests,
  COUNT(*) FILTER (WHERE status = 'denied') as denied_requests,
  COUNT(*) FILTER (WHERE status = 'suspicious') as suspicious_requests,
  COUNT(*) FILTER (WHERE is_cross_tenant_attempt) as cross_tenant_attempts,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT tenant_id) as unique_tenants
FROM public.security_access_logs
WHERE created_at > NOW() - INTERVAL '1 hour';