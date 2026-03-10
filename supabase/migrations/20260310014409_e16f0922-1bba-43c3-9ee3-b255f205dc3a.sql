
-- Add unique constraint to prevent duplicate recurring entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_despesas_recorrente_unico 
ON public.despesas (despesa_origem_id, EXTRACT(MONTH FROM data_vencimento::date), EXTRACT(YEAR FROM data_vencimento::date))
WHERE despesa_origem_id IS NOT NULL;
