

# Correção: Juros não contabilizados em fatura paga com atraso

## Problema Encontrado

Quando uma fatura vencida é paga com atraso, o sistema **apaga os juros e multa** automaticamente.

### Causa Raiz

Existe um trigger no banco de dados chamado `calcular_valor_total_fatura` que recalcula juros e multa toda vez que a fatura é atualizada. A lógica dele faz o seguinte:

```
SE status = 'Paga' ou 'Cancelada' ENTÃO
   dias_atraso = 0
   juros = 0
   multa = 0
```

Ou seja, no exato momento em que o pagamento é registrado e o status muda para "Paga", o trigger zera todos os encargos. O valor final volta a ser o valor base, como se não houvesse atraso.

## Solucao

Alterar o trigger para **preservar os juros e multa já calculados** quando a fatura muda para status "Paga". A lógica correta deve ser:

- Se a fatura **estava vencida e agora foi paga**, manter os valores de juros e multa que já foram calculados
- Só recalcular juros/multa para faturas que **ainda estao abertas/vencidas**
- Nunca zerar encargos ao marcar como paga

### Mudanca no Trigger (SQL)

A logica atual:

```sql
IF NEW.data_vencimento < CURRENT_DATE AND NEW.status NOT IN ('Paga', 'Cancelada') THEN
    v_dias_atraso := CURRENT_DATE - NEW.data_vencimento;
ELSE
    v_dias_atraso := 0;  -- AQUI ZERA TUDO quando status = Paga
END IF;
```

Sera substituida por:

```sql
-- Se ja esta Paga/Cancelada, PRESERVAR os valores existentes
IF NEW.status IN ('Paga', 'Cancelada') THEN
    -- Manter juros e multa que ja foram calculados
    NEW.valor_juros_aplicado := COALESCE(NEW.valor_juros_aplicado, OLD.valor_juros_aplicado, 0);
    NEW.valor_multa_aplicado := COALESCE(NEW.valor_multa_aplicado, OLD.valor_multa_aplicado, 0);
    NEW.juros := NEW.valor_juros_aplicado;
    NEW.dias_atraso := COALESCE(OLD.dias_atraso, 0);
    -- Recalcular valor_total preservando encargos
    NEW.valor_total := v_valor_base - v_desconto + NEW.valor_juros_aplicado + NEW.valor_multa_aplicado;
    RETURN NEW;
END IF;

-- Para faturas ativas, continuar calculando normalmente
IF NEW.data_vencimento < CURRENT_DATE THEN
    v_dias_atraso := CURRENT_DATE - NEW.data_vencimento;
ELSE
    v_dias_atraso := 0;
END IF;
```

### Arquivo Frontend (sem alteracao necessaria)

O frontend ja tem a logica correta em `useFaturas.ts` via funcao `getValorFinal()` que soma juros e multa ao valor. O problema esta **exclusivamente no trigger do banco** que apaga esses valores.

## Impacto

- **Risco**: Nenhum risco aos dados existentes. A migracao apenas atualiza a logica do trigger
- **Dados existentes**: Faturas ja pagas que tiveram juros apagados continuarao com valor zerado (nao ha como recuperar automaticamente o que ja foi zerado)
- **Novas faturas**: A partir da correção, qualquer fatura paga com atraso manterá os juros e multa corretamente

## Resumo das alteracoes

| Item | Tipo | Descricao |
|------|------|-----------|
| Migration SQL | Banco de dados | Corrigir trigger `calcular_valor_total_fatura` para preservar juros ao pagar |

