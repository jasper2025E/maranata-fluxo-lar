import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Receipt,
  Calculator,
  Target,
  Briefcase,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
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
import { getGreeting, getFirstName } from "@/lib/greetings";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profileData } = useProfileData(user?.id);
  const { data: stats, isLoading, error } = useDashboardStats();
  
  // Get greeting based on time of day
  const greeting = useMemo(() => getGreeting(), []);
  const userName = getFirstName(profileData?.nome) || user?.email?.split("@")[0] || "";
  
  // Get icon based on time of day
  const GreetingIcon = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return Sun;
    if (hour >= 12 && hour < 18) return Sunset;
    return Moon;
  }, []);

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

        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="group relative overflow-hidden bg-card/80 backdrop-blur-sm rounded-2xl p-5 border border-border/40 shadow-sm"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-60" />
          
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 to-accent/20" />
          
          <div className="relative">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">
                {greeting}, <span className="text-primary">{userName}</span>!
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("dashboard.welcomeMessage")}
              </p>
            </div>
          </div>
        </motion.div>


        {/* Main KPIs Grid */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
            title={t("dashboard.collectionRate")}
            value={`${(stats.taxaArrecadacao ?? 0).toFixed(1)}%`}
            subtitle={t("dashboard.ofExpected")}
            icon={Target}
            variant={(stats.taxaArrecadacao ?? 0) >= 80 ? "success" : (stats.taxaArrecadacao ?? 0) >= 50 ? "warning" : "danger"}
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
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
            title={t("dashboard.receivable")}
            value={formatCurrency(stats.valorAReceber ?? 0)}
            subtitle={t("dashboard.pendingInvoicesCount", { count: (stats.faturasAbertas ?? 0) + (stats.faturasVencidas ?? 0) })}
            icon={Receipt}
            variant="info"
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
          <FinancialChart
            title={t("dashboard.financialEvolution")}
            description={t("dashboard.financialEvolutionDesc")}
            data={stats.combinedData ?? []}
            type="composed"
            height={320}
            className="lg:col-span-2"
          />
          <InadimplenciaCard
            taxa={stats.inadimplenciaResponsaveis ?? 0}
            valorTotal={stats.valorVencido ?? 0}
            faturasVencidas={stats.faturasVencidas ?? 0}
            responsaveisInadimplentes={stats.responsaveisInadimplentes ?? 0}
            aging={stats.aging ?? { ate30: 0, de31a60: 0, mais60: 0 }}
          />
        </div>

        {/* Secondary Charts + Resumo Financeiro */}
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
            saldo={stats.saldoAcumulado ?? 0}
            saldoAnterior={stats.saldoAnterior ?? 0}
            receitaAnualRecebida={stats.receitaAnualRecebida ?? 0}
            receitaAnualEsperada={stats.receitaAnualEsperada ?? 0}
            despesaAnualPaga={stats.despesaAnualPaga ?? 0}
            despesaAnualTotal={stats.despesaAnualTotal ?? 0}
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
