-- Adicionar colunas para rastrear faturas derivadas de pagamentos parciais
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS fatura_origem_id UUID REFERENCES faturas(id);
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS tipo_origem TEXT DEFAULT NULL;

-- Índice para buscar faturas derivadas rapidamente
CREATE INDEX IF NOT EXISTS idx_faturas_origem ON faturas(fatura_origem_id) WHERE fatura_origem_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN faturas.fatura_origem_id IS 'ID da fatura original quando esta é derivada (ex: saldo de pagamento parcial)';
COMMENT ON COLUMN faturas.tipo_origem IS 'Tipo de origem: pagamento_parcial, renegociacao, etc.';