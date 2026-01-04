-- Use gen_random_uuid and substring for token generation instead
CREATE OR REPLACE FUNCTION public.generate_ponto_token(p_funcionario_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a token using multiple UUIDs concatenated
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  
  -- Update the funcionario with the new token (expires in 1 year)
  UPDATE public.funcionarios
  SET 
    ponto_token = v_token,
    ponto_token_expires_at = NOW() + INTERVAL '1 year'
  WHERE id = p_funcionario_id;
  
  RETURN v_token;
END;
$$;