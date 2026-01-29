-- Corrigir view para usar security_invoker
DROP VIEW IF EXISTS school_website_config_public;
CREATE VIEW school_website_config_public 
WITH (security_invoker = on)
AS
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

-- Corrigir função com search_path
CREATE OR REPLACE FUNCTION update_website_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;