-- ==============================================
-- ARQUITETURA DE GATEWAY DE PAGAMENTOS MULTI-TENANT
-- Fase 1: Tabelas de configuração e credenciais
-- ==============================================

-- Enum para tipos de gateway suportados
CREATE TYPE public.payment_gateway_type AS ENUM (
  'asaas',
  'mercado_pago',
  'stripe',
  'pagarme',
  'gerencianet',
  'pix_banco',
  'custom_api'
);

-- Enum para métodos de pagamento
CREATE TYPE public.payment_method_type AS ENUM (
  'pix',
  'boleto',
  'credit_card',
  'debit_card',
  'bank_transfer'
);

-- Enum para ambiente (sandbox/produção)
CREATE TYPE public.gateway_environment AS ENUM (
  'sandbox',
  'production'
);

-- ==============================================
-- TABELA: Configurações de Gateway por Tenant
-- ==============================================
CREATE TABLE public.tenant_gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identificação do gateway
  gateway_type payment_gateway_type NOT NULL,
  display_name TEXT NOT NULL, -- Nome amigável ex: "Asaas Principal"
  
  -- Configurações
  environment gateway_environment NOT NULL DEFAULT 'sandbox',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Métodos permitidos
  allowed_methods payment_method_type[] NOT NULL DEFAULT ARRAY['pix', 'boleto']::payment_method_type[],
  
  -- Webhook
  webhook_url TEXT, -- URL gerada para receber callbacks
  webhook_token TEXT, -- Token para validar webhooks
  
  -- Configurações específicas (não-sensíveis)
  currency TEXT NOT NULL DEFAULT 'BRL',
  settings JSONB DEFAULT '{}'::jsonb, -- Configurações extras não-sensíveis
  
  -- Status de conexão
  last_connection_test TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'not_tested',
  connection_error TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraint: Apenas um gateway default por tenant
  CONSTRAINT unique_default_gateway_per_tenant 
    EXCLUDE USING btree (tenant_id WITH =) WHERE (is_default = true)
);

-- ==============================================
-- TABELA: Credenciais Criptografadas do Gateway
-- ==============================================
CREATE TABLE public.tenant_gateway_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_config_id UUID NOT NULL REFERENCES public.tenant_gateway_configs(id) ON DELETE CASCADE,
  
  -- Identificação da chave
  key_name TEXT NOT NULL, -- ex: 'api_key', 'secret_key', 'access_token', 'webhook_secret'
  
  -- Valor criptografado (AES-256 via pgcrypto)
  -- Nunca exposto diretamente - apenas via Edge Function
  encrypted_value TEXT NOT NULL,
  
  -- Metadados (não-sensíveis)
  key_prefix TEXT, -- Primeiros 8 chars para identificação visual
  last_rotated TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Cada chave é única por configuração
  CONSTRAINT unique_key_per_config UNIQUE (gateway_config_id, key_name)
);

-- ==============================================
-- TABELA: Logs de Transações por Gateway
-- ==============================================
CREATE TABLE public.gateway_transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gateway_config_id UUID REFERENCES public.tenant_gateway_configs(id) ON DELETE SET NULL,
  
  -- Referência interna
  fatura_id UUID REFERENCES public.faturas(id) ON DELETE SET NULL,
  pagamento_id UUID REFERENCES public.pagamentos(id) ON DELETE SET NULL,
  
  -- Operação
  operation TEXT NOT NULL, -- 'create_customer', 'create_payment', 'cancel', 'refund', 'webhook'
  gateway_type payment_gateway_type NOT NULL,
  
  -- Dados da transação
  external_reference TEXT, -- ID no gateway externo
  amount NUMERIC,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  error_code TEXT,
  
  -- Payload (para debug - sanitizado, sem credenciais)
  request_payload JSONB,
  response_payload JSONB,
  
  -- Métricas
  duration_ms INTEGER,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================
CREATE INDEX idx_gateway_configs_tenant ON public.tenant_gateway_configs(tenant_id);
CREATE INDEX idx_gateway_configs_active ON public.tenant_gateway_configs(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_gateway_secrets_config ON public.tenant_gateway_secrets(gateway_config_id);
CREATE INDEX idx_gateway_logs_tenant ON public.gateway_transaction_logs(tenant_id, created_at DESC);
CREATE INDEX idx_gateway_logs_fatura ON public.gateway_transaction_logs(fatura_id) WHERE fatura_id IS NOT NULL;

-- ==============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ==============================================
CREATE TRIGGER update_gateway_configs_updated_at
  BEFORE UPDATE ON public.tenant_gateway_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- FUNÇÃO: Gerar webhook URL única
-- ==============================================
CREATE OR REPLACE FUNCTION public.generate_gateway_webhook_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gera token único para webhook
  NEW.webhook_token := encode(gen_random_bytes(32), 'hex');
  
  -- A URL completa será construída no frontend usando o project URL
  -- Formato: /functions/v1/gateway-webhook/{gateway_type}/{webhook_token}
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_webhook_on_insert
  BEFORE INSERT ON public.tenant_gateway_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_gateway_webhook_url();

-- ==============================================
-- FUNÇÃO: Garantir apenas um default por tenant
-- ==============================================
CREATE OR REPLACE FUNCTION public.ensure_single_default_gateway()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Remove default de outros gateways do mesmo tenant
    UPDATE public.tenant_gateway_configs
    SET is_default = false, updated_at = now()
    WHERE tenant_id = NEW.tenant_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_before_update
  BEFORE INSERT OR UPDATE ON public.tenant_gateway_configs
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_gateway();

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE public.tenant_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_gateway_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_transaction_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para tenant_gateway_configs
CREATE POLICY "tenant_gateway_configs_tenant_isolation" ON public.tenant_gateway_configs
  FOR ALL USING (
    (tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid())
  )
  WITH CHECK (
    (tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY "tenant_gateway_configs_admin_manage" ON public.tenant_gateway_configs
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

-- Políticas para tenant_gateway_secrets (MUITO RESTRITIVO)
-- Apenas via Edge Functions com service role
CREATE POLICY "tenant_gateway_secrets_no_direct_access" ON public.tenant_gateway_secrets
  FOR ALL USING (false)
  WITH CHECK (false);

-- Políticas para gateway_transaction_logs
CREATE POLICY "gateway_logs_tenant_isolation" ON public.gateway_transaction_logs
  FOR ALL USING (
    (tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY "gateway_logs_admin_view" ON public.gateway_transaction_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro') OR is_platform_admin(auth.uid())
  );

CREATE POLICY "gateway_logs_insert_only" ON public.gateway_transaction_logs
  FOR INSERT WITH CHECK (true); -- Service role insere via Edge Functions

-- ==============================================
-- ADICIONAR CAMPO gateway_config_id NAS FATURAS
-- Para rastrear qual gateway processou cada fatura
-- ==============================================
ALTER TABLE public.faturas 
  ADD COLUMN IF NOT EXISTS gateway_config_id UUID REFERENCES public.tenant_gateway_configs(id) ON DELETE SET NULL;

ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS gateway_config_id UUID REFERENCES public.tenant_gateway_configs(id) ON DELETE SET NULL;

-- Índice para buscar faturas por gateway
CREATE INDEX IF NOT EXISTS idx_faturas_gateway ON public.faturas(gateway_config_id) WHERE gateway_config_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagamentos_gateway ON public.pagamentos(gateway_config_id) WHERE gateway_config_id IS NOT NULL;