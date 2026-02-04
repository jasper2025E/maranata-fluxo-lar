
-- Fix data_retention_status view to use security_invoker
DROP VIEW IF EXISTS public.data_retention_status;

CREATE VIEW public.data_retention_status 
WITH (security_invoker = on)
AS
SELECT 
  drc.table_name,
  drc.retention_days,
  drc.anonymization_enabled,
  drc.fields_to_anonymize,
  drc.last_cleanup_at,
  CASE 
    WHEN drc.last_cleanup_at IS NULL THEN 'Never run'
    WHEN drc.last_cleanup_at < NOW() - INTERVAL '1 day' THEN 'Due for cleanup'
    ELSE 'Up to date'
  END as status
FROM public.data_retention_config drc
ORDER BY drc.table_name;

-- Grant access to authenticated users
GRANT SELECT ON public.data_retention_status TO authenticated;
