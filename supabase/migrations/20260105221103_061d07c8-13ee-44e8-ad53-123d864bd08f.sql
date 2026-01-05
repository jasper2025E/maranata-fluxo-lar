-- Adicionar configurações de cobrança na tabela escola
ALTER TABLE public.escola
ADD COLUMN IF NOT EXISTS juros_percentual_diario_padrao numeric DEFAULT 0.033,
ADD COLUMN IF NOT EXISTS juros_percentual_mensal_padrao numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS multa_fixa_padrao numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS multa_percentual_padrao numeric DEFAULT 2,
ADD COLUMN IF NOT EXISTS dias_carencia_juros integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_pontualidade_percentual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_desconto_pontualidade integer DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.escola.juros_percentual_diario_padrao IS 'Taxa de juros diária padrão (ex: 0.033 = 0.033% ao dia)';
COMMENT ON COLUMN public.escola.juros_percentual_mensal_padrao IS 'Taxa de juros mensal padrão (ex: 1 = 1% ao mês)';
COMMENT ON COLUMN public.escola.multa_fixa_padrao IS 'Valor fixo de multa por atraso em reais';
COMMENT ON COLUMN public.escola.multa_percentual_padrao IS 'Percentual de multa por atraso (ex: 2 = 2%)';
COMMENT ON COLUMN public.escola.dias_carencia_juros IS 'Dias de carência antes de aplicar juros';
COMMENT ON COLUMN public.escola.desconto_pontualidade_percentual IS 'Desconto para pagamento antecipado (%)';
COMMENT ON COLUMN public.escola.dias_desconto_pontualidade IS 'Dias antes do vencimento para aplicar desconto';