import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "./useQueryConfig";

export interface DashboardStats {
  // Responsáveis
  totalResponsaveis: number;
  responsaveisAtivos: number;
  
  // Alunos
  totalAlunos: number;
  alunosAtivos: number;
  
  // Faturas
  faturasAbertas: number;
  faturasPagas: number;
  faturasVencidas: number;
  
  // Financeiro
  totalReceitas: number;
  totalDespesas: number;
  saldoMensal: number;
  valorAReceber: number;
  
  // Gráficos
  receitasMes: { mes: string; valor: number }[];
  despesasMes: { mes: string; valor: number }[];
  
  // Indicadores
  inadimplencia: number;
  inadimplenciaResponsaveis: number;
  
  // RH
  totalFuncionarios: number;
  funcionariosAtivos: number;
  gastoRHMensal: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Execute all queries in parallel
  const [
    responsaveisResult,
    alunosResult,
    faturasResult,
    pagamentosResult,
    despesasResult,
    pagamentosHistoricoResult,
    despesasHistoricoResult,
    funcionariosResult,
    folhaPagamentoResult,
  ] = await Promise.all([
    // Responsáveis
    supabase.from("responsaveis").select("id, ativo"),
    
    // Total students
    supabase.from("alunos").select("id, status_matricula"),
    
    // Invoices for current month
    supabase
      .from("faturas")
      .select("id, status, valor, responsavel_id")
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
  const faturas = faturasResult.data || [];
  const pagamentos = pagamentosResult.data || [];
  const despesas = despesasResult.data || [];
  const funcionarios = funcionariosResult.data || [];
  const folhaPagamento = folhaPagamentoResult.data || [];
  // Responsáveis stats
  const totalResponsaveis = responsaveis.length;
  const responsaveisAtivos = responsaveis.filter(r => r.ativo).length;

  // Alunos stats
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === "ativo").length;
  
  // Faturas stats
  const faturasAbertas = faturas.filter(f => f.status === "Aberta").length;
  const faturasPagas = faturas.filter(f => f.status === "Paga").length;
  const faturasVencidas = faturas.filter(f => f.status === "Vencida").length;
  
  // Valor a receber (faturas abertas)
  const valorAReceber = faturas
    .filter(f => f.status === "Aberta" || f.status === "Vencida")
    .reduce((sum, f) => sum + Number(f.valor), 0);
  
  // Financeiro
  const totalReceitas = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valor), 0);

  // Calculate inadimplência rate (faturas)
  const totalFaturasMes = faturas.length;
  const inadimplencia = totalFaturasMes > 0 
    ? Math.round((faturasVencidas / totalFaturasMes) * 100) 
    : 0;

  // Inadimplência por responsável
  const responsaveisComVencidas = new Set(
    faturas.filter(f => f.status === "Vencida").map(f => f.responsavel_id)
  ).size;
  const inadimplenciaResponsaveis = responsaveisAtivos > 0
    ? Math.round((responsaveisComVencidas / responsaveisAtivos) * 100)
    : 0;

  // Process historical data for charts
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  // RH Stats
  const totalFuncionarios = funcionarios.length;
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
  const gastoRHMensal = folhaPagamento.reduce((sum, f) => sum + Number(f.total_liquido || 0), 0);

  const receitasMes = processMonthlyData(pagamentosHistoricoResult.data || [], monthNames);
  const despesasMes = processMonthlyData(despesasHistoricoResult.data || [], monthNames);

  return {
    totalResponsaveis,
    responsaveisAtivos,
    totalAlunos,
    alunosAtivos,
    faturasAbertas,
    faturasPagas,
    faturasVencidas,
    totalReceitas,
    totalDespesas,
    saldoMensal: totalReceitas - totalDespesas,
    valorAReceber,
    receitasMes,
    despesasMes,
    inadimplencia,
    inadimplenciaResponsaveis,
    totalFuncionarios,
    funcionariosAtivos,
    gastoRHMensal,
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
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
