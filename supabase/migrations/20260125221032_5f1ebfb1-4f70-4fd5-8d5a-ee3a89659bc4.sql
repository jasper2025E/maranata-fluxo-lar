-- =====================================================
-- CORREÇÃO CRÍTICA: Vazamento de Dados Multi-Tenant
-- Remove políticas RLS duplicadas que ignoram tenant_id
-- =====================================================

-- ===================
-- TABELA: alunos
-- ===================
DROP POLICY IF EXISTS "Staff can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Staff can view alunos" ON public.alunos;
DROP POLICY IF EXISTS "Platform admins can view all alunos" ON public.alunos;

-- Recriar política consolidada com tenant + roles
DROP POLICY IF EXISTS "alunos_tenant_isolation" ON public.alunos;
CREATE POLICY "alunos_tenant_isolation" ON public.alunos
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: cursos
-- ===================
DROP POLICY IF EXISTS "Staff can manage cursos" ON public.cursos;
DROP POLICY IF EXISTS "Staff can view cursos" ON public.cursos;
DROP POLICY IF EXISTS "Platform admins can view all cursos" ON public.cursos;

DROP POLICY IF EXISTS "cursos_tenant_isolation" ON public.cursos;
CREATE POLICY "cursos_tenant_isolation" ON public.cursos
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: turmas
-- ===================
DROP POLICY IF EXISTS "Staff can manage turmas" ON public.turmas;
DROP POLICY IF EXISTS "Staff can view turmas" ON public.turmas;
DROP POLICY IF EXISTS "Platform admins can view all turmas" ON public.turmas;

DROP POLICY IF EXISTS "turmas_tenant_isolation" ON public.turmas;
CREATE POLICY "turmas_tenant_isolation" ON public.turmas
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: responsaveis
-- ===================
DROP POLICY IF EXISTS "Staff can manage responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Authenticated staff can view responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Platform admins can view all responsaveis" ON public.responsaveis;

DROP POLICY IF EXISTS "responsaveis_tenant_isolation" ON public.responsaveis;
CREATE POLICY "responsaveis_tenant_isolation" ON public.responsaveis
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria')
  ))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELA: faturas
-- ===================
DROP POLICY IF EXISTS "Staff can manage faturas" ON public.faturas;
DROP POLICY IF EXISTS "Financial staff can view faturas" ON public.faturas;
DROP POLICY IF EXISTS "Platform admins can view all faturas" ON public.faturas;

DROP POLICY IF EXISTS "faturas_tenant_isolation" ON public.faturas;
CREATE POLICY "faturas_tenant_isolation" ON public.faturas
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
-- TABELA: pagamentos
-- ===================
DROP POLICY IF EXISTS "Staff can manage pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Financial staff can view pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Platform admins can view all pagamentos" ON public.pagamentos;

DROP POLICY IF EXISTS "pagamentos_tenant_isolation" ON public.pagamentos;
CREATE POLICY "pagamentos_tenant_isolation" ON public.pagamentos
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
-- TABELA: despesas
-- ===================
DROP POLICY IF EXISTS "Staff can manage despesas" ON public.despesas;
DROP POLICY IF EXISTS "Financial staff can view despesas" ON public.despesas;
DROP POLICY IF EXISTS "Platform admins can view all despesas" ON public.despesas;

DROP POLICY IF EXISTS "despesas_tenant_isolation" ON public.despesas;
CREATE POLICY "despesas_tenant_isolation" ON public.despesas
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
-- TABELA: funcionarios
-- ===================
DROP POLICY IF EXISTS "Admin can manage funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Staff can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admin and Staff can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admin and Staff can update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admin and Staff can delete funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admin and Staff can insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Platform admins can view all funcionarios" ON public.funcionarios;

DROP POLICY IF EXISTS "funcionarios_tenant_isolation" ON public.funcionarios;
CREATE POLICY "funcionarios_tenant_isolation" ON public.funcionarios
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
-- TABELA: escola
-- ===================
DROP POLICY IF EXISTS "Admins can manage escola" ON public.escola;
DROP POLICY IF EXISTS "Authenticated staff can view all escola data" ON public.escola;
DROP POLICY IF EXISTS "Platform admins can view all escola" ON public.escola;

DROP POLICY IF EXISTS "escola_tenant_isolation" ON public.escola;
CREATE POLICY "escola_tenant_isolation" ON public.escola
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'staff') OR 
    has_role(auth.uid(), 'secretaria') OR
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- TABELAS FINANCEIRAS ADICIONAIS
-- ===================

-- fatura_itens
DROP POLICY IF EXISTS "Financial staff can view fatura_itens" ON public.fatura_itens;
DROP POLICY IF EXISTS "Staff can manage fatura_itens" ON public.fatura_itens;

