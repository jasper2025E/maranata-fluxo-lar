-- Create subscription_plans table for dynamic plan management
CREATE TABLE public.subscription_plans (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- Price in cents (e.g., 9900 = R$ 99,00)
  features TEXT[] NOT NULL DEFAULT '{}',
  limite_alunos INTEGER,
  limite_usuarios INTEGER DEFAULT 5,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  color TEXT DEFAULT 'from-gray-500 to-gray-600',
  icon TEXT DEFAULT 'Zap',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active plans (public)
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (active = true);

-- Platform admins can manage all plans
CREATE POLICY "Platform admins can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (is_platform_admin(auth.uid()));

-- Insert default plans
INSERT INTO public.subscription_plans (id, name, price, features, limite_alunos, limite_usuarios, popular, display_order, color, icon) VALUES
(
  'basic',
  'Básico',
  9900,
  ARRAY['Até 50 alunos', 'Gestão de faturas', 'Relatórios básicos', 'Suporte por email'],
  50,
  3,
  false,
  1,
  'from-gray-500 to-gray-600',
  'Zap'
),
(
  'pro',
  'Profissional',
  19900,
  ARRAY['Até 200 alunos', 'Integração Asaas/PIX', 'Relatórios avançados', 'Suporte prioritário', 'Gestão de RH'],
  200,
  10,
  true,
  2,
  'from-primary to-primary/80',
  'Sparkles'
),
(
  'enterprise',
  'Enterprise',
  49900,
  ARRAY['Alunos ilimitados', 'Todas as integrações', 'API personalizada', 'Suporte dedicado 24/7', 'Treinamento incluso'],
  NULL,
  NULL,
  false,
  3,
  'from-violet-500 to-purple-600',
  'Crown'
);

-- Create trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();