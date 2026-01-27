
# Plano: Controle Total sobre Faturas (Deletar, Editar Status, Reverter)

## Objetivo
Dar ao administrador controle total sobre as faturas do sistema:
1. **Deletar faturas** - Remover completamente do sistema E do ASAAS (não apenas "cancelar")
2. **Editar faturas pagas** - Permitir reverter status de "Paga" para "Aberta" ou "Vencida" (para corrigir erros)
3. **Deletar faturas pagas** - Permitir excluir qualquer fatura, independente do status

---

## Situação Atual

### Problemas Identificados

| Problema | Localização | Impacto |
|----------|-------------|---------|
| Faturas são "canceladas", não deletadas | `useCancelarFatura` em `useFaturas.ts` | Ficam no banco com status "Cancelada" |
| Faturas pagas não podem ser editadas | `isEditable` em `FaturaDetails.tsx` linha 763 | Usuário não consegue corrigir erros |
| Não existe função para deletar fatura | `useFaturas.ts` | Não há opção de remover permanentemente |
| Ao desativar aluno, faturas apenas mudam status | `useDeleteAluno` em `useAlunos.ts` | Cobranças permanecem no ASAAS |

### Código Atual que Bloqueia Edição
```typescript
// FaturaDetails.tsx - linha 763
const isEditable = !fatura.bloqueada && fatura.status !== 'Paga' && fatura.status !== 'Cancelada';
```

### Fluxo Atual de "Cancelamento"
```
[Cancelar Fatura] → DELETE /payments/{id} no ASAAS → status local = "Cancelada"
```
O registro permanece no banco de dados com status "Cancelada".

---

## Mudanças Propostas

### 1. Criar Hook `useDeleteFatura` para Exclusão Permanente

**Arquivo:** `src/hooks/useFaturas.ts`

**Nova função:**
```typescript
export function useDeleteFatura() {
  return useMutation({
    mutationFn: async (faturaId: string) => {
      // 1. Buscar fatura
      const { data: fatura } = await supabase
        .from("faturas")
        .select("asaas_payment_id, status")
        .eq("id", faturaId)
        .single();

      // 2. Se tem cobrança ASAAS, deletar lá primeiro
      if (fatura?.asaas_payment_id) {
        await supabase.functions.invoke("asaas-cancel-payment", {
          body: { faturaId, motivo: "Fatura excluída permanentemente" }
        });
      }

      // 3. Deletar registros relacionados (itens, descontos, pagamentos)
      await supabase.from("fatura_itens").delete().eq("fatura_id", faturaId);
      await supabase.from("fatura_descontos").delete().eq("fatura_id", faturaId);
      await supabase.from("fatura_historico").delete().eq("fatura_id", faturaId);
      await supabase.from("pagamentos").delete().eq("fatura_id", faturaId);

      // 4. Deletar a fatura permanentemente
      await supabase.from("faturas").delete().eq("id", faturaId);
    }
  });
}
```

---

### 2. Criar Hook `useReabrirFatura` para Reverter Status

**Arquivo:** `src/hooks/useFaturas.ts`

**Nova função:**
```typescript
export function useReabrirFatura() {
  return useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: 'Aberta' | 'Vencida' }) => {
      // Buscar fatura para saber o valor original
      const { data: fatura } = await supabase
        .from("faturas")
        .select("valor_total, valor")
        .eq("id", id)
        .single();

      // Atualizar status e restaurar saldo
      await supabase.from("faturas").update({
        status: novoStatus,
        saldo_restante: fatura?.valor_total || fatura?.valor || 0
      }).eq("id", id);

      // Opcional: Deletar pagamentos registrados (ou marcar como estornados)
      // Depende da preferência do usuário
    }
  });
}
```

---

### 3. Permitir Edição de Faturas Pagas

**Arquivo:** `src/components/faturas/FaturaDetails.tsx`

**Mudança na linha 763:**
```typescript
// ANTES:
const isEditable = !fatura.bloqueada && fatura.status !== 'Paga' && fatura.status !== 'Cancelada';

// DEPOIS:
const isEditable = !fatura.bloqueada && fatura.status !== 'Cancelada';
// Fatura paga agora pode ser editada!
```

---

### 4. Adicionar Ações na Interface

**Arquivo:** `src/components/faturas/FaturaTable.tsx`

**Novas opções no dropdown:**

| Status Atual | Novas Opções |
|--------------|--------------|
| Paga | "Reabrir fatura", "Excluir permanentemente" |
| Aberta/Vencida | "Excluir permanentemente" |
| Cancelada | "Excluir permanentemente" |

