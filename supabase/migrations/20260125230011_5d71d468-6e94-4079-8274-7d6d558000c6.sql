-- Tabela para configurações do site escolar (funcionalidade Enterprise)
CREATE TABLE public.school_website_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Status e URLs
  enabled BOOLEAN NOT NULL DEFAULT false,
  slug VARCHAR(100) UNIQUE,
  custom_domain VARCHAR(255),
  
  -- Configurações do Hero
  hero_title VARCHAR(200),
  hero_subtitle TEXT,
  hero_cta_primary VARCHAR(100) DEFAULT 'Inscrever Aluno',
  hero_cta_secondary VARCHAR(100) DEFAULT 'Ver Cursos',
  hero_background_url TEXT,
  hero_badge_text VARCHAR(100) DEFAULT 'Matrículas Abertas 2025',
  
  -- Sobre a escola
  about_title VARCHAR(200) DEFAULT 'Sobre Nossa Instituição',
  about_description TEXT,
  about_features JSONB DEFAULT '[]'::jsonb,
  
  -- Diferenciais
  differentials JSONB DEFAULT '[]'::jsonb,
  
  -- Estrutura/Galeria
  gallery_images JSONB DEFAULT '[]'::jsonb,
  
  -- Como funciona
  steps JSONB DEFAULT '[]'::jsonb,
  
  -- Depoimentos
  testimonials JSONB DEFAULT '[]'::jsonb,
  
  -- Contato
  contact_title VARCHAR(200) DEFAULT 'Entre em Contato',
  contact_subtitle TEXT,
  whatsapp_number VARCHAR(20),
  show_map BOOLEAN DEFAULT false,
  map_embed_url TEXT,
  
  -- Formulário de pré-matrícula
  prematricula_enabled BOOLEAN DEFAULT true,
  prematricula_title VARCHAR(200) DEFAULT 'Inscreva-se Agora',
  prematricula_subtitle TEXT,
  prematricula_fields JSONB DEFAULT '["nome", "email", "telefone", "curso"]'::jsonb,
  
  -- SEO
  seo_title VARCHAR(70),
  seo_description VARCHAR(160),
  seo_keywords TEXT,
  og_image_url TEXT,
  
  -- Cores e estilo
  primary_color VARCHAR(50) DEFAULT '217 91% 60%',
  secondary_color VARCHAR(50) DEFAULT '142 76% 36%',
  accent_color VARCHAR(50) DEFAULT '45 93% 47%',
  font_family VARCHAR(100) DEFAULT 'Inter',
  
  -- Redes sociais
  social_links JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  facebook_pixel_id VARCHAR(50),
  google_analytics_id VARCHAR(50),
  google_tag_manager_id VARCHAR(50),
  
  -- Footer
  footer_text TEXT,
  show_powered_by BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_tenant_website UNIQUE (tenant_id)
);

-- Habilitar RLS
ALTER TABLE public.school_website_config ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (site público)
CREATE POLICY "Public websites are readable by everyone"
ON public.school_website_config
FOR SELECT
USING (enabled = true);

-- Política para admins do tenant (usando school_users)
CREATE POLICY "Admins can manage their school website"
ON public.school_website_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.school_users su
    WHERE su.id = auth.uid()
    AND su.tenant_id = school_website_config.tenant_id
    AND su.role IN ('owner', 'admin')
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_school_website_config_updated_at
BEFORE UPDATE ON public.school_website_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para busca
CREATE INDEX idx_school_website_slug ON public.school_website_config(slug) WHERE enabled = true;
CREATE INDEX idx_school_website_tenant ON public.school_website_config(tenant_id);

-- Comentários
COMMENT ON TABLE public.school_website_config IS 'Configurações do site escolar (funcionalidade Enterprise)';
COMMENT ON COLUMN public.school_website_config.slug IS 'URL amigável do site (ex: escola-maranata)';
COMMENT ON COLUMN public.school_website_config.custom_domain IS 'Domínio personalizado (ex: www.escolamaranata.com.br)';