-- Correção: Drop de políticas existentes que podem estar duplicadas
DROP POLICY IF EXISTS "Staff can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Staff can view cursos" ON public.cursos;
DROP POLICY IF EXISTS "Staff can view turmas" ON public.turmas;
DROP POLICY IF EXISTS "Financial staff can view faturas" ON public.faturas;
DROP POLICY IF EXISTS "Financial staff can view pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Financial staff can view despesas" ON public.despesas;
DROP POLICY IF EXISTS "HR staff can view ponto_registros" ON public.ponto_registros;
DROP POLICY IF EXISTS "Financial staff can view fatura_itens" ON public.fatura_itens;
DROP POLICY IF EXISTS "Financial staff can view fatura_descontos" ON public.fatura_descontos;
DROP POLICY IF EXISTS "Financial staff can view fatura_documentos" ON public.fatura_documentos;

-- Recriar políticas RLS restritivas

-- ALUNOS
CREATE POLICY "Staff can view alunos"
ON public.alunos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'secretaria')
);

-- CURSOS
CREATE POLICY "Staff can view cursos"
ON public.cursos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'secretaria')
);

-- TURMAS
CREATE POLICY "Staff can view turmas"
ON public.turmas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'secretaria')
);

-- FATURAS
CREATE POLICY "Financial staff can view faturas"
ON public.faturas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- PAGAMENTOS
CREATE POLICY "Financial staff can view pagamentos"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- DESPESAS
CREATE POLICY "Financial staff can view despesas"
ON public.despesas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- PONTO_REGISTROS
CREATE POLICY "HR staff can view ponto_registros"
ON public.ponto_registros
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- FATURA_ITENS
CREATE POLICY "Financial staff can view fatura_itens"
ON public.fatura_itens
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- FATURA_DESCONTOS
CREATE POLICY "Financial staff can view fatura_descontos"
ON public.fatura_descontos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- FATURA_DOCUMENTOS
CREATE POLICY "Financial staff can view fatura_documentos"
ON public.fatura_documentos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'financeiro')
);