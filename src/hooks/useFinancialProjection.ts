import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "./useQueryConfig";

// ============= TYPES =============

export type ScenarioType = "conservative" | "realistic" | "optimistic";
export type HealthStatus = "healthy" | "attention" | "risk";

export interface ProjectionPeriod {
  label: string;
  months: number;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface FinancialScenario {
  type: ScenarioType;
  label: string;
  growthRate: number;
  expenseRate: number;
  projections: ProjectionPeriod[];
}

export interface HealthIndicator {
  id: string;
  label: string;
  value: number;
  threshold: { healthy: number; attention: number };
  status: HealthStatus;
  description: string;
}

export interface FinancialAlert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  actionLabel?: string;
}

export interface FinancialRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
}

export interface FinancialProjectionData {
  // Historical data
  historicalMonths: number;
  avgMonthlyRevenue: number;
  avgMonthlyExpenses: number;
  avgMonthlyProfit: number;
  revenueGrowthRate: number;
  expenseGrowthRate: number;
  
  // Current state
  currentCashBalance: number;
  monthsOfRunway: number;
  recurringRevenueRatio: number;
  delinquencyRate: number;
  fixedCostRatio: number;
  profitMargin: number;
  breakEvenPoint: number;
  
  // Scenarios
  scenarios: FinancialScenario[];
  
  // Health indicators
  healthIndicators: HealthIndicator[];
  overallHealth: HealthStatus;
  
  // Alerts
  alerts: FinancialAlert[];
  
  // Recommendations
  recommendations: FinancialRecommendation[];
  
  // Chart data
  historicalData: { month: string; revenue: number; expenses: number; profit: number }[];
  projectionData: { month: string; conservative: number; realistic: number; optimistic: number }[];
}

// ============= HELPER FUNCTIONS =============

function getHealthStatus(value: number, threshold: { healthy: number; attention: number }, inverted = false): HealthStatus {
  if (inverted) {
    if (value <= threshold.healthy) return "healthy";
    if (value <= threshold.attention) return "attention";
    return "risk";
  }
  if (value >= threshold.healthy) return "healthy";
  if (value >= threshold.attention) return "attention";
  return "risk";
}

function generateProjections(
  avgRevenue: number,
  avgExpenses: number,
  growthRate: number,
  expenseRate: number
): ProjectionPeriod[] {
  const periods = [
    { label: "30 dias", months: 1 },
    { label: "3 meses", months: 3 },
    { label: "6 meses", months: 6 },
    { label: "12 meses", months: 12 },
  ];

  return periods.map(period => {
    const compoundGrowth = Math.pow(1 + growthRate, period.months);
    const compoundExpense = Math.pow(1 + expenseRate, period.months);
    
    const totalRevenue = avgRevenue * period.months * compoundGrowth;
    const totalExpenses = avgExpenses * period.months * compoundExpense;
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      label: period.label,
      months: period.months,
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      margin,
    };
  });
}

