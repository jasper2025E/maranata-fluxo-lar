-- ============================================================
-- FASE 1: Função para corrigir inconsistências ASAAS + Cron job
-- ============================================================

-- 1. Função para corrigir faturas com pagamento confirmado no ASAAS
-- mas status local ainda em Aberta/Vencida
CREATE OR REPLACE FUNCTION public.fix_asaas_status_inconsistencies()
RETURNS TABLE(fatura_id uuid, old_status text, new_status text, asaas_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE faturas f
  SET 
    status = 'Paga',
    saldo_restante = 0,
    updated_at = now()
  WHERE 
    f.asaas_status IN ('RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED')
    AND f.status NOT IN ('Paga', 'Cancelada')
  RETURNING f.id, f.status as old_status, 'Paga' as new_status, f.asaas_status;
END;
$$;

-- 2. Função para sincronização automática de status baseado em asaas_status
-- Chamada por trigger ou cron
CREATE OR REPLACE FUNCTION public.sync_fatura_status_from_asaas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se asaas_status indica pago, atualizar status local
  IF NEW.asaas_status IN ('RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED') 
     AND NEW.status NOT IN ('Paga', 'Cancelada') THEN
    NEW.status := 'Paga';
    NEW.saldo_restante := 0;
    NEW.updated_at := now();
  END IF;
  
  -- Se asaas_status indica vencida
  IF NEW.asaas_status IN ('OVERDUE', 'DUNNING_REQUESTED') 
     AND NEW.status NOT IN ('Paga', 'Cancelada') THEN
    NEW.status := 'Vencida';
    NEW.updated_at := now();
  END IF;
  
  -- Se asaas_status indica cancelada/estornada
  IF NEW.asaas_status IN ('REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 
                          'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL')
     AND NEW.status NOT IN ('Cancelada') THEN
    NEW.status := 'Cancelada';
    NEW.motivo_cancelamento := COALESCE(NEW.motivo_cancelamento, 'Asaas: ' || NEW.asaas_status);
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Trigger para sincronização automática quando asaas_status muda
DROP TRIGGER IF EXISTS trigger_sync_fatura_asaas_status ON faturas;
CREATE TRIGGER trigger_sync_fatura_asaas_status
  BEFORE UPDATE OF asaas_status ON faturas
  FOR EACH ROW
  WHEN (OLD.asaas_status IS DISTINCT FROM NEW.asaas_status)
  EXECUTE FUNCTION sync_fatura_status_from_asaas();

-- 4. Habilitar realtime para faturas (se não estiver)
ALTER PUBLICATION supabase_realtime ADD TABLE faturas;
ALTER PUBLICATION supabase_realtime ADD TABLE pagamentos;