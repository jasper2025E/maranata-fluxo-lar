
# Correcao: Juros Congelados e Erros no Modulo de Faturas

## Diagnostico Completo

### Problema Principal: Juros e dias de atraso CONGELADOS

O trigger `calcular_valor_total_fatura` recalcula juros e `dias_atraso` **somente quando a fatura e atualizada** (BEFORE UPDATE). O cron diario `mark_overdue_faturas` (3 AM) so muda faturas de "Aberta" para "Vencida" — ele **nao re-toca** faturas ja vencidas.

Resultado: uma fatura que venceu dia 11/02 e foi marcada como Vencida naquele dia ficou com `dias_atraso = 1` e juros de R$ 0,05. Hoje (14/02) deveria ter `dias_atraso = 3` e juros de R$ 0,16, mas o valor esta congelado.

### Problema do Riscado (Strikethrough)

A correcao anterior JA foi aplicada no codigo — confirmei visualmente no sandbox que o riscado nao aparece mais nos juros. O usuario pode estar vendo uma versao em cache do navegador. Apos o deploy, o problema visual estara resolvido.

### Datas corretas

As datas no banco realmente sao `2026-02-11`, entao exibir "11/02/26" esta correto. Nao ha bug de timezone aqui — as faturas foram criadas com vencimento dia 11 mesmo.

## Solucao

### 1. Criar funcao SQL para recalcular juros diariamente

Criar uma nova funcao `recalculate_overdue_interest()` que:
- Seleciona todas faturas com status "Vencida" e `data_vencimento < CURRENT_DATE`
- Recalcula `dias_atraso`, `valor_juros_aplicado`, `valor_multa_aplicado` e `valor_total`
- Executa um UPDATE que dispara o trigger existente

### 2. Adicionar ao cron diario

Agendar `recalculate_overdue_interest()` para rodar apos o `mark_overdue_faturas`, garantindo que os juros acumulem diariamente.

### 3. Executar recalculo imediato

Rodar o recalculo agora para corrigir todas as faturas atualmente com juros congelados.

## Detalhes Tecnicos

### Migracao SQL

```text
-- Funcao que forca recalculo de juros em faturas vencidas
CREATE OR REPLACE FUNCTION public.recalculate_overdue_interest()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Fazer UPDATE "touch" nas faturas vencidas para que o trigger
  -- calcular_valor_total_fatura recalcule dias_atraso e juros
  UPDATE public.faturas
  SET updated_at = NOW()
  WHERE status = 'Vencida'
    AND data_vencimento < CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
```

### Cron Job

Agendar para rodar diariamente as 3:05 AM (5 min apos o mark_overdue):

```text
SELECT cron.schedule(
  'recalculate-overdue-interest',
  '5 3 * * *',
  'SELECT public.recalculate_overdue_interest()'
);
```

### Execucao imediata

Apos criar a funcao, executar `SELECT public.recalculate_overdue_interest()` para corrigir todas as faturas atuais.

## Impacto

| Item | Detalhe |
|------|---------|
| Risco | Baixo - a funcao apenas faz UPDATE em `updated_at`, delegando o calculo ao trigger existente |
| Faturas afetadas | ~11 faturas vencidas terao juros recalculados de 1 dia para 3 dias |
| Recorrencia | Diaria, garantindo que juros acumulem corretamente todo dia |
| Strikethrough | Ja corrigido no codigo — sem alteracao adicional necessaria |
