import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  Wallet,
  UserCheck,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface ResponsavelStats {
  totalResponsaveis: number;
  responsaveisAtivos: number;
  responsaveisInadimplentes: number;
  totalAlunos: number;
  faturasAbertas: number;
  faturasPagas: number;
  faturasVencidas: number;
  valorAReceber: number;
  valorRecebidoMes: number;
  ticketMedio: number;
}

interface ResponsavelComPendencias {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  faturas_vencidas: number;
  valor_pendente: number;
}

async function fetchResponsavelStats(): Promise<ResponsavelStats> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [
    responsaveisResult,
    alunosResult,
    faturasResult,
    pagamentosResult,
  ] = await Promise.all([
    supabase.from("responsaveis").select("id, ativo"),
    supabase.from("alunos").select("id, status_matricula, responsavel_id"),
    supabase
      .from("faturas")
      .select("id, status, valor, responsavel_id")
      .eq("mes_referencia", currentMonth)
      .eq("ano_referencia", currentYear),
    supabase
      .from("pagamentos")
      .select("valor, data_pagamento")
      .gte("data_pagamento", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
      .lt("data_pagamento", currentMonth === 12 
        ? `${currentYear + 1}-01-01` 
        : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
      ),
  ]);

  const responsaveis = responsaveisResult.data || [];
  const alunos = alunosResult.data || [];
  const faturas = faturasResult.data || [];
  const pagamentos = pagamentosResult.data || [];

  const totalResponsaveis = responsaveis.length;
  const responsaveisAtivos = responsaveis.filter(r => r.ativo).length;
  
  // Responsáveis com faturas vencidas
  const responsaveisComVencidas = new Set(
    faturas.filter(f => f.status === "Vencida").map(f => f.responsavel_id)
  ).size;

  const faturasAbertas = faturas.filter(f => f.status === "Aberta").length;
  const faturasPagas = faturas.filter(f => f.status === "Paga").length;
  const faturasVencidas = faturas.filter(f => f.status === "Vencida").length;
  
  const valorAReceber = faturas
    .filter(f => f.status === "Aberta" || f.status === "Vencida")
    .reduce((sum, f) => sum + Number(f.valor), 0);
  
  const valorRecebidoMes = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  
  const ticketMedio = faturasPagas > 0 ? valorRecebidoMes / faturasPagas : 0;

  return {
    totalResponsaveis,
    responsaveisAtivos,
    responsaveisInadimplentes: responsaveisComVencidas,
    totalAlunos: alunos.filter(a => a.status_matricula === "ativo").length,
    faturasAbertas,
    faturasPagas,
    faturasVencidas,
    valorAReceber,
    valorRecebidoMes,
    ticketMedio,
  };
}

async function fetchResponsaveisInadimplentes(): Promise<ResponsavelComPendencias[]> {
  // Get all overdue invoices grouped by responsavel
  const { data: faturasVencidas } = await supabase
    .from("faturas")
    .select(`
      id,
      valor,
      responsavel_id,
      responsaveis!inner(id, nome, telefone, email)
    `)
    .eq("status", "Vencida");

  if (!faturasVencidas || faturasVencidas.length === 0) return [];

  // Group by responsavel
  const responsavelMap = new Map<string, ResponsavelComPendencias>();
  
  faturasVencidas.forEach((fatura: any) => {
    const resp = fatura.responsaveis;
    if (!resp) return;
    
    const existing = responsavelMap.get(resp.id);
    if (existing) {
      existing.faturas_vencidas++;
      existing.valor_pendente += Number(fatura.valor);
    } else {
      responsavelMap.set(resp.id, {
        id: resp.id,
        nome: resp.nome,
        telefone: resp.telefone,
        email: resp.email,
        faturas_vencidas: 1,
        valor_pendente: Number(fatura.valor),
      });
    }
  });

  return Array.from(responsavelMap.values())
    .sort((a, b) => b.valor_pendente - a.valor_pendente)
    .slice(0, 10);
}

