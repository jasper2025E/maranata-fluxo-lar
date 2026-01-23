-- Adicionar coluna stripe_subscription_id na tabela tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Adicionar coluna stripe_customer_id na tabela tenants (se não existir)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Criar índice para busca por subscription
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription 
ON public.tenants(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;