-- Add official 44-digit boleto barcode returned by provider (barCode)
ALTER TABLE public.faturas
ADD COLUMN IF NOT EXISTS asaas_boleto_bar_code text;

COMMENT ON COLUMN public.faturas.asaas_boleto_bar_code IS 'Asaas boleto barCode (44 dígitos) para gerar o código de barras ITF-25; a linha digitável (47) permanece em asaas_boleto_barcode.';