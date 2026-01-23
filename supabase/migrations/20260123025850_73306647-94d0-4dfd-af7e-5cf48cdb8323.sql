-- =============================================
-- CORREÇÃO DE ISOLAMENTO MULTI-TENANT
-- =============================================

-- 1. Adicionar política de isolamento na tabela escola
CREATE POLICY "escola_tenant_isolation" 
ON public.escola 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- 2. Corrigir política de profiles para respeitar isolamento de tenant
-- Primeiro, remover as políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recriar com isolamento por tenant
CREATE POLICY "Admins can view tenant profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = id) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id()) OR
  is_platform_admin(auth.uid())
);

CREATE POLICY "Admins can update tenant profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  (auth.uid() = id) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id()) OR
  is_platform_admin(auth.uid())
);

-- 3. Remover política duplicada de tenants
DROP POLICY IF EXISTS "tenants_platform_admin_all" ON public.tenants;

-- 4. Adicionar política para admins de escola atualizarem seu próprio tenant
CREATE POLICY "tenants_own_update" 
ON public.tenants 
FOR UPDATE 
USING (
  (id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'::app_role)) OR
  is_platform_admin(auth.uid())
);

-- 5. Garantir que políticas de alunos/faturas tenham WITH CHECK correto
-- Atualizar alunos_tenant_isolation para incluir WITH CHECK
DROP POLICY IF EXISTS "alunos_tenant_isolation" ON public.alunos;
CREATE POLICY "alunos_tenant_isolation" 
ON public.alunos 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Atualizar faturas_tenant_isolation para incluir WITH CHECK
DROP POLICY IF EXISTS "faturas_tenant_isolation" ON public.faturas;
CREATE POLICY "faturas_tenant_isolation" 
ON public.faturas 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- 6. Garantir isolamento na tabela cursos
DROP POLICY IF EXISTS "cursos_tenant_isolation" ON public.cursos;
CREATE POLICY "cursos_tenant_isolation" 
ON public.cursos 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- 7. Garantir isolamento na tabela responsaveis
DROP POLICY IF EXISTS "responsaveis_tenant_isolation" ON public.responsaveis;
CREATE POLICY "responsaveis_tenant_isolation" 
ON public.responsaveis 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- 8. Garantir isolamento na tabela funcionarios
DROP POLICY IF EXISTS "funcionarios_tenant_isolation" ON public.funcionarios;
CREATE POLICY "funcionarios_tenant_isolation" 
ON public.funcionarios 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- 9. Garantir isolamento na tabela pagamentos
DROP POLICY IF EXISTS "pagamentos_tenant_isolation" ON public.pagamentos;
CREATE POLICY "pagamentos_tenant_isolation" 
ON public.pagamentos 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- 10. Garantir isolamento na tabela despesas
DROP POLICY IF EXISTS "despesas_tenant_isolation" ON public.despesas;
CREATE POLICY "despesas_tenant_isolation" 
ON public.despesas 
FOR ALL 
USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()))
WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));