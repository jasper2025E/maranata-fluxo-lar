-- Drop the old function first (with old signature)
DROP FUNCTION IF EXISTS public.registrar_ponto_externo(text, text, text, text);

-- Recreate with new signature including geolocation
CREATE OR REPLACE FUNCTION public.registrar_ponto_externo(
  p_token TEXT,
  p_tipo TEXT,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_accuracy DOUBLE PRECISION DEFAULT NULL
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
  v_validacao RECORD;
BEGIN
  -- Validate token and get funcionario
  SELECT id INTO v_funcionario_id
  FROM funcionarios
  WHERE ponto_token = p_token
    AND status = 'ativo'
    AND (ponto_token_expires_at IS NULL OR ponto_token_expires_at > NOW());
  
  IF v_funcionario_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido ou expirado');
  END IF;

  -- Validate geolocation is provided
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Localização não informada. Ative o GPS do seu dispositivo.');
  END IF;

  -- Validate location against authorized points
  SELECT * INTO v_validacao FROM validar_localizacao(p_latitude, p_longitude);
  
  IF NOT v_validacao.valido THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Você está fora da área autorizada para registro de ponto.',
      'distancia', round(v_validacao.distancia_metros::numeric, 0)
    );
  END IF;
  
  -- Get current day's ponto record
  SELECT * INTO v_ponto_atual
  FROM ponto_registros
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
  
  -- Insert or update ponto record with geolocation
  IF v_ponto_atual IS NULL THEN
    INSERT INTO ponto_registros (
      funcionario_id, data, entrada, tipo_registro, 
      ip_address, user_agent, latitude, longitude, accuracy, localizacao_valida
    )
    VALUES (
      v_funcionario_id, v_hoje, v_agora, p_tipo,
      p_ip, p_user_agent, p_latitude, p_longitude, p_accuracy, true
    )
    RETURNING id INTO v_registro_id;
  ELSE
    UPDATE ponto_registros
    SET 
      entrada = CASE WHEN p_tipo = 'entrada' THEN v_agora ELSE entrada END,
      saida_almoco = CASE WHEN p_tipo = 'saida_almoco' THEN v_agora ELSE saida_almoco END,
      retorno_almoco = CASE WHEN p_tipo = 'retorno_almoco' THEN v_agora ELSE retorno_almoco END,
      saida = CASE WHEN p_tipo = 'saida' THEN v_agora ELSE saida END,
      tipo_registro = p_tipo,
      ip_address = COALESCE(p_ip, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent),
      latitude = p_latitude,
      longitude = p_longitude,
      accuracy = p_accuracy,
      localizacao_valida = true,
      updated_at = NOW()
    WHERE funcionario_id = v_funcionario_id AND data = v_hoje
    RETURNING id INTO v_registro_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Ponto registrado com sucesso',
    'tipo', p_tipo,
    'hora', v_agora::TEXT,
    'registro_id', v_registro_id,
    'local', v_validacao.ponto_nome
  );
END;
$$;

-- Grant execute to anon for public access
GRANT EXECUTE ON FUNCTION public.registrar_ponto_externo(TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;