import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Responsavel = Database["public"]["Tables"]["responsaveis"]["Row"];
type ResponsavelInsert = Database["public"]["Tables"]["responsaveis"]["Insert"];
type ResponsavelUpdate = Database["public"]["Tables"]["responsaveis"]["Update"];

export function useResponsaveis() {
  return useQuery({
    queryKey: queryKeys.responsaveis.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select(`
          *,
          alunos (id, nome_completo, turma_id, curso_id)
        `)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

export function useResponsavel(id: string) {
  return useQuery({
    queryKey: ["responsaveis", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select(`
          *,
          alunos (
            id, 
            nome_completo, 
            data_nascimento, 
            turma_id, 
            curso_id,
            cursos (id, nome, mensalidade),
            turmas (id, nome, serie)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    ...defaultQueryConfig,
  });
}

export function useCreateResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responsavel: ResponsavelInsert) => {
      const { data, error } = await supabase
        .from("responsaveis")
        .insert(responsavel)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar responsável: ${error.message}`);
    },
  });
}

export function useUpdateResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ResponsavelUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("responsaveis")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar responsável: ${error.message}`);
    },
  });
}

export function useDeleteResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("responsaveis")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover responsável: ${error.message}`);
    },
  });
}
