-- =====================================================
-- SECURITY HARDENING - FASE ENTERPRISE (CORRIGIDO)
-- Corrigindo vulnerabilidades identificadas na auditoria
-- =====================================================

-- 1. SUBSCRIPTION_PLANS - Restringir acesso público à estratégia de preços
DROP POLICY IF EXISTS "Public read subscription_plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;

CREATE POLICY "Authenticated users can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
TO authenticated
USING (true);

-- 2. PLATFORM_SETTINGS - Restringir a platform_admin apenas
DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;

CREATE POLICY "Only platform admins can view platform settings" 
ON public.platform_settings 
FOR SELECT 
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- 3. SCHOOL_WEBSITE_CONFIG - Criar política restritiva
DROP POLICY IF EXISTS "Public can view enabled websites" ON public.school_website_config;
DROP POLICY IF EXISTS "Anyone can view enabled websites" ON public.school_website_config;

-- Apenas administradores do tenant podem ver configuração completa
CREATE POLICY "Tenant admins can manage website config" 
ON public.school_website_config 
FOR ALL 
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- 4. Criar função segura para buscar dados públicos de website
CREATE OR REPLACE FUNCTION public.get_public_website_by_slug(p_slug text)
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
  testimonials jsonb,
  prematricula_enabled boolean,
  prematricula_title text,
  prematricula_subtitle text,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_family text,
  footer_text text,
  show_powered_by boolean,
  seo_title text,
  seo_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    swc.seo_title,
    swc.seo_description
  FROM school_website_config swc
  WHERE swc.slug = p_slug
    AND swc.enabled = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_website_by_slug TO anon, authenticated;

-- 5. PREMATRICULA_LEADS - Política com campos corretos
DROP POLICY IF EXISTS "Anyone can submit pre-enrollment lead" ON public.prematricula_leads;

CREATE POLICY "Public can submit leads with validation" 
ON public.prematricula_leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Validação: nome_aluno ou nome_responsavel obrigatório
  (nome_aluno IS NOT NULL AND length(trim(nome_aluno)) >= 2)
  OR (nome_responsavel IS NOT NULL AND length(trim(nome_responsavel)) >= 2)
);

-- 6. Criar índice para detecção de spam
CREATE INDEX IF NOT EXISTS idx_prematricula_leads_ip_created 
ON public.prematricula_leads(ip_address, created_at DESC);

-- 7. SECURITY_SUMMARY - Restringir acesso
REVOKE ALL ON public.security_summary FROM anon;
GRANT SELECT ON public.security_summary TO authenticated;

-- 8. Função segura para security summary
CREATE OR REPLACE FUNCTION public.get_security_summary()
RETURNS TABLE (
  total_requests bigint,
  allowed_requests bigint,
  denied_requests bigint,
  cross_tenant_attempts bigint,
  suspicious_requests bigint,
  unique_users bigint,
  unique_tenants bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: platform_admin role required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.security_summary;
END;
$$;

-- 9. AUDIT: Criar tabela para logs de segurança imutáveis
CREATE TABLE IF NOT EXISTS public.immutable_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info', -- info, warning, critical
  user_id uuid,
  tenant_id uuid,
  ip_address text,
  user_agent text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.immutable_security_logs ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode inserir (via Edge Functions)
CREATE POLICY "Backend only insert security logs" 
ON public.immutable_security_logs 
FOR INSERT 
WITH CHECK (
  current_setting('role', true) = 'postgres'
  OR current_setting('role', true) = 'service_role'
);

-- Apenas platform_admin pode ler
CREATE POLICY "Platform admin can view security logs" 
ON public.immutable_security_logs 
FOR SELECT 
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- NINGUÉM pode deletar ou atualizar (logs imutáveis)
-- Não criar políticas de UPDATE ou DELETE

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_immutable_logs_created 
ON public.immutable_security_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_immutable_logs_severity 
ON public.immutable_security_logs(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_immutable_logs_user 
ON public.immutable_security_logs(user_id, created_at DESC);

-- 10. Função para registrar eventos de segurança
CREATE OR REPLACE FUNCTION public.log_security_event_v2(
  p_event_type text,
  p_action text,
  p_severity text DEFAULT 'info',
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_tenant_id uuid;
BEGIN
  -- Tentar obter tenant_id do usuário atual
  BEGIN
    SELECT public.get_user_tenant_id() INTO v_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;

  INSERT INTO public.immutable_security_logs (
    event_type,
    severity,
    user_id,
    tenant_id,
    ip_address,
    user_agent,
    action,
    resource_type,
    resource_id,
    old_value,
    new_value,
    metadata
  )
  VALUES (
    p_event_type,
    p_severity,
    auth.uid(),
    v_tenant_id,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_value,
    p_new_value,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
EXCEPTION WHEN OTHERS THEN
  -- Nunca falhar a operação principal por causa de log
  RAISE WARNING 'Failed to log security event: %', SQLERRM;
  RETURN NULL;
END;
$$;

COMMENT ON TABLE public.immutable_security_logs IS 
'Logs de segurança imutáveis - NINGUÉM pode deletar ou modificar. Usado para auditoria de conformidade LGPD.';

COMMENT ON FUNCTION public.log_security_event_v2 IS 
'Registra eventos de segurança de forma imutável. Usado para auditoria de login, alterações financeiras, etc.';