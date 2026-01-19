-- Proteger audit_logs: apenas triggers/sistema podem inserir
-- Revogar INSERT de usuários autenticados
DROP POLICY IF EXISTS "Admin can insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System only can insert audit_logs" ON public.audit_logs;

-- Criar política que impede INSERT por usuários normais (somente service role via triggers)
-- A tabela audit_logs só deve receber dados de triggers
CREATE POLICY "No direct INSERT - triggers only"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Manter SELECT apenas para admin
DROP POLICY IF EXISTS "Admin can view audit_logs" ON public.audit_logs;
CREATE POLICY "Admin can view audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Impedir UPDATE e DELETE
DROP POLICY IF EXISTS "No updates on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No deletes on audit_logs" ON public.audit_logs;

CREATE POLICY "No updates on audit_logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No deletes on audit_logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (false);