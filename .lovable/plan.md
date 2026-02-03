
# Plano de Correção: Campo saldo_restante

## Problema Identificado

O campo `saldo_restante` nas faturas está com valor **0** para todas as 504 faturas abertas, quando deveria ter o `valor_total`. Isso causa:

- KPI "A Receber" mostrando R$ 0,00 ao invés de R$ 92.468,00
- Cálculos financeiros incorretos

## Causa

- O campo tem `DEFAULT 0` no banco
- Ao criar faturas, o sistema NÃO inicializa `saldo_restante` com `valor_total`
- O cálculo do KPI usa `saldo_restante` primeiro (quando não é NULL)

## Solução (2 Partes)

### 1. Correção Imediata dos Dados Existentes

Atualizar todas as faturas abertas/emitidas para ter `saldo_restante = valor_total`:

```sql
UPDATE faturas
SET saldo_restante = COALESCE(valor_total, valor)
WHERE status IN ('Aberta', 'Vencida', 'Emitida')
  AND (saldo_restante IS NULL OR saldo_restante = 0)
  AND COALESCE(valor_total, valor) > 0;
```

### 2. Trigger para Futuras Faturas

Criar trigger que inicializa `saldo_restante` automaticamente na criação:

```sql
CREATE OR REPLACE FUNCTION init_saldo_restante()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.saldo_restante IS NULL OR NEW.saldo_restante = 0 THEN
    NEW.saldo_restante := COALESCE(NEW.valor_total, NEW.valor, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_init_saldo_restante
  BEFORE INSERT ON faturas
  FOR EACH ROW
  EXECUTE FUNCTION init_saldo_restante();
```

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| A Receber: R$ 0,00 | A Receber: R$ 92.468,00 |
| saldo_restante = 0 | saldo_restante = valor_total |
| KPIs incorretos | KPIs refletindo valores reais |

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| Nova migração SQL | Correção de dados + Trigger |

## Garantias de Segurança

- Sem exclusão de dados
- Apenas UPDATE de campo numérico
- Trigger não afeta lógica existente
- 100% reversível se necessário
