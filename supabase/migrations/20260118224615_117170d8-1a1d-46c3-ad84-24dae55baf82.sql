-- ===========================================
-- CORREÇÃO FINAL: REMOVER POLÍTICAS COM "condition: true"
-- ===========================================

-- PAGAMENTOS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Financial staff can view pagamentos" ON public.pagamentos;

CREATE POLICY "Financial staff can view pagamentos"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- DESPESAS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view despesas" ON public.despesas;
DROP POLICY IF EXISTS "Financial staff can view despesas" ON public.despesas;

CREATE POLICY "Financial staff can view despesas"
ON public.despesas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- PONTO_REGISTROS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view ponto_registros" ON public.ponto_registros;
DROP POLICY IF EXISTS "HR staff can view ponto_registros" ON public.ponto_registros;

CREATE POLICY "HR staff can view ponto_registros"
ON public.ponto_registros
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- FATURAS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view faturas" ON public.faturas;
DROP POLICY IF EXISTS "Financial staff can view faturas" ON public.faturas;

CREATE POLICY "Financial staff can view faturas"
ON public.faturas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro') OR
  public.has_role(auth.uid(), 'secretaria')
);

-- FATURA_ITENS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view fatura_itens" ON public.fatura_itens;
DROP POLICY IF EXISTS "Financial staff can view fatura_itens" ON public.fatura_itens;

CREATE POLICY "Financial staff can view fatura_itens"
ON public.fatura_itens
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- FATURA_DESCONTOS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view fatura_descontos" ON public.fatura_descontos;
DROP POLICY IF EXISTS "Financial staff can view fatura_descontos" ON public.fatura_descontos;

CREATE POLICY "Financial staff can view fatura_descontos"
ON public.fatura_descontos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- FATURA_DOCUMENTOS: Remover política permissiva antiga
DROP POLICY IF EXISTS "Staff can view fatura_documentos" ON public.fatura_documentos;
DROP POLICY IF EXISTS "Financial staff can view fatura_documentos" ON public.fatura_documentos;

CREATE POLICY "Financial staff can view fatura_documentos"
ON public.fatura_documentos
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'financeiro')
);

-- NOTIFICATIONS: Garantir que não há acesso público
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public can view notifications" ON public.notifications;

-- Apenas usuários autenticados veem suas próprias notificações
CREATE POLICY "Users view own notifications only"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins veem todas
CREATE POLICY "Admins view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Staff também pode ver notificações do sistema (user_id IS NULL)
CREATE POLICY "Staff view system notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_id IS NULL AND (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff') OR 
    public.has_role(auth.uid(), 'secretaria') OR
    public.has_role(auth.uid(), 'financeiro')
  )
);