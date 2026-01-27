-- =============================================
-- SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS
-- =============================================

-- 1. Função utilitária para criar notificações
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_tenant_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (tenant_id, title, message, type, link)
  VALUES (p_tenant_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- 2. Trigger para notificar pagamentos
CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_aluno_nome TEXT;
  v_valor_formatado TEXT;
BEGIN
  -- Buscar nome do aluno via fatura
  SELECT a.nome_completo INTO v_aluno_nome
  FROM faturas f
  JOIN alunos a ON a.id = f.aluno_id
  WHERE f.id = NEW.fatura_id;
  
  v_valor_formatado := 'R$ ' || TO_CHAR(NEW.valor, 'FM999G999D00');
  
  -- Criar notificação apenas para pagamentos não-estorno
  IF NEW.tipo IS DISTINCT FROM 'estorno' THEN
    INSERT INTO notifications (tenant_id, title, message, type, link)
    VALUES (
      NEW.tenant_id,
      'Pagamento Registrado',
      v_valor_formatado || ' recebido de ' || COALESCE(v_aluno_nome, 'Aluno') || ' via ' || COALESCE(NEW.metodo, 'Manual'),
      'success',
      '/faturas'
    );
  ELSE
    INSERT INTO notifications (tenant_id, title, message, type, link)
    VALUES (
      NEW.tenant_id,
      'Estorno Registrado',
      'Estorno de ' || v_valor_formatado || ' para ' || COALESCE(v_aluno_nome, 'Aluno'),
      'warning',
      '/faturas'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_payment ON pagamentos;
CREATE TRIGGER trigger_notify_payment
  AFTER INSERT ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_payment();

-- 3. Trigger para notificar nova folha de pagamento
CREATE OR REPLACE FUNCTION public.notify_on_folha_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_func_nome TEXT;
  v_mes_nome TEXT;
  v_meses TEXT[] := ARRAY['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
BEGIN
  SELECT nome_completo INTO v_func_nome
  FROM funcionarios WHERE id = NEW.funcionario_id;
  
  v_mes_nome := v_meses[NEW.mes_referencia];
  
  INSERT INTO notifications (tenant_id, title, message, type, link)
  VALUES (
    NEW.tenant_id,
    'Folha de Pagamento Gerada',
    'Folha de ' || COALESCE(v_func_nome, 'Funcionário') || ' - ' || v_mes_nome || '/' || NEW.ano_referencia,
    'info',
    '/rh'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_folha_created ON folha_pagamento;
CREATE TRIGGER trigger_notify_folha_created
  AFTER INSERT ON folha_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_folha_created();

-- 4. Trigger para notificar folha paga
CREATE OR REPLACE FUNCTION public.notify_on_folha_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_func_nome TEXT;
  v_valor_formatado TEXT;
BEGIN
  -- Só notifica se mudou de não-pago para pago
  IF (OLD.pago IS DISTINCT FROM true) AND NEW.pago = true THEN
    SELECT nome_completo INTO v_func_nome
    FROM funcionarios WHERE id = NEW.funcionario_id;
    
    v_valor_formatado := 'R$ ' || TO_CHAR(NEW.total_liquido, 'FM999G999D00');
    
    INSERT INTO notifications (tenant_id, title, message, type, link)
    VALUES (
      NEW.tenant_id,
      'Folha Paga',
      'Pagamento de ' || v_valor_formatado || ' para ' || COALESCE(v_func_nome, 'Funcionário') || ' registrado',
      'success',
      '/rh'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_folha_paid ON folha_pagamento;
CREATE TRIGGER trigger_notify_folha_paid
  AFTER UPDATE ON folha_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_folha_paid();