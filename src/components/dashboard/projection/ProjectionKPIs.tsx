import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FinancialKPICard } from "../FinancialKPICard";
import { formatCurrency } from "@/lib/formatters";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Target,
  Percent,
  Calculator,
  BarChart3,
} from "lucide-react";

interface ProjectionKPIsProps {
  avgMonthlyRevenue: number;
  avgMonthlyExpenses: number;
  avgMonthlyProfit: number;
  profitMargin: number;
  monthsOfRunway: number;
  breakEvenPoint: number;
  revenueGrowthRate: number;
  historicalMonths: number;
}

export function ProjectionKPIs({
  avgMonthlyRevenue,
  avgMonthlyExpenses,
  avgMonthlyProfit,
  profitMargin,
  monthsOfRunway,
  breakEvenPoint,
  revenueGrowthRate,
  historicalMonths,
}: ProjectionKPIsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FinancialKPICard
        title={t("projection.avgRevenue")}
        value={formatCurrency(avgMonthlyRevenue)}
        subtitle={t("projection.basedOnMonths", { count: historicalMonths })}
        icon={TrendingUp}
        variant="success"
        index={0}
      />
      
      <FinancialKPICard
        title={t("projection.avgExpenses")}
        value={formatCurrency(avgMonthlyExpenses)}
        subtitle={t("projection.monthlyAvg")}
        icon={TrendingDown}
        variant="danger"
        index={1}
      />
      
      <FinancialKPICard
        title={t("projection.avgProfit")}
        value={formatCurrency(avgMonthlyProfit)}
        subtitle={avgMonthlyProfit >= 0 ? t("dashboard.surplus") : t("dashboard.deficit")}
        icon={Wallet}
        variant={avgMonthlyProfit >= 0 ? "success" : "danger"}
        index={2}
      />
      
      <FinancialKPICard
        title={t("projection.profitMargin")}
        value={`${profitMargin.toFixed(1)}%`}
        subtitle={profitMargin >= 15 ? t("projection.healthy") : t("projection.needsAttention")}
        icon={Percent}
        variant={profitMargin >= 15 ? "success" : profitMargin >= 5 ? "warning" : "danger"}
        index={3}
      />
      
      <FinancialKPICard
        title={t("projection.financialReserve")}
        value={`${monthsOfRunway.toFixed(1)} ${t("common.months")}`}
        subtitle={t("projection.survivalTime")}
        icon={PiggyBank}
        variant={monthsOfRunway >= 6 ? "success" : monthsOfRunway >= 3 ? "warning" : "danger"}
        size="sm"
        index={4}
      />
      
      <FinancialKPICard
        title={t("projection.breakEven")}
        value={formatCurrency(breakEvenPoint)}
        subtitle={t("projection.minimumRevenue")}
        icon={Target}
        variant="info"
        size="sm"
        index={5}
      />
      
      <FinancialKPICard
        title={t("projection.growthTrend")}
        value={`${revenueGrowthRate >= 0 ? "+" : ""}${(revenueGrowthRate * 100).toFixed(1)}%`}
        subtitle={t("projection.monthlyGrowth")}
        icon={BarChart3}
        variant={revenueGrowthRate >= 0 ? "success" : "danger"}
        size="sm"
        index={6}
      />
      
      <FinancialKPICard
        title={t("projection.dataBase")}
        value={`${historicalMonths} ${t("common.months")}`}
        subtitle={t("projection.analyzedHistory")}
        icon={Calculator}
        variant="default"
        size="sm"
        index={7}
      />
    </div>
  );
}
