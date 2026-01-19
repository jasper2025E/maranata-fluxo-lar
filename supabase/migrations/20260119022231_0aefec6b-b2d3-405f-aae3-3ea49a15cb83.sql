-- Adicionar colunas do Asaas na tabela faturas
ALTER TABLE public.faturas
ADD COLUMN IF NOT EXISTS asaas_payment_id text,
ADD COLUMN IF NOT EXISTS asaas_invoice_url text,
ADD COLUMN IF NOT EXISTS asaas_pix_qrcode text,
ADD COLUMN IF NOT EXISTS asaas_pix_payload text,
ADD COLUMN IF NOT EXISTS asaas_boleto_url text,
ADD COLUMN IF NOT EXISTS asaas_boleto_barcode text,
ADD COLUMN IF NOT EXISTS asaas_status text,
ADD COLUMN IF NOT EXISTS asaas_due_date date,
ADD COLUMN IF NOT EXISTS asaas_billing_type text;

-- Adicionar coluna asaas_customer_id na tabela responsaveis
ALTER TABLE public.responsaveis
ADD COLUMN IF NOT EXISTS asaas_customer_id text;

-- Criar índice para buscar por asaas_payment_id
CREATE INDEX IF NOT EXISTS idx_faturas_asaas_payment_id ON public.faturas(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_asaas_customer_id ON public.responsaveis(asaas_customer_id);