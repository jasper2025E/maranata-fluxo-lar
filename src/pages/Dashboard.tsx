import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, AlertCircle, TrendingUp, TrendingDown, Percent, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema financeiro da escola
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Alunos Ativos"
            value={stats.alunosAtivos}
            description={`de ${stats.totalAlunos} matriculados`}
            icon={Users}
          />
          <StatCard
            title="Faturas Abertas"
            value={stats.faturasAbertas}
            description="Aguardando pagamento"
            icon={FileText}
          />
          <StatCard
            title="Faturas Pagas"
            value={stats.faturasPagas}
            description="Este mês"
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Inadimplência"
            value={`${stats.inadimplencia}%`}
            description={`${stats.faturasVencidas} faturas vencidas`}
            icon={AlertCircle}
            variant={stats.inadimplencia > 20 ? "destructive" : stats.inadimplencia > 10 ? "warning" : "default"}
          />
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Receitas do Mês"
            value={formatCurrency(stats.totalReceitas)}
            description="Total de entradas"
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Despesas do Mês"
            value={formatCurrency(stats.totalDespesas)}
            description="Total de saídas"
            icon={TrendingDown}
            variant="destructive"
          />
          <StatCard
            title="Saldo Mensal"
            value={formatCurrency(stats.saldoMensal)}
            description="Receitas - Despesas"
            icon={DollarSign}
            variant={stats.saldoMensal >= 0 ? "success" : "destructive"}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receitas vs Despesas</CardTitle>
              <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="mes" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar 
                      dataKey="receitas" 
                      name="Receitas"
                      fill="hsl(var(--success))" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="despesas" 
                      name="Despesas"
                      fill="hsl(var(--destructive))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Balance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução das Receitas</CardTitle>
              <CardDescription>Tendência dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.receitasMes}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      name="Receitas"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReceitas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Rápido</CardTitle>
            <CardDescription>Status atual do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.totalAlunos}</p>
                  <p className="text-xs text-muted-foreground">Total Alunos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.faturasPagas}</p>
                  <p className="text-xs text-muted-foreground">Pagas no Mês</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.faturasAbertas}</p>
                  <p className="text-xs text-muted-foreground">Em Aberto</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.inadimplencia}%</p>
                  <p className="text-xs text-muted-foreground">Inadimplência</p>
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
