import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  Users, 
  FileText, 
  BadgeCheck, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  UserCheck,
  Receipt,
  Banknote,
  Calculator,
  Target,
  Briefcase,
  GraduationCap,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/formatters";
import {
  FinancialKPICard,
  FinancialChart,
  FinancialSummaryCard,
  InadimplenciaCard,
} from "@/components/dashboard";
import { motion } from "framer-motion";
import { getRandomVerse, type BibleVerse } from "@/lib/biblicalVerses";

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useDashboardStats();
  const [verse] = useState<BibleVerse>(() => getRandomVerse());

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState type="dashboard" />
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={AlertCircle}
          title={t("dashboard.loadError")}
          description={t("dashboard.loadErrorDesc")}
          action={{
            label: t("dashboard.reload"),
            onClick: () => window.location.reload(),
          }}
        />
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("nav.home")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("dashboard.title")}</span>
        </nav>

        {/* Verse Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl border border-border/50 p-5 bg-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground italic leading-relaxed">
                "{verse.text}"
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                — {verse.reference}
              </p>
            </div>
          </div>
        </motion.div>


        {/* Main KPIs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialKPICard
            title={t("dashboard.monthlyRevenues")}
            value={formatCurrency(stats.totalReceitas ?? 0)}
            icon={TrendingUp}
            variant="success"
            trend={(stats.variacaoReceitas ?? 0) !== 0 ? {
              value: stats.variacaoReceitas ?? 0,
              isPositive: (stats.variacaoReceitas ?? 0) > 0,
              label: t("dashboard.vsLastMonth"),
            } : undefined}
            index={0}
          />
          <FinancialKPICard
            title={t("dashboard.monthlyExpenses")}
            value={formatCurrency(stats.totalDespesas ?? 0)}
            icon={TrendingDown}
            variant="danger"
            trend={(stats.variacaoDespesas ?? 0) !== 0 ? {
              value: stats.variacaoDespesas ?? 0,
              isPositive: (stats.variacaoDespesas ?? 0) < 0,
              label: t("dashboard.vsLastMonth"),
            } : undefined}
            index={1}
          />
          <FinancialKPICard
            title={t("dashboard.receivable")}
            value={formatCurrency(stats.valorAReceber ?? 0)}
            subtitle={t("dashboard.pendingInvoicesCount", { count: (stats.faturasAbertas ?? 0) + (stats.faturasVencidas ?? 0) })}
            icon={Receipt}
            variant="info"
            index={2}
          />
          <FinancialKPICard
            title={t("dashboard.averageTicket")}
            value={formatCurrency(stats.ticketMedio ?? 0)}
            subtitle={t("dashboard.perPaidInvoice")}
            icon={Calculator}
            variant="default"
            index={3}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialKPICard
            title={t("dashboard.monthlyBalance")}
            value={formatCurrency(stats.saldoMensal ?? 0)}
            subtitle={(stats.saldoMensal ?? 0) >= 0 ? t("dashboard.surplus") : t("dashboard.deficit")}
            icon={Wallet}
            variant={(stats.saldoMensal ?? 0) >= 0 ? "success" : "danger"}
            size="sm"
            index={4}
          />
          <FinancialKPICard
            title={t("dashboard.collectionRate")}
            value={`${(stats.taxaArrecadacao ?? 0).toFixed(1)}%`}
            subtitle={t("dashboard.ofExpected")}
            icon={Target}
            variant={(stats.taxaArrecadacao ?? 0) >= 80 ? "success" : (stats.taxaArrecadacao ?? 0) >= 50 ? "warning" : "danger"}
            size="sm"
            index={5}
          />
          <FinancialKPICard
            title={t("dashboard.totalOverdue")}
            value={formatCurrency(stats.valorVencido ?? 0)}
            subtitle={t("dashboard.overdueInvoicesCount", { count: stats.faturasVencidas ?? 0 })}
            icon={AlertCircle}
            variant={(stats.valorVencido ?? 0) > 0 ? "warning" : "success"}
            size="sm"
            index={6}
          />
          <FinancialKPICard
            title={t("dashboard.monthlyPayroll")}
            value={formatCurrency(stats.gastoRHMensal ?? 0)}
            subtitle={t("dashboard.activeEmployees", { count: stats.funcionariosAtivos ?? 0 })}
            icon={Briefcase}
            variant="default"
            size="sm"
            index={7}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main Composed Chart */}
          <FinancialChart
            title={t("dashboard.financialEvolution")}
            description={t("dashboard.financialEvolutionDesc")}
            data={stats.combinedData ?? []}
            type="composed"
            height={320}
            className="lg:col-span-2"
          />

          {/* Inadimplência Card */}
          <InadimplenciaCard
            taxa={stats.inadimplenciaResponsaveis ?? 0}
            valorTotal={stats.valorVencido ?? 0}
            faturasVencidas={stats.faturasVencidas ?? 0}
            responsaveisInadimplentes={stats.responsaveisInadimplentes ?? 0}
            aging={stats.aging ?? { ate30: 0, de31a60: 0, mais60: 0 }}
          />
        </div>

        {/* Secondary Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          <FinancialChart
            title={t("dashboard.revenueVsExpenses")}
            description={t("dashboard.monthlyComparison")}
            data={stats.combinedData ?? []}
            type="comparison"
            height={280}
          />
          <FinancialSummaryCard
            receitas={stats.totalReceitas ?? 0}
            despesas={stats.totalDespesas ?? 0}
            saldo={stats.saldoMensal ?? 0}
          />
        </div>

        {/* Revenue Trend */}
        <FinancialChart
          title={t("dashboard.revenueTrend")}
          description={t("dashboard.revenueTrendDesc")}
          data={stats.receitasMes ?? []}
          type="area"
          height={250}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
