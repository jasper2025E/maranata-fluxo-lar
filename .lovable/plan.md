

# Solucao Definitiva: Juros e Multas no Asaas

## Problema

Atualmente, juros (0,06%/dia) e multas (1,9%) sao calculados **apenas localmente** no trigger do banco de dados. O Asaas nao sabe nada sobre esses encargos, entao quando o responsavel vai pagar:

- **Boleto no banco**: cobra R$ 290 (valor original)
- **PIX via QR Code**: cobra R$ 290 (valor original)
- **Seu sistema**: mostra R$ 295,86 (com encargos)

O banco nunca vai cobrar os encargos porque eles nao foram informados ao Asaas.

## Solucao

A API do Asaas suporta nativamente os campos `interest` e `fine` na criacao da cobranca. Ao incluir esses parametros, o **proprio Asaas** calcula e cobra os encargos automaticamente quando o pagamento e feito apos o vencimento.

## O que vai mudar

### 1. Criar cobranca com juros e multa nativos (Edge Function `asaas-create-payment`)

Ao criar a cobranca no Asaas, incluir os campos `interest` e `fine` com os valores da configuracao da escola:

```text
POST /v3/payments
{
  "customer": "cus_xxx",
  "billingType": "BOLETO",
  "value": 290.00,
  "dueDate": "2026-02-15",
  "interest": { "value": 1.8 },   <-- juros mensal (0.06/dia x 30 = 1.8% ao mes)
  "fine": { "value": 1.9 }        <-- multa percentual
}
```

Com isso, quando o responsavel pagar apos o vencimento, o banco automaticamente cobra o valor **com** juros e multa.

### 2. Buscar taxas da escola antes de criar a cobranca

A Edge Function vai buscar `juros_percentual_mensal_padrao` e `multa_percentual_padrao` da tabela `escola` usando o `tenant_id` da fatura.

### 3. Atualizar cobranças existentes

Para as faturas vencidas que ja tem cobranca no Asaas **sem** os encargos configurados, vamos atualizar via API do Asaas (`PUT /v3/payments/{id}`) adicionando os campos `interest` e `fine`.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/asaas-create-payment/index.ts`

- Antes de criar o pagamento, buscar da tabela `escola` os campos `juros_percentual_mensal_padrao`, `multa_percentual_padrao` e `multa_fixa_padrao`
- Incluir no body do `POST /payments`:
  - `interest: { value: juros_mensal }` (percentual mensal)
  - `fine: { value: multa_percentual }` (percentual de multa)
  - Se houver `multa_fixa_padrao`, usar `fine: { value: multa_fixa, type: "FIXED" }`

### Arquivo: `supabase/functions/asaas-update-payment/index.ts`

- Ao atualizar cobranças, tambem incluir `interest` e `fine` se ainda nao estiverem configurados

### Migracao: Atualizar cobranças existentes em atraso

- Criar uma Edge Function ou SQL que identifique faturas vencidas com `asaas_payment_id` e atualize cada uma no Asaas com os campos `interest` e `fine`
- Isso sera feito via chamada a API do Asaas para cada fatura pendente

### Resultado esperado

- O boleto impresso continuara mostrando o valor original (R$ 290)
- Quando o responsavel pagar **apos o vencimento**, o banco cobrara automaticamente valor + juros + multa
- O PIX QR Code dinamico ja reflete os encargos no momento do escaneamento
- O sistema local e o Asaas ficarao 100% sincronizados

