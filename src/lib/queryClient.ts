import { QueryClient } from "@tanstack/react-query";

// Query client singleton para permitir acesso global
// Isso permite que o AuthContext limpe o cache ao fazer logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - evita refetches na navegação
      gcTime: 1000 * 60 * 30, // 30 minutos de cache em memória
      retry: 1,
      retryDelay: 300,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Usa cache se disponível
      refetchOnReconnect: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      retryDelay: 200,
    },
  },
});

/**
 * Invalida queries e força refetch imediato
 * Use em vez de queryClient.invalidateQueries para garantir atualização
 */
export function forceRefetch(queryKey: readonly unknown[]) {
  queryClient.invalidateQueries({ 
    queryKey, 
    refetchType: 'all',
  });
}

/**
 * Limpa todo o cache do React Query
 * Deve ser chamado ao fazer logout ou trocar de usuário
 */
export function clearQueryCache() {
  queryClient.clear();
}

/**
 * Invalida todas as queries relacionadas a dados do tenant
 * Útil quando o usuário troca de escola
 */
export function invalidateTenantQueries() {
  const tenantRelatedKeys = [
    "alunos",
    "faturas",
    "cursos",
    "turmas",
    "despesas",
    "pagamentos",
    "responsaveis",
    "funcionarios",
    "escola",
    "tenant",
    "notifications",
    "dashboard",
  ];

  tenantRelatedKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}
