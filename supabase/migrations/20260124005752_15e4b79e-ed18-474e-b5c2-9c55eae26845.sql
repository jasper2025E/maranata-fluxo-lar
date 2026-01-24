
-- ============================================
-- MIGRAÇÃO: Suporte a Domínio Customizado
-- ============================================

-- 1. Função para buscar tenant pelo domínio customizado
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  slug TEXT,
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
    t.slug,
    t.logo_url,
    t.primary_color,
    t.secondary_color,
    t.status,
    t.blocked_at
  FROM public.tenants t
  WHERE LOWER(t.custom_domain) = LOWER(p_domain)
     OR LOWER(t.custom_domain) = LOWER('www.' || p_domain)
     OR LOWER('www.' || t.custom_domain) = LOWER(p_domain)
  LIMIT 1;
$$;

-- 2. Função combinada para buscar tenant por slug OU domínio
CREATE OR REPLACE FUNCTION public.get_tenant_by_identifier(p_identifier TEXT, p_type TEXT DEFAULT 'slug')
RETURNS TABLE(
  id UUID,
  nome TEXT,
  slug TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  status TEXT,
  blocked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_type = 'domain' THEN
    RETURN QUERY SELECT * FROM public.get_tenant_by_domain(p_identifier);
  ELSE
    RETURN QUERY SELECT 
      t.id,
      t.nome,
      t.slug,
      t.logo_url,
      t.primary_color,
      t.secondary_color,
      t.status,
      t.blocked_at
    FROM public.tenants t
    WHERE t.slug = p_identifier
    LIMIT 1;
  END IF;
END;
$$;

-- 3. Índice para busca case-insensitive por domínio
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain_lower 
ON public.tenants(LOWER(custom_domain));

-- 4. Adicionar campo para status de verificação do domínio
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ;
