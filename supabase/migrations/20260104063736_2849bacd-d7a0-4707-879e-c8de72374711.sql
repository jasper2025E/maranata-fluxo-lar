-- Add explicit authorization check to gerar_faturas_aluno function
CREATE OR REPLACE FUNCTION public.gerar_faturas_aluno(p_aluno_id uuid, p_curso_id uuid, p_valor numeric, p_data_inicio date)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mes INTEGER;
  v_ano INTEGER;
  v_data_vencimento DATE;
BEGIN
  -- Explicit authorization check before any operation
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR 
    has_role(auth.uid(), 'secretaria'::app_role) OR
    has_role(auth.uid(), 'financeiro'::app_role)
  ) THEN
    RAISE EXCEPTION 'Acesso negado: permissões insuficientes';
  END IF;

  FOR i IN 0..11 LOOP
    v_data_vencimento := p_data_inicio + (i || ' months')::INTERVAL;
    v_data_vencimento := DATE_TRUNC('month', v_data_vencimento) + INTERVAL '9 days';
    v_mes := EXTRACT(MONTH FROM v_data_vencimento);
    v_ano := EXTRACT(YEAR FROM v_data_vencimento);
    
    INSERT INTO public.faturas (
      aluno_id,
      curso_id,
      valor,
      mes_referencia,
      ano_referencia,
      data_emissao,
      data_vencimento,
      status
    ) VALUES (
      p_aluno_id,
      p_curso_id,
      p_valor,
      v_mes,
      v_ano,
      CURRENT_DATE,
      v_data_vencimento,
      'Aberta'
    );
  END LOOP;
END;
$function$;