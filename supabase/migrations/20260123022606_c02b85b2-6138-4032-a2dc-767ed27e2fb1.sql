
-- ================================================================
-- FASE 1: ADICIONAR tenant_id EM TODAS AS TABELAS DE DADOS
-- ================================================================

-- 1. Buscar o tenant_id existente para atribuir aos dados atuais
-- (usando o primeiro tenant encontrado como fallback)

-- Adicionar tenant_id às tabelas que ainda não têm
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.responsaveis ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.setores ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.folha_pagamento ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.ponto_registros ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.pontos_autorizados ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.integration_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.fatura_itens ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.fatura_descontos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.fatura_historico ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.fatura_documentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.funcionario_documentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.funcionario_turmas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- ================================================================
-- FASE 2: MIGRAR DADOS EXISTENTES PARA O PRIMEIRO TENANT
-- ================================================================

-- Atualizar dados órfãos para o primeiro tenant (Maranata)
DO $$
DECLARE
  first_tenant_id UUID;
BEGIN
  SELECT id INTO first_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;
  
  IF first_tenant_id IS NOT NULL THEN
    UPDATE public.alunos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.cursos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.turmas SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.responsaveis SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.faturas SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.pagamentos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.despesas SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.funcionarios SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.cargos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.setores SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.contratos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.folha_pagamento SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.ponto_registros SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.pontos_autorizados SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.notifications SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.integration_settings SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.fatura_itens SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.fatura_descontos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.fatura_historico SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.fatura_documentos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.funcionario_documentos SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.funcionario_turmas SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ================================================================
-- FASE 3: FUNÇÃO PARA OBTER TENANT_ID DO USUÁRIO ATUAL
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ================================================================
-- FASE 4: RLS POLICIES PARA ISOLAMENTO MULTI-TENANT
-- ================================================================

-- Remover políticas antigas e criar novas para cada tabela

-- ALUNOS
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alunos_tenant_isolation" ON public.alunos;
DROP POLICY IF EXISTS "alunos_platform_admin" ON public.alunos;
CREATE POLICY "alunos_tenant_isolation" ON public.alunos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- CURSOS
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cursos_tenant_isolation" ON public.cursos;
CREATE POLICY "cursos_tenant_isolation" ON public.cursos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- TURMAS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "turmas_tenant_isolation" ON public.turmas;
CREATE POLICY "turmas_tenant_isolation" ON public.turmas
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- RESPONSÁVEIS
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "responsaveis_tenant_isolation" ON public.responsaveis;
CREATE POLICY "responsaveis_tenant_isolation" ON public.responsaveis
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FATURAS
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faturas_tenant_isolation" ON public.faturas;
CREATE POLICY "faturas_tenant_isolation" ON public.faturas
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- PAGAMENTOS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pagamentos_tenant_isolation" ON public.pagamentos;
CREATE POLICY "pagamentos_tenant_isolation" ON public.pagamentos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- DESPESAS
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "despesas_tenant_isolation" ON public.despesas;
CREATE POLICY "despesas_tenant_isolation" ON public.despesas
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FUNCIONÁRIOS
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "funcionarios_tenant_isolation" ON public.funcionarios;
CREATE POLICY "funcionarios_tenant_isolation" ON public.funcionarios
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- CARGOS
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cargos_tenant_isolation" ON public.cargos;
CREATE POLICY "cargos_tenant_isolation" ON public.cargos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- SETORES
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "setores_tenant_isolation" ON public.setores;
CREATE POLICY "setores_tenant_isolation" ON public.setores
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- CONTRATOS
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contratos_tenant_isolation" ON public.contratos;
CREATE POLICY "contratos_tenant_isolation" ON public.contratos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FOLHA_PAGAMENTO
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "folha_pagamento_tenant_isolation" ON public.folha_pagamento;
CREATE POLICY "folha_pagamento_tenant_isolation" ON public.folha_pagamento
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- PONTO_REGISTROS
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ponto_registros_tenant_isolation" ON public.ponto_registros;
CREATE POLICY "ponto_registros_tenant_isolation" ON public.ponto_registros
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- PONTOS_AUTORIZADOS
ALTER TABLE public.pontos_autorizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pontos_autorizados_tenant_isolation" ON public.pontos_autorizados;
CREATE POLICY "pontos_autorizados_tenant_isolation" ON public.pontos_autorizados
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_tenant_isolation" ON public.notifications;
CREATE POLICY "notifications_tenant_isolation" ON public.notifications
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid()) OR
    user_id = auth.uid()
  );

