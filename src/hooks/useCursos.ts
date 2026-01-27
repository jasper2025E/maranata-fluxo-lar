import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Curso = Database["public"]["Tables"]["cursos"]["Row"];
type CursoInsert = Database["public"]["Tables"]["cursos"]["Insert"];
type CursoUpdate = Database["public"]["Tables"]["cursos"]["Update"];

interface UseCursosOptions {
  apenasAtivos?: boolean;
}

/**
 * Hook para listar cursos
 * @param options.apenasAtivos - Se true, filtra apenas cursos ativos (padrão: true para seleção em formulários)
 */
export function useCursos(options: UseCursosOptions = { apenasAtivos: true }) {
  const { apenasAtivos = true } = options;
  
  return useQuery({
    queryKey: [...queryKeys.cursos.list(), { apenasAtivos }],
    queryFn: async () => {
      // Validação defensiva
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useCursos: Usuário não autenticado");
        return [];
      }

      let query = supabase
        .from("cursos")
        .select("*")
        .order("nome");

      // Filtrar apenas ativos se solicitado
      if (apenasAtivos) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

/**
 * Hook para listar TODOS os cursos (ativos e inativos) - para tela de gestão
 */
export function useCursosAdmin() {
  return useQuery({
    queryKey: [...queryKeys.cursos.all, "admin"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useCursosAdmin: Usuário não autenticado");
        return [];
      }

      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

export function useCurso(id: string) {
  return useQuery({
    queryKey: queryKeys.cursos.detail(id),
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
      // Invalidar todas as queries de cursos para garantir consistência
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all, refetchType: 'all' });
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
    onSuccess: (data, variables) => {
      // Invalidar todas as queries de cursos para garantir consistência
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.detail(variables.id), refetchType: 'all' });
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
      // Soft delete - apenas desativa
      const { error } = await supabase
        .from("cursos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all, refetchType: 'all' });
      toast.success("Curso desativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar curso: ${error.message}`);
    },
  });
}

export function useToggleCursoAtivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("cursos")
        .update({ ativo })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all, refetchType: 'all' });
      toast.success("Status do curso atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}
