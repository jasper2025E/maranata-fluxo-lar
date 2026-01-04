-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the function with proper extension
CREATE OR REPLACE FUNCTION public.generate_ponto_token(p_funcionario_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token using pgcrypto
  v_token := encode(pgcrypto.gen_random_bytes(32), 'hex');
  
  -- Update the funcionario with the new token (expires in 1 year)
  UPDATE public.funcionarios
  SET 
    ponto_token = v_token,
    ponto_token_expires_at = NOW() + INTERVAL '1 year'
  WHERE id = p_funcionario_id;
  
  RETURN v_token;
END;
$$;