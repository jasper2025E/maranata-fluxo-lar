
CREATE OR REPLACE FUNCTION public.calcular_valor_total_fatura()
RETURNS TRIGGER AS $$
DECLARE
  v_valor_base numeric;
  v_desconto numeric := 0;
  v_juros numeric := 0;
  v_multa numeric := 0;
  v_dias_atraso integer := 0;
  v_valor_final numeric;
  v_multa_percentual numeric := 0;
  v_multa_fixa numeric := 0;
  v_dias_carencia integer := 0;
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

  -- Se ja esta Paga/Cancelada, PRESERVAR os valores existentes de juros/multa
  IF NEW.status IN ('Paga', 'Cancelada') THEN
    NEW.valor_juros_aplicado := COALESCE(NEW.valor_juros_aplicado, OLD.valor_juros_aplicado, 0);
    NEW.valor_multa_aplicado := COALESCE(NEW.valor_multa_aplicado, OLD.valor_multa_aplicado, 0);
    NEW.juros := NEW.valor_juros_aplicado;
    NEW.dias_atraso := COALESCE(OLD.dias_atraso, 0);
    NEW.valor_desconto_aplicado := v_desconto;
    
    v_valor_final := v_valor_base - v_desconto + NEW.valor_juros_aplicado + NEW.valor_multa_aplicado;
    IF v_valor_final < 0 THEN
      v_valor_final := 0;
    END IF;
    NEW.valor_total := v_valor_final;
    
    IF NEW.valor_original IS NULL THEN
      NEW.valor_original := NEW.valor;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Para faturas ativas, calcular normalmente
  IF NEW.data_vencimento < CURRENT_DATE THEN
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
  
  -- Buscar configuração de multa da escola (tenant)
  SELECT COALESCE(e.multa_percentual_padrao, 0), 
         COALESCE(e.multa_fixa_padrao, 0),
         COALESCE(e.dias_carencia_juros, 0)
  INTO v_multa_percentual, v_multa_fixa, v_dias_carencia
  FROM escola e 
  WHERE e.tenant_id = NEW.tenant_id
  LIMIT 1;
  
  -- Calcular multa automaticamente se houver atraso (após carência)
  IF v_dias_atraso > v_dias_carencia THEN
    -- Multa percentual sobre o valor base (aplicada uma única vez, não acumula por dia)
    IF v_multa_percentual > 0 THEN
      v_multa := (v_valor_base - v_desconto) * (v_multa_percentual / 100);
    END IF;
    -- Somar multa fixa se configurada
    IF v_multa_fixa > 0 THEN
      v_multa := v_multa + v_multa_fixa;
    END IF;
    -- Se havia um valor manual no campo multa, usar o maior
    IF COALESCE(NEW.multa, 0) > v_multa THEN
      v_multa := NEW.multa;
    END IF;
  ELSE
    v_multa := 0;
  END IF;
  
  -- Calcular valor final
  v_valor_final := v_valor_base - v_desconto + v_juros + v_multa;
  IF v_valor_final < 0 THEN
    v_valor_final := 0;
  END IF;
  
  -- Atualizar campos calculados
  NEW.dias_atraso := v_dias_atraso;
  NEW.valor_desconto_aplicado := v_desconto;
  NEW.valor_juros_aplicado := v_juros;
  NEW.valor_multa_aplicado := v_multa;
  NEW.juros := v_juros;
  NEW.multa := v_multa;
  NEW.valor_total := v_valor_final;
  
  IF NEW.valor_original IS NULL THEN
    NEW.valor_original := NEW.valor;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