-- INTEGRATION_SETTINGS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "integration_settings_tenant_isolation" ON public.integration_settings;
CREATE POLICY "integration_settings_tenant_isolation" ON public.integration_settings
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FATURA_ITENS
ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fatura_itens_tenant_isolation" ON public.fatura_itens;
CREATE POLICY "fatura_itens_tenant_isolation" ON public.fatura_itens
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FATURA_DESCONTOS
ALTER TABLE public.fatura_descontos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fatura_descontos_tenant_isolation" ON public.fatura_descontos;
CREATE POLICY "fatura_descontos_tenant_isolation" ON public.fatura_descontos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FATURA_HISTORICO
ALTER TABLE public.fatura_historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fatura_historico_tenant_isolation" ON public.fatura_historico;
CREATE POLICY "fatura_historico_tenant_isolation" ON public.fatura_historico
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FATURA_DOCUMENTOS
ALTER TABLE public.fatura_documentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fatura_documentos_tenant_isolation" ON public.fatura_documentos;
CREATE POLICY "fatura_documentos_tenant_isolation" ON public.fatura_documentos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FUNCIONARIO_DOCUMENTOS
ALTER TABLE public.funcionario_documentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "funcionario_documentos_tenant_isolation" ON public.funcionario_documentos;
CREATE POLICY "funcionario_documentos_tenant_isolation" ON public.funcionario_documentos
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- FUNCIONARIO_TURMAS
ALTER TABLE public.funcionario_turmas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "funcionario_turmas_tenant_isolation" ON public.funcionario_turmas;
CREATE POLICY "funcionario_turmas_tenant_isolation" ON public.funcionario_turmas
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id() OR
    public.is_platform_admin(auth.uid())
  );

-- ================================================================
-- FASE 5: TENANTS - PERMITIR PLATFORM_ADMIN VER TODOS
-- ================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_platform_admin_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_own_read" ON public.tenants;

CREATE POLICY "tenants_platform_admin_all" ON public.tenants
  FOR ALL USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "tenants_own_read" ON public.tenants
  FOR SELECT USING (id = public.get_user_tenant_id());

-- ================================================================
-- FASE 6: ÍNDICES PARA PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_alunos_tenant_id ON public.alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cursos_tenant_id ON public.cursos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_turmas_tenant_id ON public.turmas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_tenant_id ON public.responsaveis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faturas_tenant_id ON public.faturas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_tenant_id ON public.pagamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_despesas_tenant_id ON public.despesas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tenant_id ON public.funcionarios(tenant_id);

-- ================================================================
-- FASE 7: TRIGGER PARA AUTO-PREENCHER TENANT_ID EM NOVOS REGISTROS
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_tenant_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Criar triggers para as tabelas principais
DROP TRIGGER IF EXISTS set_tenant_id_alunos ON public.alunos;
CREATE TRIGGER set_tenant_id_alunos
  BEFORE INSERT ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_cursos ON public.cursos;
CREATE TRIGGER set_tenant_id_cursos
  BEFORE INSERT ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_turmas ON public.turmas;
CREATE TRIGGER set_tenant_id_turmas
  BEFORE INSERT ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_responsaveis ON public.responsaveis;
CREATE TRIGGER set_tenant_id_responsaveis
  BEFORE INSERT ON public.responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_faturas ON public.faturas;
CREATE TRIGGER set_tenant_id_faturas
  BEFORE INSERT ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_pagamentos ON public.pagamentos;
CREATE TRIGGER set_tenant_id_pagamentos
  BEFORE INSERT ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_despesas ON public.despesas;
CREATE TRIGGER set_tenant_id_despesas
  BEFORE INSERT ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_funcionarios ON public.funcionarios;
CREATE TRIGGER set_tenant_id_funcionarios
  BEFORE INSERT ON public.funcionarios
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_cargos ON public.cargos;
CREATE TRIGGER set_tenant_id_cargos
  BEFORE INSERT ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_setores ON public.setores;
CREATE TRIGGER set_tenant_id_setores
  BEFORE INSERT ON public.setores
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_contratos ON public.contratos;
CREATE TRIGGER set_tenant_id_contratos
  BEFORE INSERT ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_tenant_id_notifications ON public.notifications;
CREATE TRIGGER set_tenant_id_notifications
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_on_insert();
