import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AlunoProfile {
  id: string;
  nome_completo: string;
  data_nascimento: string | null;
  email_responsavel: string | null;
  endereco: string | null;
  data_matricula: string;
  status_matricula: string | null;
  curso: { id: string; nome: string; mensalidade: number; duracao_meses: number } | null;
  turma: { id: string; nome: string } | null;
  responsavel: { id: string; nome: string; telefone: string; email: string | null } | null;
}

export function useAlunoProfile(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-profile", alunoId],
    queryFn: async () => {
      if (!alunoId) return null;
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id, nome_completo, data_nascimento, email_responsavel, endereco,
          data_matricula, status_matricula,
          cursos(id, nome, mensalidade, duracao_meses),
          turmas(id, nome),
          responsaveis(id, nome, telefone, email)
        `)
        .eq("id", alunoId)
        .single();
      if (error) throw error;
      return {
        ...data,
        curso: data.cursos as any,
        turma: data.turmas as any,
        responsavel: data.responsaveis as any,
      } as AlunoProfile;
    },
    enabled: !!alunoId,
    staleTime: 1000 * 60,
  });
}

export function useAlunoNotas(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-notas", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from("notas")
        .select("*, disciplinas(nome)")
        .eq("aluno_id", alunoId)
        .order("data_avaliacao", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 60,
  });
}

export function useAlunoFrequencia(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-frequencia", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from("frequencia")
        .select("*, disciplinas(nome)")
        .eq("aluno_id", alunoId)
        .order("data", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 60,
  });
}

export function useAlunoFaturas(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-faturas", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from("faturas")
        .select("id, valor, status, data_vencimento, mes_referencia, ano_referencia, saldo_restante, valor_total")
        .eq("aluno_id", alunoId)
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 30,
  });
}

export function useAlunoPagamentos(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-pagamentos", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      // Get faturas IDs first, then pagamentos
      const { data: faturas } = await supabase
        .from("faturas")
        .select("id")
        .eq("aluno_id", alunoId);
      if (!faturas || faturas.length === 0) return [];
      const faturaIds = faturas.map(f => f.id);
      const { data, error } = await supabase
        .from("pagamentos")
        .select("id, valor, metodo, data_pagamento, tipo, gateway")
        .in("fatura_id", faturaIds)
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 30,
  });
}

export function useAlunoAvaliacoes(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-avaliacoes", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from("avaliacoes_desempenho")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 60,
  });
}

export function useAlunoAtividades(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-atividades", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from("atividades_extracurriculares")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 60,
  });
}

export function useAlunoFeedback(alunoId: string | null) {
  return useQuery({
    queryKey: ["aluno-feedback", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from("feedback_professores")
        .select("*, disciplinas(nome)")
        .eq("aluno_id", alunoId)
        .order("data_feedback", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!alunoId,
    staleTime: 1000 * 60,
  });
}
