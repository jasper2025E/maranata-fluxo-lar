
# Plano: Sistema de Sincronização Automática Robusto e Seguro

## Diagnóstico Completo - Status Atual

### O que JÁ está funcionando corretamente:

| Componente | Status | Descrição |
|------------|--------|-----------|
| Cron Job | ✅ OK | `sync-asaas-payments-every-5min` executando a cada 5 minutos com sucesso |
| Webhook Asaas | ✅ OK | Configurado e processando eventos com idempotência |
| Realtime Provider | ✅ OK | Canal global unificado escutando 8 tabelas principais |
| Triggers SQL | ✅ OK | `sync_fatura_status_from_asaas` + `init_saldo_restante` funcionando |
| Integridade de Dados | ✅ OK | Zero faturas inconsistentes no momento |
| Priorização Vencidas | ✅ OK | Cron processa faturas vencidas primeiro (100) antes das abertas (50) |

### Gaps Identificados para Resolver:

| Issue | Risco | Descrição |
|-------|-------|-----------|
| Faturas sem asaas_payment_id | Médio | Faturas locais não sincronizadas ficam invisíveis para o cron |
| Webhook pode não chegar | Médio | Se Asaas falha em enviar webhook, depende 100% do cron |
| Status local vs gateway | Baixo | Atualmente só sync verifica, mas não notifica usuário |
| Outros gateways | Placeholder | Stripe/MercadoPago ainda não implementados |

---

## Melhorias a Implementar

### 1. Proteção Contra Faturas "Órfãs" (Sem Gateway Sync)

Criar verificação periódica para detectar faturas abertas SEM `asaas_payment_id` e alertar admin:

```typescript
// Nova função no sync-asaas-payments para detectar órfãs
const { data: faturasOrfas } = await supabase
  .from("faturas")
  .select("id, aluno_id, data_vencimento, valor")
  .is("asaas_payment_id", null)
  .eq("status", "Aberta")
  .lt("data_vencimento", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  .limit(20);

if (faturasOrfas?.length) {
  // Criar notificação de alerta
  await supabase.from("notifications").insert({
    title: "Faturas sem Cobrança",
    message: `${faturasOrfas.length} faturas vencem em breve sem cobrança no gateway`,
    type: "warning",
    link: "/faturas"
  });
}
```

### 2. Melhorar Resiliência do Webhook

Adicionar validação de duplicidade e retry no webhook handler:

```typescript
// Já existe idempotência por status, adicionar por timestamp
const { data: recentWebhook } = await supabase
  .from("webhook_logs")
  .select("id")
  .eq("source", "asaas")
  .contains("payload", { payment: { id: payment.id } })
  .eq("status", "processed")
  .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
  .maybeSingle();

if (recentWebhook) {
  // Mesmo webhook já processado recentemente
  return Response.json({ skipped: true, reason: "duplicate_event" });
}
```

### 3. Sincronização Bidirecional Melhorada

Atualizar o `gateway-sync-payment` para sempre sincronizar status do Asaas quando consultar:

```typescript
// Em getAsaasPaymentData - já existe, mas garantir que atualiza status local
if (payment.status !== fatura.asaas_status) {
  const statusMap = {
    'RECEIVED': 'Paga', 'CONFIRMED': 'Paga', 
    'OVERDUE': 'Vencida', 'PENDING': 'Aberta'
  };
  
  await supabase.from("faturas").update({
    asaas_status: payment.status,
    status: statusMap[payment.status] || fatura.status,
    updated_at: new Date().toISOString()
  }).eq("id", fatura.id);
}
```

### 4. Notificações Automáticas de Inconsistência

Adicionar alerta quando sync detectar divergência:

```typescript
// Quando sync corrige uma fatura, notificar
if (shouldUpdate && newLocalStatus !== localStatus) {
  await supabase.from("notifications").insert({
    tenant_id: fatura.tenant_id,
    title: `Fatura ${fatura.id.slice(0,8)} Sincronizada`,
    message: `Status atualizado: ${localStatus} → ${newLocalStatus}`,
    type: "info",
    link: "/faturas"
  });
}
```

