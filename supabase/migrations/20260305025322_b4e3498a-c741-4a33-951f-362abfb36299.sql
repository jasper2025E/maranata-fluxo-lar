
CREATE OR REPLACE FUNCTION public.get_overdue_invoices_summary()
RETURNS TABLE (
  total_valor_vencido NUMERIC,
  total_faturas_vencidas BIGINT,
  total_responsaveis_inadimplentes BIGINT,
  aging_ate30 BIGINT,
  aging_de31a60 BIGINT,
  aging_mais60 BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(COALESCE(f.valor_total, f.valor)), 0) as total_valor_vencido,
    COUNT(*) as total_faturas_vencidas,
    COUNT(DISTINCT f.responsavel_id) as total_responsaveis_inadimplentes,
    COUNT(*) FILTER (WHERE (CURRENT_DATE - f.data_vencimento) <= 30) as aging_ate30,
    COUNT(*) FILTER (WHERE (CURRENT_DATE - f.data_vencimento) > 30 AND (CURRENT_DATE - f.data_vencimento) <= 60) as aging_de31a60,
    COUNT(*) FILTER (WHERE (CURRENT_DATE - f.data_vencimento) > 60) as aging_mais60
  FROM public.faturas f
  WHERE f.status = 'Vencida'
    AND f.tenant_id = get_user_tenant_id();
$$;
