import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface DashboardStats {
  totalAlunos: number;
  faturasAbertas: number;
  faturasPagas: number;
  faturasVencidas: number;
  totalReceitas: number;
  totalDespesas: number;
  saldoMensal: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    faturasAbertas: 0,
    faturasPagas: 0,
    faturasVencidas: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    saldoMensal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Buscar alunos ativos
      const { data: alunos } = await supabase
        .from("alunos")
        .select("*")
        .eq("ativo", true);

      // Buscar faturas do mês
      const { data: faturas } = await supabase
        .from("faturas")
        .select("*")
        .eq("mes_referencia", currentMonth)
        .eq("ano_referencia", currentYear);

      // Buscar pagamentos do mês
      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("valor");

      // Buscar despesas pagas do mês
      const { data: despesas } = await supabase
        .from("despesas")
        .select("valor")
        .eq("paga", true);

      const totalReceitas = pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0;
      const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;

      setStats({
        totalAlunos: alunos?.length || 0,
        faturasAbertas: faturas?.filter(f => f.status === "Aberta").length || 0,
        faturasPagas: faturas?.filter(f => f.status === "Paga").length || 0,
        faturasVencidas: faturas?.filter(f => f.status === "Vencida").length || 0,
        totalReceitas,
        totalDespesas,
        saldoMensal: totalReceitas - totalDespesas,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema financeiro da escola
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlunos}</div>
              <p className="text-xs text-muted-foreground">Total de alunos matriculados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Abertas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.faturasAbertas}</div>
              <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Pagas</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.faturasPagas}</div>
              <p className="text-xs text-muted-foreground">Pagamentos recebidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Vencidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.faturasVencidas}</div>
              <p className="text-xs text-muted-foreground">Necessitam atenção</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(stats.totalReceitas)}
              </div>
              <p className="text-xs text-muted-foreground">Total de entradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(stats.totalDespesas)}
              </div>
              <p className="text-xs text-muted-foreground">Total de saídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.saldoMensal >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(stats.saldoMensal)}
              </div>
              <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Instituição</CardTitle>
            <CardDescription>Dados cadastrais da Escola Maranata</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Nome:</span>
              <span className="text-sm text-muted-foreground">Escola Maranata</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">CNPJ:</span>
              <span className="text-sm text-muted-foreground">53.613.866/0001-34</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Endereço:</span>
              <span className="text-sm text-muted-foreground">Rua 15 de Novembro, 59, Cebola, Barreirinhas - MA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">E-mail:</span>
              <span className="text-sm text-muted-foreground">jn.ney@hotmail.com</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
