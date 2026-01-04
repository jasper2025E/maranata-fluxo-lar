-- Adicionar coluna stripe_customer_id na tabela responsaveis
ALTER TABLE public.responsaveis
ADD COLUMN stripe_customer_id TEXT;

-- Criar índice para busca por stripe_customer_id
CREATE INDEX idx_responsaveis_stripe_customer_id ON public.responsaveis(stripe_customer_id);

-- Adicionar colunas do Stripe na tabela faturas
ALTER TABLE public.faturas
ADD COLUMN stripe_payment_intent_id TEXT,
ADD COLUMN stripe_checkout_session_id TEXT,
ADD COLUMN payment_url TEXT;

-- Criar índices para busca pelas colunas do Stripe
CREATE INDEX idx_faturas_stripe_payment_intent_id ON public.faturas(stripe_payment_intent_id);
CREATE INDEX idx_faturas_stripe_checkout_session_id ON public.faturas(stripe_checkout_session_id);