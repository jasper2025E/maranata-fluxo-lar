-- ============================================
-- LIMPEZA FINAL: Remover todas as políticas duplicadas restantes
-- ============================================

-- AUDIT_LOGS - Remover políticas antigas (manter apenas a consolidada)
DROP POLICY IF EXISTS "Admin can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "No deletes on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "No direct INSERT - triggers only" ON audit_logs;
DROP POLICY IF EXISTS "No updates on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON audit_logs;

-- PROFILES - Remover políticas antigas (manter apenas a consolidada)
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- SCHOOL_USERS - Remover políticas antigas (manter apenas a consolidada)
DROP POLICY IF EXISTS "Admin da escola pode atualizar usuários" ON school_users;
DROP POLICY IF EXISTS "Admin da escola pode criar usuários" ON school_users;
DROP POLICY IF EXISTS "Admin da escola pode deletar usuários" ON school_users;
DROP POLICY IF EXISTS "Usuários veem colegas do mesmo tenant" ON school_users;

-- TENANT_GATEWAY_CONFIGS - Remover política duplicada
DROP POLICY IF EXISTS "tenant_gateway_configs_admin_manage" ON tenant_gateway_configs;

-- TENANT_PAYMENT_METHODS - Remover políticas duplicadas
DROP POLICY IF EXISTS "Platform admins can view all payment methods" ON tenant_payment_methods;
DROP POLICY IF EXISTS "Tenant admins can manage own payment methods" ON tenant_payment_methods;
DROP POLICY IF EXISTS "Tenant admins can view own payment methods" ON tenant_payment_methods;