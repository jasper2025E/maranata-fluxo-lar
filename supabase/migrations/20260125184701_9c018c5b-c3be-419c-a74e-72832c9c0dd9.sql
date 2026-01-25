-- Update function to return escola with logo preferentially, or most recent
CREATE OR REPLACE FUNCTION public.get_escola_public_info()
RETURNS TABLE(nome text, logo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.nome, e.logo_url 
  FROM public.escola e
  ORDER BY 
    CASE WHEN e.logo_url IS NOT NULL THEN 0 ELSE 1 END,
    e.created_at DESC
  LIMIT 1;
$$;