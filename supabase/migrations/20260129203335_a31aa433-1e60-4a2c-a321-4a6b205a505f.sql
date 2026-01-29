-- =====================================================
-- SECURITY FIX #1: Remove public read access to escola table
-- Replace with secure view that only exposes branding fields
-- =====================================================

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "escola_public_branding_read" ON public.escola;

-- Create a secure public view with ONLY safe branding fields
DROP VIEW IF EXISTS public.escola_public_branding;

CREATE VIEW public.escola_public_branding 
WITH (security_invoker = on)
AS
SELECT 
  nome,
  logo_url,
  tenant_id
  -- EXCLUDED: email, telefone, endereco, cnpj, ano_letivo,
  -- juros_percentual_diario_padrao, juros_percentual_mensal_padrao,
  -- multa_fixa_padrao, multa_percentual_padrao, 
  -- desconto_pontualidade_percentual, dias_desconto_pontualidade, dias_carencia_juros
FROM public.escola;

-- Grant public read access to the safe view only
GRANT SELECT ON public.escola_public_branding TO anon;
GRANT SELECT ON public.escola_public_branding TO authenticated;

COMMENT ON VIEW public.escola_public_branding IS 'Public-safe view of school data. Only exposes branding (name, logo). Excludes contact info, CNPJ, and financial settings.';

-- Update the get_escola_public_info function to use the new safe columns
CREATE OR REPLACE FUNCTION public.get_escola_public_info()
RETURNS TABLE(nome text, logo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.nome, e.logo_url 
  FROM public.escola e
  ORDER BY 
    CASE WHEN e.logo_url IS NOT NULL THEN 0 ELSE 1 END,
    e.created_at DESC
  LIMIT 1;
$$;

-- =====================================================
-- SECURITY FIX #2: Restrict storage.objects SELECT policy for rh-documentos
-- Only allow staff with proper role to view files
-- =====================================================

-- Drop the overly permissive view policy
DROP POLICY IF EXISTS "Staff can view rh documents" ON storage.objects;

-- Create a properly restrictive SELECT policy 
CREATE POLICY "Staff can view rh documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rh-documentos'
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'staff'::app_role)
  )
);

-- Also ensure INSERT policy has proper WITH CHECK
DROP POLICY IF EXISTS "Staff can upload rh documents" ON storage.objects;

CREATE POLICY "Staff can upload rh documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rh-documentos'
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'staff'::app_role)
  )
);