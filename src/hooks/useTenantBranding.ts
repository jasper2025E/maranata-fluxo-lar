import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenantBranding {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  status: string;
  blocked_at: string | null;
}

/**
 * Hook para buscar branding do tenant pelo slug
 * Usado na tela de login dinâmica por escola
 */
export function useTenantBranding(slug: string | undefined) {
  return useQuery({
    queryKey: ["tenant-branding", "slug", slug],
    queryFn: async (): Promise<TenantBranding | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .rpc("get_tenant_by_slug", { p_slug: slug });

      if (error) {
        console.error("Error fetching tenant branding:", error);
        return null;
      }

      if (!data || data.length === 0) return null;

      return {
        ...data[0],
        slug,
      } as TenantBranding;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 minutos - branding muda raramente
    gcTime: 1000 * 60 * 60, // 1 hora
    retry: 1,
  });
}

/**
 * Hook para buscar branding do tenant pelo domínio customizado
 * Usado quando escola acessa via seu próprio domínio
 */
export function useTenantByDomain(domain: string | undefined) {
  return useQuery({
    queryKey: ["tenant-branding", "domain", domain],
    queryFn: async (): Promise<TenantBranding | null> => {
      if (!domain) return null;

      const { data, error } = await supabase
        .rpc("get_tenant_by_domain", { p_domain: domain });

      if (error) {
        console.error("Error fetching tenant by domain:", error);
        return null;
      }

      if (!data || data.length === 0) return null;

      return data[0] as TenantBranding;
    },
    enabled: !!domain,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });
}

/**
 * Detecta se o usuário está acessando via domínio customizado
 * Retorna o hostname se for um domínio customizado, null se for o domínio padrão
 */
export function useCustomDomainDetection(): {
  isCustomDomain: boolean;
  customDomain: string | null;
  isLovableDomain: boolean;
} {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  
  // Domínios da plataforma (não são custom domains)
  const platformDomains = [
    "localhost",
    "127.0.0.1",
    "lovable.app",
    "lovableproject.com",
    "lovable.dev",
  ];
  
  const isLovableDomain = platformDomains.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );
  
  return {
    isCustomDomain: !isLovableDomain && hostname !== "",
    customDomain: !isLovableDomain && hostname !== "" ? hostname : null,
    isLovableDomain,
  };
}

/**
 * Valida se usuário pertence ao tenant específico
 */
export async function validateUserForTenant(userId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc("validate_school_user_for_tenant", { 
      p_user_id: userId, 
      p_tenant_id: tenantId 
    });

  if (error) {
    console.error("Error validating user for tenant:", error);
    return false;
  }

  return data === true;
}
