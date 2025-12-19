import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  BadgeCheck, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  GraduationCap,
  Percent
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const Dashboard = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

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

  // Combine data for comparison chart
  const combinedChartData = stats.receitasMes.map((item, index) => ({
    mes: item.mes,
    receitas: item.valor,
    despesas: stats.despesasMes[index]?.valor || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Financeiro
          </h2>
          <p className="text-gray-500 mt-1.5">
            Visão geral do sistema financeiro da escola
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Alunos Ativos"
            value={stats.alunosAtivos}
            subtitle={`de ${stats.totalAlunos} matriculados`}
            icon={Users}
            color="blue"
          />
          <DashboardCard
            title="Faturas Abertas"
            value={stats.faturasAbertas}
            subtitle="Aguardando pagamento"
            icon={FileText}
            color="yellow"
          />
          <DashboardCard
            title="Faturas Pagas"
            value={stats.faturasPagas}
            subtitle="Este mês"
            icon={BadgeCheck}
            color="green"
          />
          <DashboardCard
            title="Inadimplência"
            value={`${stats.inadimplencia}%`}
            subtitle={`${stats.faturasVencidas} faturas vencidas`}
            icon={AlertCircle}
            color={stats.inadimplencia > 20 ? "red" : stats.inadimplencia > 10 ? "yellow" : "blue"}
          />
        </div>

        {/* Financial Stats */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Receitas do Mês"
            value={formatCurrency(stats.totalReceitas)}
            subtitle="Total de entradas"
            icon={TrendingUp}
            color="green"
          />
          <DashboardCard
            title="Despesas do Mês"
            value={formatCurrency(stats.totalDespesas)}
            subtitle="Total de saídas"
            icon={TrendingDown}
            color="red"
          />
          <DashboardCard
            title="Saldo Mensal"
            value={formatCurrency(stats.saldoMensal)}
            subtitle="Receitas - Despesas"
            icon={Wallet}
            color={stats.saldoMensal >= 0 ? "green" : "red"}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Revenue vs Expenses Chart */}
          <Card className="border-gray-100/80 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Receitas vs Despesas
              </CardTitle>
              <CardDescription className="text-gray-500">
                Comparativo dos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedChartData} barGap={8}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#f1f5f9" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="mes" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                    />
                    <Legend 
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "16px" }}
                    />
                    <Bar 
                      dataKey="receitas" 
                      name="Receitas"
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar 
                      dataKey="despesas" 
                      name="Despesas"
                      fill="#f43f5e" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          <Card className="border-gray-100/80 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Evolução das Receitas
              </CardTitle>
              <CardDescription className="text-gray-500">
                Tendência dos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.receitasMes}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#f1f5f9" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="mes" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      name="Receitas"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorReceitas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Summary */}
        <Card className="border-gray-100/80 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Resumo Rápido
            </CardTitle>
            <CardDescription className="text-gray-500">
              Status atual do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Students */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-blue-50/40 border border-blue-100/50">
                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.totalAlunos}</p>
                  <p className="text-sm text-gray-500">Total Alunos</p>
                </div>
              </div>

              {/* Paid Invoices */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 to-emerald-50/40 border border-emerald-100/50">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.faturasPagas}</p>
                  <p className="text-sm text-gray-500">Pagas no Mês</p>
                </div>
              </div>

              {/* Open Invoices */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-amber-50/40 border border-amber-100/50">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.faturasAbertas}</p>
                  <p className="text-sm text-gray-500">Em Aberto</p>
                </div>
              </div>

              {/* Default Rate */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-rose-50/80 to-rose-50/40 border border-rose-100/50">
                <div className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-rose-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.inadimplencia}%</p>
                  <p className="text-sm text-gray-500">Inadimplência</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
