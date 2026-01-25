-- =====================================================
-- CORREÇÃO FASE 2: Remover políticas duplicadas restantes
-- =====================================================

-- ===================
-- TABELA: fatura_documentos
-- ===================
DROP POLICY IF EXISTS "Financial staff can view fatura_documentos" ON public.fatura_documentos;
DROP POLICY IF EXISTS "Staff can manage fatura_documentos" ON public.fatura_documentos;

DROP POLICY IF EXISTS "fatura_documentos_tenant_isolation" ON public.fatura_documentos;
CREATE POLICY "fatura_documentos_tenant_isolation" ON public.fatura_documentos
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: fatura_historico
-- ===================
DROP POLICY IF EXISTS "Staff can insert fatura_historico" ON public.fatura_historico;
DROP POLICY IF EXISTS "Staff can view fatura_historico" ON public.fatura_historico;

DROP POLICY IF EXISTS "fatura_historico_tenant_isolation" ON public.fatura_historico;
CREATE POLICY "fatura_historico_tenant_isolation" ON public.fatura_historico
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: folha_pagamento
-- ===================
DROP POLICY IF EXISTS "Admin Staff and Financeiro can view folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Admin can manage folha_pagamento" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Financial staff can view folha_pagamento" ON public.folha_pagamento;

DROP POLICY IF EXISTS "folha_pagamento_tenant_isolation" ON public.folha_pagamento;
CREATE POLICY "folha_pagamento_tenant_isolation" ON public.folha_pagamento
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: funcionario_turmas
-- ===================
DROP POLICY IF EXISTS "Admin and Staff can view funcionario_turmas" ON public.funcionario_turmas;
DROP POLICY IF EXISTS "Admin can manage funcionario_turmas" ON public.funcionario_turmas;

DROP POLICY IF EXISTS "funcionario_turmas_tenant_isolation" ON public.funcionario_turmas;
CREATE POLICY "funcionario_turmas_tenant_isolation" ON public.funcionario_turmas
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: setores
-- ===================
DROP POLICY IF EXISTS "Admin and Staff can view setores" ON public.setores;
DROP POLICY IF EXISTS "Admin can manage setores" ON public.setores;
DROP POLICY IF EXISTS "Staff can view setores" ON public.setores;

DROP POLICY IF EXISTS "setores_tenant_isolation" ON public.setores;
CREATE POLICY "setores_tenant_isolation" ON public.setores
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: categorias_contabeis
-- ===================
DROP POLICY IF EXISTS "Insert categorias with tenant" ON public.categorias_contabeis;
DROP POLICY IF EXISTS "Tenant isolation for categorias_contabeis" ON public.categorias_contabeis;

CREATE POLICY "categorias_contabeis_tenant_isolation" ON public.categorias_contabeis
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: lancamentos_contabeis
-- ===================
DROP POLICY IF EXISTS "Insert lancamentos with tenant" ON public.lancamentos_contabeis;
DROP POLICY IF EXISTS "No delete on lancamentos" ON public.lancamentos_contabeis;
DROP POLICY IF EXISTS "No update on lancamentos" ON public.lancamentos_contabeis;
DROP POLICY IF EXISTS "Tenant isolation for lancamentos_contabeis" ON public.lancamentos_contabeis;

CREATE POLICY "lancamentos_contabeis_tenant_isolation" ON public.lancamentos_contabeis
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: auditoria_contabil
-- ===================
DROP POLICY IF EXISTS "Read auditoria for tenant" ON public.auditoria_contabil;

DROP POLICY IF EXISTS "auditoria_contabil_tenant_isolation" ON public.auditoria_contabil;
CREATE POLICY "auditoria_contabil_tenant_isolation" ON public.auditoria_contabil
FOR SELECT
USING (
  (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
  OR is_platform_admin(auth.uid())
);

-- Trigger inserts only (via trigger)
CREATE POLICY "auditoria_contabil_insert_trigger" ON public.auditoria_contabil
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

-- ===================
-- TABELA: pontos_autorizados (se existir)
-- ===================
DROP POLICY IF EXISTS "Admin can manage pontos_autorizados" ON public.pontos_autorizados;
DROP POLICY IF EXISTS "Admin and Staff can view pontos_autorizados" ON public.pontos_autorizados;

DROP POLICY IF EXISTS "pontos_autorizados_tenant_isolation" ON public.pontos_autorizados;
CREATE POLICY "pontos_autorizados_tenant_isolation" ON public.pontos_autorizados
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff')
  ))
  OR is_platform_admin(auth.uid())
);