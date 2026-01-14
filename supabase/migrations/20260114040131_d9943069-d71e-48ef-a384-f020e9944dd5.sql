-- Fix PUBLIC_DATA_EXPOSURE: Restrict responsaveis table to authenticated staff only
-- This table contains sensitive parent/guardian data (names, emails, phones, CPF)

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Staff can view responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "All users can view responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Public can view responsaveis" ON public.responsaveis;

-- Create proper restrictive policy for SELECT
CREATE POLICY "Authenticated staff can view responsaveis" 
ON public.responsaveis 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role) OR
  public.has_role(auth.uid(), 'financeiro'::app_role) OR
  public.has_role(auth.uid(), 'secretaria'::app_role)
);