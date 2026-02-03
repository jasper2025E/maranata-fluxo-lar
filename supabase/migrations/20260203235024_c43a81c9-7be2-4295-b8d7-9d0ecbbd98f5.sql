-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.auto_update_fatura_vencida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Aberta' 
     AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'Vencida';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;