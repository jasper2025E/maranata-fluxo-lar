-- Adicionar campos de personalização da landing page e login na tabela platform_settings
-- Usando JSON para armazenar configurações complexas

-- Inserir configurações de personalização visual
INSERT INTO public.platform_settings (key, value) VALUES
  ('landing_hero_title', '{"value": "Gerencie sua escola com simplicidade"}'::jsonb),
  ('landing_hero_subtitle', '{"value": "Plataforma completa para gestão escolar. Alunos, financeiro, RH e muito mais em um só lugar."}'::jsonb),
  ('landing_features', '{"value": [
    {"icon": "GraduationCap", "text": "Gestão completa de alunos e matrículas"},
    {"icon": "CreditCard", "text": "Financeiro integrado com múltiplos gateways"},
    {"icon": "Users", "text": "RH e controle de funcionários"},
    {"icon": "BarChart3", "text": "Relatórios e dashboards avançados"},
    {"icon": "Shield", "text": "Segurança e controle de acesso"},
    {"icon": "Zap", "text": "Automações e integrações"}
  ]}'::jsonb),
  ('landing_cta_primary', '{"value": "Entrar na Plataforma"}'::jsonb),
  ('landing_cta_secondary', '{"value": "Cadastre sua escola"}'::jsonb),
  ('login_title', '{"value": "Acesse sua conta"}'::jsonb),
  ('login_subtitle', '{"value": "Entre com seu email e senha para continuar"}'::jsonb),
  ('gradient_from', '{"value": "262 83% 58%"}'::jsonb),
  ('gradient_via', '{"value": "292 84% 61%"}'::jsonb),
  ('gradient_to', '{"value": "24 95% 53%"}'::jsonb),
  ('favicon_url', '{"value": null}'::jsonb),
  ('meta_title', '{"value": null}'::jsonb),
  ('meta_description', '{"value": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Criar tabela para mensagens dinâmicas na tela de login
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'promo')),
  link_url TEXT,
  link_text TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  show_on_login BOOLEAN NOT NULL DEFAULT true,
  show_on_landing BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
  ON public.platform_announcements
  FOR SELECT
  USING (active = true AND (ends_at IS NULL OR ends_at > now()));

-- Policy: Only platform admins can manage announcements
CREATE POLICY "Platform admins can manage announcements"
  ON public.platform_announcements
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_platform_announcements_updated_at
  BEFORE UPDATE ON public.platform_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();