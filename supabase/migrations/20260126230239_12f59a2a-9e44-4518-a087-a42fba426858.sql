-- Adicionar campos de configuração de faturamento na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS dia_vencimento integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS data_inicio_cobranca date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS quantidade_parcelas integer DEFAULT 12;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.alunos.dia_vencimento IS 'Dia do mês para vencimento das faturas (1-28)';
COMMENT ON COLUMN public.alunos.data_inicio_cobranca IS 'Data de início da geração de faturas';
COMMENT ON COLUMN public.alunos.quantidade_parcelas IS 'Quantidade de parcelas/meses a gerar';