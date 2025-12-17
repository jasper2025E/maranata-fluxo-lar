-- Tabela de configuração da escola
CREATE TABLE public.escola (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  logo_url text,
  ano_letivo integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  endereco text,
  telefone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.escola ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage escola" ON public.escola
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela de turmas
CREATE TABLE public.turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  serie text NOT NULL,
  turno text NOT NULL DEFAULT 'Manhã',
  ano_letivo integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage turmas" ON public.turmas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Criar enum para status do aluno
CREATE TYPE public.aluno_status AS ENUM ('ativo', 'trancado', 'cancelado', 'transferido');

-- Adicionar campos aos alunos
ALTER TABLE public.alunos 
  ADD COLUMN turma_id uuid REFERENCES public.turmas(id),
  ADD COLUMN desconto_percentual numeric DEFAULT 0,
  ADD COLUMN status_matricula aluno_status DEFAULT 'ativo',
  DROP COLUMN ativo;

-- Adicionar campos para integração Asaas nos pagamentos
ALTER TABLE public.pagamentos
  ADD COLUMN gateway text,
  ADD COLUMN gateway_id text,
  ADD COLUMN gateway_status text,
  ADD COLUMN comprovante_url text;

-- Adicionar campos de multa/juros nas faturas
ALTER TABLE public.faturas
  ADD COLUMN multa numeric DEFAULT 0,
  ADD COLUMN juros numeric DEFAULT 0,
  ADD COLUMN valor_total numeric GENERATED ALWAYS AS (valor + multa + juros) STORED;

-- Tabela de logs de ações (auditoria)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  acao text NOT NULL,
  tabela text NOT NULL,
  registro_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at na escola
CREATE TRIGGER update_escola_updated_at
  BEFORE UPDATE ON public.escola
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar roles financeiro e secretaria
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';

-- Storage bucket para logo
INSERT INTO storage.buckets (id, name, public) VALUES ('escola-assets', 'escola-assets', true);

CREATE POLICY "Anyone can view escola assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'escola-assets');

CREATE POLICY "Admins can upload escola assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'escola-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update escola assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'escola-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete escola assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'escola-assets' AND public.has_role(auth.uid(), 'admin'));