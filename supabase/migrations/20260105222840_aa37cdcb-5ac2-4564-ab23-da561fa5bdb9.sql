
-- Adicionar campos enterprise na tabela faturas
ALTER TABLE public.faturas
ADD COLUMN IF NOT EXISTS codigo_sequencial text UNIQUE,
ADD COLUMN IF NOT EXISTS valor_bruto numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_liquido numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS versao integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS updated_by uuid,
ADD COLUMN IF NOT EXISTS cancelada_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelada_por uuid,
ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
ADD COLUMN IF NOT EXISTS bloqueada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS saldo_restante numeric DEFAULT 0;

-- Criar função para gerar código sequencial
CREATE OR REPLACE FUNCTION public.generate_fatura_codigo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_ano integer;
  v_seq integer;
BEGIN
  v_ano := EXTRACT(YEAR FROM COALESCE(NEW.data_emissao, CURRENT_DATE));
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(codigo_sequencial FROM 10) AS integer)
  ), 0) + 1
  INTO v_seq
  FROM faturas
  WHERE codigo_sequencial LIKE 'FAT-' || v_ano || '-%';
  
  NEW.codigo_sequencial := 'FAT-' || v_ano || '-' || LPAD(v_seq::text, 6, '0');
  RETURN NEW;
END;
$$;

-- Trigger para código sequencial
DROP TRIGGER IF EXISTS tr_generate_fatura_codigo ON public.faturas;
CREATE TRIGGER tr_generate_fatura_codigo
BEFORE INSERT ON public.faturas
FOR EACH ROW
WHEN (NEW.codigo_sequencial IS NULL)
EXECUTE FUNCTION public.generate_fatura_codigo();

-- Tabela de itens da fatura
CREATE TABLE IF NOT EXISTS public.fatura_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  desconto_valor numeric DEFAULT 0,
  desconto_percentual numeric DEFAULT 0,
  desconto_aplicado numeric DEFAULT 0,
  valor_final numeric NOT NULL,
  centro_custo text,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage fatura_itens" ON public.fatura_itens
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can view fatura_itens" ON public.fatura_itens
FOR SELECT USING (true);

-- Tabela de descontos da fatura
CREATE TABLE IF NOT EXISTS public.fatura_descontos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('convenio', 'bolsa', 'campanha', 'pontualidade', 'manual', 'item')),
  descricao text NOT NULL,
  valor numeric DEFAULT 0,
  percentual numeric DEFAULT 0,
  valor_aplicado numeric NOT NULL,
  condicao text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.fatura_descontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage fatura_descontos" ON public.fatura_descontos
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can view fatura_descontos" ON public.fatura_descontos
FOR SELECT USING (true);

-- Tabela de histórico/versões da fatura (audit trail)
CREATE TABLE IF NOT EXISTS public.fatura_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  versao integer NOT NULL,
  acao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  motivo text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  ip_address text,
  user_agent text
);

ALTER TABLE public.fatura_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view fatura_historico" ON public.fatura_historico
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can insert fatura_historico" ON public.fatura_historico
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Tabela de documentos da fatura
CREATE TABLE IF NOT EXISTS public.fatura_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('fatura', 'recibo', 'comprovante', 'outro')),
  nome text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.fatura_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage fatura_documentos" ON public.fatura_documentos
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can view fatura_documentos" ON public.fatura_documentos
FOR SELECT USING (true);

-- Adicionar campos para pagamentos parciais
ALTER TABLE public.pagamentos
ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'total',
ADD COLUMN IF NOT EXISTS estorno_de uuid,
ADD COLUMN IF NOT EXISTS motivo_estorno text;

-- Função para recalcular fatura automaticamente
CREATE OR REPLACE FUNCTION public.recalcular_fatura(p_fatura_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_valor_bruto numeric := 0;
  v_valor_descontos numeric := 0;
  v_valor_itens numeric := 0;
  v_total_pago numeric := 0;
  v_saldo numeric := 0;
BEGIN
  -- Calcular total dos itens
  SELECT COALESCE(SUM(valor_final), 0) INTO v_valor_itens
  FROM fatura_itens WHERE fatura_id = p_fatura_id;
  
  -- Se tem itens, usar valor dos itens, senão usar valor da fatura
  IF v_valor_itens > 0 THEN
    v_valor_bruto := v_valor_itens;
  ELSE
    SELECT COALESCE(valor_original, valor, 0) INTO v_valor_bruto
    FROM faturas WHERE id = p_fatura_id;
  END IF;
  
  -- Calcular descontos globais
  SELECT COALESCE(SUM(valor_aplicado), 0) INTO v_valor_descontos
  FROM fatura_descontos WHERE fatura_id = p_fatura_id AND tipo != 'item';
  
  -- Calcular total pago
  SELECT COALESCE(SUM(CASE WHEN tipo = 'estorno' THEN -valor ELSE valor END), 0) INTO v_total_pago
  FROM pagamentos WHERE fatura_id = p_fatura_id;
  
  -- Atualizar fatura
  UPDATE faturas SET
    valor_bruto = v_valor_bruto,
    valor = v_valor_bruto - v_valor_descontos,
    valor_original = COALESCE(valor_original, v_valor_bruto),
    saldo_restante = GREATEST(0, (v_valor_bruto - v_valor_descontos) - v_total_pago),
    updated_at = now()
  WHERE id = p_fatura_id;
END;
$$;

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION public.registrar_fatura_historico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO fatura_historico (fatura_id, versao, acao, dados_anteriores, dados_novos, created_by)
    VALUES (
      NEW.id,
      COALESCE(NEW.versao, 1),
      'alteracao',
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
    NEW.versao := COALESCE(OLD.versao, 1) + 1;
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_fatura_historico ON public.faturas;
CREATE TRIGGER tr_fatura_historico
BEFORE UPDATE ON public.faturas
FOR EACH ROW
EXECUTE FUNCTION public.registrar_fatura_historico();

-- Trigger para recalcular ao alterar itens
CREATE OR REPLACE FUNCTION public.trigger_recalcular_fatura_itens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalcular_fatura(OLD.fatura_id);
    RETURN OLD;
  ELSE
    PERFORM recalcular_fatura(NEW.fatura_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS tr_recalcular_fatura_itens ON public.fatura_itens;
CREATE TRIGGER tr_recalcular_fatura_itens
AFTER INSERT OR UPDATE OR DELETE ON public.fatura_itens
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalcular_fatura_itens();

-- Trigger para recalcular ao alterar descontos
DROP TRIGGER IF EXISTS tr_recalcular_fatura_descontos ON public.fatura_descontos;
CREATE TRIGGER tr_recalcular_fatura_descontos
AFTER INSERT OR UPDATE OR DELETE ON public.fatura_descontos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalcular_fatura_itens();
