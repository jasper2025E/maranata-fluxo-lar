import { QueryClient } from "@tanstack/react-query";

// Query client singleton para permitir acesso global
// Isso permite que o AuthContext limpe o cache ao fazer logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos - dados ficam "frescos"
      gcTime: 1000 * 60 * 15, // 15 minutos de cache em memória
      retry: 1,
      retryDelay: 300,
      refetchOnWindowFocus: true, // Atualiza ao voltar ao app
      refetchOnMount: 'always', // Sempre verifica dados ao montar
      refetchOnReconnect: true, // Atualiza ao reconectar internet
      networkMode: 'online',
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
