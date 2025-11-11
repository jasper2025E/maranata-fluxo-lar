-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Administrador'),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create courses table
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nivel TEXT NOT NULL,
  mensalidade DECIMAL(10,2) NOT NULL,
  duracao_meses INTEGER NOT NULL DEFAULT 12,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courses"
  ON public.cursos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage courses"
  ON public.cursos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default courses
INSERT INTO public.cursos (nome, nivel, mensalidade, duracao_meses) VALUES
  ('Reforço Escolar - Educação Infantil e Fundamental I', 'Infantil e Fundamental I', 160.00, 12),
  ('Reforço Escolar - Fundamental II', 'Fundamental II', 180.00, 12);

-- Create students table
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT NOT NULL,
  telefone_responsavel TEXT NOT NULL,
  email_responsavel TEXT NOT NULL,
  endereco TEXT NOT NULL,
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view students"
  ON public.alunos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage students"
  ON public.alunos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create invoices table
CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberta' CHECK (status IN ('Aberta', 'Paga', 'Vencida', 'Cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices"
  ON public.faturas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage invoices"
  ON public.faturas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create payments table
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID REFERENCES public.faturas(id) ON DELETE CASCADE NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  valor DECIMAL(10,2) NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('PIX', 'Cartão', 'Dinheiro')),
  referencia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
  ON public.pagamentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payments"
  ON public.pagamentos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create expenses table
CREATE TABLE public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Fixa', 'Variável', 'Única')),
  data_vencimento DATE NOT NULL,
  paga BOOLEAN DEFAULT FALSE,
  data_pagamento DATE,
  observacoes TEXT,
  recorrente BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON public.despesas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage expenses"
  ON public.despesas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faturas_updated_at
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despesas_updated_at
  BEFORE UPDATE ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoices for a student
CREATE OR REPLACE FUNCTION public.gerar_faturas_aluno(
  p_aluno_id UUID,
  p_curso_id UUID,
  p_valor DECIMAL,
  p_data_inicio DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_mes INTEGER;
  v_ano INTEGER;
  v_data_vencimento DATE;
BEGIN
  FOR i IN 0..11 LOOP
    v_data_vencimento := p_data_inicio + (i || ' months')::INTERVAL;
    v_data_vencimento := DATE_TRUNC('month', v_data_vencimento) + INTERVAL '9 days'; -- day 10
    v_mes := EXTRACT(MONTH FROM v_data_vencimento);
    v_ano := EXTRACT(YEAR FROM v_data_vencimento);
    
    INSERT INTO public.faturas (
      aluno_id,
      curso_id,
      valor,
      mes_referencia,
      ano_referencia,
      data_emissao,
      data_vencimento,
      status
    ) VALUES (
      p_aluno_id,
      p_curso_id,
      p_valor,
      v_mes,
      v_ano,
      CURRENT_DATE,
      v_data_vencimento,
      'Aberta'
    );
  END LOOP;
END;
$$;

-- Function to update invoice status based on due date
CREATE OR REPLACE FUNCTION public.atualizar_status_faturas()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.faturas
  SET status = 'Vencida'
  WHERE status = 'Aberta'
    AND data_vencimento < CURRENT_DATE;
END;
$$;