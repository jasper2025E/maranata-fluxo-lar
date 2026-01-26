-- =====================================================
-- MÓDULO GESTOR - ESTRUTURA COMPLETA (v2)
-- =====================================================

-- 1. Adicionar colunas faltantes em platform_announcements
ALTER TABLE public.platform_announcements 
ADD COLUMN IF NOT EXISTS show_banner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS target_plans text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_status text[] DEFAULT '{}';

-- 2. TABELA: Leitura de Comunicados
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.platform_announcements(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  read_by uuid REFERENCES auth.users(id),
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, tenant_id)
);

-- 3. TABELA: Roadmap / Feature Requests
CREATE TABLE IF NOT EXISTS public.platform_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'feature',
  status text NOT NULL DEFAULT 'backlog',
  priority text DEFAULT 'medium',
  estimated_release date,
  released_at timestamptz,
  votes_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  release_notes text,
  created_by uuid REFERENCES public.system_managers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. TABELA: Votos no Roadmap
CREATE TABLE IF NOT EXISTS public.roadmap_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid REFERENCES public.platform_roadmap(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(roadmap_id, tenant_id)
);

-- 5. TABELA: Changelog / Release Notes
CREATE TABLE IF NOT EXISTS public.platform_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'feature',
  is_major boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.system_managers(id),
  created_at timestamptz DEFAULT now()
);

-- 6. TABELA: Backups Agendados
CREATE TABLE IF NOT EXISTS public.platform_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  backup_type text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'pending',
  file_url text,
  file_size_bytes bigint,
  tables_included text[] DEFAULT '{}',
  error_message text,
  requested_by uuid REFERENCES public.system_managers(id),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. TABELA: Logs de Ações do Gestor
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES public.system_managers(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 8. ENUM: Níveis de permissão do Gestor
DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM (
    'super_admin',
    'admin_financeiro',
    'suporte',
    'read_only'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 9. Adicionar coluna de role em system_managers
ALTER TABLE public.system_managers 
ADD COLUMN IF NOT EXISTS platform_role text DEFAULT 'read_only',
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS phone text;

-- 10. Enable RLS
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies
DROP POLICY IF EXISTS "system_managers_roadmap" ON public.platform_roadmap;
CREATE POLICY "system_managers_roadmap" ON public.platform_roadmap
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()) OR is_system_manager(auth.uid()));

DROP POLICY IF EXISTS "system_managers_changelog" ON public.platform_changelog;
CREATE POLICY "system_managers_changelog" ON public.platform_changelog
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()) OR is_system_manager(auth.uid()));

DROP POLICY IF EXISTS "system_managers_backups" ON public.platform_backups;
CREATE POLICY "system_managers_backups" ON public.platform_backups
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()) OR is_system_manager(auth.uid()));

DROP POLICY IF EXISTS "system_managers_audit" ON public.platform_audit_logs;
CREATE POLICY "system_managers_audit" ON public.platform_audit_logs
  FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()) OR is_system_manager(auth.uid()));

DROP POLICY IF EXISTS "tenants_view_roadmap" ON public.platform_roadmap;
CREATE POLICY "tenants_view_roadmap" ON public.platform_roadmap
  FOR SELECT TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "tenants_vote_roadmap" ON public.roadmap_votes;
CREATE POLICY "tenants_vote_roadmap" ON public.roadmap_votes
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tenants_view_changelog" ON public.platform_changelog;
CREATE POLICY "tenants_view_changelog" ON public.platform_changelog
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "tenants_mark_read" ON public.announcement_reads;
CREATE POLICY "tenants_mark_read" ON public.announcement_reads
  FOR ALL TO authenticated
  USING (read_by = auth.uid());

-- 12. Function: Registrar ação do gestor
CREATE OR REPLACE FUNCTION public.log_manager_action(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.platform_audit_logs (
    manager_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 13. Function: Verificar permissão do gestor
CREATE OR REPLACE FUNCTION public.manager_has_permission(p_manager_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_managers sm
    WHERE sm.id = p_manager_id
    AND sm.is_active = true
    AND (
      sm.platform_role = 'super_admin'
      OR (sm.platform_role = 'admin_financeiro' AND p_permission IN ('view_tenants', 'view_subscriptions', 'manage_subscriptions', 'view_analytics'))
      OR (sm.platform_role = 'suporte' AND p_permission IN ('view_tenants', 'view_subscriptions', 'manage_announcements', 'view_roadmap', 'manage_roadmap'))
      OR (sm.platform_role = 'read_only' AND p_permission LIKE 'view_%')
    )
  )
$$;

-- 14. Trigger: Atualizar contador de votos
CREATE OR REPLACE FUNCTION update_roadmap_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE platform_roadmap SET votes_count = votes_count + 1 WHERE id = NEW.roadmap_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE platform_roadmap SET votes_count = votes_count - 1 WHERE id = OLD.roadmap_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_votes_count ON public.roadmap_votes;
CREATE TRIGGER trg_update_votes_count
  AFTER INSERT OR DELETE ON public.roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION update_roadmap_votes_count();

-- 15. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.platform_announcements(active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_roadmap_status ON public.platform_roadmap(status, is_public);
CREATE INDEX IF NOT EXISTS idx_backups_tenant ON public.platform_backups(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_manager ON public.platform_audit_logs(manager_id, created_at DESC);