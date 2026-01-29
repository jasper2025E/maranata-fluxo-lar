import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenantInfo {
  id: string;
  nome: string;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

export function useTenantInfo() {
  return useQuery({
    queryKey: ["tenant-info"],
    queryFn: async (): Promise<TenantInfo | null> => {
      // Buscar o primeiro tenant ativo (single-tenant)
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome, slug, logo_url, primary_color, secondary_color, telefone, email, endereco")
        .eq("status", "ativo")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache
    retry: 2,
  });
}
