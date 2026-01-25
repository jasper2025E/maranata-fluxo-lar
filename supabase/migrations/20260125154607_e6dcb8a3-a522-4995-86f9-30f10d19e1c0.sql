-- =============================================
-- MÓDULO DE CONTABILIDADE PREMIUM
-- =============================================

-- Tabela de categorias contábeis
CREATE TABLE public.categorias_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ativo', 'passivo', 'patrimonio')),
  natureza TEXT NOT NULL CHECK (natureza IN ('credito', 'debito')),
  categoria_pai_id UUID REFERENCES public.categorias_contabeis(id),
  nivel INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, codigo)
);

-- Tabela de centros de custo
CREATE TABLE public.centros_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, codigo)
);

-- Tabela principal de lançamentos contábeis (IMUTÁVEL - apenas estornos)
CREATE TABLE public.lancamentos_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  numero_lancamento TEXT NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE NOT NULL,
  categoria_id UUID REFERENCES public.categorias_contabeis(id) NOT NULL,
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia', 'estorno')),
  natureza TEXT NOT NULL CHECK (natureza IN ('credito', 'debito')),
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  historico TEXT NOT NULL,
  documento_referencia TEXT,
  fatura_id UUID REFERENCES public.faturas(id),
  despesa_id UUID REFERENCES public.despesas(id),
  pagamento_id UUID REFERENCES public.pagamentos(id),
  estorno_de UUID REFERENCES public.lancamentos_contabeis(id),
  estornado BOOLEAN NOT NULL DEFAULT false,
  estornado_em TIMESTAMP WITH TIME ZONE,
  estornado_por UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  -- Sem updated_at pois lançamentos são imutáveis
);

-- Tabela de bens patrimoniais
CREATE TABLE public.bens_patrimoniais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  data_aquisicao DATE NOT NULL,
  valor_aquisicao NUMERIC(15,2) NOT NULL,
  vida_util_meses INTEGER NOT NULL DEFAULT 60,
  taxa_depreciacao_anual NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  valor_residual NUMERIC(15,2) DEFAULT 0,
  depreciacao_acumulada NUMERIC(15,2) DEFAULT 0,
  valor_contabil_atual NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'baixado', 'vendido')),
  data_baixa DATE,
  motivo_baixa TEXT,
  localizacao TEXT,
  responsavel TEXT,
  numero_serie TEXT,
  nota_fiscal TEXT,
  fornecedor TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, codigo)
);

-- Tabela de depreciação mensal
CREATE TABLE public.depreciacao_mensal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  bem_id UUID REFERENCES public.bens_patrimoniais(id) ON DELETE CASCADE NOT NULL,
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL,
  valor_depreciacao NUMERIC(15,2) NOT NULL,
  depreciacao_acumulada NUMERIC(15,2) NOT NULL,
  valor_contabil NUMERIC(15,2) NOT NULL,
  lancamento_id UUID REFERENCES public.lancamentos_contabeis(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bem_id, mes_referencia, ano_referencia)
);

-- Tabela de controle de impostos estimados
CREATE TABLE public.impostos_estimados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  tipo_imposto TEXT NOT NULL,
  mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
  ano_referencia INTEGER NOT NULL,
  base_calculo NUMERIC(15,2) NOT NULL,
  aliquota NUMERIC(5,2) NOT NULL,
  valor_estimado NUMERIC(15,2) NOT NULL,
  valor_pago NUMERIC(15,2) DEFAULT 0,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, tipo_imposto, mes_referencia, ano_referencia)
);

