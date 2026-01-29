-- Criar tabela para vincular múltiplos alunos a uma fatura (fatura consolidada)
CREATE TABLE public.fatura_alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE RESTRICT,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  desconto_percentual NUMERIC DEFAULT 0,
  desconto_valor NUMERIC DEFAULT 0,
  valor_final NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Evitar duplicatas do mesmo aluno na mesma fatura
  UNIQUE(fatura_id, aluno_id)
);

-- Criar índices para performance
CREATE INDEX idx_fatura_alunos_fatura_id ON public.fatura_alunos(fatura_id);
CREATE INDEX idx_fatura_alunos_aluno_id ON public.fatura_alunos(aluno_id);
CREATE INDEX idx_fatura_alunos_tenant_id ON public.fatura_alunos(tenant_id);

-- Habilitar RLS
ALTER TABLE public.fatura_alunos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view fatura_alunos from their tenant" 
ON public.fatura_alunos 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert fatura_alunos in their tenant" 
ON public.fatura_alunos 
FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update fatura_alunos in their tenant" 
ON public.fatura_alunos 
FOR UPDATE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete fatura_alunos in their tenant" 
ON public.fatura_alunos 
FOR DELETE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Adicionar campo na faturas para indicar se é consolidada
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS consolidada BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON TABLE public.fatura_alunos IS 'Tabela de relacionamento para faturas consolidadas com múltiplos alunos';
COMMENT ON COLUMN public.faturas.consolidada IS 'Indica se a fatura consolida múltiplos alunos do mesmo responsável';