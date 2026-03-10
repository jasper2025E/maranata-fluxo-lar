
-- Add recurrence fields to despesas
ALTER TABLE public.despesas 
  ADD COLUMN IF NOT EXISTS recorrencia_ate DATE,
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER,
  ADD COLUMN IF NOT EXISTS despesa_origem_id UUID REFERENCES public.despesas(id);

-- Function to generate recurring despesa entries
CREATE OR REPLACE FUNCTION public.gerar_despesas_recorrentes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_despesa RECORD;
  v_data DATE;
  v_count INTEGER := 0;
  v_dia INTEGER;
  v_ultimo_dia INTEGER;
BEGIN
  -- Find all recurring expenses with an end date
  FOR v_despesa IN
    SELECT * FROM public.despesas
    WHERE recorrente = true
      AND recorrencia_ate IS NOT NULL
      AND despesa_origem_id IS NULL -- only originals, not generated copies
  LOOP
    v_dia := COALESCE(v_despesa.dia_vencimento, EXTRACT(DAY FROM v_despesa.data_vencimento::date));
    
    -- Start from the month after the original, go until recorrencia_ate
    v_data := (DATE_TRUNC('month', v_despesa.data_vencimento::date) + INTERVAL '1 month')::date;
    
    WHILE v_data <= v_despesa.recorrencia_ate LOOP
      -- Adjust day for months with fewer days
      v_ultimo_dia := EXTRACT(DAY FROM (DATE_TRUNC('month', v_data) + INTERVAL '1 month - 1 day')::date);
      
      -- Check if entry already exists for this month
      IF NOT EXISTS (
        SELECT 1 FROM public.despesas
        WHERE despesa_origem_id = v_despesa.id
          AND EXTRACT(MONTH FROM data_vencimento::date) = EXTRACT(MONTH FROM v_data)
          AND EXTRACT(YEAR FROM data_vencimento::date) = EXTRACT(YEAR FROM v_data)
      ) THEN
        INSERT INTO public.despesas (
          titulo, categoria, valor, data_vencimento, paga, recorrente,
          observacoes, tenant_id, despesa_origem_id, dia_vencimento
        ) VALUES (
          v_despesa.titulo,
          v_despesa.categoria,
          v_despesa.valor,
          (DATE_TRUNC('month', v_data) + ((LEAST(v_dia, v_ultimo_dia) - 1) || ' days')::interval)::date,
          false,
          true,
          v_despesa.observacoes,
          v_despesa.tenant_id,
          v_despesa.id,
          v_dia
        );
        v_count := v_count + 1;
      END IF;
      
      v_data := (v_data + INTERVAL '1 month')::date;
    END LOOP;
  END LOOP;
  
  RETURN v_count;
END;
$$;
