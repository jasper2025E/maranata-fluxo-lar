import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export function useTenant() {
  const { user, isPlatformAdmin } = useAuth();

  return useQuery({
    queryKey: ["tenant", user?.id],
    queryFn: async (): Promise<Tenant | null> => {
      // Platform admins don't have a tenant
      if (isPlatformAdmin()) {
        return null;
      }

      // Get user's tenant_id from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user!.id)
        .single();

      if (profileError || !profile?.tenant_id) {
        console.error("Error fetching profile tenant:", profileError);
        return null;
      }

      // Get tenant details
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single();

      if (tenantError) {
        console.error("Error fetching tenant:", tenantError);
        return null;
      }

      return tenant as Tenant;
    },
    enabled: !!user && !isPlatformAdmin(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useTenantId() {
  const { data: tenant } = useTenant();
  return tenant?.id ?? null;
}

export function useIsBlocked() {
  const { data: tenant } = useTenant();
  
  if (!tenant) return false;
  
  // Check if tenant is blocked
  if (tenant.blocked_at) return true;
  
  // Check if subscription is suspended
  if (tenant.subscription_status === "suspended") return true;
  
  return false;
}

export function useSubscriptionStatus() {
  const { data: tenant } = useTenant();
  
  if (!tenant) return null;
  
  return {
    status: tenant.subscription_status,
    isActive: tenant.subscription_status === "active",
    isTrial: tenant.subscription_status === "trial",
    isPastDue: tenant.subscription_status === "past_due",
    isSuspended: tenant.subscription_status === "suspended",
    isCanceled: tenant.subscription_status === "canceled",
    trialEndsAt: tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null,
    gracePeriodEndsAt: tenant.grace_period_ends_at ? new Date(tenant.grace_period_ends_at) : null,
    plan: tenant.plano,
  };
}
