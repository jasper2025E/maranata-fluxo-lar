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
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/formatters";
import {
  FinancialKPICard,
  FinancialChart,
  QuickStatsGrid,
  FinancialSummaryCard,
  InadimplenciaCard,
} from "@/components/dashboard";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

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
          title="Erro ao carregar dados"
          description="Não foi possível carregar os dados do dashboard. Tente novamente."
          action={{
            label: "Recarregar",
            onClick: () => window.location.reload(),
          }}
        />
      </DashboardLayout>
    );
  }

  const quickStats = [
    { label: "Responsáveis", value: stats.totalResponsaveis ?? 0, icon: UserCheck, variant: "blue" as const },
    { label: "Alunos Ativos", value: stats.alunosAtivos ?? 0, icon: GraduationCap, variant: "violet" as const },
    { label: "Faturas do Mês", value: stats.totalFaturas ?? 0, icon: FileText, variant: "cyan" as const },
    { label: "Pagas no Mês", value: stats.faturasPagas ?? 0, icon: BadgeCheck, variant: "emerald" as const },
    { label: "Funcionários", value: stats.funcionariosAtivos ?? 0, icon: Briefcase, variant: "amber" as const },
    { label: "Inadimplentes", value: stats.responsaveisInadimplentes ?? 0, icon: AlertCircle, variant: "rose" as const },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Financeiro
          </h2>
          <p className="text-muted-foreground mt-1">
            Visão geral do fluxo financeiro e indicadores da escola
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <QuickStatsGrid stats={quickStats} />

        {/* Main KPIs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialKPICard
            title="Receitas do Mês"
            value={formatCurrency(stats.totalReceitas ?? 0)}
            icon={TrendingUp}
            variant="success"
            trend={(stats.variacaoReceitas ?? 0) !== 0 ? {
              value: stats.variacaoReceitas ?? 0,
              isPositive: (stats.variacaoReceitas ?? 0) > 0,
            } : undefined}
            index={0}
          />
          <FinancialKPICard
            title="Despesas do Mês"
            value={formatCurrency(stats.totalDespesas ?? 0)}
            icon={TrendingDown}
            variant="danger"
            trend={(stats.variacaoDespesas ?? 0) !== 0 ? {
              value: stats.variacaoDespesas ?? 0,
              isPositive: (stats.variacaoDespesas ?? 0) < 0,
            } : undefined}
            index={1}
          />
          <FinancialKPICard
            title="Valor a Receber"
            value={formatCurrency(stats.valorAReceber ?? 0)}
            subtitle={`${(stats.faturasAbertas ?? 0) + (stats.faturasVencidas ?? 0)} faturas pendentes`}
            icon={Receipt}
            variant="info"
            index={2}
          />
          <FinancialKPICard
            title="Ticket Médio"
            value={formatCurrency(stats.ticketMedio ?? 0)}
            subtitle="Por fatura paga"
            icon={Calculator}
            variant="default"
            index={3}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialKPICard
            title="Saldo Mensal"
            value={formatCurrency(stats.saldoMensal ?? 0)}
            subtitle={(stats.saldoMensal ?? 0) >= 0 ? "Superávit" : "Déficit"}
            icon={Wallet}
            variant={(stats.saldoMensal ?? 0) >= 0 ? "success" : "danger"}
            size="sm"
            index={4}
          />
          <FinancialKPICard
            title="Taxa de Arrecadação"
            value={`${(stats.taxaArrecadacao ?? 0).toFixed(1)}%`}
            subtitle="Do valor esperado"
            icon={Target}
            variant={(stats.taxaArrecadacao ?? 0) >= 80 ? "success" : (stats.taxaArrecadacao ?? 0) >= 50 ? "warning" : "danger"}
            size="sm"
            index={5}
          />
          <FinancialKPICard
            title="Total em Atraso"
            value={formatCurrency(stats.valorVencido ?? 0)}
            subtitle={`${stats.faturasVencidas ?? 0} faturas vencidas`}
            icon={AlertCircle}
            variant={(stats.valorVencido ?? 0) > 0 ? "warning" : "success"}
            size="sm"
            index={6}
          />
          <FinancialKPICard
            title="Folha RH Mensal"
            value={formatCurrency(stats.gastoRHMensal ?? 0)}
            subtitle={`${stats.funcionariosAtivos ?? 0} funcionários ativos`}
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
            title="Evolução Financeira"
            description="Receitas, despesas e saldo dos últimos 6 meses"
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
            title="Receitas vs Despesas"
            description="Comparativo mensal"
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
          title="Tendência de Receitas"
          description="Evolução da arrecadação nos últimos 6 meses"
          data={stats.receitasMes ?? []}
          type="area"
          height={250}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
