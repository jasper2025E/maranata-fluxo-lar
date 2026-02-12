# Correção: Boletos não imprimem para faturas vencidas

## Problema Encontrado

Identifiquei o bug exato. Quando você tenta imprimir um boleto (individual ou em lote), o sistema chama uma função chamada `isAsaasBoletoReady()` que verifica se o boleto está "pronto". Essa função exige que o status no Asaas seja **"CONFIRMED" ou "RECEIVED"** (ou seja, já pago). Resultado: só é possível imprimir boleto de fatura **já paga**, o que não faz sentido.

Faturas vencidas/abertas têm status "PENDING" ou "OVERDUE" no Asaas, e por isso o sistema bloqueia a impressão com a mensagem "Boleto ainda não está pronto".

## Sobre o QR Code impresso no mês passado

Boa notícia: **sim, os juros aparecem quando o pai escaneia o QR Code**. O QR Code PIX do Asaas é dinâmico -- quando o pai faz a leitura, o Asaas calcula automaticamente juros e multa no momento do pagamento. O valor impresso no papel pode estar desatualizado, mas o valor cobrado via PIX/boleto será o correto com os encargos.

O código de barras do boleto, porém, tem o valor fixo embutido (o valor que estava vigente quando a cobrança foi criada no Asaas). Para boletos lidos pela barra, o Asaas aplica os encargos separadamente no momento do processamento bancário.

## Correções

### 1. Corrigir `isAsaasBoletoReady` (Bug Principal)

**Arquivo**: `src/lib/asaasBoleto.ts`

Remover a exigência de status "CONFIRMED/RECEIVED". A verificação deve apenas garantir que a linha digitável (47 dígitos) e o código de barras (44 dígitos) existem, independente do status da cobrança.

De:

```typescript
const statusOk = status === "CONFIRMED" || status === "RECEIVED";
return statusOk && digits(...).length === 47 && digits(...).length === 44;
```

Para:

```typescript
return digits(fields.boletoBarcode).length === 47 && digits(fields.boletoBarCode).length === 44;
```

### 2. Corrigir validação no botão "Baixar Boleto" da tabela

**Arquivo**: `src/components/faturas/FaturaTable.tsx`

O botão "Baixar Boleto" já verifica corretamente apenas os dígitos (sem exigir status). Está OK.

### 3. Corrigir geração em lote (BulkActionsBar)

**Arquivo**: `src/components/faturas/BulkActionsBar.tsx`

O lote já chama `generateCarneCompacto` diretamente sem passar por `waitForAsaasBoletoReady`. Porém o download individual (Faturas.tsx e FaturaDetails.tsx) passa pelo `waitForAsaasBoletoReady` que está bloqueando. A correção no item 1 resolve todos os pontos de entrada.

## Resumo


| Mudança                                               | Arquivo                  | Risco                                  |
| ----------------------------------------------------- | ------------------------ | -------------------------------------- |
| Remover exigência de status pago para imprimir boleto | `src/lib/asaasBoleto.ts` | Zero - apenas remove bloqueio indevido |


Nenhum dado será alterado. Apenas a lógica de validação será corrigida.

sistema está em produção cuidado se essa alteração for prejudicar ou danificar algo emprodução ou atrapalhar as cobraças não faça, o objetivo é conseguir imprimir boletos/carnê em qualquer local que tenha essa opção sem erros com valores sempre atualizados independente do status da cobrança. pois o mesmo é caso  precise reemprimmir um boleto  tudo sempre funcione perfeitamente