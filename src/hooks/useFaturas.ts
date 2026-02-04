import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { queryClient as globalQueryClient } from "@/lib/queryClient";

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
  consolidada?: boolean;
  qtd_alunos?: number;
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
  // Campos Asaas
  asaas_payment_id?: string | null;
  asaas_invoice_url?: string | null;
  asaas_pix_qrcode?: string | null;
  asaas_pix_payload?: string | null;
  asaas_boleto_url?: string | null;
  asaas_boleto_barcode?: string | null;
  // barCode oficial (44 dígitos) retornado pelo Asaas (usado para gerar o ITF-25 no PDF)
  asaas_boleto_bar_code?: string | null;
  asaas_status?: string | null;
  asaas_due_date?: string | null;
  asaas_billing_type?: string | null;
  // Campos para rastrear faturas derivadas (pagamento parcial)
  fatura_origem_id?: string | null;
  tipo_origem?: string | null; // 'pagamento_parcial' | 'renegociacao' | etc.
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

// Hook para listar faturas - CORRIGIDO para garantir visibilidade de todas faturas
export function useFaturas() {
  return useQuery({
    queryKey: queryKeys.faturas.list(),
    queryFn: async () => {
      // Buscar faturas com campos essenciais - ordenar por vencimento para pegar as mais urgentes
      const { data, error } = await supabase
        .from("faturas")
        .select(`
          id, codigo_sequencial, aluno_id, curso_id, responsavel_id,
          valor, valor_total, saldo_restante, status,
          mes_referencia, ano_referencia, data_emissao, data_vencimento,
          asaas_payment_id, asaas_boleto_url, asaas_pix_qrcode,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone)
        `)
        .order("data_vencimento", { ascending: true }) // Mais antigas primeiro
        .limit(1000); // Aumentado para garantir visibilidade de Pagas e Vencidas
      
      if (error) throw error;
      
      // Ordenação por prioridade de negócio: Vencida > Aberta > Parcial > Paga > Cancelada
      const statusPriority: Record<string, number> = { 
        Vencida: 1, 
        Aberta: 2, 
        Parcial: 3, 
        Paga: 4, 
        Cancelada: 5 
      };
      
      return (data || []).sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        // Dentro do mesmo status, ordenar por data de vencimento (mais antigas primeiro)
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      }) as Fatura[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // CRÍTICO: garantir dados frescos na navegação
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
        .maybeSingle();
      if (error) throw error;
      return data as Fatura | null;
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

// Hook para KPIs - Cache otimizado para navegação rápida
export function useFaturaKPIs() {
  return useQuery({
    queryKey: queryKeys.faturas.kpis(),
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;

      // Queries em paralelo com campos mínimos
      const [faturasResult, pagamentosResult] = await Promise.all([
        supabase
          .from("faturas")
          .select("id, status, valor, valor_total, saldo_restante, dias_atraso")
          .neq("status", "Cancelada"),
        supabase
          .from("pagamentos")
          .select("valor, tipo, juros_aplicado")
          .gte("data_pagamento", startOfMonth),
      ]);

      const faturas = faturasResult.data || [];
      const pagamentos = pagamentosResult.data || [];

      // Cálculos otimizados em uma única passagem
      let faturamentoMensal = 0;
      let jurosArrecadados = 0;
      let pagamentosCount = 0;
      let pagamentosTotal = 0;

      for (const p of pagamentos) {
        const sign = (p as any).tipo === 'estorno' ? -1 : 1;
        const valor = Number((p as any).valor || 0);
        faturamentoMensal += sign * valor;
        jurosArrecadados += sign * Number((p as any).juros_aplicado || 0);
        if ((p as any).tipo !== 'estorno') {
          pagamentosCount++;
          pagamentosTotal += valor;
        }
      }

      // Stats de faturas em uma passagem
      let totalFaturas = 0, faturasAbertas = 0, faturasPagas = 0, faturasVencidas = 0;
      let valorAReceber = 0;
      const aging = { ate30: 0, de31a60: 0, mais60: 0 };

      for (const f of faturas) {
        totalFaturas++;
        if ((f as any).status === 'Aberta') {
          faturasAbertas++;
          valorAReceber += Number((f as any).saldo_restante ?? (f as any).valor_total ?? (f as any).valor ?? 0);
        } else if ((f as any).status === 'Paga') {
          faturasPagas++;
        } else if ((f as any).status === 'Vencida') {
          faturasVencidas++;
          valorAReceber += Number((f as any).saldo_restante ?? (f as any).valor_total ?? (f as any).valor ?? 0);
          const dias = (f as any).dias_atraso || 0;
          if (dias <= 30) aging.ate30++;
          else if (dias <= 60) aging.de31a60++;
          else aging.mais60++;
        }
      }

      return {
        faturamentoMensal,
        inadimplencia: totalFaturas > 0 ? Math.round((faturasVencidas / totalFaturas) * 1000) / 10 : 0,
        ticketMedio: pagamentosCount > 0 ? pagamentosTotal / pagamentosCount : 0,
        descontosConcedidos: 0, // Removido query extra - calcular sob demanda se necessário
        jurosArrecadados,
        aging,
        valorAReceber,
        totalFaturas,
        faturasAbertas,
        faturasPagas,
        faturasVencidas,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos - realtime invalida quando muda
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
      criarCobrancaAsaas?: boolean;
    }) => {
      const { itens, descontos, responsavel_id, criarCobrancaAsaas = true, ...restFaturaData } = data;
      
      // Criar fatura - só inclui responsavel_id se existir
      const faturaInsert = {
        aluno_id: restFaturaData.aluno_id,
        curso_id: restFaturaData.curso_id,
        valor: restFaturaData.valor,
        data_vencimento: restFaturaData.data_vencimento,
        mes_referencia: restFaturaData.mes_referencia,
        ano_referencia: restFaturaData.ano_referencia,
        valor_original: restFaturaData.valor,
        valor_bruto: restFaturaData.valor,
        status: 'Aberta' as const,
        ...(responsavel_id ? { responsavel_id } : {}),
      };
      
      const { data: fatura, error: faturaError } = await supabase
        .from("faturas")
        .insert(faturaInsert)
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

      // Criar cobrança no Asaas automaticamente - OTIMIZADO com retry rápido
      if (criarCobrancaAsaas) {
        const maxRetries = 2; // Reduzido de 3 para 2
        let lastError: unknown = null;
        let asaasSuccess = false;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { data: asaasResult, error: asaasError } = await supabase.functions.invoke("asaas-create-payment", {
              body: { faturaId: fatura.id, billingType: "BOLETO" },
            });
            
            if (asaasError) {
              lastError = asaasError;
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 300)); // Delay reduzido
                continue;
              }
            } else if (asaasResult?.success) {
              asaasSuccess = true;
              break;
            } else {
              lastError = asaasResult?.error || "Resposta inválida do Asaas";
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 300));
                continue;
              }
            }
          } catch (asaasErr) {
            lastError = asaasErr;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 300));
              continue;
            }
          }
        }
        
        if (lastError && !asaasSuccess) {
          console.error("Falha ao criar cobrança Asaas:", lastError);
          toast.warning("Fatura criada. Sincronize manualmente se necessário.");
        }

        // Buscar fatura atualizada
        if (asaasSuccess) {
          const { data: faturaAtualizada } = await supabase
            .from("faturas")
            .select("*")
            .eq("id", fatura.id)
            .single();
          
          if (faturaAtualizada) {
            return faturaAtualizada;
          }
        }
      }

      return fatura;
    },
    onSuccess: (faturaRetornada) => {
      // Invalidação única e otimizada
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      
      const hasAsaas = !!faturaRetornada?.asaas_payment_id;
      toast.success(hasAsaas ? "Fatura criada e sincronizada!" : "Fatura criada!");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
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
      // 1. Buscar fatura para verificar se tem cobrança ASAAS
      const { data: fatura, error: fetchError } = await supabase
        .from("faturas")
        .select("asaas_payment_id")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Se tem cobrança ASAAS, cancelar lá primeiro
      if (fatura?.asaas_payment_id) {
        console.log("Cancelando cobrança no ASAAS:", fatura.asaas_payment_id);
        const { data: cancelResult, error: cancelError } = await supabase.functions.invoke("asaas-cancel-payment", {
          body: { faturaId: id, motivo },
        });

        if (cancelError) {
          console.error("Erro ao cancelar no ASAAS:", cancelError);
          // Continua mesmo com erro - fallback silencioso
          toast.warning("Cobrança cancelada localmente. Sincronização com gateway pode estar pendente.");
        } else if (!cancelResult?.success) {
          console.warn("ASAAS retornou erro:", cancelResult?.error);
          toast.warning("Cobrança cancelada localmente. Gateway reportou: " + (cancelResult?.error || "erro desconhecido"));
        } else {
          console.log("Cobrança ASAAS cancelada com sucesso");
        }
      }

      // 3. Atualizar banco local (sempre executa)
      const { error } = await supabase
        .from("faturas")
        .update({
          status: 'Cancelada',
          cancelada_em: new Date().toISOString(),
          motivo_cancelamento: motivo,
          asaas_status: fatura?.asaas_payment_id ? 'DELETED' : undefined,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
      toast.success("Fatura cancelada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar fatura: ${error.message}`);
    },
  });
}

