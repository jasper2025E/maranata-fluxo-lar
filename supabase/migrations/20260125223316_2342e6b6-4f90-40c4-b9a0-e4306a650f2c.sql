-- ============================================
-- CORREÇÃO CRÍTICA: Remover políticas antigas sem isolamento de tenant
-- e consolidar em políticas únicas com verificação correta
-- ============================================

-- ============================================
-- 1. PONTOS_AUTORIZADOS - Remover política sem tenant_id
-- ============================================
DROP POLICY IF EXISTS "Authenticated staff view pontos_autorizados" ON pontos_autorizados;

-- ============================================
-- 2. NOTIFICATIONS - Remover TODAS as políticas antigas
-- ============================================
DROP POLICY IF EXISTS "Admin view all notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated staff view system notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_tenant_isolation" ON notifications;

-- Criar política consolidada para notifications
CREATE POLICY "notifications_tenant_isolation" ON notifications FOR ALL
USING (
  -- Notificações do próprio usuário
  (user_id = auth.uid())
  -- OU notificações do tenant (sistema) para usuários autorizados
  OR (
    tenant_id = get_user_tenant_id() 
    AND user_id IS NULL 
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'staff') OR 
      has_role(auth.uid(), 'secretaria') OR 
      has_role(auth.uid(), 'financeiro')
    )
  )
  -- OU platform admin tem acesso global
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (user_id = auth.uid())
  OR (
    tenant_id = get_user_tenant_id() 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  )
  OR is_platform_admin(auth.uid())
);

-- ============================================
-- 3. IMPOSTOS_ESTIMADOS - Consolidar políticas
-- ============================================
DROP POLICY IF EXISTS "Insert impostos with tenant" ON impostos_estimados;
DROP POLICY IF EXISTS "Tenant isolation for impostos_estimados" ON impostos_estimados;

CREATE POLICY "impostos_tenant_isolation" ON impostos_estimados FOR ALL
USING (
  (
    tenant_id = get_user_tenant_id() 
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'financeiro')
    )
  )
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (
    tenant_id = get_user_tenant_id() 
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'financeiro')
    )
  )
  OR is_platform_admin(auth.uid())
);

-- ============================================
-- 4. AUDIT_LOGS - Consolidar todas as políticas
-- ============================================
DROP POLICY IF EXISTS "Admin view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated staff view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Platform admin view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Staff can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON audit_logs;

CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs FOR ALL
USING (
  (
    tenant_id = get_user_tenant_id() 
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'financeiro')
    )
  )
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id() 
  OR is_platform_admin(auth.uid())
);

-- ============================================
-- 5. TENANT_GATEWAY_CONFIGS - Consolidar políticas
-- ============================================
DROP POLICY IF EXISTS "Admins can manage gateway configs" ON tenant_gateway_configs;
DROP POLICY IF EXISTS "tenant_gateway_configs_tenant_isolation" ON tenant_gateway_configs;

CREATE POLICY "gateway_configs_tenant_isolation" ON tenant_gateway_configs FOR ALL
USING (
  (
    tenant_id = get_user_tenant_id() 
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'financeiro')
    )
  )
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (
    tenant_id = get_user_tenant_id() 
    AND has_role(auth.uid(), 'admin')
  )
  OR is_platform_admin(auth.uid())
);

-- ============================================
-- 6. TENANT_PAYMENT_METHODS - Consolidar políticas
-- ============================================
DROP POLICY IF EXISTS "Admins can manage payment methods" ON tenant_payment_methods;
DROP POLICY IF EXISTS "Users view own tenant payment methods" ON tenant_payment_methods;
DROP POLICY IF EXISTS "tenant_payment_methods_tenant_isolation" ON tenant_payment_methods;

CREATE POLICY "payment_methods_tenant_isolation" ON tenant_payment_methods FOR ALL
USING (
  (
    tenant_id = get_user_tenant_id() 
    AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'financeiro')
    )
  )
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (
    tenant_id = get_user_tenant_id() 
    AND has_role(auth.uid(), 'admin')
  )
  OR is_platform_admin(auth.uid())
);

-- ============================================
-- 7. SCHOOL_USERS - Consolidar políticas
-- ============================================
DROP POLICY IF EXISTS "Admins manage school users" ON school_users;
DROP POLICY IF EXISTS "Platform admin full access" ON school_users;
DROP POLICY IF EXISTS "Users view own school user" ON school_users;
DROP POLICY IF EXISTS "school_users_tenant_isolation" ON school_users;

CREATE POLICY "school_users_tenant_isolation" ON school_users FOR ALL
USING (
  -- Usuário pode ver seu próprio registro
  (id = auth.uid())
  -- OU admin do tenant pode ver todos do tenant
  OR (
    tenant_id = get_user_tenant_id() 
    AND has_role(auth.uid(), 'admin')
  )
  -- OU platform admin tem acesso global
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (
    tenant_id = get_user_tenant_id() 
    AND has_role(auth.uid(), 'admin')
  )
  OR is_platform_admin(auth.uid())
);

-- ============================================
-- 8. PROFILES - Verificar e consolidar
-- ============================================
DROP POLICY IF EXISTS "Admin view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users update own profile" ON profiles;
DROP POLICY IF EXISTS "Platform admin view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;

CREATE POLICY "profiles_tenant_isolation" ON profiles FOR ALL
USING (
  -- Usuário pode ver seu próprio perfil
  (id = auth.uid())
  -- OU admin do tenant pode ver todos os perfis do tenant
  OR (
    tenant_id = get_user_tenant_id() 
    AND has_role(auth.uid(), 'admin')
  )
  -- OU platform admin tem acesso global
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  -- Usuário pode atualizar seu próprio perfil
  (id = auth.uid())
  -- OU admin do tenant pode atualizar perfis do tenant
  OR (
    tenant_id = get_user_tenant_id() 
    AND has_role(auth.uid(), 'admin')
  )
  -- OU platform admin
  OR is_platform_admin(auth.uid())
);