DROP POLICY IF EXISTS "fatura_itens_tenant_isolation" ON public.fatura_itens;
CREATE POLICY "fatura_itens_tenant_isolation" ON public.fatura_itens
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

-- fatura_descontos
DROP POLICY IF EXISTS "Financial staff can view fatura_descontos" ON public.fatura_descontos;
DROP POLICY IF EXISTS "Staff can manage fatura_descontos" ON public.fatura_descontos;

DROP POLICY IF EXISTS "fatura_descontos_tenant_isolation" ON public.fatura_descontos;
CREATE POLICY "fatura_descontos_tenant_isolation" ON public.fatura_descontos
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
-- TABELAS RH
-- ===================

-- contratos
DROP POLICY IF EXISTS "Admin can manage contratos" ON public.contratos;
DROP POLICY IF EXISTS "Admin and Staff can view contratos" ON public.contratos;
DROP POLICY IF EXISTS "HR staff can view contratos" ON public.contratos;

DROP POLICY IF EXISTS "contratos_tenant_isolation" ON public.contratos;
CREATE POLICY "contratos_tenant_isolation" ON public.contratos
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

-- cargos
DROP POLICY IF EXISTS "Admin can manage cargos" ON public.cargos;
DROP POLICY IF EXISTS "Admin and Staff can view cargos" ON public.cargos;
DROP POLICY IF EXISTS "Staff can view cargos" ON public.cargos;

DROP POLICY IF EXISTS "cargos_tenant_isolation" ON public.cargos;
CREATE POLICY "cargos_tenant_isolation" ON public.cargos
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

-- ponto_registros
DROP POLICY IF EXISTS "Admin can manage ponto_registros" ON public.ponto_registros;
DROP POLICY IF EXISTS "HR staff can view ponto_registros" ON public.ponto_registros;

DROP POLICY IF EXISTS "ponto_registros_tenant_isolation" ON public.ponto_registros;
CREATE POLICY "ponto_registros_tenant_isolation" ON public.ponto_registros
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

-- funcionario_documentos
DROP POLICY IF EXISTS "Admin can manage funcionario_documentos" ON public.funcionario_documentos;
DROP POLICY IF EXISTS "Admin and Staff can view funcionario_documentos" ON public.funcionario_documentos;

DROP POLICY IF EXISTS "funcionario_documentos_tenant_isolation" ON public.funcionario_documentos;
CREATE POLICY "funcionario_documentos_tenant_isolation" ON public.funcionario_documentos
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
-- GATEWAY / INTEGRAÇÕES
-- ===================

-- gateway_transaction_logs
DROP POLICY IF EXISTS "gateway_logs_admin_view" ON public.gateway_transaction_logs;
DROP POLICY IF EXISTS "gateway_logs_insert_only" ON public.gateway_transaction_logs;

DROP POLICY IF EXISTS "gateway_logs_tenant_isolation" ON public.gateway_transaction_logs;
CREATE POLICY "gateway_logs_tenant_isolation" ON public.gateway_transaction_logs
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'financeiro')
  ))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id())
  OR is_platform_admin(auth.uid())
);

-- integration_settings
DROP POLICY IF EXISTS "Admins can view integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Admins can insert integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Admins can update integration settings" ON public.integration_settings;

DROP POLICY IF EXISTS "integration_settings_tenant_isolation" ON public.integration_settings;
CREATE POLICY "integration_settings_tenant_isolation" ON public.integration_settings
FOR ALL
USING (
  (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
  OR is_platform_admin(auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'))
  OR is_platform_admin(auth.uid())
);

-- ===================
-- CONTABILIDADE
-- ===================

-- bens_patrimoniais
DROP POLICY IF EXISTS "Insert bens with tenant" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "Tenant isolation for bens_patrimoniais" ON public.bens_patrimoniais;

CREATE POLICY "bens_patrimoniais_tenant_isolation" ON public.bens_patrimoniais
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

-- depreciacao_mensal
DROP POLICY IF EXISTS "Insert depreciacao with tenant" ON public.depreciacao_mensal;
DROP POLICY IF EXISTS "Tenant isolation for depreciacao_mensal" ON public.depreciacao_mensal;

CREATE POLICY "depreciacao_mensal_tenant_isolation" ON public.depreciacao_mensal
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

-- centros_custo
DROP POLICY IF EXISTS "Insert centros with tenant" ON public.centros_custo;
DROP POLICY IF EXISTS "Tenant isolation for centros_custo" ON public.centros_custo;

CREATE POLICY "centros_custo_tenant_isolation" ON public.centros_custo
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