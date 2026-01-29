-- Fix: Set security_invoker on school_website_public_safe view
ALTER VIEW public.school_website_public_safe SET (security_invoker = on);

-- Also update school_website_config_public to exclude sensitive SEO data
DROP VIEW IF EXISTS public.school_website_config_public;

CREATE VIEW public.school_website_config_public 
WITH (security_invoker = on)
AS
SELECT 
  swc.id,
  swc.tenant_id,
  t.nome AS school_name,
  t.logo_url,
  t.primary_color,
  t.secondary_color,
  t.telefone,
  t.email,
  t.endereco
  -- REMOVED: seo_title, seo_description, og_image_url (sensitive marketing data)
FROM school_website_config swc
JOIN tenants t ON t.id = swc.tenant_id
WHERE swc.enabled = true;

GRANT SELECT ON public.school_website_config_public TO anon;
GRANT SELECT ON public.school_website_config_public TO authenticated;

COMMENT ON VIEW public.school_website_config_public IS 'Public school website info - excludes SEO metadata';