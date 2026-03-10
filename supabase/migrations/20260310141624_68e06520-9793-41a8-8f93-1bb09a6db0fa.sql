
-- Add photo_url column to alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Create aluno_documentos table for document management
CREATE TABLE IF NOT EXISTS public.aluno_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'outro',
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  observacoes TEXT,
  uploaded_by UUID,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create aluno_habilidades table for skills and interests
CREATE TABLE IF NOT EXISTS public.aluno_habilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'habilidade',
  nome TEXT NOT NULL,
  nivel TEXT,
  observacoes TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create aluno_historico table for change timeline
CREATE TABLE IF NOT EXISTS public.aluno_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  dados JSON,
  created_by UUID,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aluno_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aluno_documentos
CREATE POLICY "Tenant isolation for aluno_documentos" ON public.aluno_documentos
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- RLS Policies for aluno_habilidades
CREATE POLICY "Tenant isolation for aluno_habilidades" ON public.aluno_habilidades
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- RLS Policies for aluno_historico
CREATE POLICY "Tenant isolation for aluno_historico" ON public.aluno_historico
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Auto set tenant_id triggers
CREATE TRIGGER set_tenant_id_aluno_documentos BEFORE INSERT ON public.aluno_documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_aluno_habilidades BEFORE INSERT ON public.aluno_habilidades
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_id_aluno_historico BEFORE INSERT ON public.aluno_historico
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

-- Create storage bucket for student files
INSERT INTO storage.buckets (id, name, public) VALUES ('aluno-files', 'aluno-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload aluno files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aluno-files');

CREATE POLICY "Authenticated users can view aluno files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'aluno-files');

CREATE POLICY "Authenticated users can delete aluno files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'aluno-files');

-- Trigger to log changes to aluno_historico
CREATE OR REPLACE FUNCTION public.log_aluno_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status_matricula IS DISTINCT FROM NEW.status_matricula THEN
      INSERT INTO aluno_historico (aluno_id, tipo, descricao, dados, created_by, tenant_id)
      VALUES (NEW.id, 'status', 'Status alterado de ' || COALESCE(OLD.status_matricula::text, 'null') || ' para ' || COALESCE(NEW.status_matricula::text, 'null'),
        json_build_object('antigo', OLD.status_matricula, 'novo', NEW.status_matricula), auth.uid(), NEW.tenant_id);
    END IF;
    -- Log turma changes
    IF OLD.turma_id IS DISTINCT FROM NEW.turma_id THEN
      INSERT INTO aluno_historico (aluno_id, tipo, descricao, dados, created_by, tenant_id)
      VALUES (NEW.id, 'enturmacao', 'Turma alterada', json_build_object('turma_antiga', OLD.turma_id, 'turma_nova', NEW.turma_id), auth.uid(), NEW.tenant_id);
    END IF;
    -- Log curso changes
    IF OLD.curso_id IS DISTINCT FROM NEW.curso_id THEN
      INSERT INTO aluno_historico (aluno_id, tipo, descricao, dados, created_by, tenant_id)
      VALUES (NEW.id, 'curso', 'Curso alterado', json_build_object('curso_antigo', OLD.curso_id, 'curso_novo', NEW.curso_id), auth.uid(), NEW.tenant_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_aluno_changes AFTER UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.log_aluno_change();