export interface RegistrarPagamentoResult {
  success: boolean;
  novaFaturaId?: string;
  novaFaturaCodigoSequencial?: string;
  message?: string;
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
    }): Promise<RegistrarPagamentoResult> => {
      // Buscar info completa da fatura antes (para sync com gateway e criar derivada)
      const { data: faturaInfo } = await supabase
        .from("faturas")
        .select("asaas_payment_id, valor_total, valor, saldo_restante, data_vencimento")
        .eq("id", data.fatura_id)
        .maybeSingle();

      const valorTotal = faturaInfo?.saldo_restante || faturaInfo?.valor_total || faturaInfo?.valor || 0;
      const isParcial = data.tipo === 'parcial' && data.valor < valorTotal;
      const saldoRestante = isParcial ? valorTotal - data.valor : 0;

      // Registrar pagamento
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

      // Atualizar fatura original
      // - Pagamento TOTAL: fatura fica Paga
      // - Pagamento PARCIAL: fatura fica Parcial (e o saldo restante será cobrado na fatura derivada)
      const faturaUpdate = isParcial && saldoRestante > 0
        ? { status: "Parcial", saldo_restante: 0 }
        : { status: "Paga", saldo_restante: 0 };

      const { error: faturaError } = await supabase
        .from("faturas")
        .update(faturaUpdate)
        .eq("id", data.fatura_id);

      if (faturaError) throw faturaError;

      // SYNC COM GATEWAY: Confirmar recebimento no Asaas
      // Para pagamento parcial, passamos isPartial=true para NÃO marcar como Paga no Asaas
      // (cancelaremos a cobrança original depois)
      if (faturaInfo?.asaas_payment_id) {
        try {
          const { error: syncError } = await supabase.functions.invoke("asaas-receive-in-cash", {
            body: { 
              faturaId: data.fatura_id,
              paymentDate: new Date().toISOString().split('T')[0],
              value: data.valor,
              notifyCustomer: false,
              isPartial: isParcial, // NÃO marca como paga se for parcial
            },
          });

          if (syncError) {
            console.warn("Aviso: Não foi possível sincronizar com gateway:", syncError);
            // Continua - não bloqueia fluxo
          }
        } catch (syncErr) {
          console.warn("Erro ao sincronizar com gateway:", syncErr);
        }
      }

      // Se for pagamento PARCIAL com saldo restante > 0, criar fatura derivada
      if (isParcial && saldoRestante > 0) {
        console.log(`[useRegistrarPagamento] Pagamento parcial. Criando fatura derivada de R$ ${saldoRestante}`);
        
        // Calcular nova data de vencimento (mesma do original ou +15 dias se já venceu)
        const hoje = new Date();
        const vencimentoOriginal = faturaInfo?.data_vencimento 
          ? new Date(faturaInfo.data_vencimento) 
          : hoje;
        
        const novaDataVencimento = vencimentoOriginal > hoje 
          ? faturaInfo!.data_vencimento
          : new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
          // Cancelar cobrança original no gateway (se existir)
          if (faturaInfo?.asaas_payment_id) {
            try {
              await supabase.functions.invoke("asaas-cancel-payment", {
                body: { paymentId: faturaInfo.asaas_payment_id },
              });
              console.log("[useRegistrarPagamento] Cobrança original cancelada no gateway");
            } catch (cancelErr) {
              console.warn("Aviso: Não foi possível cancelar cobrança original:", cancelErr);
              // Continua mesmo assim - a fatura derivada será criada
            }
          }

          // Criar fatura derivada com nova cobrança (gateway-agnostic)
          const { data: result, error: remainderError } = await supabase.functions.invoke("create-remainder-payment", {
            body: {
              faturaOrigemId: data.fatura_id,
              valorRestante: saldoRestante,
              dataVencimento: novaDataVencimento,
            },
          });

          if (remainderError) {
            console.error("Erro ao criar fatura derivada:", remainderError);
            toast.warning(`Pagamento registrado. Erro ao criar cobrança do saldo: ${remainderError.message}`);
            return { success: true, message: "Pagamento registrado. Crie manualmente a cobrança do saldo restante." };
          }

          if (result?.success) {
            toast.success(
              `Pagamento registrado! Nova cobrança de R$ ${saldoRestante.toFixed(2)} criada (${result.codigoSequencial || 'pendente'})`,
              { duration: 5000 }
            );
            return {
              success: true,
              novaFaturaId: result.novaFaturaId,
              novaFaturaCodigoSequencial: result.codigoSequencial,
              message: `Fatura derivada criada: ${result.codigoSequencial}`,
            };
          } else {
            toast.warning("Pagamento registrado. Verifique a criação da cobrança do saldo.");
            return { success: true, message: result?.message || "Verifique a fatura derivada." };
          }
        } catch (derivadaErr) {
          console.error("Erro ao criar fatura derivada:", derivadaErr);
          toast.warning("Pagamento registrado. Erro ao criar cobrança do saldo restante.");
          return { success: true, message: "Crie manualmente a cobrança do saldo restante." };
        }
      }

      return { success: true };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.pagamentos(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
      
      // Toast já exibido no mutationFn para pagamento parcial
      if (!result?.novaFaturaId && !result?.message) {
        toast.success("Pagamento registrado!");
      }
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
      // Buscar info da fatura antes (para sync com gateway)
      const { data: faturaInfo } = await supabase
        .from("faturas")
        .select("asaas_payment_id, asaas_status")
        .eq("id", data.fatura_id)
        .maybeSingle();

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
        .maybeSingle();

      if (fatura) {
        await supabase
          .from("faturas")
          .update({ 
            saldo_restante: (fatura.saldo_restante || 0) + data.valor,
            status: 'Aberta',
          })
          .eq("id", data.fatura_id);
      }

      // SYNC COM GATEWAY: Desfazer confirmação de recebimento no Asaas
      // Só tenta desfazer se foi recebido em dinheiro (RECEIVED_IN_CASH)
      if (faturaInfo?.asaas_payment_id) {
        try {
          const { error: syncError } = await supabase.functions.invoke("asaas-undo-receive-in-cash", {
            body: { faturaId: data.fatura_id },
          });

          if (syncError) {
            console.warn("Aviso: Não foi possível reverter no gateway:", syncError);
            toast.warning("Estorno registrado. Sincronização com gateway pode estar pendente.");
          }
        } catch (syncErr) {
          console.warn("Erro ao sincronizar estorno com gateway:", syncErr);
          // Não bloqueia - estorno já foi salvo localmente
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.pagamentos(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id), refetchType: 'all' });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.items(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.items(fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
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
      // Buscar o tenant_id e dados da fatura para garantir consistência
      const { data: faturaInfo, error: faturaInfoError } = await supabase
        .from("faturas")
        .select("tenant_id, valor, valor_original, valor_bruto, saldo_restante, asaas_payment_id, alunos(nome_completo), cursos(nome), mes_referencia, ano_referencia")
        .eq("id", data.fatura_id)
        .maybeSingle();

      if (faturaInfoError) throw faturaInfoError;
      if (!faturaInfo) throw new Error("Fatura não encontrada");
      
      // Inserir o desconto com tenant_id
      const { error } = await supabase.from("fatura_descontos").insert({
        fatura_id: data.fatura_id,
        tipo: data.tipo,
        descricao: data.descricao,
        valor: data.valor || 0,
        percentual: data.percentual || 0,
        valor_aplicado: data.valor_aplicado,
        condicao: data.condicao || null,
        tenant_id: faturaInfo?.tenant_id,
      });
      if (error) throw error;

      // Buscar todos os descontos para recalcular
      const { data: todosDescontos } = await supabase
        .from("fatura_descontos")
        .select("valor_aplicado")
        .eq("fatura_id", data.fatura_id);

      const valorBase = faturaInfo.valor_original || faturaInfo.valor_bruto || faturaInfo.valor;
      const totalDescontos = (todosDescontos || []).reduce(
        (sum, d) => sum + Number(d.valor_aplicado || 0), 
        0
      );
      const novoValorTotal = Math.max(0, valorBase - totalDescontos);

      // Atualizar fatura com novo valor total
      await supabase
        .from("faturas")
        .update({ 
          valor_total: novoValorTotal,
          valor_desconto_aplicado: totalDescontos,
          saldo_restante: novoValorTotal,
        })
        .eq("id", data.fatura_id);

      // Se existe cobrança no Asaas, atualizar o valor
      if (faturaInfo.asaas_payment_id) {
        try {
          const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          const mesRef = meses[(faturaInfo.mes_referencia as number) - 1] || "";
          const alunoNome = (faturaInfo.alunos as { nome_completo: string })?.nome_completo || "Aluno";
          const cursoNome = (faturaInfo.cursos as { nome: string })?.nome || "Curso";
          const descricaoAsaas = `Mensalidade ${mesRef}/${faturaInfo.ano_referencia} - ${alunoNome} - ${cursoNome} (com desconto: ${data.descricao})`;
          
          const { error: asaasError } = await supabase.functions.invoke("asaas-update-payment", {
            body: { 
              faturaId: data.fatura_id, 
              novoValor: novoValorTotal,
              descricao: descricaoAsaas,
            },
          });
          
          if (asaasError) {
            console.warn("Aviso: Não foi possível atualizar o boleto Asaas:", asaasError);
            // Não lança erro, pois o desconto já foi aplicado no banco
            toast.warning("Desconto aplicado, mas o boleto Asaas pode precisar ser atualizado manualmente.");
          } else {
            console.log("Boleto Asaas atualizado com novo valor:", novoValorTotal);
          }
        } catch (asaasErr) {
          console.warn("Erro ao atualizar Asaas:", asaasErr);
          toast.warning("Desconto aplicado. Verifique se o boleto precisa de atualização.");
        }
      }

      return { novoValorTotal, totalDescontos };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.descontos(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(variables.fatura_id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      toast.success("Desconto aplicado e boleto atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar desconto: ${error.message}`);
    },
  });
}

/**
 * Hook para deletar fatura permanentemente (não apenas cancelar)
 * Remove do banco de dados E do ASAAS
 */
export function useDeleteFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faturaId: string) => {
      // 1. Buscar fatura
      const { data: fatura, error: fetchError } = await supabase
        .from("faturas")
        .select("asaas_payment_id, status, tenant_id")
        .eq("id", faturaId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Se tem cobrança ASAAS, cancelar/deletar lá primeiro
      if (fatura?.asaas_payment_id) {
        console.log("Cancelando cobrança no ASAAS antes de deletar:", fatura.asaas_payment_id);
        try {
          const { error: cancelError } = await supabase.functions.invoke("asaas-cancel-payment", {
            body: { faturaId, motivo: "Fatura excluída permanentemente" },
          });

          if (cancelError) {
            console.warn("Erro ao cancelar no ASAAS:", cancelError);
            // Continua mesmo com erro - a fatura será deletada localmente
          }
        } catch (asaasErr) {
          console.warn("Erro ao comunicar com ASAAS:", asaasErr);
        }
      }

      // 3. Deletar registros relacionados em cascata
      await supabase.from("fatura_itens").delete().eq("fatura_id", faturaId);
      await supabase.from("fatura_descontos").delete().eq("fatura_id", faturaId);
      await supabase.from("fatura_historico").delete().eq("fatura_id", faturaId);
      await supabase.from("pagamentos").delete().eq("fatura_id", faturaId);
      await supabase.from("fatura_documentos").delete().eq("fatura_id", faturaId);

      // 4. Deletar a fatura permanentemente
      const { error: deleteError } = await supabase
        .from("faturas")
        .delete()
        .eq("id", faturaId);

      if (deleteError) throw deleteError;

      return { deletedId: faturaId, hadAsaas: !!fatura?.asaas_payment_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
      
      if (result.hadAsaas) {
        toast.success("Fatura excluída do sistema e do ASAAS!");
      } else {
        toast.success("Fatura excluída permanentemente!");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir fatura: ${error.message}`);
    },
  });
}

/**
 * Hook para reabrir fatura paga (reverter status)
 * Permite corrigir erros de marcação
 */
export function useReabrirFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, novoStatus, deletarPagamentos = false }: { 
      id: string; 
      novoStatus: 'Aberta' | 'Vencida';
      deletarPagamentos?: boolean;
    }) => {
      // Buscar fatura para saber o valor original E se tem gateway
      const { data: fatura, error: fetchError } = await supabase
        .from("faturas")
        .select("valor_total, valor, valor_original, asaas_payment_id, asaas_status")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Calcular saldo (valor total da fatura)
      const valorTotal = fatura?.valor_total || fatura?.valor_original || fatura?.valor || 0;

      // Atualizar status e restaurar saldo
      const { error: updateError } = await supabase
        .from("faturas")
        .update({
          status: novoStatus,
          saldo_restante: valorTotal,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Opcionalmente deletar pagamentos registrados
      if (deletarPagamentos) {
        await supabase.from("pagamentos").delete().eq("fatura_id", id);
      }

      // SYNC COM GATEWAY: Desfazer confirmação de recebimento no Asaas
      if (fatura?.asaas_payment_id) {
        try {
          const { error: syncError } = await supabase.functions.invoke("asaas-undo-receive-in-cash", {
            body: { faturaId: id },
          });

          if (syncError) {
            console.warn("Aviso: Não foi possível reverter no gateway:", syncError);
            toast.warning("Fatura reaberta. Sincronização com gateway pode estar pendente.");
          }
        } catch (syncErr) {
          console.warn("Erro ao sincronizar reabertura com gateway:", syncErr);
          // Não bloqueia - fatura já foi reaberta localmente
        }
      }

      return { id, novoStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.list(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.detail(result.id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.pagamentos(result.id), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
      toast.success(`Fatura reaberta com status "${result.novoStatus}"!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reabrir fatura: ${error.message}`);
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
