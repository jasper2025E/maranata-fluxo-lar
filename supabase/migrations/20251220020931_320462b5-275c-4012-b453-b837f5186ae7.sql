-- 1. Criar tabela de responsáveis financeiros
CREATE TABLE public.responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Adicionar coluna responsavel_id na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN responsavel_id UUID REFERENCES public.responsaveis(id);

-- 3. Modificar colunas obrigatórias do aluno (agora só nome é obrigatório)
ALTER TABLE public.alunos 
ALTER COLUMN data_nascimento DROP NOT NULL,
ALTER COLUMN telefone_responsavel DROP NOT NULL,
ALTER COLUMN email_responsavel DROP NOT NULL,
ALTER COLUMN endereco DROP NOT NULL;

-- 4. Adicionar coluna responsavel_id na tabela faturas
ALTER TABLE public.faturas 
ADD COLUMN responsavel_id UUID REFERENCES public.responsaveis(id);

-- 5. Adicionar configuração de fatura consolidada por responsável
ALTER TABLE public.responsaveis 
ADD COLUMN fatura_consolidada BOOLEAN DEFAULT false;

-- 6. Migrar dados existentes: criar responsáveis a partir dos alunos
INSERT INTO public.responsaveis (nome, telefone, email, observacoes)
SELECT DISTINCT 
  COALESCE(nome_completo, 'Responsável') as nome,
  COALESCE(telefone_responsavel, 'Não informado') as telefone,
  email_responsavel as email,
  'Migrado automaticamente do cadastro de aluno' as observacoes
FROM public.alunos
WHERE telefone_responsavel IS NOT NULL OR email_responsavel IS NOT NULL;

-- 7. Vincular alunos aos responsáveis criados
UPDATE public.alunos a
SET responsavel_id = (
  SELECT r.id FROM public.responsaveis r 
  WHERE r.telefone = a.telefone_responsavel 
  LIMIT 1
)
WHERE a.telefone_responsavel IS NOT NULL;

-- 8. Atualizar faturas com responsavel_id baseado no aluno
UPDATE public.faturas f
SET responsavel_id = (
  SELECT a.responsavel_id FROM public.alunos a 
  WHERE a.id = f.aluno_id
)
WHERE f.aluno_id IS NOT NULL;

-- 9. Habilitar RLS na tabela responsaveis
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para responsaveis
CREATE POLICY "Staff can view responsaveis" 
ON public.responsaveis 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage responsaveis" 
ON public.responsaveis 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'secretaria'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'secretaria'::app_role) OR
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- 11. Trigger para updated_at
CREATE TRIGGER update_responsaveis_updated_at
BEFORE UPDATE ON public.responsaveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();