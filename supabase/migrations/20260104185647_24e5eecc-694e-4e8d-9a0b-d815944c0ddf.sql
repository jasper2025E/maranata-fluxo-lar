
-- Create enum for employee type
CREATE TYPE public.funcionario_tipo AS ENUM ('professor', 'administrativo', 'outro');

-- Create enum for employee status
CREATE TYPE public.funcionario_status AS ENUM ('ativo', 'inativo', 'afastado', 'ferias');

-- Create enum for contract type
CREATE TYPE public.contrato_tipo AS ENUM ('clt', 'pj', 'temporario', 'estagio');

-- Create setores table
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cargos table
CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  setor_id UUID REFERENCES public.setores(id),
  salario_base NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create funcionarios table
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  data_nascimento DATE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cargo_id UUID REFERENCES public.cargos(id),
  tipo funcionario_tipo NOT NULL DEFAULT 'administrativo',
  status funcionario_status NOT NULL DEFAULT 'ativo',
  salario_base NUMERIC NOT NULL DEFAULT 0,
  data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_demissao DATE,
  foto_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create funcionario_documentos table
CREATE TABLE public.funcionario_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create funcionario_turmas table (link professors to classes)
CREATE TABLE public.funcionario_turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  materia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(funcionario_id, turma_id)
);

-- Create contratos table
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  tipo contrato_tipo NOT NULL DEFAULT 'clt',
  data_inicio DATE NOT NULL,
  data_fim DATE,
  salario NUMERIC NOT NULL,
  carga_horaria INTEGER DEFAULT 44,
  documento_url TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ponto_registros table
CREATE TABLE public.ponto_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  entrada TIME,
  saida_almoco TIME,
  retorno_almoco TIME,
  saida TIME,
  horas_trabalhadas INTERVAL,
  horas_extras INTERVAL,
  observacoes TEXT,
  editado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(funcionario_id, data)
);

-- Create folha_pagamento table
CREATE TABLE public.folha_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  salario_base NUMERIC NOT NULL,
  horas_extras_valor NUMERIC DEFAULT 0,
  bonificacoes NUMERIC DEFAULT 0,
  adicional_noturno NUMERIC DEFAULT 0,
  adicional_periculosidade NUMERIC DEFAULT 0,
  outros_adicionais NUMERIC DEFAULT 0,
  descontos NUMERIC DEFAULT 0,
  faltas_atrasos NUMERIC DEFAULT 0,
  inss NUMERIC DEFAULT 0,
  fgts NUMERIC DEFAULT 0,
  irrf NUMERIC DEFAULT 0,
  total_bruto NUMERIC NOT NULL,
  total_liquido NUMERIC NOT NULL,
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  despesa_id UUID REFERENCES public.despesas(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(funcionario_id, mes_referencia, ano_referencia)
);

-- Enable RLS on all tables
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

-- RLS Policies for setores
CREATE POLICY "Staff can view setores" ON public.setores FOR SELECT USING (true);
CREATE POLICY "Admin can manage setores" ON public.setores FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for cargos
CREATE POLICY "Staff can view cargos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Admin can manage cargos" ON public.cargos FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for funcionarios
CREATE POLICY "Staff can view funcionarios" ON public.funcionarios FOR SELECT USING (true);
CREATE POLICY "Admin can manage funcionarios" ON public.funcionarios FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for funcionario_documentos
CREATE POLICY "Staff can view funcionario_documentos" ON public.funcionario_documentos FOR SELECT USING (true);
CREATE POLICY "Admin can manage funcionario_documentos" ON public.funcionario_documentos FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for funcionario_turmas
CREATE POLICY "Staff can view funcionario_turmas" ON public.funcionario_turmas FOR SELECT USING (true);
CREATE POLICY "Admin can manage funcionario_turmas" ON public.funcionario_turmas FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for contratos
CREATE POLICY "Staff can view contratos" ON public.contratos FOR SELECT USING (true);
CREATE POLICY "Admin can manage contratos" ON public.contratos FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for ponto_registros
CREATE POLICY "Staff can view ponto_registros" ON public.ponto_registros FOR SELECT USING (true);
CREATE POLICY "Admin can manage ponto_registros" ON public.ponto_registros FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for folha_pagamento
CREATE POLICY "Staff can view folha_pagamento" ON public.folha_pagamento FOR SELECT USING (true);
CREATE POLICY "Admin can manage folha_pagamento" ON public.folha_pagamento FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_setores_updated_at BEFORE UPDATE ON public.setores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_registros_updated_at BEFORE UPDATE ON public.ponto_registros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_folha_pagamento_updated_at BEFORE UPDATE ON public.folha_pagamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public) VALUES ('rh-documentos', 'rh-documentos', false) ON CONFLICT DO NOTHING;

-- Storage policies for rh-documentos bucket
CREATE POLICY "Staff can view rh documents" ON storage.objects FOR SELECT USING (bucket_id = 'rh-documentos');
CREATE POLICY "Staff can upload rh documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rh-documentos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));
CREATE POLICY "Staff can update rh documents" ON storage.objects FOR UPDATE USING (bucket_id = 'rh-documentos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));
CREATE POLICY "Staff can delete rh documents" ON storage.objects FOR DELETE USING (bucket_id = 'rh-documentos' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));
