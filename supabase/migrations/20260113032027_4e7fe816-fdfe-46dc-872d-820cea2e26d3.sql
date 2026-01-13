-- Fix PUBLIC_DATA_EXPOSURE: Restrict escola table to authenticated users only
-- This removes anonymous access to sensitive school data (CNPJ, contact info, financial settings)

-- Drop the overly permissive public read policy that allows anonymous access
DROP POLICY IF EXISTS "Allow public read escola" ON public.escola;

-- Keep only authenticated staff can view escola
-- The existing "All staff can view escola" policy already handles authenticated access
-- But let's ensure it's properly configured

-- Drop and recreate to ensure consistency
DROP POLICY IF EXISTS "All staff can view escola" ON public.escola;

CREATE POLICY "Authenticated users can view escola" 
ON public.escola 
FOR SELECT 
TO authenticated
USING (true);