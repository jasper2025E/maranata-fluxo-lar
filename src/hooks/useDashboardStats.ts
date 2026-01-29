import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "./useQueryConfig";

export interface AgingData {
  ate30: number;
  de31a60: number;
  mais60: number;
}

export interface DashboardStats {
  // Responsáveis
  totalResponsaveis: number;
  responsaveisAtivos: number;
  responsaveisInadimplentes: number;
  
  // Alunos
  totalAlunos: number;
  alunosAtivos: number;
  
  // Faturas
  totalFaturas: number;
  faturasAbertas: number;
  faturasPagas: number;
  faturasVencidas: number;
  
  // Financeiro
  totalReceitas: number;
  totalDespesas: number;
  saldoMensal: number;
  valorAReceber: number;
  valorVencido: number;
  ticketMedio: number;
  
  // Gráficos
  receitasMes: { mes: string; valor: number }[];
  despesasMes: { mes: string; valor: number }[];
  combinedData: { mes: string; receitas: number; despesas: number; saldo: number }[];
  
  // Indicadores
  inadimplencia: number;
  inadimplenciaResponsaveis: number;
  taxaArrecadacao: number;
  aging: AgingData;
  
  // RH
  totalFuncionarios: number;
  funcionariosAtivos: number;
  gastoRHMensal: number;
  
  // Comparativos
  variacaoReceitas: number;
  variacaoDespesas: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  // Calculate previous month for comparison
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Execute all queries in parallel
  const [
    responsaveisResult,
    alunosResult,
    faturasCurrentMonthResult,
    faturasAllOpenResult,
    faturasVencidasResult,
    faturasPagasCurrentMonthResult,
    pagamentosResult,
    pagamentosPrevResult,
    despesasResult,
    despesasPrevResult,
    pagamentosHistoricoResult,
    despesasHistoricoResult,
    funcionariosResult,
    folhaPagamentoResult,
  ] = await Promise.all([
    // Responsáveis
    supabase.from("responsaveis").select("id, ativo"),
    
    // Total students
    supabase.from("alunos").select("id, status_matricula"),
    
    // All invoices for current month (for stats display)
    supabase
      .from("faturas")
      .select("id, status, valor, valor_total, responsavel_id, data_vencimento")
      .eq("mes_referencia", currentMonth)
      .eq("ano_referencia", currentYear),
    
    // ALL open invoices (Aberta status) - for "Valor a Receber"
    supabase
      .from("faturas")
      .select("id, status, valor, valor_total, responsavel_id, data_vencimento")
      .in("status", ["Aberta", "Vencida"]),
    
    // All overdue invoices with aging
    supabase
      .from("faturas")
      .select("id, status, valor, valor_total, responsavel_id, data_vencimento")
      .eq("status", "Vencida"),
    
    // Paid invoices for current month (for revenue calculation)
    supabase
      .from("faturas")
      .select("id, valor, valor_total")
      .eq("status", "Paga")
      .eq("mes_referencia", currentMonth)
      .eq("ano_referencia", currentYear),
    
    // Payments for current month
    supabase
      .from("pagamentos")
      .select("valor, data_pagamento")
      .gte("data_pagamento", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
      .lt("data_pagamento", currentMonth === 12 
        ? `${currentYear + 1}-01-01` 
        : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
      ),
    
    // Payments for previous month (comparison)
    supabase
      .from("pagamentos")
      .select("valor")
      .gte("data_pagamento", `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`)
      .lt("data_pagamento", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`),
    
    // Expenses for current month
    supabase
      .from("despesas")
      .select("valor, paga")
      .eq("paga", true)
      .gte("data_pagamento", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
      .lt("data_pagamento", currentMonth === 12 
        ? `${currentYear + 1}-01-01` 
        : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
      ),
    
    // Expenses for previous month (comparison)
    supabase
      .from("despesas")
      .select("valor")
      .eq("paga", true)
      .gte("data_pagamento", `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`)
      .lt("data_pagamento", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`),

    // Last 6 months payments for chart
    supabase
      .from("pagamentos")
      .select("valor, data_pagamento")
      .gte("data_pagamento", new Date(currentYear, currentMonth - 6, 1).toISOString().split("T")[0]),

    // Last 6 months expenses for chart
    supabase
      .from("despesas")
      .select("valor, data_pagamento")
      .eq("paga", true)
      .gte("data_pagamento", new Date(currentYear, currentMonth - 6, 1).toISOString().split("T")[0]),

    // Funcionários
    supabase.from("funcionarios").select("id, status, salario_base"),

    // Folha de pagamento do mês atual
    supabase
      .from("folha_pagamento")
      .select("total_liquido, pago")
      .eq("mes_referencia", currentMonth)
      .eq("ano_referencia", currentYear)
      .eq("pago", true),
  ]);

  const responsaveis = responsaveisResult.data || [];
  const alunos = alunosResult.data || [];
  const faturasCurrentMonth = faturasCurrentMonthResult.data || [];
  const faturasAllOpen = faturasAllOpenResult.data || [];
  const faturasVencidasAll = faturasVencidasResult.data || [];
  const faturasPagasCurrentMonth = faturasPagasCurrentMonthResult.data || [];
  const pagamentos = pagamentosResult.data || [];
  const pagamentosPrev = pagamentosPrevResult.data || [];
  const despesas = despesasResult.data || [];
  const despesasPrev = despesasPrevResult.data || [];
  const funcionarios = funcionariosResult.data || [];
  const folhaPagamento = folhaPagamentoResult.data || [];

  // Responsáveis stats
  const totalResponsaveis = responsaveis.length;
  const responsaveisAtivos = responsaveis.filter(r => r.ativo).length;
  const responsaveisComVencidas = new Set(
    faturasVencidasAll.map(f => f.responsavel_id).filter(Boolean)
  ).size;

  // Alunos stats
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === "ativo").length;
  
