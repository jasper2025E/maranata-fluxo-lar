import { QueryClient } from "@tanstack/react-query";

// Query client singleton para permitir acesso global
// Isso permite que o AuthContext limpe o cache ao fazer logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos - dados ficam "frescos" por 30s
      gcTime: 1000 * 60 * 10, // 10 minutos de cache
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Sempre verifica ao montar componente
    },
    mutations: {
      // Após mutation, força refetch imediato das queries invalidadas
      onSettled: () => {
        // Mutations individuais já fazem invalidação - isso é fallback
      },
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
