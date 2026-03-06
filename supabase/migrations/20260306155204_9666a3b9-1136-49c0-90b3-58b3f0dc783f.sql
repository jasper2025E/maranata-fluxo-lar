
-- 1. Tabela de disciplinas
CREATE TABLE public.disciplinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for disciplinas" ON public.disciplinas
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER set_tenant_id_disciplinas BEFORE INSERT ON public.disciplinas
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela de notas
CREATE TABLE public.notas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  nota NUMERIC(5,2) NOT NULL CHECK (nota >= 0 AND nota <= 100),
  peso NUMERIC(3,2) DEFAULT 1.0,
  tipo TEXT NOT NULL DEFAULT 'prova',
  descricao TEXT,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  bimestre INTEGER CHECK (bimestre BETWEEN 1 AND 4),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for notas" ON public.notas
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER set_tenant_id_notas BEFORE INSERT ON public.notas
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON public.notas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tabela de frequência
CREATE TABLE public.frequencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  presente BOOLEAN NOT NULL DEFAULT true,
  justificativa TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aluno_id, disciplina_id, data)
);

ALTER TABLE public.frequencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for frequencia" ON public.frequencia
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER set_tenant_id_frequencia BEFORE INSERT ON public.frequencia
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

-- 4. Tabela de avaliações de desempenho
CREATE TABLE public.avaliacoes_desempenho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  avaliador_nome TEXT NOT NULL,
  periodo TEXT NOT NULL,
  nota_geral NUMERIC(3,1) CHECK (nota_geral >= 0 AND nota_geral <= 10),
  pontos_fortes TEXT,
  pontos_melhoria TEXT,
  observacoes TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.avaliacoes_desempenho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for avaliacoes_desempenho" ON public.avaliacoes_desempenho
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER set_tenant_id_avaliacoes BEFORE INSERT ON public.avaliacoes_desempenho
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes_desempenho
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Tabela de atividades extracurriculares
CREATE TABLE public.atividades_extracurriculares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'ativa',
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.atividades_extracurriculares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for atividades" ON public.atividades_extracurriculares
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER set_tenant_id_atividades BEFORE INSERT ON public.atividades_extracurriculares
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

CREATE TRIGGER update_atividades_updated_at BEFORE UPDATE ON public.atividades_extracurriculares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Tabela de feedback de professores
CREATE TABLE public.feedback_professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  professor_nome TEXT NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  comentario TEXT NOT NULL,
  tipo TEXT DEFAULT 'geral',
  data_feedback DATE NOT NULL DEFAULT CURRENT_DATE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback_professores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for feedback" ON public.feedback_professores
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER set_tenant_id_feedback BEFORE INSERT ON public.feedback_professores
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();
