
-- Fix escola_public_branding view to use security_invoker
-- Drop and recreate with security_invoker = on
DROP VIEW IF EXISTS public.escola_public_branding;

CREATE VIEW public.escola_public_branding 
WITH (security_invoker = on)
AS
SELECT 
  e.nome,
  e.logo_url
FROM public.escola e
ORDER BY 
  CASE WHEN e.logo_url IS NOT NULL THEN 0 ELSE 1 END,
  e.created_at DESC
LIMIT 1;

-- Grant SELECT to anon and authenticated roles for public branding access
GRANT SELECT ON public.escola_public_branding TO anon, authenticated;

-- Consolidate platform_settings policies - remove duplicate public policies
DROP POLICY IF EXISTS "Anyone can read platform branding settings" ON public.platform_settings;

-- The "Public can read whitelisted platform settings" policy already covers the necessary keys
-- So we just need to ensure it's the only public policy
