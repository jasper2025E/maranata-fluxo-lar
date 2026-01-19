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
    { label: "Responsáveis", value: stats.totalResponsaveis, icon: UserCheck, variant: "blue" as const },
    { label: "Alunos Ativos", value: stats.alunosAtivos, icon: GraduationCap, variant: "violet" as const },
    { label: "Faturas do Mês", value: stats.totalFaturas, icon: FileText, variant: "cyan" as const },
    { label: "Pagas no Mês", value: stats.faturasPagas, icon: BadgeCheck, variant: "emerald" as const },
    { label: "Funcionários", value: stats.funcionariosAtivos, icon: Briefcase, variant: "amber" as const },
    { label: "Inadimplentes", value: stats.responsaveisInadimplentes, icon: AlertCircle, variant: "rose" as const },
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
            value={formatCurrency(stats.totalReceitas)}
            icon={TrendingUp}
            variant="success"
            trend={stats.variacaoReceitas !== 0 ? {
              value: stats.variacaoReceitas,
              isPositive: stats.variacaoReceitas > 0,
            } : undefined}
            index={0}
          />
          <FinancialKPICard
            title="Despesas do Mês"
            value={formatCurrency(stats.totalDespesas)}
            icon={TrendingDown}
            variant="danger"
            trend={stats.variacaoDespesas !== 0 ? {
              value: stats.variacaoDespesas,
              isPositive: stats.variacaoDespesas < 0,
            } : undefined}
            index={1}
          />
          <FinancialKPICard
            title="Valor a Receber"
            value={formatCurrency(stats.valorAReceber)}
            subtitle={`${stats.faturasAbertas + stats.faturasVencidas} faturas pendentes`}
            icon={Receipt}
            variant="info"
            index={2}
          />
          <FinancialKPICard
            title="Ticket Médio"
            value={formatCurrency(stats.ticketMedio)}
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
            value={formatCurrency(stats.saldoMensal)}
            subtitle={stats.saldoMensal >= 0 ? "Superávit" : "Déficit"}
            icon={Wallet}
            variant={stats.saldoMensal >= 0 ? "success" : "danger"}
            size="sm"
            index={4}
          />
          <FinancialKPICard
            title="Taxa de Arrecadação"
            value={`${stats.taxaArrecadacao.toFixed(1)}%`}
            subtitle="Do valor esperado"
            icon={Target}
            variant={stats.taxaArrecadacao >= 80 ? "success" : stats.taxaArrecadacao >= 50 ? "warning" : "danger"}
            size="sm"
            index={5}
          />
          <FinancialKPICard
            title="Total em Atraso"
            value={formatCurrency(stats.valorVencido)}
            subtitle={`${stats.faturasVencidas} faturas vencidas`}
            icon={AlertCircle}
            variant={stats.valorVencido > 0 ? "warning" : "success"}
            size="sm"
            index={6}
          />
          <FinancialKPICard
            title="Folha RH Mensal"
            value={formatCurrency(stats.gastoRHMensal)}
            subtitle={`${stats.funcionariosAtivos} funcionários ativos`}
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
            data={stats.combinedData}
            type="composed"
            height={320}
            className="lg:col-span-2"
          />

          {/* Inadimplência Card */}
          <InadimplenciaCard
            taxa={stats.inadimplenciaResponsaveis}
            valorTotal={stats.valorVencido}
            faturasVencidas={stats.faturasVencidas}
            responsaveisInadimplentes={stats.responsaveisInadimplentes}
            aging={stats.aging}
          />
        </div>

        {/* Secondary Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          <FinancialChart
            title="Receitas vs Despesas"
            description="Comparativo mensal"
            data={stats.combinedData}
            type="comparison"
            height={280}
          />
          <FinancialSummaryCard
            receitas={stats.totalReceitas}
            despesas={stats.totalDespesas}
            saldo={stats.saldoMensal}
          />
        </div>

        {/* Revenue Trend */}
        <FinancialChart
          title="Tendência de Receitas"
          description="Evolução da arrecadação nos últimos 6 meses"
          data={stats.receitasMes}
          type="area"
          height={250}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