const ResponsavelDashboard = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["responsavel-dashboard-stats"],
    queryFn: fetchResponsavelStats,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const { data: inadimplentes } = useQuery({
    queryKey: ["responsaveis-inadimplentes"],
    queryFn: fetchResponsaveisInadimplentes,
    staleTime: 1000 * 60,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
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

  // Data for pie chart
  const faturasStatusData = [
    { name: "Pagas", value: stats.faturasPagas, color: "#10b981" },
    { name: "Abertas", value: stats.faturasAbertas, color: "#f59e0b" },
    { name: "Vencidas", value: stats.faturasVencidas, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const inadimplenciaRate = stats.responsaveisAtivos > 0
    ? Math.round((stats.responsaveisInadimplentes / stats.responsaveisAtivos) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Dashboard Financeiro
            </h2>
            <p className="text-gray-500 mt-1">
              Gestão de responsáveis e cobranças
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate("/relatorios")}
            >
              <Download className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Responsáveis Ativos"
            value={stats.responsaveisAtivos}
            subtitle={`de ${stats.totalResponsaveis} cadastrados`}
            icon={UserCheck}
            color="blue"
          />
          <DashboardCard
            title="Valor a Receber"
            value={formatCurrency(stats.valorAReceber)}
            subtitle={`${stats.faturasAbertas + stats.faturasVencidas} faturas pendentes`}
            icon={Wallet}
            color="yellow"
          />
          <DashboardCard
            title="Recebido no Mês"
            value={formatCurrency(stats.valorRecebidoMes)}
            subtitle={`${stats.faturasPagas} faturas pagas`}
            icon={TrendingUp}
            color="green"
          />
          <DashboardCard
            title="Inadimplência"
            value={`${inadimplenciaRate}%`}
            subtitle={`${stats.responsaveisInadimplentes} responsáveis`}
            icon={AlertCircle}
            color={inadimplenciaRate > 20 ? "red" : inadimplenciaRate > 10 ? "yellow" : "blue"}
          />
        </div>

        {/* Quick Actions */}
        <Card className="border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Ações Rápidas
            </CardTitle>
            <CardDescription className="text-gray-500">
              Acesse as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => navigate("/responsaveis")}
              >
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Gerenciar Responsáveis</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200"
                onClick={() => navigate("/faturas")}
              >
                <FileText className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium">Ver Faturas</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200"
                onClick={() => navigate("/pagamentos")}
              >
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">Registrar Pagamento</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-violet-50 hover:border-violet-200"
                onClick={() => navigate("/relatorios")}
              >
                <Download className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium">Exportar Dados</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Faturas Status Chart */}
          <Card className="border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Status das Faturas
              </CardTitle>
              <CardDescription className="text-gray-500">
                Distribuição do mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faturasStatusData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={faturasStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {faturasStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">Nenhuma fatura no mês</p>
                </div>
              )}

              {/* Summary stats below chart */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-lg font-bold">{stats.faturasPagas}</span>
                  </div>
                  <p className="text-xs text-gray-500">Pagas</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-lg font-bold">{stats.faturasAbertas}</span>
                  </div>
                  <p className="text-xs text-gray-500">Abertas</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-rose-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-lg font-bold">{stats.faturasVencidas}</span>
                  </div>
                  <p className="text-xs text-gray-500">Vencidas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inadimplentes List */}
          <Card className="border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Responsáveis Inadimplentes
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Top 10 com maior valor pendente
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/responsaveis")}
                  className="text-primary"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inadimplentes && inadimplentes.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {inadimplentes.map((resp) => (
                    <div
                      key={resp.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {resp.nome}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {resp.telefone}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant="destructive" className="whitespace-nowrap">
                          {resp.faturas_vencidas} {resp.faturas_vencidas === 1 ? "fatura" : "faturas"}
                        </Badge>
                        <span className="font-semibold text-rose-600 whitespace-nowrap">
                          {formatCurrency(resp.valor_pendente)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                  <p className="font-medium text-gray-900">Nenhum inadimplente!</p>
                  <p className="text-sm">Todos os pagamentos estão em dia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="border-gray-100/80 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Resumo Financeiro
            </CardTitle>
            <CardDescription className="text-gray-500">
              Indicadores do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-blue-50/40 border border-blue-100/50">
                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.totalAlunos}</p>
                  <p className="text-sm text-gray-500">Alunos Ativos</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 to-emerald-50/40 border border-emerald-100/50">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.ticketMedio)}</p>
                  <p className="text-sm text-gray-500">Ticket Médio</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-amber-50/40 border border-amber-100/50">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.faturasAbertas + stats.faturasVencidas}</p>
                  <p className="text-sm text-gray-500">Faturas Pendentes</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-violet-50/80 to-violet-50/40 border border-violet-100/50">
                <div className="h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-violet-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.faturasPagas + stats.faturasAbertas + stats.faturasVencidas > 0
                      ? Math.round((stats.faturasPagas / (stats.faturasPagas + stats.faturasAbertas + stats.faturasVencidas)) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Taxa de Pagamento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ResponsavelDashboard;
