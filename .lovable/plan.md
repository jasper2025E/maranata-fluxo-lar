

# Plano: Sistema de Atualização em Tempo Real Robusto

## Diagnóstico Confirmado

Os dados estão 100% corretos no banco de dados:

| Métrica | Valor no Banco |
|---------|----------------|
| Faturas Pagas | 2 (R$ 460,00) |
| Pagamentos Fev/2026 | 2 (R$ 460,00) |
| Faturas Abertas/Vencidas | 504 (R$ 92.468,00) |

**Por que não reflete no frontend?**

O hook `useFaturaKPIs` não tem subscription Realtime - ele não atualiza automaticamente quando os dados mudam. O cache antigo permanece até expirar (60 segundos).

## Problema: Arquitetura de Cache Fragmentada

```text
┌─────────────────────────────────────────────────────────────────┐
│  useFaturas (com Realtime)                                      │
│  ├── queryKeys.faturas.all → ['faturas']                        │
│  └── Invalida: queryKeys.faturas.all                            │
│       ❌ NÃO inclui ['faturas', 'kpis']                         │
├─────────────────────────────────────────────────────────────────┤
│  useFaturaKPIs (SEM Realtime)                                   │
│  ├── queryKey: ['faturas', 'kpis']                              │
│  └── ❌ Nunca é invalidado automaticamente                      │
├─────────────────────────────────────────────────────────────────┤
│  useDashboardStats (com Realtime)                               │
│  ├── queryKey: ['dashboard', 'stats']                           │
│  └── ✅ Atualiza ao receber eventos de pagamentos               │
└─────────────────────────────────────────────────────────────────┘
```

## Solução: Unificar Sistema de Atualização

### Parte 1: Adicionar Realtime ao useFaturaKPIs

Modificar o hook para incluir subscription Realtime que invalida o cache quando faturas ou pagamentos mudam:

```typescript
// src/hooks/useFaturas.ts - useFaturaKPIs
export function useFaturaKPIs() {
  const queryClient = useQueryClient();

  // Adicionar subscription Realtime
  useEffect(() => {
    const channel = supabase
      .channel("faturas-kpis-realtime")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "faturas" },
        () => {
          console.log("[useFaturaKPIs] Fatura changed - refresh KPIs");
          queryClient.invalidateQueries({ queryKey: queryKeys.faturas.kpis() });
        }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "pagamentos" },
        () => {
          console.log("[useFaturaKPIs] Pagamento changed - refresh KPIs");
          queryClient.invalidateQueries({ queryKey: queryKeys.faturas.kpis() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    // ... configuração existente
    refetchOnMount: true,  // Garantir dados frescos ao montar
  });
}
```

### Parte 2: Invalidação Centralizada no useFaturas

Quando o realtime detectar mudanças, invalidar TODOS os caches relacionados:

```typescript
// src/hooks/useFaturas.ts - useFaturas realtime handler
.on("postgres_changes", 
  { event: "*", schema: "public", table: "pagamentos" },
  () => {
    // Invalidar lista de faturas
    queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
    // Invalidar KPIs
    queryClient.invalidateQueries({ queryKey: queryKeys.faturas.kpis() });
    // Invalidar dashboard global
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  }
)
```

### Parte 3: Configuração de Cache Otimizada

Ajustar `staleTime` e adicionar `refetchOnMount: true` para KPIs:

```typescript
// useFaturaKPIs
return useQuery({
  queryKey: queryKeys.faturas.kpis(),
  queryFn: async () => { ... },
  staleTime: 1000 * 30,     // 30 segundos
  refetchOnMount: true,      // Sempre buscar dados frescos ao montar
  refetchOnWindowFocus: false,
});
```

## Resultado Esperado

```text
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: Pagamento inserido via trigger SQL                   │
│                          ↓                                      │
│  Supabase Realtime → Notifica todos os channels ativos         │
│                          ↓                                      │
│  useFaturas ──────→ Invalida ['faturas']                       │
│  useFaturaKPIs ───→ Invalida ['faturas', 'kpis']               │
│  useDashboardStats → Invalida ['dashboard', 'stats']           │
│                          ↓                                      │
│  React Query → Refetch automático de todos os dados            │
│                          ↓                                      │
│  UI Atualizada instantaneamente em todas as telas              │
└─────────────────────────────────────────────────────────────────┘
```

| Antes | Depois |
|-------|--------|
| KPIs desatualizados até refresh manual | KPIs atualizados em <1 segundo |
| Cache fragmentado entre hooks | Cache unificado e sincronizado |
| Usuário precisa fazer F5 | Zero fricção - automático |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useFaturas.ts` | Adicionar Realtime ao `useFaturaKPIs`, unificar invalidação |

## Garantias de Segurança

- Sem alteração de estrutura do banco
- Sem exclusão de dados
- Apenas ajuste de lógica de cache no frontend
- 100% retrocompatível
- Realtime já está habilitado para `pagamentos` e `faturas`

