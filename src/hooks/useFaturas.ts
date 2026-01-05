import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FaturaItem {
  id?: string;
  fatura_id?: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  desconto_aplicado: number;
  valor_final: number;
  centro_custo?: string;
  ordem: number;
}

export interface FaturaDesconto {
  id?: string;
  fatura_id?: string;
  tipo: 'convenio' | 'bolsa' | 'campanha' | 'pontualidade' | 'manual' | 'item';
  descricao: string;
  valor: number;
  percentual: number;
  valor_aplicado: number;
  condicao?: string;
}

export interface FaturaHistorico {
  id: string;
  fatura_id: string;
  versao: number;
  acao: string;
  dados_anteriores: Record<string, unknown>;
  dados_novos: Record<string, unknown>;
  motivo?: string;
  created_at: string;
  created_by?: string;
}

export interface FaturaDocumento {
  id: string;
  fatura_id: string;
  tipo: 'fatura' | 'recibo' | 'comprovante' | 'outro';
  nome: string;
  url: string;
  created_at: string;
}

export interface Fatura {
  id: string;
  codigo_sequencial?: string;
  aluno_id: string;
  curso_id: string;
  responsavel_id?: string | null;
  valor: number;
  valor_original?: number | null;
  valor_total?: number | null;
  valor_bruto?: number;
  valor_liquido?: number;
  saldo_restante?: number;
  mes_referencia: number;
  ano_referencia: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  versao?: number;
  bloqueada?: boolean;
  payment_url?: string | null;
  stripe_checkout_session_id?: string | null;
  desconto_valor?: number | null;
  desconto_percentual?: number | null;
  desconto_motivo?: string | null;
  valor_desconto_aplicado?: number | null;
  juros?: number | null;
  multa?: number | null;
  juros_percentual_diario?: number | null;
  juros_percentual_mensal?: number | null;
  dias_atraso?: number | null;
  valor_juros_aplicado?: number | null;
  valor_multa_aplicado?: number | null;
  cancelada_em?: string | null;
  cancelada_por?: string | null;
  motivo_cancelamento?: string | null;
  created_by?: string;
  updated_by?: string;
  alunos?: { nome_completo: string; email_responsavel: string; responsavel_id?: string | null };
  cursos?: { nome: string };
  responsaveis?: { nome: string; email: string | null; telefone: string } | null;
}

export interface Pagamento {
  id: string;
  fatura_id: string;
  valor: number;
  valor_original?: number;
  desconto_aplicado?: number;
  juros_aplicado?: number;
  multa_aplicada?: number;
  metodo: string;
  referencia?: string;
  data_pagamento: string;
  tipo?: string;
  estorno_de?: string;
  motivo_estorno?: string;
  gateway?: string;
  gateway_id?: string;
  gateway_status?: string;
  comprovante_url?: string;
}

export const queryKeys = {
  faturas: {
    all: ['faturas'] as const,
    list: () => ['faturas', 'list'] as const,
    detail: (id: string) => ['faturas', 'detail', id] as const,
    items: (faturaId: string) => ['faturas', 'items', faturaId] as const,
    descontos: (faturaId: string) => ['faturas', 'descontos', faturaId] as const,
    historico: (faturaId: string) => ['faturas', 'historico', faturaId] as const,
    documentos: (faturaId: string) => ['faturas', 'documentos', faturaId] as const,
    pagamentos: (faturaId: string) => ['faturas', 'pagamentos', faturaId] as const,
    kpis: () => ['faturas', 'kpis'] as const,
  },
};

// Hook para listar faturas
export function useFaturas() {
  return useQuery({
    queryKey: queryKeys.faturas.list(),
    queryFn: async () => {
      await supabase.rpc("atualizar_status_faturas");
      const { data, error } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone)
        `)
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Fatura[];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

// Hook para detalhe de fatura
export function useFatura(faturaId: string | null) {
  return useQuery({
    queryKey: queryKeys.faturas.detail(faturaId || ''),
    queryFn: async () => {
      if (!faturaId) return null;
      const { data, error } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone)
        `)
        .eq("id", faturaId)
        .single();
      if (error) throw error;
      return data as Fatura;
    },
    enabled: !!faturaId,
  });
}

