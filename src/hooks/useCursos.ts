import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Curso = Database["public"]["Tables"]["cursos"]["Row"];
type CursoInsert = Database["public"]["Tables"]["cursos"]["Insert"];
type CursoUpdate = Database["public"]["Tables"]["cursos"]["Update"];

export function useCursos() {
  return useQuery({
    queryKey: queryKeys.cursos.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

export function useCurso(id: string) {
  return useQuery({
    queryKey: ["cursos", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
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

export function useCreateCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (curso: CursoInsert) => {
      const { data, error } = await supabase
        .from("cursos")
        .insert(curso)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar curso: ${error.message}`);
    },
  });
}

export function useUpdateCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CursoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cursos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar curso: ${error.message}`);
    },
  });
}

export function useDeleteCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cursos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover curso: ${error.message}`);
    },
  });
}
