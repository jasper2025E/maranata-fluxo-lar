import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Turma = Database["public"]["Tables"]["turmas"]["Row"];
type TurmaInsert = Database["public"]["Tables"]["turmas"]["Insert"];
type TurmaUpdate = Database["public"]["Tables"]["turmas"]["Update"];

export function useTurmas() {
  return useQuery({
    queryKey: queryKeys.turmas.list(),
    queryFn: async () => {
      // Validação defensiva: RLS garante isolamento, mas verificamos sessão
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useTurmas: Usuário não autenticado");
        return [];
      }

      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

export function useTurma(id: string) {
  return useQuery({
    queryKey: ["turmas", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    ...defaultQueryConfig,
  });
}

export function useCreateTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (turma: TurmaInsert) => {
      const { data, error } = await supabase
        .from("turmas")
        .insert(turma)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"], refetchType: 'all' });
      toast.success("Turma cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar turma: ${error.message}`);
    },
  });
}

export function useUpdateTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TurmaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("turmas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"], refetchType: 'all' });
      toast.success("Turma atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar turma: ${error.message}`);
    },
  });
}

export function useDeleteTurma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("turmas")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"], refetchType: 'all' });
      toast.success("Turma removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover turma: ${error.message}`);
    },
  });
}
