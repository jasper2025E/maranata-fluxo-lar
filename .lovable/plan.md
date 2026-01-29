
# Plano: Sincronização Automática de Pagamentos com Gateway (Asaas)

## Diagnóstico do Problema

O usuário relatou que ao registrar pagamento manualmente no sistema, essa informação **não é refletida no Asaas**. Após análise completa do código:

### O que JÁ funciona (sincroniza com Asaas):
- Criar fatura → cria cobrança no Asaas
- Cancelar fatura → cancela no Asaas
- Excluir fatura → deleta no Asaas
- Adicionar desconto → atualiza valor no Asaas
- Atualizar valor → atualiza no Asaas

### O que NÃO funciona (não sincroniza):
- **Registrar pagamento manual** → Só atualiza banco local
- **Estornar pagamento** → Só atualiza banco local
- **Reabrir fatura paga** → Só atualiza banco local

---

## Solução Proposta

### 1. Criar Edge Function: `asaas-receive-in-cash`

**Objetivo:** Quando o usuário registrar pagamento manual, confirmar no Asaas que a cobrança foi "recebida em dinheiro".

**API Asaas utilizada:**
```
POST /payments/{id}/receiveInCash
Body: { paymentDate, value, notifyCustomer }
```

**Arquivo:** `supabase/functions/asaas-receive-in-cash/index.ts`

```text
┌─────────────────────────────────────────────────────────┐
│  Frontend: useRegistrarPagamento                        │
│  ↓                                                      │
│  1. Salva pagamento no banco local                      │
│  2. Atualiza status da fatura para "Paga"               │
│  3. Chama asaas-receive-in-cash (se tiver asaas_id)     │
│  ↓                                                      │
│  Edge Function: asaas-receive-in-cash                   │
│  ↓                                                      │
│  Asaas API: POST /payments/{id}/receiveInCash           │
│  ↓                                                      │
│  Asaas atualiza cobrança para RECEIVED_IN_CASH          │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Criar Edge Function: `asaas-undo-receive-in-cash`

**Objetivo:** Quando o usuário reabrir uma fatura paga, desfazer a confirmação no Asaas.

**API Asaas utilizada:**
```
POST /payments/{id}/undoReceivedInCash
```

**Arquivo:** `supabase/functions/asaas-undo-receive-in-cash/index.ts`

---

### 3. Modificar Hook: `useRegistrarPagamento`

**Arquivo:** `src/hooks/useFaturas.ts`

**Mudança:** Após salvar pagamento local, chamar `asaas-receive-in-cash` para sincronizar com gateway.

```typescript
// Após atualizar banco local:
if (faturaInfo?.asaas_payment_id) {
  await supabase.functions.invoke("asaas-receive-in-cash", {
    body: { 
      faturaId: data.fatura_id,
      paymentDate: new Date().toISOString().split('T')[0],
      value: data.valor,
    },
  });
}
```

---

### 4. Modificar Hook: `useEstornarPagamento`

**Arquivo:** `src/hooks/useFaturas.ts`

**Mudança:** Chamar API de estorno do Asaas quando estornar pagamento.

O Asaas suporta estorno apenas para pagamentos via PIX e Cartão processados por eles. Para pagamentos "recebidos em dinheiro", o correto é usar `undoReceivedInCash`.

---

### 5. Modificar Hook: `useReabrirFatura`

**Arquivo:** `src/hooks/useFaturas.ts`

**Mudança:** Ao reabrir fatura, verificar se o pagamento foi confirmado no Asaas e desfazer.

---

### 6. Atualizar `supabase/config.toml`

Adicionar configuração para as novas Edge Functions:

```toml
[functions.asaas-receive-in-cash]
verify_jwt = true

[functions.asaas-undo-receive-in-cash]
verify_jwt = true
```

---

## Fluxo Completo Após Implementação

```text
┌──────────────────────────────────────────────────────────────┐
│                    AÇÃO DO USUÁRIO                           │
├──────────────────────────────────────────────────────────────┤
│  Registrar Pagamento Manual                                  │
│  └→ Salva no banco local                                     │
│  └→ Chama asaas-receive-in-cash                              │
│  └→ Asaas marca como RECEIVED_IN_CASH                        │
├──────────────────────────────────────────────────────────────┤
│  Estornar Pagamento                                          │
│  └→ Salva estorno no banco local                             │
│  └→ Chama asaas-undo-receive-in-cash (se foi manual)         │
│  └→ Asaas volta status para PENDING                          │
├──────────────────────────────────────────────────────────────┤
│  Reabrir Fatura Paga                                         │
│  └→ Atualiza banco local                                     │
│  └→ Chama asaas-undo-receive-in-cash                         │
│  └→ Asaas volta status para PENDING                          │
├──────────────────────────────────────────────────────────────┤
│  Cancelar Fatura (JÁ FUNCIONA)                               │
│  └→ Chama asaas-cancel-payment                               │
│  └→ Asaas marca como DELETED                                 │
├──────────────────────────────────────────────────────────────┤
│  Aplicar Desconto (JÁ FUNCIONA)                              │
│  └→ Chama asaas-update-payment                               │
│  └→ Asaas atualiza valor da cobrança                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Serem Criados

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/asaas-receive-in-cash/index.ts` | Confirmar recebimento manual no Asaas |
| `supabase/functions/asaas-undo-receive-in-cash/index.ts` | Desfazer confirmação de recebimento |

---

## Arquivos a Serem Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useFaturas.ts` | Modificar `useRegistrarPagamento`, `useEstornarPagamento`, `useReabrirFatura` |
| `supabase/config.toml` | Adicionar configuração das novas functions |

---

## Tratamento de Erros

- Se a sincronização com Asaas falhar, o pagamento **ainda será salvo localmente**
- Um `toast.warning` será exibido informando que a sincronização pode estar pendente
- Logs serão registrados em `gateway_transaction_logs` para auditoria
- Não bloquear o fluxo do usuário por falhas de gateway

---

## Considerações de Segurança

- Edge Functions usam `verify_jwt = true` (autenticação obrigatória)
- Credenciais do Asaas são obtidas via sistema de tenant/gateway existente
- Todas as operações são logadas para auditoria

---

## Impacto

- **Nenhuma quebra** em funcionalidades existentes
- **Nenhuma perda** de dados
- **Transparente** para o usuário (sincronização em background)
- Sistema mantém **consistência** entre banco local e gateway de pagamento
