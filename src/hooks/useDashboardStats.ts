import { useQuery } from "@tanstack/react-query";
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
  saldoAnterior: number;
  valorAReceber: number;
  valorVencido: number;
  ticketMedio: number;
  
  // Anuais
  receitaAnualRecebida: number;
  receitaAnualEsperada: number;
  despesaAnualPaga: number;
  despesaAnualTotal: number;
  
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
  const startOfCurrentMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;

  // Execute all queries in parallel
  const [
    responsaveisResult,
    alunosResult,
    faturasCurrentMonthResult,
    faturasEmAbertoMesResult,
    overdueRpcResult,
    faturasPagasCurrentMonthResult,
    pagamentosResult,
    pagamentosPrevResult,
    despesasResult,
    despesasPrevResult,
    pagamentosHistoricoResult,
    despesasHistoricoResult,
    funcionariosResult,
    folhaPagamentoResult,
    pagamentosAnuaisResult,
    faturasAnuaisResult,
    despesasAnuaisResult,
    pagamentosAcumuladosResult,
    despesasAcumuladasResult,
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
    
    // Open invoices from current month only (for monthly dashboard "Valor a Receber")
    supabase
      .from("faturas")
      .select("id, status, valor, valor_total, responsavel_id, data_vencimento")
      .in("status", ["Aberta", "Vencida"])
      .eq("mes_referencia", currentMonth)
      .eq("ano_referencia", currentYear),
    
    // All overdue invoices aggregated via RPC (bypasses 1000-row limit)
    supabase.rpc("get_overdue_invoices_summary"),
    
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

    // Annual: all payments this year
    supabase
      .from("pagamentos")
      .select("valor")
      .gte("data_pagamento", `${currentYear}-01-01`)
      .lt("data_pagamento", `${currentYear + 1}-01-01`),

    // Annual: all invoices this year (expected revenue)
    supabase
      .from("faturas")
      .select("valor, valor_total, status")
      .eq("ano_referencia", currentYear),

    // Annual: all paid expenses this year
    supabase
      .from("despesas")
      .select("valor, paga")
      .gte("data_vencimento", `${currentYear}-01-01`)
      .lt("data_vencimento", `${currentYear + 1}-01-01`),

    // Cumulative: ALL payments before current month (for accurate saldo anterior)
    supabase
      .from("pagamentos")
      .select("valor")
      .lt("data_pagamento", startOfCurrentMonth),

    // Cumulative: ALL paid expenses before current month
    supabase
      .from("despesas")
      .select("valor")
      .eq("paga", true)
      .not("data_pagamento", "is", null)
      .lt("data_pagamento", startOfCurrentMonth),
  ]);

  const responsaveis = responsaveisResult.data || [];
  const alunos = alunosResult.data || [];
  const faturasCurrentMonth = faturasCurrentMonthResult.data || [];
  const faturasEmAbertoMes = faturasEmAbertoMesResult.data || [];
  const faturasPagasCurrentMonth = faturasPagasCurrentMonthResult.data || [];
  const pagamentos = pagamentosResult.data || [];
  const pagamentosPrev = pagamentosPrevResult.data || [];
  const despesas = despesasResult.data || [];
  const despesasPrev = despesasPrevResult.data || [];
  const funcionarios = funcionariosResult.data || [];
  const folhaPagamento = folhaPagamentoResult.data || [];

  // Overdue aggregation from RPC (accurate, bypasses row limits)
  const overdueData = overdueRpcResult.data?.[0] || {
    total_valor_vencido: 0,
    total_faturas_vencidas: 0,
    total_responsaveis_inadimplentes: 0,
    aging_ate30: 0,
    aging_de31a60: 0,
    aging_mais60: 0,
  };

  // Responsáveis stats
  const totalResponsaveis = responsaveis.length;
  const responsaveisAtivos = responsaveis.filter(r => r.ativo).length;
  const responsaveisComVencidas = Number(overdueData.total_responsaveis_inadimplentes);

  // Alunos stats
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === "ativo").length;
  
  // Faturas stats (current month for general counts, RPC for overdue totals)
  const totalFaturas = faturasCurrentMonth.length;
  const faturasAbertas = faturasCurrentMonth.filter(f => f.status === "Aberta").length;
  const faturasPagas = faturasCurrentMonth.filter(f => f.status === "Paga").length;
  // Use RPC total for overdue count (includes ALL months, not just current)
  const faturasVencidas = Number(overdueData.total_faturas_vencidas);
  
  // Valor a receber = ONLY open/overdue invoices from current month
  const valorAReceber = faturasEmAbertoMes
    .reduce((sum, f) => sum + Number((f as any).valor_total || f.valor), 0);
  
  // Valor vencido from RPC (accurate across ALL invoices)
  const valorVencido = Number(overdueData.total_valor_vencido);
  
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
  
  // Saldo anterior CUMULATIVO: soma de TODOS os pagamentos - TODAS as despesas pagas antes do mês atual
  const totalReceitasAcumuladas = (pagamentosAcumuladosResult.data || []).reduce((sum, p) => sum + Number(p.valor), 0);
  const totalDespesasAcumuladas = (despesasAcumuladasResult.data || []).reduce((sum, d) => sum + Number(d.valor), 0);
  const saldoAnterior = totalReceitasAcumuladas - totalDespesasAcumuladas;

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

  // Calculate aging from RPC data
  const aging: AgingData = {
    ate30: Number(overdueData.aging_ate30),
    de31a60: Number(overdueData.aging_de31a60),
    mais60: Number(overdueData.aging_mais60),
  };

  // Process historical data for charts
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  // RH Stats
  const totalFuncionarios = funcionarios.length;
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
  const gastoRHMensal = folhaPagamento.reduce((sum, f) => sum + Number(f.total_liquido || 0), 0);

  // Annual calculations
  const pagamentosAnuais = pagamentosAnuaisResult.data || [];
  const faturasAnuais = faturasAnuaisResult.data || [];
  const despesasAnuais = despesasAnuaisResult.data || [];

  const receitaAnualRecebida = pagamentosAnuais.reduce((sum, p) => sum + Number(p.valor), 0);
  const receitaAnualEsperada = faturasAnuais.reduce((sum, f) => sum + Number((f as any).valor_total || f.valor), 0);
  const despesaAnualPaga = despesasAnuais.filter(d => d.paga).reduce((sum, d) => sum + Number(d.valor), 0);
  const despesaAnualTotal = despesasAnuais.reduce((sum, d) => sum + Number(d.valor), 0);

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
    saldoMensal: saldoAnterior + totalReceitas - totalDespesas,
    saldoAnterior,
    valorAReceber,
    valorVencido,
    ticketMedio,
    receitaAnualRecebida,
    receitaAnualEsperada,
    despesaAnualPaga,
    despesaAnualTotal,
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
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 3, // 3 minutos - realtime cuida de invalidar
    gcTime: 1000 * 60 * 15,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Usa cache na navegação
  });
}
