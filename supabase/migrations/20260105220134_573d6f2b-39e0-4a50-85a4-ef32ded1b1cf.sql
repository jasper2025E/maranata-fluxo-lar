-- Adicionar campos de desconto, juros e multa avançados na tabela faturas
ALTER TABLE public.faturas 
ADD COLUMN IF NOT EXISTS desconto_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_percentual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_motivo text,
ADD COLUMN IF NOT EXISTS juros_percentual_diario numeric DEFAULT 0.033,
ADD COLUMN IF NOT EXISTS juros_percentual_mensal numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS dias_atraso integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_original numeric,
ADD COLUMN IF NOT EXISTS valor_desconto_aplicado numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_juros_aplicado numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_multa_aplicado numeric DEFAULT 0;

-- Atualizar valor_original com o valor atual para faturas existentes
UPDATE public.faturas SET valor_original = valor WHERE valor_original IS NULL;

-- Criar função para calcular valor total da fatura automaticamente
CREATE OR REPLACE FUNCTION public.calcular_valor_total_fatura()
RETURNS TRIGGER AS $$
DECLARE
  v_valor_base numeric;
  v_desconto numeric := 0;
  v_juros numeric := 0;
  v_multa numeric := 0;
  v_dias_atraso integer := 0;
  v_valor_final numeric;
BEGIN
  -- Usar valor_original se existir, senão usar valor
  v_valor_base := COALESCE(NEW.valor_original, NEW.valor);
  
  -- Calcular desconto
  IF COALESCE(NEW.desconto_percentual, 0) > 0 THEN
    v_desconto := v_valor_base * (NEW.desconto_percentual / 100);
  ELSE
    v_desconto := COALESCE(NEW.desconto_valor, 0);
  END IF;
  
  -- Limitar desconto ao valor base
  IF v_desconto > v_valor_base THEN
    v_desconto := v_valor_base;
  END IF;
  
  -- Calcular dias de atraso
  IF NEW.data_vencimento < CURRENT_DATE AND NEW.status NOT IN ('Paga', 'Cancelada') THEN
    v_dias_atraso := CURRENT_DATE - NEW.data_vencimento;
  ELSE
    v_dias_atraso := 0;
  END IF;
  
  -- Calcular juros por atraso
  IF v_dias_atraso > 0 THEN
    IF COALESCE(NEW.juros_percentual_diario, 0) > 0 THEN
      v_juros := (v_valor_base - v_desconto) * (NEW.juros_percentual_diario / 100) * v_dias_atraso;
    ELSIF COALESCE(NEW.juros_percentual_mensal, 0) > 0 THEN
      v_juros := (v_valor_base - v_desconto) * (NEW.juros_percentual_mensal / 100) * (v_dias_atraso / 30.0);
    END IF;
  END IF;
  
  -- Usar multa se informada ou se houver atraso
  IF v_dias_atraso > 0 THEN
    v_multa := COALESCE(NEW.multa, 0);
  ELSE
    v_multa := 0;
  END IF;
  
  -- Calcular valor final
  v_valor_final := v_valor_base - v_desconto + v_juros + v_multa;
  
  -- Garantir que não seja negativo
  IF v_valor_final < 0 THEN
    v_valor_final := 0;
  END IF;
  
  -- Atualizar campos calculados
  NEW.dias_atraso := v_dias_atraso;
  NEW.valor_desconto_aplicado := v_desconto;
  NEW.valor_juros_aplicado := v_juros;
  NEW.valor_multa_aplicado := v_multa;
  NEW.juros := v_juros;
  NEW.valor_total := v_valor_final;
  
  -- Se valor_original não foi definido, usar valor atual
  IF NEW.valor_original IS NULL THEN
    NEW.valor_original := NEW.valor;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para recalcular automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_valor_total_fatura ON public.faturas;
CREATE TRIGGER trigger_calcular_valor_total_fatura
BEFORE INSERT OR UPDATE ON public.faturas
FOR EACH ROW
EXECUTE FUNCTION public.calcular_valor_total_fatura();

-- Atualizar função de status de faturas para recalcular valores também
CREATE OR REPLACE FUNCTION public.atualizar_status_faturas()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Atualizar status para Vencida
  UPDATE public.faturas
  SET 
    status = 'Vencida',
    updated_at = NOW()
  WHERE status = 'Aberta'
    AND data_vencimento < CURRENT_DATE;
    
  -- Forçar recálculo de juros e multa para faturas vencidas
  UPDATE public.faturas
  SET updated_at = NOW()
  WHERE status = 'Vencida';
END;
$function$;

-- Atualizar tabela de pagamentos para registrar detalhes do pagamento
ALTER TABLE public.pagamentos
ADD COLUMN IF NOT EXISTS valor_original numeric,
ADD COLUMN IF NOT EXISTS desconto_aplicado numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS juros_aplicado numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS multa_aplicada numeric DEFAULT 0;