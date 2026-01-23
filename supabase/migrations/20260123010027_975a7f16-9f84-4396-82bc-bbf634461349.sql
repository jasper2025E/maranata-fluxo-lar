-- Sistema de Assinaturas para Multi-Tenancy SaaS
-- Adiciona campos de assinatura e status na tabela tenants

-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM (
  'trial',
  'active', 
  'past_due',
  'cancelled',
  'suspended'
);

-- Adicionar campos de assinatura à tabela tenants
ALTER TABLE public.tenants
ADD COLUMN subscription_status subscription_status DEFAULT 'trial',
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN grace_period_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN monthly_price NUMERIC DEFAULT 0,
ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN blocked_reason TEXT;

-- Índices para performance
CREATE INDEX idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX idx_tenants_stripe_customer_id ON public.tenants(stripe_customer_id);
CREATE INDEX idx_tenants_subscription_ends_at ON public.tenants(subscription_ends_at);

-- Tabela de histórico de assinaturas
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_status subscription_status,
  new_status subscription_status,
  stripe_event_id TEXT,
  amount NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Apenas platform_admin pode ver histórico de assinaturas
CREATE POLICY "Platform admins can view subscription history"
ON public.subscription_history
FOR SELECT
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage subscription history"
ON public.subscription_history
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Função para verificar se tenant está bloqueado
CREATE OR REPLACE FUNCTION public.is_tenant_blocked(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = p_tenant_id
    AND (
      subscription_status = 'suspended'
      OR blocked_at IS NOT NULL
    )
  )
$$;

-- Função para verificar período de carência
CREATE OR REPLACE FUNCTION public.is_in_grace_period(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = p_tenant_id
    AND subscription_status = 'past_due'
    AND grace_period_ends_at > NOW()
  )
$$;

-- Função para atualizar status com período de carência de 7 dias
CREATE OR REPLACE FUNCTION public.handle_subscription_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se passou para past_due, define período de carência de 7 dias
  IF NEW.subscription_status = 'past_due' AND OLD.subscription_status != 'past_due' THEN
    NEW.grace_period_ends_at := NOW() + INTERVAL '7 days';
  END IF;
  
  -- Se passou do período de carência, bloqueia
  IF NEW.subscription_status = 'past_due' 
     AND NEW.grace_period_ends_at IS NOT NULL 
     AND NEW.grace_period_ends_at < NOW() THEN
    NEW.subscription_status := 'suspended';
    NEW.blocked_at := NOW();
    NEW.blocked_reason := 'Assinatura vencida - período de carência expirado';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para gerenciar status de assinatura
CREATE TRIGGER trigger_handle_subscription_overdue
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.handle_subscription_overdue();