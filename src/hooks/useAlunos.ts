import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Aluno = Database["public"]["Tables"]["alunos"]["Row"];
type AlunoInsert = Database["public"]["Tables"]["alunos"]["Insert"];
type AlunoUpdate = Database["public"]["Tables"]["alunos"]["Update"];
type AlunoStatus = Database["public"]["Enums"]["aluno_status"];

interface UseAlunosOptions {
  statusMatricula?: AlunoStatus | 'todos';
}

/**
 * Hook para listar alunos
 * @param options.statusMatricula - Filtrar por status (padrão: 'todos' para mostrar todos)
 */
export function useAlunos(options: UseAlunosOptions = { statusMatricula: 'todos' }) {
  const { statusMatricula = 'todos' } = options;
  
  return useQuery({
    queryKey: [...queryKeys.alunos.list(), { statusMatricula }],
    queryFn: async () => {
      // Validação defensiva: RLS garante isolamento, mas verificamos sessão
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useAlunos: Usuário não autenticado");
        return [];
      }

      let query = supabase
        .from("alunos")
        .select(`
          *,
          cursos (id, nome, mensalidade),
          turmas (id, nome, serie)
        `)
        .order("nome_completo");

      // Filtrar por status se não for 'todos'
      if (statusMatricula !== 'todos') {
        query = query.eq("status_matricula", statusMatricula);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

/**
 * Hook para listar apenas alunos ativos (para seleção em formulários)
 */
export function useAlunosAtivos() {
  return useQuery({
    queryKey: [...queryKeys.alunos.all, "ativos"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useAlunosAtivos: Usuário não autenticado");
        return [];
      }

      const { data, error } = await supabase
        .from("alunos")
        .select(`
          *,
          cursos (id, nome, mensalidade),
          turmas (id, nome, serie)
        `)
        .eq("status_matricula", "ativo")
        .order("nome_completo");

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

export function useAluno(id: string) {
  return useQuery({
    queryKey: queryKeys.alunos.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          *,
          cursos (id, nome, mensalidade),
          turmas (id, nome, serie)
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

export function useCreateAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aluno: AlunoInsert) => {
      const { data, error } = await supabase
        .from("alunos")
        .insert(aluno)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      toast.success("Aluno cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar aluno: ${error.message}`);
    },
  });
}

export function useUpdateAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AlunoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("alunos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.detail(variables.id) });
      toast.success("Aluno atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar aluno: ${error.message}`);
    },
  });
}

export function useDeleteAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // PROTEÇÃO: Soft delete - muda status para cancelado em vez de deletar permanentemente
      const { error } = await supabase
        .from("alunos")
        .update({ status_matricula: 'cancelado' })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      toast.success("Aluno desativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar aluno: ${error.message}`);
    },
  });
}

/**
 * Hook para alternar status de matrícula do aluno
 */
export function useToggleAlunoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status_matricula }: { id: string; status_matricula: AlunoStatus }) => {
      const { data, error } = await supabase
        .from("alunos")
        .update({ status_matricula })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      toast.success("Status do aluno atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}