function generateAlerts(data: {
  monthsOfRunway: number;
  revenueGrowthRate: number;
  expenseGrowthRate: number;
  delinquencyRate: number;
  profitMargin: number;
  fixedCostRatio: number;
  topClientsConcentration: number;
}): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  // Cash runway alert
  if (data.monthsOfRunway <= 3) {
    alerts.push({
      id: "runway-critical",
      type: "danger",
      title: `Se continuar assim, o caixa zera em ${Math.ceil(data.monthsOfRunway)} meses`,
      description: "É urgente aumentar receitas ou reduzir despesas para manter a operação.",
    });
  } else if (data.monthsOfRunway <= 6) {
    alerts.push({
      id: "runway-warning",
      type: "warning",
      title: `Reserva financeira dura apenas ${Math.ceil(data.monthsOfRunway)} meses`,
      description: "Considere criar uma reserva maior para imprevistos.",
    });
  }

  // Expense growth vs revenue
  if (data.expenseGrowthRate > data.revenueGrowthRate && data.expenseGrowthRate > 0.02) {
    alerts.push({
      id: "expense-growth",
      type: "warning",
      title: "Despesas cresceram mais rápido que a receita",
      description: `Despesas: +${(data.expenseGrowthRate * 100).toFixed(1)}% | Receitas: +${(data.revenueGrowthRate * 100).toFixed(1)}%`,
    });
  }

  // Delinquency
  if (data.delinquencyRate > 15) {
    alerts.push({
      id: "delinquency-high",
      type: "danger",
      title: "Inadimplência acima do recomendado",
      description: `Taxa atual: ${data.delinquencyRate.toFixed(1)}%. O ideal é manter abaixo de 10%.`,
    });
  } else if (data.delinquencyRate > 10) {
    alerts.push({
      id: "delinquency-warning",
      type: "warning",
      title: "Atenção à inadimplência",
      description: `Taxa atual: ${data.delinquencyRate.toFixed(1)}%. Monitore de perto.`,
    });
  }

  // Profit margin
  if (data.profitMargin < 5) {
    alerts.push({
      id: "margin-critical",
      type: "danger",
      title: "Margem de lucro muito baixa",
      description: `Margem atual: ${data.profitMargin.toFixed(1)}%. O negócio opera no limite.`,
    });
  } else if (data.profitMargin < 15) {
    alerts.push({
      id: "margin-low",
      type: "warning",
      title: "Margem de lucro abaixo do ideal",
      description: `Margem atual: ${data.profitMargin.toFixed(1)}%. O ideal para escolas é acima de 15%.`,
    });
  }

  // Fixed costs
  if (data.fixedCostRatio > 80) {
    alerts.push({
      id: "fixed-costs",
      type: "warning",
      title: "Alta proporção de custos fixos",
      description: `${data.fixedCostRatio.toFixed(0)}% do faturamento são custos fixos. Isso reduz flexibilidade.`,
    });
  }

  // Client concentration (simulated for now)
  if (data.topClientsConcentration > 30) {
    alerts.push({
      id: "client-concentration",
      type: "info",
      title: "Alta dependência de poucos clientes",
      description: "Diversifique a base de alunos para reduzir riscos.",
    });
  }

  return alerts;
}

