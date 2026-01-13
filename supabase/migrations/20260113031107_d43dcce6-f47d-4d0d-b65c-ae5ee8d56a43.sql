-- Fix PUBLIC_DATA_EXPOSURE: Restrict funcionarios table access to admin and staff only
-- This fixes the security issue where all authenticated users could view sensitive employee data (CPF, RG, salary, addresses)

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Staff can view funcionarios" ON public.funcionarios;

-- Create proper role-based access policy for reading employee data
-- Only admins and staff (HR) should have access to view all employee records
CREATE POLICY "Admin and Staff can view funcionarios" 
ON public.funcionarios 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Also ensure INSERT, UPDATE, DELETE policies are properly restricted (they should already be, but let's be safe)
DROP POLICY IF EXISTS "Staff can insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Staff can update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Staff can delete funcionarios" ON public.funcionarios;

CREATE POLICY "Admin and Staff can insert funcionarios" 
ON public.funcionarios 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Admin and Staff can update funcionarios" 
ON public.funcionarios 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Admin and Staff can delete funcionarios" 
ON public.funcionarios 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);