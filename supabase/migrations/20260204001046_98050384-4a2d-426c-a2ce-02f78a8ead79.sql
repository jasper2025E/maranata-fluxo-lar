-- Garantir que a view escola_public_branding tenha acesso público para login
-- Primeiro, vamos recriar a view com security_invoker=off para permitir acesso anônimo

DROP VIEW IF EXISTS public.escola_public_branding;

CREATE VIEW public.escola_public_branding AS
SELECT nome, logo_url
FROM public.escola
LIMIT 1;

-- Garantir acesso público à view
GRANT SELECT ON public.escola_public_branding TO anon;
GRANT SELECT ON public.escola_public_branding TO authenticated;