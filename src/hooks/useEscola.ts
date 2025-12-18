import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Escola = Database["public"]["Tables"]["escola"]["Row"];
type EscolaUpdate = Database["public"]["Tables"]["escola"]["Update"];

export function useEscola() {
  return useQuery({
    queryKey: queryKeys.escola.info(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escola")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
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
