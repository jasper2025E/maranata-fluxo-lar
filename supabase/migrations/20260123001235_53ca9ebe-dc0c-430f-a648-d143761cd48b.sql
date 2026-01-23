-- Create tenants table first
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  logo_url TEXT,
  plano TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  data_contrato DATE DEFAULT CURRENT_DATE,
  limite_alunos INTEGER DEFAULT 100,
  limite_usuarios INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  )
$$;

-- RLS Policy for tenants
CREATE POLICY "Platform admins can do everything on tenants"
  ON public.tenants
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();