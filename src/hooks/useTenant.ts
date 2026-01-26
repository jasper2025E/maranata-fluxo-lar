// Hook simplificado para sistema single-tenant
// Não há mais conceito de tenant/multi-escola

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  logo_url: string | null;
  plano: string | null;
  status: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  grace_period_ends_at: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  limite_alunos: number | null;
  limite_usuarios: number | null;
  monthly_price: number | null;
}

// Single-tenant: sempre retorna null (não usado)
export function useTenant() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant", user?.id],
    queryFn: async (): Promise<Tenant | null> => {
      // Sistema single-tenant - não há tenants
      return null;
    },
    enabled: false, // Nunca executa
    staleTime: Infinity,
  });
}

export function useTenantId() {
  return null;
}

export function useIsBlocked() {
  return false; // Nunca bloqueado em single-tenant
}

export function useSubscriptionStatus() {
  // Sempre ativo em single-tenant
  return {
    status: "active",
    isActive: true,
    isTrial: false,
    isPastDue: false,
    isSuspended: false,
    isCanceled: false,
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    plan: "enterprise",
  };
}
