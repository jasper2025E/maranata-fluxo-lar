
-- =====================================================
-- LGPD COMPLIANCE: Data Retention & Anonymization
-- =====================================================

-- 1. Create data retention configuration table
CREATE TABLE IF NOT EXISTS public.data_retention_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL DEFAULT 365,
  anonymization_enabled BOOLEAN DEFAULT true,
  fields_to_anonymize TEXT[] DEFAULT '{}',
  last_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_retention_config ENABLE ROW LEVEL SECURITY;

-- Only platform admins can manage retention config
CREATE POLICY "Platform admins manage retention config"
ON public.data_retention_config
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Insert default retention policies
INSERT INTO public.data_retention_config (table_name, retention_days, anonymization_enabled, fields_to_anonymize) VALUES
  ('security_access_logs', 90, true, ARRAY['ip_address', 'user_agent', 'user_email']),
  ('immutable_security_logs', 365, true, ARRAY['ip_address', 'user_agent']),
  ('api_request_logs', 30, true, ARRAY['ip_address', 'user_agent', 'request_body', 'response_body']),
  ('webhook_logs', 60, true, ARRAY['payload']),
  ('audit_logs', 730, true, ARRAY['dados_anteriores', 'dados_novos']),
  ('gateway_transaction_logs', 365, false, ARRAY[]::TEXT[])
ON CONFLICT (table_name) DO NOTHING;

-- 2. Create function to anonymize old logs
CREATE OR REPLACE FUNCTION public.anonymize_old_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_config RECORD;
  v_count INTEGER := 0;
  v_total INTEGER := 0;
  v_results jsonb := '{}';
BEGIN
  -- Process each table with retention config
  FOR v_config IN 
    SELECT * FROM public.data_retention_config 
    WHERE anonymization_enabled = true
  LOOP
    v_count := 0;
    
    -- Anonymize security_access_logs
    IF v_config.table_name = 'security_access_logs' THEN
      UPDATE public.security_access_logs
      SET 
        ip_address = 'ANONYMIZED',
        user_agent = 'ANONYMIZED',
        user_email = CASE 
          WHEN user_email IS NOT NULL THEN 
            CONCAT(LEFT(user_email, 2), '***@anonymized.lgpd')
          ELSE NULL 
        END
      WHERE created_at < NOW() - (v_config.retention_days || ' days')::INTERVAL
        AND ip_address != 'ANONYMIZED';
      GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Anonymize immutable_security_logs (only IP and user_agent)
    ELSIF v_config.table_name = 'immutable_security_logs' THEN
      UPDATE public.immutable_security_logs
      SET 
        ip_address = 'ANONYMIZED',
        user_agent = 'ANONYMIZED'
      WHERE created_at < NOW() - (v_config.retention_days || ' days')::INTERVAL
        AND ip_address != 'ANONYMIZED';
      GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Anonymize api_request_logs
    ELSIF v_config.table_name = 'api_request_logs' THEN
      UPDATE public.api_request_logs
      SET 
        ip_address = 'ANONYMIZED',
        user_agent = 'ANONYMIZED',
        request_body = '{"anonymized": true}'::jsonb,
        response_body = '{"anonymized": true}'::jsonb
      WHERE created_at < NOW() - (v_config.retention_days || ' days')::INTERVAL
        AND ip_address != 'ANONYMIZED';
      GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Anonymize webhook_logs
    ELSIF v_config.table_name = 'webhook_logs' THEN
      UPDATE public.webhook_logs
      SET payload = '{"anonymized": true, "reason": "LGPD retention policy"}'::jsonb
      WHERE created_at < NOW() - (v_config.retention_days || ' days')::INTERVAL
        AND NOT (payload ? 'anonymized');
      GET DIAGNOSTICS v_count = ROW_COUNT;
    
    END IF;
    
    -- Update last cleanup timestamp
    UPDATE public.data_retention_config
    SET last_cleanup_at = NOW()
    WHERE table_name = v_config.table_name;
    
    v_total := v_total + v_count;
    v_results := v_results || jsonb_build_object(v_config.table_name, v_count);
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_anonymized', v_total,
    'tables', v_results,
    'executed_at', NOW()
  );
END;
$$;

-- 3. Create audit trigger for prematricula_leads exports/access
CREATE OR REPLACE FUNCTION public.log_lead_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log whenever leads are accessed (SELECT doesn't trigger, but we log via RLS function)
  PERFORM log_security_event_v2(
    'lead_data_access',
    TG_OP,
    'info',
    'prematricula_leads',
    COALESCE(NEW.id, OLD.id)::TEXT,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    jsonb_build_object('trigger', TG_NAME, 'table', TG_TABLE_NAME)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger for INSERT/UPDATE/DELETE on leads
DROP TRIGGER IF EXISTS audit_lead_changes ON public.prematricula_leads;
CREATE TRIGGER audit_lead_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.prematricula_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_access();

-- 4. Create function to log lead exports (call from application)
CREATE OR REPLACE FUNCTION public.log_lead_export(
  p_lead_ids UUID[],
  p_export_format TEXT DEFAULT 'csv',
  p_metadata jsonb DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  v_log_id := log_security_event_v2(
    'lead_data_export',
    'EXPORT',
    'warn',
    'prematricula_leads',
    NULL,
    NULL,
    jsonb_build_object('lead_ids', p_lead_ids, 'count', array_length(p_lead_ids, 1)),
    jsonb_build_object(
      'format', p_export_format,
      'exported_at', NOW(),
      'metadata', p_metadata
    )
  );
  
  RETURN v_log_id;
END;
$$;

-- 5. Create scheduled cleanup view (for monitoring)
CREATE OR REPLACE VIEW public.data_retention_status AS
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

-- Grant access to view
GRANT SELECT ON public.data_retention_status TO authenticated;

-- 6. Add LGPD deletion request support
CREATE TABLE IF NOT EXISTS public.lgpd_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_email TEXT NOT NULL,
  requester_cpf TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('deletion', 'anonymization', 'export')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  affected_tables TEXT[] DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lgpd_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can manage deletion requests
CREATE POLICY "Admins manage LGPD requests"
ON public.lgpd_deletion_requests
FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND (has_role(auth.uid(), 'admin') OR is_platform_admin(auth.uid()))
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_status ON public.lgpd_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_tenant ON public.lgpd_deletion_requests(tenant_id);
