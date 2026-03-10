
-- Create receitas table mirroring despesas structure
CREATE TABLE public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_recebimento TEXT NOT NULL,
  recebida BOOLEAN DEFAULT false,
  data_confirmacao TEXT,
  recorrente BOOLEAN DEFAULT false,
  origem TEXT,
  observacoes TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own tenant receitas"
  ON public.receitas FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant receitas"
  ON public.receitas FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant receitas"
  ON public.receitas FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant receitas"
  ON public.receitas FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Auto-set tenant_id on insert
CREATE TRIGGER set_receitas_tenant_id
  BEFORE INSERT ON public.receitas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_on_insert();

-- Auto-update updated_at
CREATE TRIGGER update_receitas_updated_at
  BEFORE UPDATE ON public.receitas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
