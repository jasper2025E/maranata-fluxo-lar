
# Plano de Correção: Sincronização ASAAS em Tempo Real

## Diagnóstico Confirmado

Após análise detalhada do sistema em produção, identifiquei:

| Métrica | Valor |
|---------|-------|
| Total de faturas | 506 |
| Faturas com ASAAS | 506 |
| **Faturas Inconsistentes** | **2** |

As 2 faturas inconsistentes têm `asaas_status: RECEIVED` (confirmado pago pelo ASAAS) mas `status: Aberta` (não refletido no sistema).

### Causa Raiz
1. **Webhook recebido mas atualização parcial**: O webhook está funcionando (logs mostram `status: processed`), mas a atualização do campo `status` local não está ocorrendo corretamente em todos os casos
2. **Sem rede de segurança (Cron)**: Se o webhook falhar, não há mecanismo de recuperação
3. **Frontend sem atualização automática**: A lista de faturas não escuta mudanças em tempo real

---

## Soluções (Sem Quebrar Nada)

### 1. Correção Imediata das Faturas Inconsistentes
Criar uma função SQL segura para sincronizar o status local com o `asaas_status`:

```sql
-- Função para corrigir faturas desincronizadas
CREATE OR REPLACE FUNCTION public.fix_asaas_status_inconsistencies()
RETURNS TABLE(fatura_id uuid, old_status text, new_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE faturas
  SET 
    status = 'Paga',
    saldo_restante = 0,
    updated_at = now()
  WHERE 
    asaas_status IN ('RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED')
    AND status NOT IN ('Paga', 'Cancelada')
  RETURNING id, 'Aberta/Vencida' as old_status, 'Paga' as new_status;
END;
$$;
```

### 2. Webhook Aprimorado com Idempotência
Melhorar o webhook ASAAS para:
- Verificar se o status já foi atualizado antes de processar
- Registrar cada mudança de status com detalhes de log expandidos
- Garantir que TODOS os campos sejam atualizados corretamente

**Mudanças no `asaas-webhook/index.ts`:**
```typescript
// Antes de atualizar, verificar estado atual
const { data: faturaAtual } = await supabase
  .from("faturas")
  .select("status, asaas_status")
  .eq("id", faturaId)
  .single();

// Log detalhado para rastreamento
console.log(`[asaas-webhook] Fatura ${faturaId}: ${faturaAtual?.status} → ${newStatus} (asaas: ${payment.status})`);

// Só atualizar se realmente mudou
if (faturaAtual?.status !== newStatus) {
  // ... update logic
}
```

### 3. Cron de Sincronização (Rede de Segurança)
Criar uma Edge Function e agendar via pg_cron para rodar a cada 5 minutos:

**Nova Edge Function: `sync-asaas-payments/index.ts`**
- Busca todas as faturas com `asaas_payment_id` que NÃO estão Pagas/Canceladas
- Para cada uma, consulta o status atual no ASAAS
- Corrige inconsistências e registra em `gateway_transaction_logs`

**Cron Job:**
```sql
SELECT cron.schedule(
  'sync-asaas-payments-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sznckclviajjmmvsgrpp.supabase.co/functions/v1/sync-asaas-payments',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);
```

### 4. Realtime no Frontend (Lista de Faturas)
Adicionar subscription ao `useFaturas` para atualização automática:

```typescript
useEffect(() => {
  const channel = supabase
    .channel("faturas-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "faturas" },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pagamentos" },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [queryClient]);
```

### 5. Logs Aprimorados
Expandir o webhook para registrar divergências:

| Campo | Descrição |
|-------|-----------|
| `payment_id` | ID do pagamento ASAAS |
| `old_status` | Status anterior no banco local |
| `new_status` | Novo status aplicado |
| `asaas_status` | Status retornado pelo ASAAS |
| `origin` | "Webhook" ou "Sync" |
| `timestamp` | Data/hora da operação |

---

## Sequência de Implementação

```text
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: Correção Imediata (sem risco)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Criar função SQL fix_asaas_status_inconsistencies          │
│  2. Executar para corrigir as 2 faturas pendentes              │
│  3. Validar resultado                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FASE 2: Aprimorar Webhook (idempotência)                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Adicionar verificação de estado atual antes de update      │
│  2. Logs detalhados de divergência                             │
│  3. Deploy do webhook aprimorado                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FASE 3: Criar Cron de Segurança                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Nova Edge Function: sync-asaas-payments                    │
│  2. Agendar cron job (cada 5 minutos)                          │
│  3. Testar sincronização automática                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FASE 4: Realtime no Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Adicionar subscription em useFaturas                       │
│  2. Garantir cache invalidation correto                        │
│  3. Testar atualização automática na UI                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/asaas-webhook/index.ts` | Aprimorar com idempotência e logs expandidos |
| `supabase/functions/sync-asaas-payments/index.ts` | **NOVO** - Edge Function de sincronização |
| `src/hooks/useFaturas.ts` | Adicionar subscription realtime |
| Nova migração SQL | Função de correção + Cron job |

### Edge Function: sync-asaas-payments

```typescript
// Lógica principal
1. Autenticar via service_role (cron job)
2. Buscar faturas abertas/vencidas com asaas_payment_id
3. Para cada fatura (em batches de 10):
   a. Consultar API ASAAS: GET /payments/{id}
   b. Se status ASAAS indica pago mas local não está pago:
      - Atualizar fatura local
      - Criar registro em pagamentos (se não existir)
      - Logar divergência
4. Retornar resumo: { synced: N, errors: [] }
```

### Garantias de Segurança

- **Sem exclusão de dados**: Apenas UPDATE de status
- **Idempotente**: Verificação antes de cada update
- **Sem alterar IDs**: Mantém todos os identificadores
- **Logs completos**: Rastreabilidade total
- **Rollback automático**: Se falhar, não corrompe dados

---

## Resultado Esperado

Após implementação:

| Antes | Depois |
|-------|--------|
| Pagamento ASAAS não reflete no sistema | Atualização automática via webhook + cron |
| Dashboard desatualizado | Realtime em faturas, pagamentos, despesas |
| Sem visibilidade de divergências | Logs detalhados em webhook_logs e gateway_transaction_logs |
| Dependência 100% do webhook | Cron de segurança como backup (5 min) |
| 2 faturas inconsistentes | 0 inconsistências |
