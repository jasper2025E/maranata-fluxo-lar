-- ============================================
-- REESTRUTURAÇÃO: DOMÍNIOS DE AUTENTICAÇÃO SEPARADOS
-- ============================================

-- 1. Criar tabela de gestores do sistema (platform managers)
CREATE TABLE IF NOT EXISTS public.system_managers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de usuários de escola (school users)
CREATE TABLE IF NOT EXISTS public.school_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'financeiro', 'secretaria', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, tenant_id)
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_school_users_tenant ON public.school_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_school_users_email ON public.school_users(email);
CREATE INDEX IF NOT EXISTS idx_school_users_role ON public.school_users(role);
CREATE INDEX IF NOT EXISTS idx_system_managers_email ON public.system_managers(email);

-- 4. Habilitar RLS
ALTER TABLE public.system_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

-- 5. Funções auxiliares para verificação de domínio

-- Verifica se usuário é um gestor do sistema
CREATE OR REPLACE FUNCTION public.is_system_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_managers
    WHERE id = _user_id AND is_active = true
  )
$$;

-- Verifica se usuário é de uma escola
CREATE OR REPLACE FUNCTION public.is_school_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_users
    WHERE id = _user_id AND is_active = true
  )
$$;

-- Retorna o tenant_id do usuário de escola
CREATE OR REPLACE FUNCTION public.get_school_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id FROM public.school_users WHERE id = auth.uid() AND is_active = true
$$;

-- Retorna o papel do usuário de escola
CREATE OR REPLACE FUNCTION public.get_school_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.school_users WHERE id = _user_id AND is_active = true
$$;

-- 6. RLS Policies para system_managers

-- Gestores só veem a si mesmos (ou outros gestores podem ver todos - decidir depois)
CREATE POLICY "Gestores podem ver seu próprio perfil"
ON public.system_managers
FOR SELECT
TO authenticated
USING (id = auth.uid() OR is_system_manager(auth.uid()));

CREATE POLICY "Gestores podem atualizar seu próprio perfil"
ON public.system_managers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 7. RLS Policies para school_users

-- Usuários de escola só veem usuários do mesmo tenant
CREATE POLICY "Usuários veem colegas do mesmo tenant"
ON public.school_users
FOR SELECT
TO authenticated
USING (
  (tenant_id = get_school_user_tenant_id()) 
  OR is_system_manager(auth.uid())
);

-- Admin da escola pode inserir novos usuários
CREATE POLICY "Admin da escola pode criar usuários"
ON public.school_users
FOR INSERT
TO authenticated
WITH CHECK (
  (tenant_id = get_school_user_tenant_id() AND get_school_user_role(auth.uid()) = 'admin')
  OR is_system_manager(auth.uid())
);

-- Admin da escola pode atualizar usuários do tenant
CREATE POLICY "Admin da escola pode atualizar usuários"
ON public.school_users
FOR UPDATE
TO authenticated
USING (
  (tenant_id = get_school_user_tenant_id() AND get_school_user_role(auth.uid()) = 'admin')
  OR is_system_manager(auth.uid())
)
WITH CHECK (
  (tenant_id = get_school_user_tenant_id() AND get_school_user_role(auth.uid()) = 'admin')
  OR is_system_manager(auth.uid())
);

-- Admin da escola pode deletar usuários do tenant
CREATE POLICY "Admin da escola pode deletar usuários"
ON public.school_users
FOR DELETE
TO authenticated
USING (
  (tenant_id = get_school_user_tenant_id() AND get_school_user_role(auth.uid()) = 'admin')
  OR is_system_manager(auth.uid())
);

-- 8. Triggers para updated_at

CREATE TRIGGER update_system_managers_updated_at
BEFORE UPDATE ON public.system_managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_users_updated_at
BEFORE UPDATE ON public.school_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Migrar dados existentes

-- Migrar platform_admin existentes para system_managers
INSERT INTO public.system_managers (id, nome, email, avatar_url, created_at)
SELECT 
  p.id,
  p.nome,
  p.email,
  p.avatar_url,
  p.created_at
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'platform_admin'
ON CONFLICT (id) DO NOTHING;

-- Migrar usuários de escola existentes para school_users
INSERT INTO public.school_users (id, tenant_id, nome, email, avatar_url, role, created_at)
SELECT 
  p.id,
  p.tenant_id,
  p.nome,
  p.email,
  p.avatar_url,
  ur.role::TEXT,
  p.created_at
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role != 'platform_admin' AND p.tenant_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 10. Tabela de logs de autenticação separados por domínio
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('platform', 'school')),
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_login', 'password_reset')),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON public.auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_domain ON public.auth_logs(domain);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON public.auth_logs(created_at DESC);

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Gestores veem todos os logs, usuários de escola veem logs do seu tenant
CREATE POLICY "Acesso a logs de autenticação"
ON public.auth_logs
FOR SELECT
TO authenticated
USING (
  is_system_manager(auth.uid())
  OR (
    domain = 'school' 
    AND user_id IN (SELECT id FROM school_users WHERE tenant_id = get_school_user_tenant_id())
  )
);