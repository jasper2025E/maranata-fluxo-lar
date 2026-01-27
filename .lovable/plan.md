
# Plano: Sistema de Sincronização Dinâmica com Gateway Padrão

## Resumo da Mudança
Atualizar o sistema de faturamento para que o botão "Sincronizar" use **automaticamente** o gateway que estiver configurado como padrão no sistema (Asaas, Mercado Pago, Stripe, etc.), em vez de estar fixo ao Asaas.

## O Que Funciona Hoje (Não Será Alterado)
- Configurações de gateway já existentes
- Chaves API já cadastradas
- Toda a lógica de criptografia de secrets
- A integração Asaas já funcionando
- O fluxo de criação de faturas

---

## Mudanças Propostas

### 1. Frontend - Botão Genérico "Sincronizar"

**Arquivo:** `src/pages/Faturas.tsx`

- Renomear o botão de "Sincronizar ASAAS" → "Sincronizar"
- Manter a lógica atual, mas usar uma edge function genérica

```text
Antes:  <Button>Sincronizar ASAAS</Button>
Depois: <Button>Sincronizar</Button>
```

### 2. Novo Hook - `useGatewaySync`

**Novo arquivo:** `src/hooks/useGatewaySync.ts`

Hook que abstrai a sincronização com qualquer gateway:

- Detectar automaticamente qual gateway está configurado como padrão
- Chamar a edge function apropriada baseada no tipo de gateway
- Retornar feedback consistente independente do gateway

```text
Funcionalidades:
├── getDefaultGateway() → Retorna info do gateway padrão do tenant
├── syncFatura(faturaId) → Sincroniza com o gateway padrão
├── syncMultipleFaturas(faturaIds[]) → Sincronização em lote
└── isGatewayConfigured → Boolean indicando se há gateway ativo
```

### 3. Edge Function - `gateway-sync-payment`

**Novo arquivo:** `supabase/functions/gateway-sync-payment/index.ts`

Edge function genérica que:

1. Busca o gateway padrão do tenant via `getDefaultTenantGateway()`
2. Roteia para a lógica apropriada baseada no `gateway_type`
3. Retorna dados padronizados (PIX, boleto, link de pagamento)

```text
Fluxo:
┌─────────────────────┐
│ Frontend solicita   │
│ sincronização       │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ gateway-sync-payment│
│ Edge Function       │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Detecta gateway     │
│ padrão do tenant    │
└──────────┬──────────┘
           ▼
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ Asaas   │ │ Outros  │
│ (atual) │ │ (futuro)│
└─────────┘ └─────────┘
```

### 4. Atualizar Hook Existente - `useFaturaAsaasSync.ts`

**Arquivo:** `src/hooks/useFaturaAsaasSync.ts`

Refatorar para usar a nova edge function genérica:

- Manter as funções atuais para retrocompatibilidade
- Adicionar novas funções que usam o gateway dinâmico

---

## Segurança (Garantias)

- **Nenhuma chave API será alterada ou removida**
- **Nenhuma configuração de gateway existente será modificada**
- **O fluxo atual com Asaas continua funcionando exatamente igual**
- A mudança é apenas na camada de roteamento/abstração

---

## Detalhes Técnicos

### Estrutura do Gateway Padrão (já existe no banco)

```sql
-- Tabela tenant_gateway_configs já tem:
-- is_default: boolean  -- Indica qual é o gateway padrão
-- is_active: boolean   -- Indica se está ativo
-- gateway_type: enum   -- asaas, mercado_pago, stripe, etc.
```

### Resposta Padronizada da Edge Function

```json
{
  "success": true,
  "gatewayType": "asaas",
  "paymentId": "pay_xxx",
  "pixQrCode": "base64...",
  "boletoBarcode": "23793.38128...",
  "paymentUrl": "https://..."
}
```

---

## Arquivos a Serem Modificados/Criados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Faturas.tsx` | Modificar | Remover "ASAAS" do texto do botão |
| `src/hooks/useGatewaySync.ts` | Criar | Hook para detectar e usar gateway padrão |
| `supabase/functions/gateway-sync-payment/index.ts` | Criar | Edge function genérica de sincronização |
| `src/hooks/useFaturaAsaasSync.ts` | Modificar | Usar nova edge function |
| `src/components/faturas/BulkActionsBar.tsx` | Modificar | Atualizar referências ao Asaas |

---

## Resultado Esperado

1. O botão "Sincronizar" funcionará com **qualquer gateway** configurado como padrão
2. Se o Asaas for o padrão → continua sincronizando com Asaas (comportamento atual)
3. Se outro gateway for configurado como padrão no futuro → funcionará automaticamente
4. Interface mais limpa sem mencionar gateway específico

---

## Benefícios

- **Flexibilidade**: Trocar de gateway sem alterar código
- **Manutenibilidade**: Lógica centralizada em uma edge function
- **Experiência do usuário**: Interface genérica que se adapta
- **Compatibilidade**: 100% retrocompatível com a configuração atual
