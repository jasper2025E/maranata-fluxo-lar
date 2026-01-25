-- =====================================================
-- SISTEMA DE AUDITORIA DE SEGURANÇA
-- Rastreia acessos a dados sensíveis e detecta cross-tenant
-- =====================================================

-- Tabela de logs de acesso de segurança
CREATE TABLE IF NOT EXISTS public.security_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  tenant_id UUID,
  user_tenant_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'RPC', 'LOGIN', 'LOGOUT')),
  status TEXT NOT NULL CHECK (status IN ('allowed', 'denied', 'suspicious')),
  is_cross_tenant_attempt BOOLEAN DEFAULT false,
  is_platform_admin BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  request_path TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_tenant ON public.security_access_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON public.security_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_status ON public.security_access_logs(status);
CREATE INDEX IF NOT EXISTS idx_security_logs_cross_tenant ON public.security_access_logs(is_cross_tenant_attempt) WHERE is_cross_tenant_attempt = true;

-- Enable RLS
ALTER TABLE public.security_access_logs ENABLE ROW LEVEL SECURITY;

-- Apenas platform_admin pode ver os logs de segurança
CREATE POLICY "security_logs_platform_admin_view" ON public.security_access_logs
FOR SELECT USING (is_platform_admin(auth.uid()));

-- Inserts permitidos via service role ou funções
CREATE POLICY "security_logs_insert" ON public.security_access_logs
FOR INSERT WITH CHECK (true);

-- Ninguém pode atualizar ou deletar
CREATE POLICY "security_logs_no_update" ON public.security_access_logs
FOR UPDATE USING (false);

CREATE POLICY "security_logs_no_delete" ON public.security_access_logs
FOR DELETE USING (false);

-- Função para registrar acesso de segurança
CREATE OR REPLACE FUNCTION public.log_security_access(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_operation TEXT DEFAULT 'SELECT',
  p_status TEXT DEFAULT 'allowed',
  p_target_tenant_id UUID DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_tenant_id UUID;
  v_user_email TEXT;
  v_is_platform_admin BOOLEAN;
  v_is_cross_tenant BOOLEAN := false;
  v_log_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  v_user_tenant_id := get_user_tenant_id();
  v_is_platform_admin := is_platform_admin(v_user_id);
  
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Detect cross-tenant attempt
  IF p_target_tenant_id IS NOT NULL AND v_user_tenant_id IS NOT NULL THEN
    v_is_cross_tenant := (p_target_tenant_id != v_user_tenant_id) AND NOT v_is_platform_admin;
  END IF;
  
  -- Insert log
  INSERT INTO public.security_access_logs (
    user_id,
    user_email,
    tenant_id,
    user_tenant_id,
    action,
    resource_type,
    resource_id,
    operation,
    status,
    is_cross_tenant_attempt,
    is_platform_admin,
    error_message,
    metadata
  ) VALUES (
    v_user_id,
    v_user_email,
    p_target_tenant_id,
    v_user_tenant_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_operation,
    CASE WHEN v_is_cross_tenant THEN 'denied' ELSE p_status END,
    v_is_cross_tenant,
    v_is_platform_admin,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Função para detectar padrões suspeitos
CREATE OR REPLACE FUNCTION public.detect_suspicious_patterns(p_user_id UUID, p_minutes INTEGER DEFAULT 5)
RETURNS TABLE(
  total_requests INTEGER,
  cross_tenant_attempts INTEGER,
  denied_requests INTEGER,
  unique_tenants_accessed INTEGER,
  is_suspicious BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent_activity AS (
    SELECT *
    FROM public.security_access_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - (p_minutes || ' minutes')::INTERVAL
  )
  SELECT
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE is_cross_tenant_attempt)::INTEGER as cross_tenant_attempts,
    COUNT(*) FILTER (WHERE status = 'denied')::INTEGER as denied_requests,
    COUNT(DISTINCT tenant_id)::INTEGER as unique_tenants_accessed,
    (
      COUNT(*) FILTER (WHERE is_cross_tenant_attempt) > 3 OR
      COUNT(*) FILTER (WHERE status = 'denied') > 10 OR
      COUNT(DISTINCT tenant_id) > 5
    ) as is_suspicious
  FROM recent_activity;
$$;

-- View para resumo de segurança (última hora)
CREATE OR REPLACE VIEW public.security_summary AS
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

-- Alertas de segurança baseados em padrões
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID,
  tenant_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para security_alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_alerts_platform_admin" ON public.security_alerts
FOR ALL USING (is_platform_admin(auth.uid()));

-- Função para criar alerta automaticamente em tentativas cross-tenant
CREATE OR REPLACE FUNCTION public.auto_create_security_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar alerta para tentativas cross-tenant
  IF NEW.is_cross_tenant_attempt = true THEN
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      user_id,
      tenant_id,
      title,
      description,
      metadata
    ) VALUES (
      'cross_tenant_access',
      'high',
      NEW.user_id,
      NEW.tenant_id,
      'Tentativa de acesso cross-tenant detectada',
      'Usuário tentou acessar dados de outro tenant: ' || NEW.resource_type,
      jsonb_build_object(
        'action', NEW.action,
        'resource_type', NEW.resource_type,
        'resource_id', NEW.resource_id,
        'user_tenant_id', NEW.user_tenant_id,
        'target_tenant_id', NEW.tenant_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_security_alert
AFTER INSERT ON public.security_access_logs
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_security_alert();