**Código adicional:**
```typescript
// No dropdown de ações (linhas 210-275)
{fatura.status === "Paga" && (
  <>
    <DropdownMenuItem onClick={() => onReopen?.(fatura)}>
      <RefreshCw className="h-4 w-4 mr-2" />Reabrir fatura
    </DropdownMenuItem>
  </>
)}

<DropdownMenuSeparator />
<DropdownMenuItem 
  onClick={() => onDelete?.(fatura)} 
  className="text-destructive"
>
  <Trash2 className="h-4 w-4 mr-2" />Excluir permanentemente
</DropdownMenuItem>
```

---

### 5. Atualizar Exclusão de Aluno para Deletar (não cancelar)

**Arquivo:** `src/hooks/useAlunos.ts`

**Mudança no `useDeleteAluno`:**
```typescript
// ANTES: Apenas muda status para "Cancelada"
await supabase.from("faturas").update({
  status: 'Cancelada',
  ...
}).eq("id", fatura.id);

// DEPOIS: Deleta permanentemente
await supabase.from("fatura_itens").delete().eq("fatura_id", fatura.id);
await supabase.from("fatura_descontos").delete().eq("fatura_id", fatura.id);
await supabase.from("fatura_historico").delete().eq("fatura_id", fatura.id);
await supabase.from("pagamentos").delete().eq("fatura_id", fatura.id);
await supabase.from("faturas").delete().eq("id", fatura.id);
```

---

### 6. Adicionar Confirmação de Segurança

**Arquivo:** `src/pages/Faturas.tsx`

**Dialog de confirmação antes de excluir:**
```typescript
const handleDeleteFatura = async (fatura: Fatura) => {
  // Mostrar AlertDialog com aviso
  const confirmed = await showConfirmDialog({
    title: "Excluir fatura permanentemente?",
    description: fatura.status === "Paga" 
      ? "Esta fatura já foi paga. O pagamento será removido e a cobrança será excluída do gateway. Esta ação NÃO pode ser desfeita."
      : "A fatura e todos os dados relacionados serão excluídos permanentemente. Esta ação NÃO pode ser desfeita.",
  });

  if (confirmed) {
    await deleteFatura.mutateAsync(fatura.id);
  }
};
```

---

## Fluxo Visual - Novas Opções

```
┌─────────────────────────────────────────────────────────────────┐
│                     MENU DE AÇÕES DA FATURA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FATURA ABERTA/VENCIDA:                                         │
│  ├── Ver detalhes                                               │
│  ├── Editar                                                     │
│  ├── Registrar pagamento                                        │
│  ├── Cancelar                                                   │
│  └── ⚠️ Excluir permanentemente (NOVO)                          │
│                                                                  │
│  FATURA PAGA:                                                   │
│  ├── Ver detalhes                                               │
│  ├── Editar (ANTES: bloqueado)                                  │
│  ├── Enviar recibo                                              │
│  ├── Baixar recibo                                              │
│  ├── 🔄 Reabrir fatura (NOVO)                                   │
│  └── ⚠️ Excluir permanentemente (NOVO)                          │
│                                                                  │
│  FATURA CANCELADA:                                              │
│  ├── Ver detalhes                                               │
│  └── ⚠️ Excluir permanentemente (NOVO)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useFaturas.ts` | Adicionar `useDeleteFatura` e `useReabrirFatura` |
| `src/components/faturas/FaturaTable.tsx` | Adicionar props `onDelete` e `onReopen`, novas opções no dropdown |
| `src/components/faturas/FaturaDetails.tsx` | Remover bloqueio de edição para faturas pagas |
| `src/pages/Faturas.tsx` | Implementar handlers `handleDeleteFatura` e `handleReopenFatura` com confirmação |
| `src/hooks/useAlunos.ts` | Alterar `useDeleteAluno` para deletar faturas em vez de cancelar |

---

## Garantias de Segurança

- **Confirmação obrigatória** - Toda exclusão permanente exige confirmação do usuário
- **Aviso especial para pagas** - Alerta diferenciado quando a fatura já foi paga
- **ASAAS sincronizado** - Antes de deletar localmente, deleta no gateway
- **Cascade completo** - Remove itens, descontos, histórico e pagamentos junto com a fatura
- **Logs mantidos** - O histórico de operações permanece para auditoria (opcional)

---

## Benefícios

| Antes | Depois |
|-------|--------|
| Não podia corrigir erro de "paga" | Pode reabrir fatura e corrigir |
| Faturas canceladas acumulavam | Pode excluir permanentemente |
| Edição bloqueada após pagamento | Edição permitida sempre |
| Aluno desativado = faturas "canceladas" | Aluno desativado = faturas removidas |
| Dados inconsistentes entre sistema e ASAAS | Sincronização total de exclusão |
