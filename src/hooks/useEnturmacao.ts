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
      gerarFaturas = true 
    }: EnturmarParams) => {
      // 1. Atualiza o aluno com a turma
      const { error: updateError } = await supabase
        .from("alunos")
        .update({ turma_id: turmaId })
        .eq("id", alunoId);

      if (updateError) throw updateError;

      // 2. Gera faturas automaticamente se solicitado
      if (gerarFaturas) {
        const { error: faturaError } = await supabase.rpc("gerar_faturas_aluno", {
          p_aluno_id: alunoId,
          p_curso_id: cursoId,
          p_valor: valorMensalidade,
          p_data_inicio: new Date().toISOString().split("T")[0],
        });

        if (faturaError) throw faturaError;

        // 3. Se tiver responsável, vincula as faturas ao responsável
        if (responsavelId) {
          const { error: vinculoError } = await supabase
            .from("faturas")
            .update({ responsavel_id: responsavelId })
            .eq("aluno_id", alunoId)
            .is("responsavel_id", null);

          if (vinculoError) throw vinculoError;
        }

        // 4. Criar cobranças Asaas para todas as faturas geradas (processamento paralelo com retry)
        const { data: faturasGeradas } = await supabase
          .from("faturas")
          .select("id")
          .eq("aluno_id", alunoId)
          .eq("status", "Aberta")
          .is("asaas_payment_id", null);

        if (faturasGeradas && faturasGeradas.length > 0) {
          // Processar em lotes de 3 para não sobrecarregar a API
          const batchSize = 3;
          for (let i = 0; i < faturasGeradas.length; i += batchSize) {
            const batch = faturasGeradas.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(async (fatura) => {
                const maxRetries = 2;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                  try {
                    const { data: result, error } = await supabase.functions.invoke("asaas-create-payment", {
                      body: { faturaId: fatura.id, billingType: "UNDEFINED" },
                    });
                    if (!error && result?.success) {
                      console.log(`Cobrança Asaas criada para fatura ${fatura.id}`);
                      return;
                    }
                    if (attempt < maxRetries) {
                      await new Promise(r => setTimeout(r, 500 * attempt));
                    }
                  } catch (err) {
                    if (attempt === maxRetries) {
                      console.warn(`Falha ao criar cobrança Asaas para fatura ${fatura.id}:`, err);
                    }
                  }
                }
              })
            );
            // Pequeno delay entre lotes
            if (i + batchSize < faturasGeradas.length) {
              await new Promise(r => setTimeout(r, 300));
            }
          }
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Aluno enturmado e faturas geradas com sucesso!");
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
