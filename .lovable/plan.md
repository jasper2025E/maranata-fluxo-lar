

# Plano de Correção: Registro de Pagamentos e KPIs

## Diagnóstico Confirmado

| Problema | Detalhe |
|----------|---------|
| **2 faturas pagas** | `f9585a1a...` (R$ 280) e `a6756674...` (R$ 180) |
| **0 registros em `pagamentos`** | A tabela está VAZIA |
| **Webhook ASAAS não chegou** | Últimos logs são de 22/Jan, todos `PAYMENT_DELETED` |
| **Sync trigger apenas atualiza status** | Não cria registro de pagamento |

### Por que os KPIs estão zerados?

O cálculo do "Faturamento Mensal" e "Ticket Médio" é feito a partir da tabela `pagamentos`:

```typescript
// useFaturas.ts linhas 327-350
const pagamentos = pagamentosResult.data || [];  // ← VAZIA!

const faturamentoMensal = pagamentos.reduce(...);  // ← R$ 0,00
const ticketMedio = pagamentosValidos.length > 0 ? ... : 0;  // ← R$ 0,00
```

Como a tabela `pagamentos` está vazia, ambos os KPIs mostram R$ 0,00.

---

## Soluções Propostas

### Parte 1: Correção Imediata - Inserir Pagamentos Faltantes

Inserir os registros de pagamento para as faturas que estão como "Paga" mas não têm pagamento registrado:

```sql
INSERT INTO pagamentos (fatura_id, valor, metodo, data_pagamento, gateway, gateway_id, gateway_status, tenant_id)
SELECT 
  f.id,
  COALESCE(f.valor_total, f.valor),
  'Boleto',
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
```

### Parte 2: Aprimorar o Trigger de Sincronização

Modificar a função `sync_fatura_status_from_asaas()` para também criar registro de pagamento quando o status mudar para 'Paga':

```sql
CREATE OR REPLACE FUNCTION sync_fatura_status_from_asaas()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualização de status existente...
  
  -- Se está sendo marcado como pago, garantir que existe registro de pagamento
  IF NEW.status = 'Paga' AND NEW.asaas_payment_id IS NOT NULL THEN
    INSERT INTO pagamentos (fatura_id, valor, metodo, data_pagamento, gateway, gateway_id, gateway_status, tenant_id)
    SELECT 
      NEW.id,
      COALESCE(NEW.valor_total, NEW.valor),
      'Boleto',
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
$$
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Faturamento Mensal: R$ 0,00 | Faturamento Mensal: **R$ 460,00** (180 + 280) |
| Ticket Médio: R$ 0,00 | Ticket Médio: **R$ 230,00** (460 / 2) |
| Tabela `pagamentos`: 0 registros | Tabela `pagamentos`: 2 registros |

---

## Implementação

### Arquivo: Nova Migração SQL

1. **Inserir pagamentos faltantes** para faturas já pagas
2. **Atualizar trigger** para criar pagamento automaticamente em futuras sincronizações

### Garantias de Segurança

- Sem exclusão de dados
- Apenas INSERT de novos pagamentos
- Idempotente (verifica se já existe antes de inserir)
- Mantém integridade referencial

