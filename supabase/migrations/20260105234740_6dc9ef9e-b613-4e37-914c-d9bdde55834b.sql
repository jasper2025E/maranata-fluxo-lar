-- Add role checks to atualizar_status_faturas function
CREATE OR REPLACE FUNCTION public.atualizar_status_faturas()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Require admin, staff, or financeiro role
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR 
    has_role(auth.uid(), 'financeiro'::app_role)
  ) THEN
    RAISE EXCEPTION 'Acesso negado: permissões insuficientes';
  END IF;

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
$$;