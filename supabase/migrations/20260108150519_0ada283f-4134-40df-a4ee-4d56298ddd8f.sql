
-- Enum para tipos de pixel
CREATE TYPE public.pixel_type AS ENUM ('meta', 'google_ads', 'google_analytics', 'tiktok', 'custom');

-- Enum para status de páginas
CREATE TYPE public.landing_page_status AS ENUM ('draft', 'published', 'archived');

-- Enum para status de domínios
CREATE TYPE public.domain_status AS ENUM ('pending', 'active', 'error');

-- Tabela de domínios
CREATE TABLE public.marketing_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dominio TEXT NOT NULL UNIQUE,
  status domain_status NOT NULL DEFAULT 'pending',
  ssl_ativo BOOLEAN DEFAULT false,
  verificado BOOLEAN DEFAULT false,
  verificacao_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notas TEXT
);

-- Tabela de pixels
CREATE TABLE public.marketing_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo pixel_type NOT NULL,
  pixel_id TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  configuracao JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de landing pages
CREATE TABLE public.marketing_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  domain_id UUID REFERENCES public.marketing_domains(id),
  status landing_page_status NOT NULL DEFAULT 'draft',
  conteudo JSONB DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  versao INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Relação entre páginas e pixels
CREATE TABLE public.marketing_page_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.marketing_landing_pages(id) ON DELETE CASCADE,
  pixel_id UUID NOT NULL REFERENCES public.marketing_pixels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, pixel_id)
);

-- Eventos de pixels
CREATE TABLE public.marketing_pixel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id UUID NOT NULL REFERENCES public.marketing_pixels(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'custom',
  parametros JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Acessos às páginas (page views)
CREATE TABLE public.marketing_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.marketing_landing_pages(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversões
CREATE TABLE public.marketing_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.marketing_landing_pages(id) ON DELETE CASCADE,
  pixel_id UUID REFERENCES public.marketing_pixels(id),
  event_name TEXT NOT NULL,
  visitor_id TEXT,
  valor NUMERIC,
  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configurações globais de marketing
CREATE TABLE public.marketing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL DEFAULT '{}',
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Histórico de alterações das páginas
CREATE TABLE public.marketing_page_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.marketing_landing_pages(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  conteudo_anterior JSONB,
  conteudo_novo JSONB,
  acao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Logs de auditoria do marketing
CREATE TABLE public.marketing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.marketing_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_page_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_pixel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_page_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para marketing_domains
CREATE POLICY "Admin can manage marketing_domains" ON public.marketing_domains
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active domains" ON public.marketing_domains
  FOR SELECT USING (status = 'active' AND verificado = true);

-- RLS Policies para marketing_pixels
CREATE POLICY "Admin can manage marketing_pixels" ON public.marketing_pixels
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view marketing_pixels" ON public.marketing_pixels
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies para marketing_landing_pages
CREATE POLICY "Admin can manage marketing_landing_pages" ON public.marketing_landing_pages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view published pages" ON public.marketing_landing_pages
  FOR SELECT USING (status = 'published');

-- RLS Policies para marketing_page_pixels
CREATE POLICY "Admin can manage marketing_page_pixels" ON public.marketing_page_pixels
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view page_pixels" ON public.marketing_page_pixels
  FOR SELECT USING (true);

-- RLS Policies para marketing_pixel_events
CREATE POLICY "Admin can manage marketing_pixel_events" ON public.marketing_pixel_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view pixel_events" ON public.marketing_pixel_events
  FOR SELECT USING (ativo = true);

-- RLS Policies para marketing_page_views
CREATE POLICY "Admin can view marketing_page_views" ON public.marketing_page_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert page_views" ON public.marketing_page_views
  FOR INSERT WITH CHECK (true);

-- RLS Policies para marketing_conversions
CREATE POLICY "Admin can view marketing_conversions" ON public.marketing_conversions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert conversions" ON public.marketing_conversions
  FOR INSERT WITH CHECK (true);

-- RLS Policies para marketing_config
CREATE POLICY "Admin can manage marketing_config" ON public.marketing_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para marketing_page_history
CREATE POLICY "Admin can view marketing_page_history" ON public.marketing_page_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can insert marketing_page_history" ON public.marketing_page_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para marketing_audit_logs
CREATE POLICY "Admin can view marketing_audit_logs" ON public.marketing_audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit_logs" ON public.marketing_audit_logs
  FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_marketing_domains_updated_at
  BEFORE UPDATE ON public.marketing_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_pixels_updated_at
  BEFORE UPDATE ON public.marketing_pixels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_landing_pages_updated_at
  BEFORE UPDATE ON public.marketing_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_config_updated_at
  BEFORE UPDATE ON public.marketing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_marketing_page_views_page_id ON public.marketing_page_views(page_id);
CREATE INDEX idx_marketing_page_views_created_at ON public.marketing_page_views(created_at);
CREATE INDEX idx_marketing_conversions_page_id ON public.marketing_conversions(page_id);
CREATE INDEX idx_marketing_conversions_created_at ON public.marketing_conversions(created_at);
CREATE INDEX idx_marketing_landing_pages_status ON public.marketing_landing_pages(status);
CREATE INDEX idx_marketing_landing_pages_slug ON public.marketing_landing_pages(slug);

-- Inserir configurações padrão
INSERT INTO public.marketing_config (chave, valor, descricao) VALUES
  ('default_pixels', '[]', 'Pixels padrão para novas páginas'),
  ('default_domain', '{}', 'Domínio padrão do sistema'),
  ('utm_params', '{"source": "", "medium": "", "campaign": ""}', 'Parâmetros UTM padrão'),
  ('auto_events', '{"page_view": true, "scroll": false, "click": false}', 'Eventos automáticos');
