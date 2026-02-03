-- ===========================================
-- TRIGGER AUTOMÁTICO: Marca faturas como Vencida
-- ===========================================
CREATE OR REPLACE FUNCTION public.auto_update_fatura_vencida()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza se o status for "Aberta" e a data de vencimento já passou
  IF NEW.status = 'Aberta' 
     AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'Vencida';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_auto_vencida ON public.faturas;

-- Criar trigger que executa antes de INSERT ou UPDATE
CREATE TRIGGER trigger_auto_vencida
  BEFORE INSERT OR UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_fatura_vencida();

-- ===========================================
-- FUNÇÃO BATCH: Marcar faturas vencidas em lote
-- ===========================================
CREATE OR REPLACE FUNCTION public.mark_overdue_faturas()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.faturas
  SET 
    status = 'Vencida',
    updated_at = NOW()
  WHERE status = 'Aberta'
    AND data_vencimento < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute para authenticated users
GRANT EXECUTE ON FUNCTION public.mark_overdue_faturas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_overdue_faturas() TO service_role;