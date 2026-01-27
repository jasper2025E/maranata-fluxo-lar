import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { queryKeys } from "./useQueryConfig";

interface EnturmarParams {
  alunoId: string;
  turmaId: string;
  cursoId: string;
  valorMensalidade: number;
  responsavelId?: string | null;
  gerarFaturas?: boolean;
}

export function useEnturmar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      alunoId, 
      turmaId, 
      cursoId, 
      valorMensalidade, 
      responsavelId,
      gerarFaturas = false // SEMPRE false - faturas devem ser criadas manualmente via CreateFaturaDialog
    }: EnturmarParams) => {
      // Apenas atualiza o aluno com a turma
      // Geração de faturas é feita MANUALMENTE via Faturas → Nova Fatura
      // Isso garante sincronização 100% com ASAAS
      const { error: updateError } = await supabase
        .from("alunos")
        .update({ turma_id: turmaId })
        .eq("id", alunoId);

      if (updateError) throw updateError;

      // NOTA: Faturas NÃO são mais geradas automaticamente na enturmação
      // O fluxo correto é:
      // 1. Enturmar o aluno
      // 2. Ir em Faturas → Nova Fatura → Recorrente
      // 3. Isso garante que CADA fatura passe pelo fluxo ASAAS obrigatório
      
      if (gerarFaturas) {
        console.warn("DEPRECADO: gerarFaturas=true foi ignorado. Use CreateFaturaDialog para criar faturas com sync ASAAS.");
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Aluno enturmado com sucesso! Crie as faturas em Faturas → Nova Fatura → Recorrente.");
    },
    onError: (error: Error) => {
      toast.error(`Erro na enturmação: ${error.message}`);
    },
  });
}

export function useDesenturmar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alunoId: string) => {
      const { error } = await supabase
        .from("alunos")
        .update({ turma_id: null })
        .eq("id", alunoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      toast.success("Aluno desenturmado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desenturmar: ${error.message}`);
    },
  });
}