// Hook para itens da fatura
export function useFaturaItens(faturaId: string | null) {
  return useQuery({
    queryKey: queryKeys.faturas.items(faturaId || ''),
    queryFn: async () => {
      if (!faturaId) return [];
      const { data, error } = await supabase
        .from("fatura_itens")
        .select("*")
        .eq("fatura_id", faturaId)
        .order("ordem");
      if (error) throw error;
      return data as FaturaItem[];
    },
    enabled: !!faturaId,
  });
}

// Hook para descontos da fatura
export function useFaturaDescontos(faturaId: string | null) {
  return useQuery({
    queryKey: queryKeys.faturas.descontos(faturaId || ''),
    queryFn: async () => {
      if (!faturaId) return [];
      const { data, error } = await supabase
        .from("fatura_descontos")
        .select("*")
        .eq("fatura_id", faturaId)
        .order("created_at");
      if (error) throw error;
      return data as FaturaDesconto[];
    },
    enabled: !!faturaId,
  });
}

// Hook para histórico da fatura
export function useFaturaHistorico(faturaId: string | null) {
  return useQuery({
    queryKey: queryKeys.faturas.historico(faturaId || ''),
    queryFn: async () => {
      if (!faturaId) return [];
      const { data, error } = await supabase
        .from("fatura_historico")
        .select("*")
        .eq("fatura_id", faturaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FaturaHistorico[];
    },
    enabled: !!faturaId,
  });
}

// Hook para pagamentos da fatura
export function useFaturaPagamentos(faturaId: string | null) {
  return useQuery({
    queryKey: queryKeys.faturas.pagamentos(faturaId || ''),
    queryFn: async () => {
      if (!faturaId) return [];
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("fatura_id", faturaId)
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return data as Pagamento[];
    },
    enabled: !!faturaId,
  });
}

// Hook para KPIs
export function useFaturaKPIs() {
  return useQuery({
    queryKey: queryKeys.faturas.kpis(),
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const hoje = new Date();

      const [faturasResult, pagamentosResult, descontosResult] = await Promise.all([
        supabase.from("faturas").select("id, status, valor, valor_total, saldo_restante, data_vencimento, dias_atraso"),
        supabase
          .from("pagamentos")
          .select("valor, tipo, juros_aplicado, data_pagamento")
          .gte("data_pagamento", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`),
        supabase.from("fatura_descontos").select("valor_aplicado"),
      ]);

      const faturas = faturasResult.data || [];
      const pagamentos = pagamentosResult.data || [];
      const descontos = descontosResult.data || [];

      const totalPagamentos = pagamentos.reduce((sum, p: any) => {
        const sign = p.tipo === 'estorno' ? -1 : 1;
        return sum + sign * Number(p.valor || 0);
      }, 0);

      // Faturamento mensal (líquido de estornos)
      const faturamentoMensal = totalPagamentos;

      // Ticket médio (considera apenas pagamentos não-estorno)
      const pagamentosValidos = pagamentos.filter((p: any) => p.tipo !== 'estorno');
      const ticketMedio = pagamentosValidos.length > 0
        ? pagamentosValidos.reduce((sum: number, p: any) => sum + Number(p.valor || 0), 0) / pagamentosValidos.length
        : 0;

      // Inadimplência
      const totalFaturas = faturas.filter((f: any) => f.status !== 'Cancelada').length;
      const faturasVencidas = faturas.filter((f: any) => f.status === 'Vencida').length;
      const inadimplencia = totalFaturas > 0 ? (faturasVencidas / totalFaturas) * 100 : 0;

      // Descontos concedidos
      const descontosConcedidos = descontos.reduce((sum, d: any) => sum + Number(d.valor_aplicado || 0), 0);

      // Juros arrecadados (líquido de estornos quando aplicável)
      const jurosArrecadados = pagamentos.reduce((sum, p: any) => {
        const sign = p.tipo === 'estorno' ? -1 : 1;
        return sum + sign * Number(p.juros_aplicado || 0);
      }, 0);

      // Aging
      const aging = {
        ate30: faturas.filter((f: any) => f.status === 'Vencida' && (f.dias_atraso || 0) <= 30).length,
        de31a60: faturas.filter((f: any) => f.status === 'Vencida' && (f.dias_atraso || 0) > 30 && (f.dias_atraso || 0) <= 60).length,
        mais60: faturas.filter((f: any) => f.status === 'Vencida' && (f.dias_atraso || 0) > 60).length,
      };

      // Valor a receber (considera saldo_restante quando houver)
      const valorAReceber = faturas
        .filter((f: any) => f.status === 'Aberta' || f.status === 'Vencida')
        .reduce((sum: number, f: any) => sum + Number(f.saldo_restante ?? f.valor_total ?? f.valor ?? 0), 0);

      return {
        faturamentoMensal,
        inadimplencia: Math.round(inadimplencia * 10) / 10,
        ticketMedio,
        descontosConcedidos,
        jurosArrecadados,
        aging,
        valorAReceber,
        totalFaturas,
        faturasAbertas: faturas.filter((f: any) => f.status === 'Aberta').length,
        faturasPagas: faturas.filter((f: any) => f.status === 'Paga').length,
        faturasVencidas,
      };
    },
    staleTime: 1000 * 60,
  });
}

// Mutations
export function useCreateFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      aluno_id: string;
      curso_id: string;
      responsavel_id?: string;
      valor: number;
      data_vencimento: string;
      mes_referencia: number;
      ano_referencia: number;
      itens?: FaturaItem[];
      descontos?: Omit<FaturaDesconto, 'id' | 'fatura_id'>[];
    }) => {
      const { itens, descontos, ...faturaData } = data;
      
      // Criar fatura
      const { data: fatura, error: faturaError } = await supabase
        .from("faturas")
        .insert({
          ...faturaData,
          valor_original: faturaData.valor,
          valor_bruto: faturaData.valor,
          status: 'Aberta',
        })
        .select()
        .single();

      if (faturaError) throw faturaError;

      // Criar itens se houver
      if (itens && itens.length > 0) {
        const itensWithFatura = itens.map((item, index) => ({
          ...item,
          fatura_id: fatura.id,
          ordem: index,
        }));

        const { error: itensError } = await supabase
          .from("fatura_itens")
          .insert(itensWithFatura);

        if (itensError) throw itensError;
      }

      // Criar descontos se houver
      if (descontos && descontos.length > 0) {
        const descontosWithFatura = descontos.map(d => ({
          ...d,
          fatura_id: fatura.id,
        }));

        const { error: descontosError } = await supabase
          .from("fatura_descontos")
          .insert(descontosWithFatura);

        if (descontosError) throw descontosError;
      }

      return fatura;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success("Fatura criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar fatura: ${error.message}`);
    },
  });
}

export function useUpdateFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Fatura> & { id: string }) => {
      const { error } = await supabase
        .from("faturas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success("Fatura atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useCancelarFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase
        .from("faturas")
        .update({
          status: 'Cancelada',
          cancelada_em: new Date().toISOString(),
          motivo_cancelamento: motivo,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success("Fatura cancelada");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fatura_id: string;
      valor: number;
      metodo: string;
      referencia?: string;
      tipo?: 'total' | 'parcial';
      valor_original?: number;
      desconto_aplicado?: number;
      juros_aplicado?: number;
      multa_aplicada?: number;
    }) => {
      const { error: paymentError } = await supabase.from("pagamentos").insert({
        fatura_id: data.fatura_id,
        valor: data.valor,
        metodo: data.metodo,
        referencia: data.referencia || null,
        tipo: data.tipo || 'total',
        valor_original: data.valor_original || null,
        desconto_aplicado: data.desconto_aplicado || null,
        juros_aplicado: data.juros_aplicado || null,
        multa_aplicada: data.multa_aplicada || null,
      });

      if (paymentError) throw paymentError;

      // Se for pagamento total, atualizar status
      if (data.tipo !== 'parcial') {
        const { error: faturaError } = await supabase
          .from("faturas")
          .update({ 
            status: "Paga",
            saldo_restante: 0,
          })
          .eq("id", data.fatura_id);

        if (faturaError) throw faturaError;
      } else {
        // Atualizar saldo restante
        const { data: fatura } = await supabase
          .from("faturas")
          .select("saldo_restante, valor_total")
          .eq("id", data.fatura_id)
          .single();

        if (fatura) {
          const novoSaldo = (fatura.saldo_restante || fatura.valor_total || 0) - data.valor;
          await supabase
            .from("faturas")
            .update({ 
              saldo_restante: Math.max(0, novoSaldo),
              status: novoSaldo <= 0 ? 'Paga' : undefined,
            })
            .eq("id", data.fatura_id);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.pagamentos(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success("Pagamento registrado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });
}

export function useEstornarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { pagamento_id: string; fatura_id: string; valor: number; motivo: string }) => {
      // Criar registro de estorno
      const { error: estornoError } = await supabase.from("pagamentos").insert({
        fatura_id: data.fatura_id,
        valor: data.valor,
        metodo: 'Estorno',
        tipo: 'estorno',
        estorno_de: data.pagamento_id,
        motivo_estorno: data.motivo,
      });

      if (estornoError) throw estornoError;

      // Atualizar fatura
      const { data: fatura } = await supabase
        .from("faturas")
        .select("saldo_restante, valor_total")
        .eq("id", data.fatura_id)
        .single();

      if (fatura) {
        await supabase
          .from("faturas")
          .update({ 
            saldo_restante: (fatura.saldo_restante || 0) + data.valor,
            status: 'Aberta',
          })
          .eq("id", data.fatura_id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.pagamentos(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id) });
      toast.success("Estorno registrado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao estornar: ${error.message}`);
    },
  });
}

export function useAddFaturaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<FaturaItem, 'id'> & { fatura_id: string }) => {
      const { id, ...insertData } = data as FaturaItem & { fatura_id: string };
      const { error } = await supabase.from("fatura_itens").insert({
        fatura_id: data.fatura_id,
        descricao: data.descricao,
        quantidade: data.quantidade,
        valor_unitario: data.valor_unitario,
        subtotal: data.subtotal,
        desconto_valor: data.desconto_valor || 0,
        desconto_percentual: data.desconto_percentual || 0,
        desconto_aplicado: data.desconto_aplicado || 0,
        valor_final: data.valor_final,
        centro_custo: data.centro_custo || null,
        ordem: data.ordem,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.items(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      toast.success("Item adicionado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`);
    },
  });
}

export function useRemoveFaturaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fatura_id }: { id: string; fatura_id: string }) => {
      const { error } = await supabase.from("fatura_itens").delete().eq("id", id);
      if (error) throw error;
      return fatura_id;
    },
    onSuccess: (fatura_id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.items(fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      toast.success("Item removido!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover item: ${error.message}`);
    },
  });
}

export function useAddFaturaDesconto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<FaturaDesconto, 'id'> & { fatura_id: string }) => {
      const { error } = await supabase.from("fatura_descontos").insert({
        fatura_id: data.fatura_id,
        tipo: data.tipo,
        descricao: data.descricao,
        valor: data.valor || 0,
        percentual: data.percentual || 0,
        valor_aplicado: data.valor_aplicado,
        condicao: data.condicao || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.descontos(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      toast.success("Desconto adicionado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar desconto: ${error.message}`);
    },
  });
}

// Helper functions
export function getValorFinal(fatura: Fatura): number {
  if (fatura.valor_total && fatura.valor_total > 0) return fatura.valor_total;
  const valorBase = fatura.valor_original || fatura.valor;
  let desconto = fatura.desconto_percentual && fatura.desconto_percentual > 0
    ? valorBase * (fatura.desconto_percentual / 100)
    : (fatura.desconto_valor || 0);
  const juros = fatura.valor_juros_aplicado || fatura.juros || 0;
  const multa = fatura.valor_multa_aplicado || fatura.multa || 0;
  return Math.max(0, valorBase - desconto + juros + multa);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
