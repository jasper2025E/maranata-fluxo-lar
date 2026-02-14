
CREATE OR REPLACE FUNCTION public.recalculate_overdue_interest()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.faturas
  SET updated_at = NOW()
  WHERE status = 'Vencida'
    AND data_vencimento < CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
