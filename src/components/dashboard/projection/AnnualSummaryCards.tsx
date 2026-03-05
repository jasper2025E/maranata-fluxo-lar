import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Percent, Calendar } from "lucide-react";
import { FinancialKPICard } from "../FinancialKPICard";

interface AnnualSummaryCardsProps {
  historicalData: { month: string; revenue: number; expenses: number; profit: number }[];
  delinquencyRate: number;
  revenueGrowthRate: number;
}

export function AnnualSummaryCards({ historicalData, delinquencyRate, revenueGrowthRate }: AnnualSummaryCardsProps) {
  const { t } = useTranslation();

  const totalRevenue = historicalData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = historicalData.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const activeMonths = historicalData.filter(m => m.revenue > 0 || m.expenses > 0).length;
  const avgMonthly = activeMonths > 0 ? totalRevenue / activeMonths : 0;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <FinancialKPICard
        title={t("financialHealth.annualRevenue", "Receita Anual")}
        value={formatCurrency(totalRevenue)}
        subtitle={`${activeMonths} ${t("common.months", "meses")}`}
        icon={TrendingUp}
        variant="success"
        index={0}
      />
      <FinancialKPICard
        title={t("financialHealth.annualExpenses", "Despesas Anuais")}
        value={formatCurrency(totalExpenses)}
        icon={TrendingDown}
        variant="danger"
        index={1}
      />
      <FinancialKPICard
        title={t("financialHealth.annualProfit", "Lucro Anual")}
        value={formatCurrency(totalProfit)}
        subtitle={totalProfit >= 0 ? t("dashboard.surplus") : t("dashboard.deficit")}
        icon={Wallet}
        variant={totalProfit >= 0 ? "success" : "danger"}
        index={2}
      />
      <FinancialKPICard
        title={t("financialHealth.annualMargin", "Margem Anual")}
        value={`${margin.toFixed(1)}%`}
        icon={Percent}
        variant={margin >= 15 ? "success" : margin >= 5 ? "warning" : "danger"}
        index={3}
      />
      <FinancialKPICard
        title={t("financialHealth.monthlyAvg", "Média Mensal")}
        value={formatCurrency(avgMonthly)}
        subtitle={t("financialHealth.ofRevenue", "de receita")}
        icon={Calendar}
        variant="info"
        size="sm"
        index={4}
      />
      <FinancialKPICard
        title={t("financialHealth.growthRate", "Crescimento")}
        value={`${revenueGrowthRate >= 0 ? "+" : ""}${(revenueGrowthRate * 100).toFixed(1)}%`}
        subtitle={t("projection.monthlyGrowth", "ao mês")}
        icon={BarChart3}
        variant={revenueGrowthRate >= 0 ? "success" : "danger"}
        size="sm"
        index={5}
      />
    </div>
  );
}
