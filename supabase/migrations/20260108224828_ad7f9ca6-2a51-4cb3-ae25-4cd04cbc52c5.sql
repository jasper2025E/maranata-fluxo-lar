-- Trigger para sincronizar responsavel_id nas faturas quando aluno é vinculado/atualizado
CREATE OR REPLACE FUNCTION public.sincronizar_responsavel_faturas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Quando o responsavel_id do aluno é alterado, atualizar todas as faturas do aluno
  IF NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id THEN
    UPDATE faturas
    SET responsavel_id = NEW.responsavel_id,
        updated_at = NOW()
    WHERE aluno_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger no update de alunos
DROP TRIGGER IF EXISTS trigger_sincronizar_responsavel_faturas ON alunos;
CREATE TRIGGER trigger_sincronizar_responsavel_faturas
  AFTER UPDATE ON alunos
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_responsavel_faturas();

-- Trigger para inserir responsavel_id automaticamente ao criar fatura
CREATE OR REPLACE FUNCTION public.definir_responsavel_fatura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_responsavel_id UUID;
BEGIN
  -- Se responsavel_id não foi informado, buscar do aluno
  IF NEW.responsavel_id IS NULL THEN
    SELECT responsavel_id INTO v_responsavel_id
    FROM alunos
    WHERE id = NEW.aluno_id;
    
    NEW.responsavel_id := v_responsavel_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger no insert de faturas
DROP TRIGGER IF EXISTS trigger_definir_responsavel_fatura ON faturas;
CREATE TRIGGER trigger_definir_responsavel_fatura
  BEFORE INSERT ON faturas
  FOR EACH ROW
  EXECUTE FUNCTION definir_responsavel_fatura();