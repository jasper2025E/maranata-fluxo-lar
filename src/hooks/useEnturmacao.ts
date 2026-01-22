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

        // 4. Criar cobranças Asaas apenas para as próximas 3 faturas (evita sobrecarga)
        const { data: faturasGeradas } = await supabase
          .from("faturas")
          .select("id")
          .eq("aluno_id", alunoId)
          .eq("status", "Aberta")
          .is("asaas_payment_id", null)
          .order("data_vencimento", { ascending: true })
          .limit(3);

        if (faturasGeradas && faturasGeradas.length > 0) {
          for (const fatura of faturasGeradas) {
            try {
              await supabase.functions.invoke("asaas-create-payment", {
                body: { faturaId: fatura.id, billingType: "UNDEFINED" },
              });
              await new Promise(r => setTimeout(r, 800));
            } catch (err) {
              console.warn(`Aviso: Cobrança Asaas pendente para fatura ${fatura.id}`);
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
      toast.success("Aluno enturmado com sucesso! Cobranças serão geradas em breve.");
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
