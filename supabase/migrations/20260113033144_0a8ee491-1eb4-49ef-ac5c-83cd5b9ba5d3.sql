-- Fix PUBLIC_DATA_EXPOSURE: Restrict HR tables to admin/staff roles only
-- These tables contain sensitive employee data (CPF, salaries, contracts, payroll)

-- Fix contratos table - contains employment contracts and salary details
DROP POLICY IF EXISTS "Staff can view contratos" ON public.contratos;
CREATE POLICY "Admin and Staff can view contratos" 
ON public.contratos 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role)
);

-- Fix folha_pagamento table - contains payroll calculations, INSS, FGTS, IRRF
DROP POLICY IF EXISTS "Staff can view folha_pagamento" ON public.folha_pagamento;
CREATE POLICY "Admin Staff and Financeiro can view folha_pagamento" 
ON public.folha_pagamento 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role) OR
  public.has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix cargos table - contains position titles and base salaries
DROP POLICY IF EXISTS "Staff can view cargos" ON public.cargos;
CREATE POLICY "Admin and Staff can view cargos" 
ON public.cargos 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role)
);

-- Fix funcionario_documentos table - links to HR document URLs
DROP POLICY IF EXISTS "Staff can view funcionario_documentos" ON public.funcionario_documentos;
CREATE POLICY "Admin and Staff can view funcionario_documentos" 
ON public.funcionario_documentos 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role)
);

-- Fix setores table - department information (lower sensitivity but still restrict)
DROP POLICY IF EXISTS "Staff can view setores" ON public.setores;
CREATE POLICY "Admin and Staff can view setores" 
ON public.setores 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role)
);

-- Fix funcionario_turmas table - teacher-class assignments
DROP POLICY IF EXISTS "Staff can view funcionario_turmas" ON public.funcionario_turmas;
CREATE POLICY "Admin and Staff can view funcionario_turmas" 
ON public.funcionario_turmas 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role)
);