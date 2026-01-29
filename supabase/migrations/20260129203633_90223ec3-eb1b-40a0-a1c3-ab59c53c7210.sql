-- =====================================================
-- FIX: Allow public read access through the escola_public_branding view
-- The view uses security_invoker, so the base table needs a SELECT policy
-- But we only want to expose specific columns via the view
-- =====================================================

-- Option: Create a permissive SELECT policy for the escola table
-- Since the view already restricts what columns are visible, 
-- this policy allows read but the view hides sensitive data

-- Drop the view first to recreate it without security_invoker
DROP VIEW IF EXISTS public.escola_public_branding;

-- Create the view WITHOUT security_invoker so it can access data directly
-- This is safe because the view itself limits which columns are exposed
CREATE VIEW public.escola_public_branding AS
SELECT 
  nome,
  logo_url,
  tenant_id
FROM public.escola;

-- Grant public read access to the safe view
GRANT SELECT ON public.escola_public_branding TO anon;
GRANT SELECT ON public.escola_public_branding TO authenticated;

COMMENT ON VIEW public.escola_public_branding IS 'Public-safe view of school data. Only exposes branding (name, logo). Excludes contact info, CNPJ, and financial settings. Does NOT use security_invoker to allow public access.';