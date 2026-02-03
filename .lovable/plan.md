
# Plano de Correção: sync-asaas-payments

## Diagnóstico

O módulo de faturas não está refletindo pagamentos porque a Edge Function `sync-asaas-payments` está com um **bug crítico**:

| Problema | Detalhe |
|----------|---------|
| Coluna inexistente | O código busca `api_key` diretamente da tabela `tenant_gateway_configs` |
| Coluna inexistente | O código busca `sandbox_mode`, mas o campo correto é `environment` |
| API key não encontrada | Por isso o log mostra "Tenant sem API key Asaas configurada" |

**Logs comprovando o problema:**
```
WARNING [sync-asaas-payments] Tenant a1692822-1e09-4e24-84e1-53bbc22253f0 sem API key Asaas configurada
```

**Mas a API key EXISTE** - está na tabela `tenant_gateway_secrets` (criptografada).

## Solução

Corrigir o `sync-asaas-payments` para usar a função utilitária `getAsaasCredentials()` do `gateway-utils.ts` que já faz:
1. Busca na tabela correta (`tenant_gateway_secrets`)
2. Decriptografa o secret
3. Determina URL da API baseado no `environment`

## Mudanças Necessárias

### Arquivo: `supabase/functions/sync-asaas-payments/index.ts`

**Antes (código incorreto):**
```typescript
// Linhas 72-84 - Busca direta com colunas inexistentes
const { data: gatewayConfig } = await supabase
  .from("tenant_gateway_configs")
  .select("id, api_key, sandbox_mode")  // ❌ Colunas não existem!
  .eq("tenant_id", tenantId)
  ...

if (!gatewayConfig?.api_key) {  // ❌ Sempre undefined
  console.warn(`Tenant ${tenantId} sem API key Asaas configurada`);
  continue;
}
```

**Depois (código corrigido):**
```typescript
import { getAsaasCredentials } from "../_shared/gateway-utils.ts";

// Dentro do loop de tenants:
const credentials = await getAsaasCredentials(supabase, tenantId);

if (!credentials.apiKey) {
  console.warn(`[sync-asaas-payments] Tenant ${tenantId} sem API key Asaas configurada`);
  continue;
}

const ASAAS_API_URL = credentials.apiUrl;
```

## Sequência de Implementação

```text
┌──────────────────────────────────────────────────────────────┐
│  1. Corrigir import e uso de getAsaasCredentials             │
├──────────────────────────────────────────────────────────────┤
│  - Adicionar import de getAsaasCredentials                   │
│  - Substituir query direta por chamada da função utilitária  │
│  - Usar credentials.apiKey e credentials.apiUrl              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Deploy automático da Edge Function                       │
├──────────────────────────────────────────────────────────────┤
│  - O Lovable faz deploy automático após salvar               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Testar sincronização manualmente                         │
├──────────────────────────────────────────────────────────────┤
│  - Invocar a Edge Function para validar                      │
│  - Verificar se faturas inconsistentes são corrigidas        │
└──────────────────────────────────────────────────────────────┘
```

## Detalhes Técnicos

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/sync-asaas-payments/index.ts` | Corrigir busca de credenciais |

### Estrutura Real do Banco

A tabela `tenant_gateway_configs` **não tem** `api_key`:

| Coluna | Tipo |
|--------|------|
| id | uuid |
| tenant_id | uuid |
| gateway_type | enum |
| environment | enum (sandbox/production) |
| is_active | boolean |
| is_default | boolean |
| settings | jsonb |

Os secrets ficam em `tenant_gateway_secrets`:

| Coluna | Tipo |
|--------|------|
| gateway_config_id | uuid (FK) |
| key_name | text (ex: "api_key") |
| encrypted_value | text (AES-256-GCM) |

### Garantias

- Sem alteração de estrutura de banco
- Sem exclusão de dados
- Usa função utilitária já existente e testada
- Mantém compatibilidade com fallback global (`ASAAS_API_KEY` env var)

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| `Tenant sem API key Asaas configurada` | Credentials encontradas e usadas |
| 0 faturas sincronizadas | Faturas com status divergente corrigidas |
| Dashboard desatualizado | Atualização automática via cron + realtime |
