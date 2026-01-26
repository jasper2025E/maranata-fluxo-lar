import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  RefreshCw,
  ExternalLink,
  Sparkles,
  BookOpen,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";
import { getRandomVerse, type BibleVerse } from "@/lib/biblicalVerses";

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
  mrr: number;
}

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const { isPlatformAdmin, user } = useAuth();
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
  const [verse] = useState<BibleVerse>(() => getRandomVerse());

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [isPlatformAdmin, navigate]);

  const fetchData = async () => {
    try {
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) console.error("Error fetching tenants:", tenantsError);
      setTenants(tenantsData || []);

      const activeTenants = tenantsData?.filter(t => t.subscription_status === "active" || t.status === "ativo").length || 0;
      const trialTenants = tenantsData?.filter(t => t.subscription_status === "trial").length || 0;
      const overdueTenants = tenantsData?.filter(t => t.subscription_status === "past_due" || t.subscription_status === "suspended").length || 0;
      const mrr = tenantsData?.filter(t => t.subscription_status === "active")
        .reduce((sum, t) => sum + (Number(t.monthly_price) || 0), 0) || 0;

      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: alunosCount } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true });

      const { count: faturasCount } = await supabase
        .from("faturas")
        .select("*", { count: "exact", head: true });

      const { data: paidFaturas } = await supabase
        .from("faturas")
        .select("valor_total")
        .eq("status", "Paga");

      const receitaTotal = paidFaturas?.reduce((sum, f) => sum + (Number(f.valor_total) || 0), 0) || 0;

      setStats({
        totalTenants: tenantsData?.length || 0,
        activeTenants,
        trialTenants,
        overdueTenants,
        totalUsers: usersCount || 0,
        totalAlunos: alunosCount || 0,
        totalFaturas: faturasCount || 0,
        receitaTotal,
        mrr,
      });
    } catch (error) {
      console.error("Error fetching platform data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-8">
        {/* Welcome Banner - Premium gradient style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 p-6 md:p-8 bg-card"
        >
          {/* Gradient blob decorations */}
          <div className="absolute top-0 left-0 w-[400px] h-[300px] pointer-events-none">
            <svg
              viewBox="0 0 400 300"
              className="w-full h-full"
              preserveAspectRatio="xMinYMin slice"
            >
              <defs>
                <linearGradient id="welcome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#80e9ff" stopOpacity="0.3" />
                  <stop offset="33%" stopColor="#a855f7" stopOpacity="0.2" />
                  <stop offset="66%" stopColor="#ec4899" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M0,0 L400,0 L400,150 Q300,250 150,200 Q50,170 0,250 Z"
                fill="url(#welcome-gradient)"
              />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Painel do Gestor</span>
            </div>
            <h1 className="text-xl md:text-2xl font-medium text-foreground italic leading-relaxed max-w-2xl">
              "{verse.text}"
            </h1>
            <p className="text-sm text-muted-foreground mt-3 font-medium">
              — {verse.reference}
            </p>
          </div>
        </motion.div>

        {/* Quick Start Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-semibold">Comece a gerenciar</CardTitle>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <span className="sr-only">Fechar</span>
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Quick Action 1 */}
                <button
                  onClick={() => navigate("/platform/tenants/new")}
                  className="group p-5 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">Rápido</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Cadastrar nova escola
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    Iniciar <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </button>

                {/* Quick Action 2 */}
                <button
                  onClick={() => navigate("/platform/subscriptions")}
                  className="group p-5 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <Badge variant="outline" className="text-xs">Financeiro</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Gerenciar assinaturas
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    Iniciar <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </button>

                {/* Explore All */}
                <button
                  onClick={() => navigate("/platform/tenants")}
                  className="group p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-left flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Ver todas as escolas
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.totalTenants} cadastradas
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-foreground">Hoje</h2>
          
          <div className="flex flex-wrap items-center gap-6 md:gap-12 p-4 rounded-xl bg-muted/30 border border-border/50">
            {/* Volume */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">MRR</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.mrr)}
              </p>
            </div>

            {/* Escolas Ativas */}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Escolas ativas</span>
              <p className="text-2xl font-bold text-foreground">
                {stats.activeTenants}
              </p>
            </div>

            {/* Saldo */}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Receita total</span>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.receitaTotal)}
              </p>
            </div>

            <div className="ml-auto">
              <Button 
                variant="link" 
                className="text-primary"
                onClick={() => navigate("/platform/subscriptions")}
              >
                Ver detalhes
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="group hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Escolas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalTenants}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {stats.activeTenants} ativas
                    </span>
                    {stats.trialTenants > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {stats.trialTenants} em teste
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/20 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Em todas as escolas</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-500/20 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alunos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAlunos}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cadastrados na plataforma</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:shadow-green-500/5 hover:border-green-500/20 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalFaturas}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total emitidas</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Schools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Escolas Recentes</CardTitle>
                <CardDescription>Últimas escolas cadastradas na plataforma</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/platform/tenants")}
              >
                Ver todas
              </Button>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhuma escola cadastrada</p>
                  <Button
                    onClick={() => navigate("/platform/tenants/new")}
                    className="mt-4"
                  >
                    Cadastrar primeira escola
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tenants.slice(0, 5).map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tenant.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {tenant.cnpj || "CNPJ não informado"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tenant.plano}</Badge>
                        {tenant.subscription_status === "active" && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        )}
                        {tenant.subscription_status === "trial" && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Teste
                          </Badge>
                        )}
                        {(tenant.subscription_status === "past_due" || tenant.subscription_status === "suspended") && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Inadimplente
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
