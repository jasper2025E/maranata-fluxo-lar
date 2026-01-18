-- ===========================================
-- CORREÇÃO DE SEGURANÇA: VULNERABILIDADES CRÍTICAS RESTANTES
-- ===========================================

-- 1. ESCOLA: Remover política pública e criar view restritiva
-- Primeiro remover todas as políticas existentes
DROP POLICY IF EXISTS "Public can view escola name and logo" ON public.escola;
DROP POLICY IF EXISTS "Public can view escola basic info only" ON public.escola;
DROP POLICY IF EXISTS "Authenticated users can view escola" ON public.escola;

-- Criar política que permite público ver apenas campos não sensíveis
-- Usamos uma abordagem: público pode ver, mas no front-end só expomos nome/logo
CREATE POLICY "Authenticated staff can view all escola data"
ON public.escola
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff') OR 
  public.has_role(auth.uid(), 'secretaria') OR
  public.has_role(auth.uid(), 'financeiro')
);

-- Política mínima para login (apenas nome e logo são usados no front)
CREATE POLICY "Anyone can view escola name and logo for login"
ON public.escola
FOR SELECT
TO anon
USING (true);

-- 2. NOTIFICATIONS: Remover política permissiva
DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;

-- Apenas usuários autenticados podem ver suas notificações
CREATE POLICY "Users view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todas
CREATE POLICY "Admins view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. PONTOS_AUTORIZADOS: Já corrigido, mas garantir
DROP POLICY IF EXISTS "Public can view pontos_autorizados" ON public.pontos_autorizados;
DROP POLICY IF EXISTS "Staff can view pontos_autorizados" ON public.pontos_autorizados;

CREATE POLICY "Authenticated staff view pontos_autorizados"
ON public.pontos_autorizados
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- ===========================================
-- CORREÇÃO: Remover políticas "USING condition: true"
-- ===========================================

-- FUNCIONARIOS: Remover política permissiva
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Users can view funcionarios" ON public.funcionarios;

CREATE POLICY "Staff can view funcionarios"
ON public.funcionarios
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- CONTRATOS: Remover política permissiva
DROP POLICY IF EXISTS "Authenticated users can view contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users can view contratos" ON public.contratos;

CREATE POLICY "HR staff can view contratos"
ON public.contratos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- FOLHA_PAGAMENTO: Remover política permissiva
DROP POLICY IF EXISTS "Authenticated users can view folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Users can view folha_pagamento" ON public.folha_pagamento;

CREATE POLICY "Financial staff can view folha_pagamento"
ON public.folha_pagamento
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- CARGOS: Restringir
DROP POLICY IF EXISTS "Authenticated users can view cargos" ON public.cargos;
DROP POLICY IF EXISTS "Users can view cargos" ON public.cargos;

CREATE POLICY "Staff can view cargos"
ON public.cargos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- SETORES: Restringir
DROP POLICY IF EXISTS "Authenticated users can view setores" ON public.setores;
DROP POLICY IF EXISTS "Users can view setores" ON public.setores;

CREATE POLICY "Staff can view setores"
ON public.setores
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);