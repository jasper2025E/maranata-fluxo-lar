

# Plano: Sincronização Bidirecional Completa Sistema ↔ ASAAS

## Objetivo
Garantir que **TODAS** as alterações feitas no sistema reflitam automaticamente no ASAAS, eliminando a necessidade de mexer em dois lugares.

---

## Mudanças Propostas

### 1. Cancelar Fatura → Cancelar no ASAAS

**Problema atual:** `useCancelarFatura` só atualiza banco local, não chama o ASAAS.

**Solução:** Integrar a Edge Function `asaas-cancel-payment` no hook de cancelamento.

**Arquivos afetados:**
- `src/hooks/useFaturas.ts` - Alterar `useCancelarFatura` para chamar `asaas-cancel-payment`

**Comportamento:**
1. Usuário cancela fatura no sistema
2. Sistema chama `asaas-cancel-payment` (DELETE na cobrança)
3. ASAAS marca como cancelada
4. Banco local atualiza status para "Cancelada"

---

### 2. Excluir Aluno → Cancelar Faturas e Cobranças

**Problema atual:** Excluir aluno faz soft delete mas não cancela faturas/cobranças pendentes.

**Solução:** Ao desativar aluno, cancelar automaticamente todas as faturas abertas e suas cobranças no ASAAS.

**Arquivos afetados:**
- `src/hooks/useAlunos.ts` - Alterar `useDeleteAluno` para:
  1. Buscar faturas abertas do aluno
  2. Para cada fatura com `asaas_payment_id`, chamar `asaas-cancel-payment`
  3. Marcar faturas como canceladas
  4. Fazer soft delete do aluno

**Comportamento:**
1. Usuário exclui/desativa aluno
2. Sistema busca faturas abertas
3. Cancela cada cobrança no ASAAS
4. Atualiza status das faturas para "Cancelada"
5. Desativa o aluno

---

### 3. Atualizar Responsável → Atualizar Cliente no ASAAS

**Problema atual:** Não existe função para atualizar cliente no ASAAS quando CPF/email mudam.

**Solução:** Criar nova Edge Function `asaas-update-customer`.

**Arquivos a criar:**
- `supabase/functions/asaas-update-customer/index.ts`

**Arquivos afetados:**
- `src/pages/Responsaveis.tsx` - Após atualizar responsável, chamar `asaas-update-customer`

**Comportamento:**
1. Usuário edita responsável (CPF, email, telefone, nome)
2. Sistema salva no banco
3. Se responsável tem `asaas_customer_id`, chama `asaas-update-customer`
4. ASAAS atualiza dados do cliente

---

### 4. Registrar Pagamento Manual → Sincronizar com ASAAS (Opcional)

**Nota:** Esta é uma funcionalidade mais complexa, pois o ASAAS normalmente detecta pagamentos automaticamente via webhook.

**Recomendação:** Manter o fluxo atual onde pagamentos são detectados pelo webhook. Se você registrar pagamento manual no sistema, ele fica apenas local - o que é válido para casos excepcionais (dinheiro em mãos, por exemplo).

---

## Resumo Visual do Fluxo

```text
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA LOCAL                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Cancelar Fatura] ──────► asaas-cancel-payment ────┐       │
│                                                      │       │
│  [Excluir Aluno] ─► Cancel faturas ─► asaas-cancel ─┼──►    │
│                                                      │       │
│  [Editar Responsável] ──► asaas-update-customer ────┼──►    │
│                                                      │       │
│  [Criar Fatura] ────────► asaas-create-payment ─────┼──►    │
│                                                      │       │
│  [Aplicar Desconto] ────► asaas-update-payment ─────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         ASAAS                                │
├─────────────────────────────────────────────────────────────┤
│  • Cobranças criadas/atualizadas/canceladas automaticamente │
│  • Clientes atualizados quando dados mudam                  │
│  • Webhook notifica sistema quando pagamento é recebido     │
└─────────────────────────────────────────────────────────────┘
```

---

## Ordem de Implementação

1. **Cancelar Fatura com ASAAS** (mais urgente)
2. **Excluir Aluno cancela cobranças**
3. **Criar Edge Function `asaas-update-customer`**
4. **Integrar atualização de responsável**

---

## Garantias de Segurança

- Todas as alterações são **incrementais** - não afetam código existente
- **Nenhum dado será apagado** - apenas status serão alterados
- **API Key e configurações preservadas** - usamos as credenciais já existentes
- **Fallback silencioso** - se ASAAS falhar, operação local continua (com aviso)

---

## Detalhes Técnicos

### Alteração em `useCancelarFatura` (useFaturas.ts):

```typescript
export function useCancelarFatura() {
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      // 1. Buscar fatura para verificar se tem cobrança ASAAS
      const { data: fatura } = await supabase
        .from("faturas")
        .select("asaas_payment_id")
        .eq("id", id)
        .single();
      
      // 2. Se tem cobrança ASAAS, cancelar lá primeiro
      if (fatura?.asaas_payment_id) {
        await supabase.functions.invoke("asaas-cancel-payment", {
          body: { faturaId: id, motivo },
        });
      }
      
      // 3. Atualizar banco local
      await supabase.from("faturas").update({
        status: 'Cancelada',
        cancelada_em: new Date().toISOString(),
        motivo_cancelamento: motivo,
      }).eq("id", id);
    },
  });
}
```

### Nova Edge Function `asaas-update-customer`:

```typescript
// PUT /customers/{customerId}
const updateData = {
  name: responsavel.nome,
  cpfCnpj: responsavel.cpf?.replace(/\D/g, ''),
  email: responsavel.email,
  phone: responsavel.telefone?.replace(/\D/g, ''),
};

await fetch(`${ASAAS_API_URL}/customers/${asaas_customer_id}`, {
  method: "PUT",
  headers: { "access_token": ASAAS_API_KEY },
  body: JSON.stringify(updateData),
});
```

---

## Benefícios

- **Zero retrabalho**: Alterar no sistema = alterar no ASAAS
- **Dados consistentes**: Nunca haverá divergência
- **Operação simplificada**: Um lugar só para gerenciar tudo
- **Cobranças limpas**: Ao desativar aluno, cobranças são automaticamente canceladas

