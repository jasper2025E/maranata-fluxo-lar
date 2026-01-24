
-- ============================================
-- MIGRAÇÃO: SaaS Multi-tenant Profissional
-- Branding dinâmico + Slug de acesso
-- ============================================

-- 1. Adicionar campos de branding e slug ao tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#7C3AED',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#EC4899',
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- 2. Criar índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);

-- 3. Gerar slugs para tenants existentes (baseado no nome)
UPDATE public.tenants 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(nome, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 4)
WHERE slug IS NULL;

-- 4. Função para buscar tenant pelo slug (pública, sem auth)
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(p_slug TEXT)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  status TEXT,
  blocked_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.nome,
    t.logo_url,
    t.primary_color,
    t.secondary_color,
    t.status,
    t.blocked_at
  FROM public.tenants t
  WHERE t.slug = p_slug
  LIMIT 1;
$$;

-- 5. Função para validar usuário escola no tenant específico
CREATE OR REPLACE FUNCTION public.validate_school_user_for_tenant(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.school_users su
    WHERE su.id = p_user_id 
      AND su.tenant_id = p_tenant_id
      AND su.is_active = true
  )
$$;

-- 6. Atualizar função get_escola_public_info para incluir tenant_id
CREATE OR REPLACE FUNCTION public.get_escola_public_info_by_tenant(p_tenant_id UUID)
RETURNS TABLE(nome TEXT, logo_url TEXT, primary_color TEXT, secondary_color TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.nome, 
    t.logo_url,
    t.primary_color,
    t.secondary_color
  FROM public.tenants t
  WHERE t.id = p_tenant_id
  LIMIT 1;
$$;

-- 7. Índice adicional para performance em school_users
CREATE INDEX IF NOT EXISTS idx_school_users_tenant_active 
ON public.school_users(tenant_id, is_active) 
WHERE is_active = true;

-- 8. Garantir NOT NULL no slug para novos tenants (trigger)
CREATE OR REPLACE FUNCTION public.ensure_tenant_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.nome, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ensure_tenant_slug ON public.tenants;
CREATE TRIGGER trigger_ensure_tenant_slug
BEFORE INSERT OR UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.ensure_tenant_slug();