function generateRecommendations(data: {
  profitMargin: number;
  delinquencyRate: number;
  fixedCostRatio: number;
  monthsOfRunway: number;
  expenseGrowthRate: number;
  revenueGrowthRate: number;
}): FinancialRecommendation[] {
  const recommendations: FinancialRecommendation[] = [];

  // Cash runway recommendation
  if (data.monthsOfRunway < 6) {
    recommendations.push({
      id: "build-reserve",
      priority: "high",
      title: "Construir reserva financeira",
      description: "Separe pelo menos 10% das receitas mensais para criar uma reserva de 6 meses de operação.",
      impact: "Segurança financeira",
    });
  }

  // Cost reduction
  if (data.fixedCostRatio > 70 || data.expenseGrowthRate > data.revenueGrowthRate) {
    recommendations.push({
      id: "reduce-costs",
      priority: data.fixedCostRatio > 80 ? "high" : "medium",
      title: `Reduzir despesas fixas em ${Math.min(15, data.fixedCostRatio - 60).toFixed(0)}%`,
      description: "Renegocie contratos de fornecedores, revise gastos com pessoal e otimize processos.",
      impact: `Economia de ~R$ ${((data.fixedCostRatio - 60) * 100).toFixed(0)}/mês`,
    });
  }

  // Delinquency control
  if (data.delinquencyRate > 8) {
    recommendations.push({
      id: "control-delinquency",
      priority: data.delinquencyRate > 15 ? "high" : "medium",
      title: "Melhorar controle de inadimplência",
      description: "Implemente lembretes automáticos, ofereça descontos para pagamento antecipado e agilize cobranças.",
      impact: `Recuperar até ${data.delinquencyRate.toFixed(0)}% da receita`,
    });
  }

  // Pricing adjustment
  if (data.profitMargin < 15) {
    recommendations.push({
      id: "adjust-pricing",
      priority: data.profitMargin < 5 ? "high" : "medium",
      title: "Considerar reajuste de mensalidades",
      description: "Avalie um reajuste proporcional à inflação e ao valor entregue. Comunique com antecedência.",
      impact: `Aumentar margem para ${Math.min(20, data.profitMargin + 5).toFixed(0)}%`,
    });
  }

  // Growth opportunity
  if (data.profitMargin > 20 && data.monthsOfRunway > 6) {
    recommendations.push({
      id: "invest-growth",
      priority: "low",
      title: "Momento favorável para investir",
      description: "Com boa margem e reserva, considere expandir turmas, marketing ou infraestrutura.",
      impact: "Crescimento sustentável",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============= MAIN FETCH FUNCTION =============

async function fetchFinancialProjection(): Promise<FinancialProjectionData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Fetch last 12 months of data
  const startDate = new Date(currentYear - 1, currentMonth - 1, 1).toISOString().split("T")[0];

  const [
    pagamentosResult,
    despesasResult,
    faturasResult,
    funcionariosResult,
  ] = await Promise.all([
    // All payments in the last 12 months
    supabase
      .from("pagamentos")
      .select("valor, data_pagamento")
      .gte("data_pagamento", startDate),
    
    // All paid expenses in the last 12 months
    supabase
      .from("despesas")
      .select("valor, data_pagamento, recorrente, categoria")
      .eq("paga", true)
      .gte("data_pagamento", startDate),
    
    // All invoices for delinquency calculation
    supabase
      .from("faturas")
      .select("id, status, valor, data_vencimento")
      .gte("data_vencimento", startDate),
    
    // Active employees for payroll calculation
    supabase
      .from("funcionarios")
      .select("salario_base")
      .eq("status", "ativo"),
  ]);

  const pagamentos = pagamentosResult.data || [];
  const despesas = despesasResult.data || [];
  const faturas = faturasResult.data || [];
  const funcionarios = funcionariosResult.data || [];

  // Process monthly data
  const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = { revenue: 0, expenses: 0 };
  }

  // Fill revenue data
  pagamentos.forEach(p => {
    if (p.data_pagamento) {
      const date = new Date(p.data_pagamento);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key]) {
        monthlyData[key].revenue += Number(p.valor);
      }
    }
  });

  // Fill expense data
  despesas.forEach(d => {
    if (d.data_pagamento) {
      const date = new Date(d.data_pagamento);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key]) {
        monthlyData[key].expenses += Number(d.valor);
      }
    }
  });

  // Convert to array for calculations
  const sortedMonths = Object.keys(monthlyData).sort();
  const monthlyArray = sortedMonths.map(key => ({
    key,
    month: monthNames[parseInt(key.split("-")[1]) - 1],
    ...monthlyData[key],
    profit: monthlyData[key].revenue - monthlyData[key].expenses,
  }));

  // Calculate averages (excluding months with zero data for more accuracy)
  const activeMonths = monthlyArray.filter(m => m.revenue > 0 || m.expenses > 0);
  const historicalMonths = activeMonths.length;
  
  const avgMonthlyRevenue = activeMonths.length > 0
    ? activeMonths.reduce((sum, m) => sum + m.revenue, 0) / activeMonths.length
    : 0;
  
  const avgMonthlyExpenses = activeMonths.length > 0
    ? activeMonths.reduce((sum, m) => sum + m.expenses, 0) / activeMonths.length
    : 0;
  
  const avgMonthlyProfit = avgMonthlyRevenue - avgMonthlyExpenses;
  const profitMargin = avgMonthlyRevenue > 0 ? (avgMonthlyProfit / avgMonthlyRevenue) * 100 : 0;

  // Calculate growth rates (comparing last 3 months vs previous 3 months)
  const last3 = activeMonths.slice(-3);
  const prev3 = activeMonths.slice(-6, -3);
  
  const last3AvgRevenue = last3.length > 0 
    ? last3.reduce((sum, m) => sum + m.revenue, 0) / last3.length 
    : avgMonthlyRevenue;
  const prev3AvgRevenue = prev3.length > 0 
    ? prev3.reduce((sum, m) => sum + m.revenue, 0) / prev3.length 
    : avgMonthlyRevenue;
  
  const last3AvgExpenses = last3.length > 0 
    ? last3.reduce((sum, m) => sum + m.expenses, 0) / last3.length 
    : avgMonthlyExpenses;
  const prev3AvgExpenses = prev3.length > 0 
    ? prev3.reduce((sum, m) => sum + m.expenses, 0) / prev3.length 
    : avgMonthlyExpenses;

  const revenueGrowthRate = prev3AvgRevenue > 0 
    ? (last3AvgRevenue - prev3AvgRevenue) / prev3AvgRevenue / 3 
    : 0;
  const expenseGrowthRate = prev3AvgExpenses > 0 
    ? (last3AvgExpenses - prev3AvgExpenses) / prev3AvgExpenses / 3 
    : 0;

  // Calculate current state
  const currentCashBalance = avgMonthlyProfit * 3; // Simplified: 3 months of profit as cash
  const monthsOfRunway = avgMonthlyExpenses > 0 
    ? Math.max(0, currentCashBalance / avgMonthlyExpenses) 
    : 12;

  // Delinquency rate
  const totalInvoices = faturas.length;
  const overdueInvoices = faturas.filter(f => f.status === "Vencida").length;
  const delinquencyRate = totalInvoices > 0 ? (overdueInvoices / totalInvoices) * 100 : 0;

  // Fixed costs ratio (salaries + recurring expenses)
  const monthlySalaries = funcionarios.reduce((sum, f) => sum + Number(f.salario_base || 0), 0);
  const monthlyRecurring = despesas
    .filter(d => d.recorrente)
    .reduce((sum, d) => sum + Number(d.valor), 0) / Math.max(1, historicalMonths);
  const fixedCosts = monthlySalaries + monthlyRecurring;
  const fixedCostRatio = avgMonthlyRevenue > 0 ? (fixedCosts / avgMonthlyRevenue) * 100 : 0;

  // Recurring revenue ratio (simplified as 90% for tuition-based schools)
  const recurringRevenueRatio = 90;

  // Break-even point
  const breakEvenPoint = fixedCosts > 0 && profitMargin > 0 
    ? fixedCosts / (profitMargin / 100) 
    : avgMonthlyRevenue;

  // Generate scenarios
  const scenarios: FinancialScenario[] = [
    {
      type: "conservative",
      label: "Conservador",
      growthRate: Math.min(0, revenueGrowthRate - 0.02),
      expenseRate: Math.max(0.01, expenseGrowthRate),
      projections: generateProjections(
        avgMonthlyRevenue,
        avgMonthlyExpenses,
        Math.min(0, revenueGrowthRate - 0.02),
        Math.max(0.01, expenseGrowthRate)
      ),
    },
    {
      type: "realistic",
      label: "Realista",
      growthRate: revenueGrowthRate,
      expenseRate: expenseGrowthRate,
      projections: generateProjections(
        avgMonthlyRevenue,
        avgMonthlyExpenses,
        revenueGrowthRate,
        expenseGrowthRate
      ),
    },
    {
      type: "optimistic",
      label: "Otimista",
      growthRate: Math.max(0.03, revenueGrowthRate + 0.02),
      expenseRate: Math.min(0, expenseGrowthRate - 0.01),
      projections: generateProjections(
        avgMonthlyRevenue,
        avgMonthlyExpenses,
        Math.max(0.03, revenueGrowthRate + 0.02),
        Math.min(0, expenseGrowthRate - 0.01)
      ),
    },
  ];

  // Health indicators
  const healthIndicators: HealthIndicator[] = [
    {
      id: "cash-flow",
      label: "Fluxo de Caixa",
      value: avgMonthlyProfit,
      threshold: { healthy: 0, attention: -1000 },
      status: getHealthStatus(avgMonthlyProfit, { healthy: 0, attention: -1000 }),
      description: avgMonthlyProfit >= 0 ? "Positivo" : "Negativo",
    },
    {
      id: "runway",
      label: "Reserva Financeira",
      value: monthsOfRunway,
      threshold: { healthy: 6, attention: 3 },
      status: getHealthStatus(monthsOfRunway, { healthy: 6, attention: 3 }),
      description: `${monthsOfRunway.toFixed(1)} meses`,
    },
    {
      id: "recurring",
      label: "Receita Recorrente",
      value: recurringRevenueRatio,
      threshold: { healthy: 70, attention: 50 },
      status: getHealthStatus(recurringRevenueRatio, { healthy: 70, attention: 50 }),
      description: `${recurringRevenueRatio}%`,
    },
    {
      id: "delinquency",
      label: "Inadimplência",
      value: delinquencyRate,
      threshold: { healthy: 5, attention: 10 },
      status: getHealthStatus(delinquencyRate, { healthy: 5, attention: 10 }, true),
      description: `${delinquencyRate.toFixed(1)}%`,
    },
    {
      id: "fixed-costs",
      label: "Custos Fixos",
      value: fixedCostRatio,
      threshold: { healthy: 60, attention: 75 },
      status: getHealthStatus(fixedCostRatio, { healthy: 60, attention: 75 }, true),
      description: `${fixedCostRatio.toFixed(0)}% do faturamento`,
    },
  ];

  // Overall health
  const healthScores = healthIndicators.map(h => (h.status === "healthy" ? 2 : h.status === "attention" ? 1 : 0));
  const avgHealthScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
  const overallHealth: HealthStatus = avgHealthScore >= 1.5 ? "healthy" : avgHealthScore >= 0.8 ? "attention" : "risk";

  // Generate alerts and recommendations
  const alertData = {
    monthsOfRunway,
    revenueGrowthRate,
    expenseGrowthRate,
    delinquencyRate,
    profitMargin,
    fixedCostRatio,
    topClientsConcentration: 15, // Simplified
  };
  
  const alerts = generateAlerts(alertData);
  const recommendations = generateRecommendations(alertData);

  // Chart data
  const historicalData = monthlyArray.map(m => ({
    month: m.month,
    revenue: m.revenue,
    expenses: m.expenses,
    profit: m.profit,
  }));

  // Projection chart data (next 12 months)
  const projectionData: { month: string; conservative: number; realistic: number; optimistic: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    const futureDate = new Date(currentYear, currentMonth - 1 + i, 1);
    const monthLabel = monthNames[futureDate.getMonth()];
    
    projectionData.push({
      month: monthLabel,
      conservative: avgMonthlyRevenue * Math.pow(1 + scenarios[0].growthRate, i),
      realistic: avgMonthlyRevenue * Math.pow(1 + scenarios[1].growthRate, i),
      optimistic: avgMonthlyRevenue * Math.pow(1 + scenarios[2].growthRate, i),
    });
  }

  return {
    historicalMonths,
    avgMonthlyRevenue,
    avgMonthlyExpenses,
    avgMonthlyProfit,
    revenueGrowthRate,
    expenseGrowthRate,
    currentCashBalance,
    monthsOfRunway,
    recurringRevenueRatio,
    delinquencyRate,
    fixedCostRatio,
    profitMargin,
    breakEvenPoint,
    scenarios,
    healthIndicators,
    overallHealth,
    alerts,
    recommendations,
    historicalData,
    projectionData,
  };
}

// ============= HOOK =============

export function useFinancialProjection() {
  return useQuery<FinancialProjectionData>({
    queryKey: [...queryKeys.dashboard.stats(), "financial-projection"],
    queryFn: fetchFinancialProjection,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    retry: 2,
  });
}
