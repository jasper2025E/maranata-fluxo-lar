-- Parte 1: Inserir pagamentos faltantes para faturas já pagas
-- Usando 'Dinheiro' para boletos pois é o mais próximo permitido
INSERT INTO pagamentos (fatura_id, valor, metodo, data_pagamento, gateway, gateway_id, gateway_status, tenant_id)
SELECT 
  f.id,
  COALESCE(f.valor_total, f.valor),
  CASE 
    WHEN f.asaas_billing_type = 'PIX' THEN 'PIX'
    WHEN f.asaas_billing_type = 'CREDIT_CARD' THEN 'Cartão'
    ELSE 'Dinheiro'
  END,
  COALESCE(f.updated_at::date, CURRENT_DATE),
  'asaas',
  f.asaas_payment_id,
  f.asaas_status,
  f.tenant_id
FROM faturas f
WHERE f.status = 'Paga'
  AND f.asaas_payment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pagamentos p 
    WHERE p.fatura_id = f.id
  );

-- Parte 2: Adicionar 'Boleto' à constraint para suportar método correto
ALTER TABLE pagamentos DROP CONSTRAINT pagamentos_metodo_check;
ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_metodo_check 
  CHECK (metodo = ANY (ARRAY['PIX', 'Cartão', 'Dinheiro', 'Boleto']));

-- Parte 3: Corrigir os pagamentos inseridos para usar 'Boleto'
UPDATE pagamentos 
SET metodo = 'Boleto'
WHERE gateway = 'asaas' 
  AND metodo = 'Dinheiro'
  AND fatura_id IN (
    SELECT id FROM faturas WHERE asaas_billing_type = 'BOLETO' OR asaas_billing_type IS NULL
  );

-- Parte 4: Atualizar trigger para criar pagamento automaticamente
CREATE OR REPLACE FUNCTION public.sync_fatura_status_from_asaas()
RETURNS TRIGGER AS $$
BEGIN
  -- Se asaas_status indica pago, atualizar status local
  IF NEW.asaas_status IN ('RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED') 
     AND NEW.status NOT IN ('Paga', 'Cancelada') THEN
    NEW.status := 'Paga';
    NEW.saldo_restante := 0;
    NEW.updated_at := now();
  END IF;
  
  -- Se asaas_status indica vencida
  IF NEW.asaas_status IN ('OVERDUE', 'DUNNING_REQUESTED') 
     AND NEW.status NOT IN ('Paga', 'Cancelada') THEN
    NEW.status := 'Vencida';
    NEW.updated_at := now();
  END IF;
  
  -- Se asaas_status indica cancelada/estornada
  IF NEW.asaas_status IN ('REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 
                          'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL')
     AND NEW.status NOT IN ('Cancelada') THEN
    NEW.status := 'Cancelada';
    NEW.motivo_cancelamento := COALESCE(NEW.motivo_cancelamento, 'Asaas: ' || NEW.asaas_status);
    NEW.updated_at := now();
  END IF;
  
  -- Se está sendo marcado como pago, garantir que existe registro de pagamento
  IF NEW.status = 'Paga' AND NEW.asaas_payment_id IS NOT NULL THEN
    INSERT INTO pagamentos (fatura_id, valor, metodo, data_pagamento, gateway, gateway_id, gateway_status, tenant_id)
    SELECT 
      NEW.id,
      COALESCE(NEW.valor_total, NEW.valor),
      CASE 
        WHEN NEW.asaas_billing_type = 'PIX' THEN 'PIX'
        WHEN NEW.asaas_billing_type = 'CREDIT_CARD' THEN 'Cartão'
        ELSE 'Boleto'
      END,
      CURRENT_DATE,
      'asaas',
      NEW.asaas_payment_id,
      NEW.asaas_status,
      NEW.tenant_id
    WHERE NOT EXISTS (
      SELECT 1 FROM pagamentos WHERE fatura_id = NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;