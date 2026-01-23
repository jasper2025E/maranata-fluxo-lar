import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CreditCard,
  GraduationCap,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  plano: string;
  status: string;
  subscription_status: string | null;
  data_contrato: string;
  limite_alunos: number;
  limite_usuarios: number;
  created_at: string;
  monthly_price: number | null;
  trial_ends_at: string | null;
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  overdueTenants: number;
  totalUsers: number;
  totalAlunos: number;
  totalFaturas: number;
  receitaTotal: number;
  mrr: number; // Monthly Recurring Revenue
}

const subscriptionStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  trial: { label: "Período de Teste", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  active: { label: "Ativa", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  past_due: { label: "Inadimplente", variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "Cancelada", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  suspended: { label: "Suspensa", variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function PlatformDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    overdueTenants: 0,
    totalUsers: 0,
    totalAlunos: 0,
    totalFaturas: 0,
    receitaTotal: 0,
    mrr: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [isPlatformAdmin, navigate]);

  const fetchData = async () => {
    try {
      // Fetch tenants with subscription data
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError);
      }
      setTenants(tenantsData || []);

      // Calculate subscription stats
      const activeTenants = tenantsData?.filter(t => t.subscription_status === "active" || t.status === "ativo").length || 0;
      const trialTenants = tenantsData?.filter(t => t.subscription_status === "trial").length || 0;
      const overdueTenants = tenantsData?.filter(t => t.subscription_status === "past_due" || t.subscription_status === "suspended").length || 0;
      
      // Calculate MRR (Monthly Recurring Revenue)
      const mrr = tenantsData?.filter(t => t.subscription_status === "active")
        .reduce((sum, t) => sum + (Number(t.monthly_price) || 0), 0) || 0;

      // Get user count
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      if (usersError) {
        console.error("Error fetching users count:", usersError);
      }

      // Get alunos count
      let totalAlunos = 0;
      const { count: alunosCount, error: alunosError } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true });
      
      if (!alunosError) {
        totalAlunos = alunosCount || 0;
      }

      // Get faturas count and revenue
      let totalFaturas = 0;
      let receitaTotal = 0;
      const { count: faturasCount, error: faturasError } = await supabase
        .from("faturas")
        .select("*", { count: "exact", head: true });
      
      if (!faturasError) {
        totalFaturas = faturasCount || 0;
      }

      // Get paid invoices for revenue
      const { data: paidFaturas, error: revenueError } = await supabase
        .from("faturas")
        .select("valor_total")
        .eq("status", "Paga");
      
      if (!revenueError && paidFaturas) {
        receitaTotal = paidFaturas.reduce((sum, f) => sum + (Number(f.valor_total) || 0), 0);
      }

      setStats({
        totalTenants: tenantsData?.length || 0,
        activeTenants,
        trialTenants,
        overdueTenants,
        totalUsers: usersCount || 0,
        totalAlunos,
        totalFaturas,
        receitaTotal,
        mrr,
      });
    } catch (error) {
      console.error("Error fetching platform data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getSubscriptionBadge = (status: string | null) => {
    const config = subscriptionStatusConfig[status || "trial"] || subscriptionStatusConfig.trial;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-slate-700" />
            <Skeleton className="h-4 w-96 bg-slate-700" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 bg-slate-800" />
            ))}
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Painel do Gestor
            </h1>
            <p className="text-slate-400">
              Visão geral da plataforma e gestão centralizada de escolas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Escolas */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Escolas</CardTitle>
              <Building2 className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-green-400">{stats.activeTenants} ativas</span>
                <span>•</span>
                <span className="text-blue-400">{stats.trialTenants} em teste</span>
              </div>
              {stats.overdueTenants > 0 && (
                <div className="mt-1 text-xs text-red-400">
                  {stats.overdueTenants} inadimplente{stats.overdueTenants > 1 ? "s" : ""}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MRR */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Receita Mensal (MRR)</CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
              <p className="text-xs text-slate-400">
                Assinaturas ativas
              </p>
            </CardContent>
          </Card>

          {/* Usuários */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Usuários</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-slate-400">
                Em todas as escolas
              </p>
            </CardContent>
          </Card>

          {/* Alunos */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Alunos</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlunos}</div>
              <p className="text-xs text-slate-400">
                Cadastrados na plataforma
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {/* Subscription Overview */}
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Status das Assinaturas</CardTitle>
                  <CardDescription className="text-slate-400">
                    Visão geral de todas as escolas
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/platform/subscriptions")}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                >
                  Gerenciar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Ativas</span>
                  <span className="text-green-400">{stats.activeTenants}</span>
                </div>
                <Progress 
                  value={(stats.activeTenants / (stats.totalTenants || 1)) * 100} 
                  className="h-2 bg-slate-700"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Em Teste</span>
                  <span className="text-blue-400">{stats.trialTenants}</span>
                </div>
                <Progress 
                  value={(stats.trialTenants / (stats.totalTenants || 1)) * 100} 
                  className="h-2 bg-slate-700"
                />
              </div>
              {stats.overdueTenants > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Inadimplentes</span>
                    <span className="text-red-400">{stats.overdueTenants}</span>
                  </div>
                  <Progress 
                    value={(stats.overdueTenants / (stats.totalTenants || 1)) * 100} 
                    className="h-2 bg-slate-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                  <CardDescription className="text-slate-400">
                    Faturamento consolidado
                  </CardDescription>
                </div>
                <Receipt className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <p className="text-sm text-slate-400">Total de Faturas</p>
                  <p className="text-xl font-semibold">{stats.totalFaturas}</p>
                </div>
                <Receipt className="h-8 w-8 text-slate-600" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div>
                  <p className="text-sm text-slate-400">Receita Total</p>
                  <p className="text-xl font-semibold text-green-400">{formatCurrency(stats.receitaTotal)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schools List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white">Escolas Recentes</CardTitle>
                  <CardDescription className="text-slate-400">
                    Últimas escolas cadastradas na plataforma
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/platform/tenants")}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                <div className="space-y-3">
                  {tenants.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                      <p className="text-slate-400">Nenhuma escola cadastrada</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Comece cadastrando a primeira escola da plataforma
                      </p>
                      <Button
                        onClick={() => navigate("/platform/tenants/new")}
                        className="mt-4 bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        Cadastrar Escola
                      </Button>
                    </div>
                  ) : (
                    tenants.slice(0, 5).map((tenant) => (
                      <motion.div
                        key={tenant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900 transition-colors cursor-pointer"
                        onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{tenant.nome}</p>
                            <p className="text-sm text-slate-400">
                              {tenant.cnpj || "CNPJ não informado"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {tenant.plano}
                          </Badge>
                          {getSubscriptionBadge(tenant.subscription_status)}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
