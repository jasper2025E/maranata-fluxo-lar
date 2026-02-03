-- ==============================================
-- Correção do campo saldo_restante nas faturas
-- ==============================================

-- 1. Atualizar todas as faturas abertas/vencidas que têm saldo_restante = 0
UPDATE faturas
SET saldo_restante = COALESCE(valor_total, valor)
WHERE status IN ('Aberta', 'Vencida', 'Emitida')
  AND (saldo_restante IS NULL OR saldo_restante = 0)
  AND COALESCE(valor_total, valor) > 0;

-- 2. Criar função para inicializar saldo_restante automaticamente
CREATE OR REPLACE FUNCTION public.init_saldo_restante()
RETURNS TRIGGER AS $$
BEGIN
  -- Se saldo_restante não foi informado ou é zero, inicializa com valor_total
  IF NEW.saldo_restante IS NULL OR NEW.saldo_restante = 0 THEN
    NEW.saldo_restante := COALESCE(NEW.valor_total, NEW.valor, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Criar trigger para executar a função em INSERTs
DROP TRIGGER IF EXISTS trigger_init_saldo_restante ON faturas;
CREATE TRIGGER trigger_init_saldo_restante
  BEFORE INSERT ON faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.init_saldo_restante();