-- Drop e recria a função com o novo retorno
DROP FUNCTION IF EXISTS get_tenant_by_slug(text);

-- 1. Função pública para buscar tenant por slug (sem autenticação)
CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  nome text,
  slug text,
  logo_url text,
  primary_color text,
  secondary_color text,
  status text,
  blocked_at timestamptz,
  telefone text,
  email text,
  endereco text
) 
LANGUAGE sql
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
    t.blocked_at,
    t.telefone,
    t.email,
    t.endereco
  FROM tenants t
  WHERE t.slug = p_slug
  AND t.status = 'ativo'
  LIMIT 1;
$$;

-- 2. Tabela de configuração do site público (novo)
CREATE TABLE IF NOT EXISTS school_website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Página Inicial',
  slug text NOT NULL DEFAULT 'home',
  is_homepage boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- 3. Tabela de blocos do site
CREATE TABLE IF NOT EXISTS school_website_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES school_website_pages(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  block_type text NOT NULL,
  block_order int NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. View pública para acesso ao site
DROP VIEW IF EXISTS school_website_config_public;
CREATE VIEW school_website_config_public AS
SELECT 
  swc.id,
  swc.tenant_id,
  swc.seo_title,
  swc.seo_description,
  swc.og_image_url,
  t.nome as school_name,
  t.logo_url,
  t.primary_color,
  t.secondary_color,
  t.telefone,
  t.email,
  t.endereco
FROM school_website_config swc
JOIN tenants t ON t.id = swc.tenant_id
WHERE swc.enabled = true;

-- 5. RLS para school_website_pages
ALTER TABLE school_website_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public pages are readable" ON school_website_pages;
CREATE POLICY "Public pages are readable" ON school_website_pages
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage pages" ON school_website_pages;
CREATE POLICY "Admins can manage pages" ON school_website_pages
  FOR ALL USING (
    tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid())
  );

-- 6. RLS para school_website_blocks
ALTER TABLE school_website_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public blocks are readable" ON school_website_blocks;
CREATE POLICY "Public blocks are readable" ON school_website_blocks
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can manage blocks" ON school_website_blocks;
CREATE POLICY "Admins can manage blocks" ON school_website_blocks
  FOR ALL USING (
    tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid())
  );

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_website_pages_tenant ON school_website_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_slug ON school_website_pages(slug);
CREATE INDEX IF NOT EXISTS idx_website_blocks_page ON school_website_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_website_blocks_order ON school_website_blocks(page_id, block_order);

-- 8. Triggers
DROP TRIGGER IF EXISTS update_website_pages_timestamp ON school_website_pages;
DROP TRIGGER IF EXISTS update_website_blocks_timestamp ON school_website_blocks;

CREATE OR REPLACE FUNCTION update_website_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_pages_timestamp
  BEFORE UPDATE ON school_website_pages
  FOR EACH ROW EXECUTE FUNCTION update_website_timestamp();

CREATE TRIGGER update_website_blocks_timestamp
  BEFORE UPDATE ON school_website_blocks
  FOR EACH ROW EXECUTE FUNCTION update_website_timestamp();