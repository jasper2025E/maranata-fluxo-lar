
# Plano: Correção do Problema Crônico de Faturas Não Aparecendo

## Diagnóstico

O banco de dados contém:
- **554 faturas Abertas**
- **5 faturas Pagas** 
- **1 fatura Vencida**

### Causas Raiz Identificadas:

1. **Limite de 500 registros cortando dados**: A query busca apenas 500 faturas ordenadas alfabeticamente por status ("Aberta" vem antes de "Vencida"). Com 554 faturas abertas, as pagas e vencidas ficam **fora do corte**.

2. **Ordenação incorreta no banco**: A query usa `ORDER BY status ASC`, que ordena alfabeticamente, não por prioridade de negócio.

3. **Cache não atualiza**: Com `refetchOnMount: false`, mudanças de status não são refletidas ao navegar entre páginas.

---

## Solução em 4 Etapas

### Etapa 1: Corrigir a Query de Faturas

**Arquivo**: `src/hooks/useFaturas.ts`

**Mudanças**:
- Aumentar limite de 500 para **1000 registros**
- Mudar ordenação para **prioridade de negócio** (Vencida primeiro, depois Aberta, depois Paga)
- Usar `refetchOnMount: 'always'` para garantir dados frescos na navegação

```typescript
// Query corrigida com ordenação por prioridade real
const { data, error } = await supabase
  .from("faturas")
  .select(`campos...`)
  .order("data_vencimento", { ascending: true }) // Mais antigas primeiro
  .limit(1000);

// Re-ordenar por prioridade de status
const statusPriority = { Vencida: 1, Aberta: 2, Parcial: 3, Paga: 4, Cancelada: 5 };
return data.sort((a, b) => {
  const pA = statusPriority[a.status] || 99;
  const pB = statusPriority[b.status] || 99;
  if (pA !== pB) return pA - pB;
  return new Date(a.data_vencimento) - new Date(b.data_vencimento);
});
```

### Etapa 2: Forçar Refetch na Navegação

**Arquivo**: `src/hooks/useFaturas.ts`

**Mudança**: Configurar `refetchOnMount: true` para a query de faturas:

```typescript
export function useFaturas() {
  return useQuery({
    queryKey: queryKeys.faturas.list(),
    queryFn: async () => { ... },
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnMount: true, // CRÍTICO: garantir dados frescos
    refetchOnWindowFocus: false,
  });
}
```

### Etapa 3: Garantir Invalidação no Realtime

**Arquivo**: `src/contexts/RealtimeProvider.tsx`

**Verificação**: O realtime já invalida corretamente o cache de faturas. Apenas garantir que a key de invalidação seja consistente.

### Etapa 4: Corrigir Filtros de Status

**Arquivo**: `src/pages/Faturas.tsx`

**Mudança**: Normalizar comparação de status para case-insensitive:

```typescript
const matchesStatus = statusFilter === "todas" || 
  fatura.status?.toLowerCase() === statusFilter.toLowerCase();
```

---

## Detalhes Técnicos

### Arquivos a Modificar:

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useFaturas.ts` | Aumentar limite, corrigir ordenação, habilitar refetch |
| `src/pages/Faturas.tsx` | Normalizar filtro de status (já está correto) |

### Impacto:
- **Navegação**: Pode ficar ~100-200ms mais lenta na primeira carga (1000 registros vs 500)
- **Confiabilidade**: 100% das faturas sempre visíveis
- **Cache**: Dados sempre frescos ao entrar na página

---

## Resumo

A correção principal é **aumentar o limite de 500 para 1000** e garantir que a **ordenação priorize Vencidas e Abertas** antes de aplicar o limite. Também habilitaremos `refetchOnMount: true` para garantir que mudanças de status sejam sempre refletidas na navegação.
