import { QueryClient } from "@tanstack/react-query";

// Query client singleton para permitir acesso global
// Isso permite que o AuthContext limpe o cache ao fazer logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos - reduz refetches desnecessários
      gcTime: 1000 * 60 * 15, // 15 minutos de cache
      retry: 1, // Reduzido para 1 - falhas rápidas
      retryDelay: 500, // Delay curto entre retries
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Não refetch automático se dados estão frescos
      refetchOnReconnect: false,
      networkMode: 'offlineFirst', // Usa cache primeiro, depois rede
    },
    mutations: {
      retry: 1,
      retryDelay: 300,
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
