import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TenantInfo {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  status: string;
}

interface TenantContextType {
  /** Tenant atual identificado pela URL (slug) */
  currentTenant: TenantInfo | null;
  /** Se o tenant está sendo carregado */
  loading: boolean;
  /** Se houve erro ao carregar tenant */
  error: string | null;
  /** Atualiza o tenant pelo slug */
  loadTenantBySlug: (slug: string) => Promise<void>;
  /** Limpa o contexto do tenant */
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Provider para gerenciar contexto do Tenant atual
 * Usado para branding dinâmico e validação de acesso
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTenantBySlug = async (slug: string) => {
    if (!slug) {
      setCurrentTenant(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .rpc("get_tenant_by_slug", { p_slug: slug });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError("Instituição não encontrada");
        setCurrentTenant(null);
        return;
      }

      const tenant = data[0];
      setCurrentTenant({
        id: tenant.id,
        nome: tenant.nome,
        slug,
        logo_url: tenant.logo_url,
        primary_color: tenant.primary_color || "#7C3AED",
        secondary_color: tenant.secondary_color || "#EC4899",
        status: tenant.status,
      });
    } catch (err: any) {
      console.error("Error loading tenant:", err);
      setError(err.message || "Erro ao carregar instituição");
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const clearTenant = () => {
    setCurrentTenant(null);
    setError(null);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        loading,
        error,
        loadTenantBySlug,
        clearTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
}

/**
 * Hook para extrair slug do tenant da URL
 * Suporta formato /e/:slug
 */
export function useTenantSlug(): string | undefined {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  
  // Verifica se estamos em uma rota de escola dinâmica
  if (location.pathname.startsWith("/e/") && slug) {
    return slug;
  }
  
  return undefined;
}
