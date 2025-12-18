import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, shortCacheConfig } from "./useQueryConfig";

export interface DashboardStats {
  totalAlunos: number;
  alunosAtivos: number;
  faturasAbertas: number;
  faturasPagas: number;
  faturasVencidas: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoMensal: number;
  receitasMes: { mes: string; valor: number }[];
  despesasMes: { mes: string; valor: number }[];
  inadimplencia: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Execute all queries in parallel
  const [
    alunosResult,
    faturasResult,
    pagamentosResult,
    despesasResult,
    pagamentosHistoricoResult,
    despesasHistoricoResult,
  ] = await Promise.all([
    // Total students
    supabase.from("alunos").select("id, status_matricula"),
    
    // Invoices for current month
    supabase
      .from("faturas")
      .select("id, status, valor")
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
  ]);

  const alunos = alunosResult.data || [];
  const faturas = faturasResult.data || [];
  const pagamentos = pagamentosResult.data || [];
  const despesas = despesasResult.data || [];

  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === "ativo").length;
  
  const faturasAbertas = faturas.filter(f => f.status === "Aberta").length;
  const faturasPagas = faturas.filter(f => f.status === "Paga").length;
  const faturasVencidas = faturas.filter(f => f.status === "Vencida").length;
  
  const totalReceitas = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valor), 0);

  // Calculate inadimplência rate
  const totalFaturasMes = faturas.length;
  const inadimplencia = totalFaturasMes > 0 
    ? Math.round((faturasVencidas / totalFaturasMes) * 100) 
    : 0;

  // Process historical data for charts
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  const receitasMes = processMonthlyData(pagamentosHistoricoResult.data || [], monthNames);
  const despesasMes = processMonthlyData(despesasHistoricoResult.data || [], monthNames);

  return {
    totalAlunos,
    alunosAtivos,
    faturasAbertas,
    faturasPagas,
    faturasVencidas,
    totalReceitas,
    totalDespesas,
    saldoMensal: totalReceitas - totalDespesas,
    receitasMes,
    despesasMes,
    inadimplencia,
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
