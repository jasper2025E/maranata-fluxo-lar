import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, defaultQueryConfig } from "./useQueryConfig";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Responsavel = Database["public"]["Tables"]["responsaveis"]["Row"];
type ResponsavelInsert = Database["public"]["Tables"]["responsaveis"]["Insert"];
type ResponsavelUpdate = Database["public"]["Tables"]["responsaveis"]["Update"];

interface UseResponsaveisOptions {
  apenasAtivos?: boolean;
}

/**
 * Hook para listar responsáveis
 * @param options.apenasAtivos - Se true, filtra apenas responsáveis ativos (padrão: true)
 */
export function useResponsaveis(options: UseResponsaveisOptions = { apenasAtivos: true }) {
  const { apenasAtivos = true } = options;
  
  return useQuery({
    queryKey: [...queryKeys.responsaveis.list(), { apenasAtivos }],
    queryFn: async () => {
      // Validação defensiva
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useResponsaveis: Usuário não autenticado");
        return [];
      }

      let query = supabase
        .from("responsaveis")
        .select(`
          *,
          alunos (id, nome_completo, turma_id, curso_id)
        `)
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
 * Hook para listar TODOS os responsáveis (ativos e inativos) - para gestão
 */
export function useResponsaveisAdmin() {
  return useQuery({
    queryKey: [...queryKeys.responsaveis.all, "admin"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn("useResponsaveisAdmin: Usuário não autenticado");
        return [];
      }

      const { data, error } = await supabase
        .from("responsaveis")
        .select(`
          *,
          alunos (id, nome_completo, turma_id, curso_id)
        `)
        .order("nome");

      if (error) throw error;
      return data;
    },
    ...defaultQueryConfig,
  });
}

export function useResponsavel(id: string) {
  return useQuery({
    queryKey: queryKeys.responsaveis.detail(id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.responsaveis.all });
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
      // 1. Atualizar no banco local
      const { data, error } = await supabase
        .from("responsaveis")
        .update(updates)
        .eq("id", id)
        .select("*, asaas_customer_id")
        .single();

      if (error) throw error;

      // 2. Se tem cliente ASAAS, sincronizar dados
      if (data?.asaas_customer_id) {
        console.log("Sincronizando responsável com ASAAS:", data.asaas_customer_id);
        try {
          const { data: syncResult, error: syncError } = await supabase.functions.invoke("asaas-update-customer", {
            body: { responsavelId: id },
          });

          if (syncError) {
            console.warn("Erro ao sincronizar com ASAAS:", syncError);
            toast.warning("Dados salvos localmente. Sincronização com gateway pode estar pendente.");
          } else if (!syncResult?.success && !syncResult?.skipped) {
            console.warn("ASAAS retornou erro:", syncResult?.error);
            toast.warning("Dados salvos localmente. Gateway reportou: " + (syncResult?.error || "erro desconhecido"));
          } else if (syncResult?.success && !syncResult?.skipped) {
            console.log("Responsável sincronizado com ASAAS com sucesso");
          }
        } catch (err) {
          console.warn("Falha ao chamar sincronização ASAAS:", err);
          // Fallback silencioso - dados já salvos localmente
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsaveis.all });
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
      // Soft delete - apenas desativa para preservar histórico
      const { error } = await supabase
        .from("responsaveis")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsaveis.all });
      toast.success("Responsável desativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar responsável: ${error.message}`);
    },
  });
}

export function useToggleResponsavelAtivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("responsaveis")
        .update({ ativo })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsaveis.all });
      toast.success("Status do responsável atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

/**
 * Hook para sincronizar responsável com ASAAS manualmente
 */
export function useSyncResponsavelAsaas() {
  return useMutation({
    mutationFn: async (responsavelId: string) => {
      const { data, error } = await supabase.functions.invoke("asaas-update-customer", {
        body: { responsavelId },
      });

      if (error) throw error;
      if (!data?.success && !data?.skipped) {
        throw new Error(data?.error || "Erro ao sincronizar com ASAAS");
      }

      return data;
    },
    onSuccess: (result) => {
      if (result?.skipped) {
        toast.info("Responsável não possui cliente ASAAS vinculado");
      } else {
        toast.success("Responsável sincronizado com ASAAS!");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });
}
