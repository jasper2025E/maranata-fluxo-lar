import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Escola = Database["public"]["Tables"]["escola"]["Row"];
type EscolaUpdate = Database["public"]["Tables"]["escola"]["Update"];

export function useEscola() {
  return useQuery({
    queryKey: queryKeys.escola.info(),
    queryFn: async (): Promise<Escola | null> => {
      // Primeiro, pegar o tenant_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.tenant_id) return null;
      
      // Buscar escola do tenant específico
      const { data, error } = await supabase
        .from("escola")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - dados da escola mudam raramente
    gcTime: 1000 * 60 * 60, // 1 hour cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent refetch on component mount during navigation
    refetchOnReconnect: false,
  });
}

export function useUpdateEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EscolaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("escola")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.escola.all });
      toast.success("Dados da escola atualizados!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useCreateEscola() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (escola: Omit<Escola, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("escola")
        .insert(escola)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.escola.all });
      toast.success("Escola cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar escola: ${error.message}`);
    },
  });
}
