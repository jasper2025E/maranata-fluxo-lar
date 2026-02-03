-- =====================================================
-- SECURITY HARDENING - FASE 2B: Corrigindo políticas restantes
-- =====================================================

-- 1. ESCOLA_PUBLIC_BRANDING - Restringir via GRANT
REVOKE ALL ON public.escola_public_branding FROM anon;
GRANT SELECT ON public.escola_public_branding TO authenticated, anon;

-- 2. SCHOOL_WEBSITE_PUBLIC_MINIMAL - Forçar uso da função RPC
REVOKE ALL ON public.school_website_public_minimal FROM anon;
GRANT SELECT ON public.school_website_public_minimal TO authenticated;

-- 3. SUBSCRIPTION_PLANS - View pública (política já existe)
CREATE OR REPLACE VIEW public.subscription_plans_public AS
SELECT 
  id,
  name,
  price,
  features,
  limite_alunos,
  limite_usuarios,
  popular,
  color,
  icon,
  active
FROM public.subscription_plans
WHERE active = true
ORDER BY display_order;

GRANT SELECT ON public.subscription_plans_public TO anon, authenticated;

-- 4. PLATFORM_SETTINGS - View pública de branding
CREATE OR REPLACE VIEW public.platform_branding_public AS
SELECT 
  key,
  value
FROM public.platform_settings
WHERE key IN (
  'gradient_start',
  'gradient_end',
  'hero_title',
  'hero_subtitle',
  'login_title',
  'login_subtitle'
);

GRANT SELECT ON public.platform_branding_public TO anon, authenticated;

-- 5. SCHOOL_WEBSITE_CONFIG - Políticas restritivas (usar IF NOT EXISTS via DO block)
DO $$
BEGIN
  -- Drop existing policy if exists
  DROP POLICY IF EXISTS "Tenant admins can manage website config" ON public.school_website_config;
  
  -- Check and create policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_website_config' AND policyname = 'Tenant users can view website config') THEN
    CREATE POLICY "Tenant users can view website config" 
    ON public.school_website_config 
    FOR SELECT 
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_website_config' AND policyname = 'Tenant admins can update website config') THEN
    CREATE POLICY "Tenant admins can update website config" 
    ON public.school_website_config 
    FOR UPDATE 
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id())
    WITH CHECK (tenant_id = public.get_user_tenant_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'school_website_config' AND policyname = 'Tenant admins can insert website config') THEN
    CREATE POLICY "Tenant admins can insert website config" 
    ON public.school_website_config 
    FOR INSERT 
    TO authenticated
    WITH CHECK (tenant_id = public.get_user_tenant_id());
  END IF;
END $$;

-- 6. Função segura para contato público
CREATE OR REPLACE FUNCTION public.get_public_website_contact(p_slug text)
RETURNS TABLE (
  whatsapp_formatted text,
  show_map boolean,
  map_url text,
  social_links jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN swc.whatsapp_number IS NOT NULL AND length(swc.whatsapp_number) >= 10
      THEN '55' || regexp_replace(swc.whatsapp_number, '[^0-9]', '', 'g')
      ELSE NULL
    END as whatsapp_formatted,
    swc.show_map,
    swc.map_embed_url as map_url,
    swc.social_links
  FROM school_website_config swc
  WHERE swc.slug = p_slug
    AND swc.enabled = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_website_contact TO anon, authenticated;

-- 7. Security invoker nas views
ALTER VIEW public.subscription_plans_public SET (security_invoker = on);
ALTER VIEW public.platform_branding_public SET (security_invoker = on);