  // Faturas stats (current month)
  const totalFaturas = faturasCurrentMonth.length;
  const faturasAbertas = faturasCurrentMonth.filter(f => f.status === "Aberta").length;
  const faturasPagas = faturasCurrentMonth.filter(f => f.status === "Paga").length;
  const faturasVencidas = faturasCurrentMonth.filter(f => f.status === "Vencida").length;
  
  // Valor a receber = ALL open/overdue invoices (not just current month)
  const valorAReceber = faturasAllOpen
    .reduce((sum, f) => sum + Number((f as any).valor_total || f.valor), 0);
  
  const valorVencido = faturasVencidasAll
    .reduce((sum, f) => sum + Number((f as any).valor_total || f.valor), 0);
  
  // Financeiro - Receitas = faturas PAGAS do mês atual + pagamentos registrados
  const receitasFaturasPagas = faturasPagasCurrentMonth.reduce(
    (sum, f) => sum + Number((f as any).valor_total || f.valor), 0
  );
  const receitasPagamentos = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  // Use the higher value to avoid double-counting, prioritize paid invoices
  const totalReceitas = Math.max(receitasFaturasPagas, receitasPagamentos);
  
  const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valor), 0);
  const totalReceitasPrev = pagamentosPrev.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalDespesasPrev = despesasPrev.reduce((sum, d) => sum + Number(d.valor), 0);

  // Variações
  const variacaoReceitas = totalReceitasPrev > 0 
    ? ((totalReceitas - totalReceitasPrev) / totalReceitasPrev) * 100 
    : 0;
  const variacaoDespesas = totalDespesasPrev > 0 
    ? ((totalDespesas - totalDespesasPrev) / totalDespesasPrev) * 100 
    : 0;

  // Ticket médio (based on paid invoices count)
  const ticketMedio = faturasPagas > 0 ? totalReceitas / faturasPagas : 0;

  // Taxa de arrecadação - based on current month invoices
  const valorEsperado = faturasCurrentMonth.reduce((sum, f) => sum + Number((f as any).valor_total || f.valor), 0);
  const taxaArrecadacao = valorEsperado > 0 ? (totalReceitas / valorEsperado) * 100 : 0;

  // Calculate inadimplência rate based on current month
  const totalFaturasMes = faturasCurrentMonth.length;
  const inadimplencia = totalFaturasMes > 0 
    ? Math.round((faturasVencidas / totalFaturasMes) * 100) 
    : 0;

  const inadimplenciaResponsaveis = responsaveisAtivos > 0
    ? Math.round((responsaveisComVencidas / responsaveisAtivos) * 100)
    : 0;

  // Calculate aging
  const aging: AgingData = { ate30: 0, de31a60: 0, mais60: 0 };
  const todayDate = new Date(today);
  
  faturasVencidasAll.forEach(f => {
    const vencimento = new Date(f.data_vencimento);
    const diasAtraso = Math.floor((todayDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasAtraso <= 30) aging.ate30++;
    else if (diasAtraso <= 60) aging.de31a60++;
    else aging.mais60++;
  });

  // Process historical data for charts
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  // RH Stats
  const totalFuncionarios = funcionarios.length;
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
  const gastoRHMensal = folhaPagamento.reduce((sum, f) => sum + Number(f.total_liquido || 0), 0);

  const receitasMes = processMonthlyData(pagamentosHistoricoResult.data || [], monthNames);
  const despesasMes = processMonthlyData(despesasHistoricoResult.data || [], monthNames);
  
  // Combined data for composed chart
  const combinedData = receitasMes.map((item, index) => ({
    mes: item.mes,
    receitas: item.valor,
    despesas: despesasMes[index]?.valor || 0,
    saldo: item.valor - (despesasMes[index]?.valor || 0),
  }));

  return {
    totalResponsaveis,
    responsaveisAtivos,
    responsaveisInadimplentes: responsaveisComVencidas,
    totalAlunos,
    alunosAtivos,
    totalFaturas,
    faturasAbertas,
    faturasPagas,
    faturasVencidas,
    totalReceitas,
    totalDespesas,
    saldoMensal: totalReceitas - totalDespesas,
    valorAReceber,
    valorVencido,
    ticketMedio,
    receitasMes,
    despesasMes,
    combinedData,
    inadimplencia,
    inadimplenciaResponsaveis,
    taxaArrecadacao,
    aging,
    totalFuncionarios,
    funcionariosAtivos,
    gastoRHMensal,
    variacaoReceitas,
    variacaoDespesas,
  };
}

function processMonthlyData(
  data: { valor: number; data_pagamento: string }[], 
  monthNames: string[]
): { mes: string; valor: number }[] {
  const monthlyTotals: Record<string, number> = {};
  
  data.forEach(item => {
    if (item.data_pagamento) {
      const date = new Date(item.data_pagamento);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(item.valor);
    }
  });

  // Get last 6 months
  const result: { mes: string; valor: number }[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({
      mes: monthNames[d.getMonth()],
      valor: monthlyTotals[key] || 0,
    });
  }
  
  return result;
}

export function useDashboardStats() {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates for automatic dashboard refresh
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pagamentos" },
        () => {
          console.log("Pagamento atualizado - refresh dashboard");
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faturas" },
        () => {
          console.log("Fatura atualizada - refresh dashboard");
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "despesas" },
        () => {
          console.log("Despesa atualizada - refresh dashboard");
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alunos" },
        () => {
          console.log("Aluno atualizado - refresh dashboard");
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 30, // 30 segundos - mais responsivo
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Garante dados frescos ao montar
  });
}
