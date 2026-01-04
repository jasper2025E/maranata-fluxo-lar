
-- Add token and device tracking columns to funcionarios
ALTER TABLE public.funcionarios
ADD COLUMN IF NOT EXISTS ponto_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS ponto_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add device/IP tracking to ponto_registros
ALTER TABLE public.ponto_registros
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS tipo_registro TEXT;

-- Create function to generate secure token
CREATE OR REPLACE FUNCTION public.generate_ponto_token(p_funcionario_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Update the funcionario with the new token (expires in 1 year)
  UPDATE public.funcionarios
  SET 
    ponto_token = v_token,
    ponto_token_expires_at = NOW() + INTERVAL '1 year'
  WHERE id = p_funcionario_id;
  
  RETURN v_token;
END;
$$;

-- Create function to validate token and get funcionario (public access)
CREATE OR REPLACE FUNCTION public.validate_ponto_token(p_token TEXT)
RETURNS TABLE(
  funcionario_id UUID,
  nome_completo TEXT,
  foto_url TEXT,
  cargo_nome TEXT,
  ultimo_registro JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.nome_completo,
    f.foto_url,
    c.nome as cargo_nome,
    (
      SELECT jsonb_build_object(
        'tipo', pr.tipo_registro,
        'hora', pr.created_at,
        'entrada', pr.entrada,
        'saida_almoco', pr.saida_almoco,
        'retorno_almoco', pr.retorno_almoco,
        'saida', pr.saida
      )
      FROM public.ponto_registros pr
      WHERE pr.funcionario_id = f.id AND pr.data = CURRENT_DATE
      ORDER BY pr.created_at DESC
      LIMIT 1
    ) as ultimo_registro
  FROM public.funcionarios f
  LEFT JOIN public.cargos c ON f.cargo_id = c.id
  WHERE f.ponto_token = p_token
    AND f.status = 'ativo'
    AND (f.ponto_token_expires_at IS NULL OR f.ponto_token_expires_at > NOW());
END;
$$;

-- Create function to register ponto (public access)
CREATE OR REPLACE FUNCTION public.registrar_ponto_externo(
  p_token TEXT,
  p_tipo TEXT,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_funcionario_id UUID;
  v_hoje DATE := CURRENT_DATE;
  v_agora TIME := CURRENT_TIME;
  v_registro_id UUID;
  v_ponto_atual RECORD;
BEGIN
  -- Validate token and get funcionario
  SELECT id INTO v_funcionario_id
  FROM public.funcionarios
  WHERE ponto_token = p_token
    AND status = 'ativo'
    AND (ponto_token_expires_at IS NULL OR ponto_token_expires_at > NOW());
  
  IF v_funcionario_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido ou expirado');
  END IF;
  
  -- Get current day's ponto record
  SELECT * INTO v_ponto_atual
  FROM public.ponto_registros
  WHERE funcionario_id = v_funcionario_id AND data = v_hoje;
  
  -- Validate the action based on current state
  IF p_tipo = 'entrada' THEN
    IF v_ponto_atual.entrada IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Entrada já registrada hoje');
    END IF;
  ELSIF p_tipo = 'saida_almoco' THEN
    IF v_ponto_atual IS NULL OR v_ponto_atual.entrada IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Registre a entrada primeiro');
    END IF;
    IF v_ponto_atual.saida_almoco IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Intervalo já registrado hoje');
    END IF;
  ELSIF p_tipo = 'retorno_almoco' THEN
    IF v_ponto_atual IS NULL OR v_ponto_atual.saida_almoco IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Registre a saída para intervalo primeiro');
    END IF;
    IF v_ponto_atual.retorno_almoco IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Retorno já registrado hoje');
    END IF;
  ELSIF p_tipo = 'saida' THEN
    IF v_ponto_atual IS NULL OR v_ponto_atual.entrada IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Registre a entrada primeiro');
    END IF;
    IF v_ponto_atual.saida IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saída já registrada hoje');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de registro inválido');
  END IF;
  
  -- Insert or update ponto record
  IF v_ponto_atual IS NULL THEN
    INSERT INTO public.ponto_registros (funcionario_id, data, entrada, tipo_registro, ip_address, user_agent)
    VALUES (v_funcionario_id, v_hoje, v_agora, p_tipo, p_ip, p_user_agent)
    RETURNING id INTO v_registro_id;
  ELSE
    UPDATE public.ponto_registros
    SET 
      entrada = CASE WHEN p_tipo = 'entrada' THEN v_agora ELSE entrada END,
      saida_almoco = CASE WHEN p_tipo = 'saida_almoco' THEN v_agora ELSE saida_almoco END,
      retorno_almoco = CASE WHEN p_tipo = 'retorno_almoco' THEN v_agora ELSE retorno_almoco END,
      saida = CASE WHEN p_tipo = 'saida' THEN v_agora ELSE saida END,
      tipo_registro = p_tipo,
      ip_address = COALESCE(p_ip, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent),
      updated_at = NOW()
    WHERE funcionario_id = v_funcionario_id AND data = v_hoje
    RETURNING id INTO v_registro_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Ponto registrado com sucesso',
    'tipo', p_tipo,
    'hora', v_agora::TEXT,
    'registro_id', v_registro_id
  );
END;
$$;

-- Grant execute permission on public functions
GRANT EXECUTE ON FUNCTION public.validate_ponto_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.registrar_ponto_externo(TEXT, TEXT, TEXT, TEXT) TO anon;
