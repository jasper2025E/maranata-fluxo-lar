-- CORREÇÃO FINAL: Escola - restringir acesso público
DROP POLICY IF EXISTS "Anyone can view escola name and logo for login" ON public.escola;

-- Criar view pública apenas com nome e logo (via função security definer)
CREATE OR REPLACE FUNCTION public.get_escola_public_info()
RETURNS TABLE(nome text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nome, logo_url FROM public.escola LIMIT 1;
$$;

-- Conceder acesso público à função
GRANT EXECUTE ON FUNCTION public.get_escola_public_info() TO anon;
GRANT EXECUTE ON FUNCTION public.get_escola_public_info() TO authenticated;