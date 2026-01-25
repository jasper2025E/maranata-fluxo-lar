import { QueryClient } from "@tanstack/react-query";

// Query client singleton para permitir acesso global
// Isso permite que o AuthContext limpe o cache ao fazer logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Limpa todo o cache do React Query
 * Deve ser chamado ao fazer logout ou trocar de usuário
 */
export function clearQueryCache() {
  queryClient.clear();
  console.log("[QueryClient] Cache limpo após mudança de usuário");
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

  console.log("[QueryClient] Queries de tenant invalidadas");
}