### 5. Dashboard de Saúde da Integração (Opcional - Fase 2)

Criar endpoint para verificar saúde da sincronização:
- Última execução do cron
- Faturas pendentes de sync
- Webhooks recebidos nas últimas 24h
- Erros recentes

---

## Arquitetura Resultante

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA 1: WEBHOOK (Real-time)                    │
│  Asaas → POST /asaas-webhook → Processa imediatamente              │
│  ✅ Idempotente | ✅ Cria pagamento | ✅ Notifica usuário           │
├─────────────────────────────────────────────────────────────────────┤
│                    CAMADA 2: CRON (Failsafe cada 5min)              │
│  pg_cron → sync-asaas-payments → Verifica divergências             │
│  ✅ Prioriza vencidas | ✅ Corrige status | ✅ Registra pagamentos  │
├─────────────────────────────────────────────────────────────────────┤
│                    CAMADA 3: TRIGGER SQL (Garantia Final)           │
│  trigger_sync_fatura_asaas_status → Quando asaas_status muda       │
│  ✅ Atualiza status local | ✅ Cria pagamento se não existe        │
├─────────────────────────────────────────────────────────────────────┤
│                    CAMADA 4: REALTIME (Frontend)                    │
│  RealtimeProvider → Escuta faturas/pagamentos/etc                   │
│  ✅ Invalida cache | ✅ Atualiza UI automaticamente                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/sync-asaas-payments/index.ts` | Adicionar detecção de faturas órfãs e notificações |
| `supabase/functions/asaas-webhook/index.ts` | Melhorar proteção contra duplicatas |
| `supabase/functions/gateway-sync-payment/index.ts` | Garantir sync bidirecional de status |
| `src/contexts/RealtimeProvider.tsx` | Adicionar escuta de `gateway_transaction_logs` (opcional) |

---

## Garantias de Segurança (CRÍTICO)

| Regra | Implementação |
|-------|---------------|
| Sem deleção de dados | Apenas UPDATE, INSERT, SELECT |
| Sem alteração de schema destrutiva | Nenhuma coluna removida |
| Backward compatible | Todas funções mantêm assinatura atual |
| Sem downtime | Edge functions deployam em segundos |
| Dados de produção preservados | Zero risco de perda |

---

## Seção Técnica Detalhada

### Fluxo de Sincronização Completo

1. **Fatura criada** → Trigger `init_saldo_restante` define saldo
2. **Cobrança criada no Asaas** → `asaas_payment_id` salvo na fatura
3. **Pagamento realizado no Asaas** → Webhook recebe evento
4. **Webhook processa** → Atualiza `asaas_status` → Trigger atualiza `status` local
5. **Trigger cria pagamento** → Registro em `pagamentos` tabela
6. **Realtime notifica frontend** → Cache invalidado → UI atualiza

### Se Webhook Falhar

1. **Cron executa a cada 5 minutos** → Consulta API Asaas diretamente
2. **Detecta divergência** → Atualiza `asaas_status`
3. **Trigger dispara** → Mesmo fluxo do webhook
4. **Frontend atualiza** → Via Realtime subscription

### Códigos de Status Mapeados

| Asaas Status | Status Local | Ação |
|--------------|--------------|------|
| PENDING | Aberta | Nenhuma |
| RECEIVED, CONFIRMED, RECEIVED_IN_CASH | Paga | Criar pagamento |
| OVERDUE, DUNNING_REQUESTED | Vencida | Atualizar status |
| REFUNDED, CHARGEBACK | Cancelada | Notificar admin |

---

## Resultado Esperado

Após implementação:
- Zero faturas "presas" ou desincronizadas
- Atualizações refletidas em < 5 minutos (pior caso) ou < 1 segundo (webhook)
- Dashboard sempre atualizado via Realtime
- Notificações automáticas para situações anômalas
- Sistema gateway-agnostic pronto para outros provedores