-- Tabela de log de auditoria contábil
CREATE TABLE public.auditoria_contabil (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  acao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_lancamentos_tenant ON public.lancamentos_contabeis(tenant_id);
CREATE INDEX idx_lancamentos_data ON public.lancamentos_contabeis(data_lancamento);
CREATE INDEX idx_lancamentos_competencia ON public.lancamentos_contabeis(data_competencia);
CREATE INDEX idx_lancamentos_categoria ON public.lancamentos_contabeis(categoria_id);
CREATE INDEX idx_bens_tenant ON public.bens_patrimoniais(tenant_id);
CREATE INDEX idx_auditoria_tenant ON public.auditoria_contabil(tenant_id);
CREATE INDEX idx_auditoria_registro ON public.auditoria_contabil(registro_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.categorias_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens_patrimoniais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciacao_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impostos_estimados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_contabil ENABLE ROW LEVEL SECURITY;

-- Categorias Contábeis
CREATE POLICY "Tenant isolation for categorias_contabeis" ON public.categorias_contabeis
  FOR ALL USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Insert categorias with tenant" ON public.categorias_contabeis
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Centros de Custo
CREATE POLICY "Tenant isolation for centros_custo" ON public.centros_custo
  FOR ALL USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Insert centros with tenant" ON public.centros_custo
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Lançamentos Contábeis
CREATE POLICY "Tenant isolation for lancamentos_contabeis" ON public.lancamentos_contabeis
  FOR ALL USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Insert lancamentos with tenant" ON public.lancamentos_contabeis
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Prevent UPDATE/DELETE on lancamentos (immutability)
CREATE POLICY "No update on lancamentos" ON public.lancamentos_contabeis
  FOR UPDATE USING (false);

CREATE POLICY "No delete on lancamentos" ON public.lancamentos_contabeis
  FOR DELETE USING (false);

-- Bens Patrimoniais
CREATE POLICY "Tenant isolation for bens_patrimoniais" ON public.bens_patrimoniais
  FOR ALL USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Insert bens with tenant" ON public.bens_patrimoniais
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Depreciação
CREATE POLICY "Tenant isolation for depreciacao_mensal" ON public.depreciacao_mensal
  FOR ALL USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Insert depreciacao with tenant" ON public.depreciacao_mensal
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Impostos
CREATE POLICY "Tenant isolation for impostos_estimados" ON public.impostos_estimados
  FOR ALL USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Insert impostos with tenant" ON public.impostos_estimados
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Auditoria (somente leitura para usuários, escrita via função)
CREATE POLICY "Read auditoria for tenant" ON public.auditoria_contabil
  FOR SELECT USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para auto-set tenant_id
CREATE TRIGGER set_tenant_categorias_contabeis
  BEFORE INSERT ON public.categorias_contabeis
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_centros_custo
  BEFORE INSERT ON public.centros_custo
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_lancamentos
  BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_bens
  BEFORE INSERT ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_depreciacao
  BEFORE INSERT ON public.depreciacao_mensal
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

CREATE TRIGGER set_tenant_impostos
  BEFORE INSERT ON public.impostos_estimados
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

-- =============================================
-- FUNCTION: Gerar número do lançamento
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_lancamento_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_ano INTEGER;
  v_seq INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM NEW.data_lancamento);
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_lancamento FROM 5) AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM lancamentos_contabeis
  WHERE tenant_id = NEW.tenant_id
    AND numero_lancamento LIKE 'LC-' || v_ano || '-%';
  
  NEW.numero_lancamento := 'LC-' || v_ano || '-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_lancamento_numero_trigger
  BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION generate_lancamento_numero();

-- =============================================
-- FUNCTION: Calcular valor contábil do bem
-- =============================================
CREATE OR REPLACE FUNCTION public.calcular_valor_contabil_bem()
RETURNS TRIGGER AS $$
BEGIN
  NEW.valor_contabil_atual := NEW.valor_aquisicao - COALESCE(NEW.depreciacao_acumulada, 0);
  
  IF NEW.valor_contabil_atual < COALESCE(NEW.valor_residual, 0) THEN
    NEW.valor_contabil_atual := NEW.valor_residual;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calcular_valor_contabil_trigger
  BEFORE INSERT OR UPDATE ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION calcular_valor_contabil_bem();

-- =============================================
-- FUNCTION: Registrar auditoria contábil
-- =============================================
CREATE OR REPLACE FUNCTION public.registrar_auditoria_contabil()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auditoria_contabil (
    tenant_id,
    tabela,
    registro_id,
    acao,
    dados_anteriores,
    dados_novos,
    user_id
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers de auditoria
CREATE TRIGGER audit_lancamentos
  AFTER INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_contabil();

CREATE TRIGGER audit_bens
  AFTER INSERT OR UPDATE OR DELETE ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria_contabil();