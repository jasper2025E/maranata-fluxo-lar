import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Mail,
  MoreVertical,
  TrendingUp,
  History,
  Play,
  Pause,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, formatDistanceToNow, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface Subscription {
  id: string;
  nome: string;
  email: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  grace_period_ends_at: string | null;
  monthly_price: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plano: string;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string | null;
}

interface SubscriptionEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  amount: number | null;
  metadata: any;
  created_at: string;
  tenant_nome?: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  trial: { 
    label: "Em Teste", 
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", 
    icon: <Clock className="h-3 w-3" /> 
  },
  active: { 
    label: "Ativa", 
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", 
    icon: <CheckCircle className="h-3 w-3" /> 
  },
  past_due: { 
    label: "Inadimplente", 
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", 
    icon: <AlertTriangle className="h-3 w-3" /> 
  },
  cancelled: { 
    label: "Cancelada", 
    className: "bg-muted text-muted-foreground", 
    icon: <Clock className="h-3 w-3" /> 
  },
  suspended: { 
    label: "Suspensa", 
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", 
    icon: <AlertTriangle className="h-3 w-3" /> 
  },
};

const eventTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: "Cadastro", icon: <Building2 className="h-4 w-4" />, color: "text-blue-600" },
  activated: { label: "Ativação", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600" },
  reactivated: { label: "Reativação", icon: <Play className="h-4 w-4" />, color: "text-green-600" },
  suspended: { label: "Suspensão", icon: <Pause className="h-4 w-4" />, color: "text-red-600" },
  subscription_cancelled: { label: "Cancelamento", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
  subscription_updated: { label: "Atualização", icon: <RefreshCw className="h-4 w-4" />, color: "text-amber-600" },
  payment_received: { label: "Pagamento", icon: <DollarSign className="h-4 w-4" />, color: "text-green-600" },
  payment_failed: { label: "Falha Pagamento", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
  trial_started: { label: "Início Teste", icon: <Clock className="h-4 w-4" />, color: "text-blue-600" },
};

export default function PlatformSubscriptions() {
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentEvents, setRecentEvents] = useState<SubscriptionEvent[]>([]);
  const [mrrHistory, setMrrHistory] = useState<{ month: string; mrr: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [isPlatformAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, eventsRes] = await Promise.all([
        supabase
          .from("tenants")
          .select("id, nome, email, subscription_status, subscription_started_at, subscription_ends_at, trial_ends_at, grace_period_ends_at, monthly_price, stripe_customer_id, stripe_subscription_id, plano, blocked_at, blocked_reason, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("subscription_history")
          .select("*, tenants(nome)")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (subsRes.error) throw subsRes.error;
      
      const subs = subsRes.data || [];
      setSubscriptions(subs);
      
      // Process events with tenant names
      const events = (eventsRes.data || []).map((e: any) => ({
        ...e,
        tenant_nome: e.tenants?.nome || "Escola",
      }));
      setRecentEvents(events);

      // Calculate MRR history (last 6 months)
      const mrrData = calculateMrrHistory(subs);
      setMrrHistory(mrrData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const calculateMrrHistory = (subs: Subscription[]) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Count active subscriptions at end of each month
      const activeSubs = subs.filter(s => {
        if (!s.subscription_started_at) return false;
        const startDate = new Date(s.subscription_started_at);
        return startDate <= monthEnd && 
          (s.subscription_status === "active" || 
           (new Date(s.created_at || "") <= monthEnd));
      });
      
      const mrr = activeSubs.reduce((sum, s) => sum + (Number(s.monthly_price) || 0), 0);
      
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        mrr,
      });
    }
    return months;
  };

  const handleActivateSubscription = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          subscription_status: "active",
          subscription_started_at: new Date().toISOString(),
          blocked_at: null,
          blocked_reason: null,
        })
        .eq("id", tenantId);

      if (error) throw error;
      toast.success("Assinatura ativada com sucesso");
      fetchData();
    } catch (error) {
      console.error("Error activating subscription:", error);
      toast.error("Erro ao ativar assinatura");
    }
  };

  const handleSuspendSubscription = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          subscription_status: "suspended",
          blocked_at: new Date().toISOString(),
          blocked_reason: "Suspensa manualmente pelo gestor",
        })
        .eq("id", tenantId);

      if (error) throw error;
      toast.success("Assinatura suspensa");
      fetchData();
    } catch (error) {
      console.error("Error suspending subscription:", error);
      toast.error("Erro ao suspender assinatura");
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.nome.toLowerCase().includes(search.toLowerCase()) ||
      sub.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === "active").length,
    trial: subscriptions.filter(s => s.subscription_status === "trial").length,
    pastDue: subscriptions.filter(s => s.subscription_status === "past_due").length,
    suspended: subscriptions.filter(s => s.subscription_status === "suspended").length,
    mrr: subscriptions
      .filter(s => s.subscription_status === "active")
      .reduce((sum, s) => sum + (Number(s.monthly_price) || 0), 0),
  };

  // Calculate MRR growth
  const currentMrr = mrrHistory[mrrHistory.length - 1]?.mrr || 0;
  const previousMrr = mrrHistory[mrrHistory.length - 2]?.mrr || 0;
  const mrrGrowth = previousMrr > 0 ? ((currentMrr - previousMrr) / previousMrr) * 100 : 0;

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
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
            <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-muted-foreground">
              Gerencie as assinaturas e pagamentos das escolas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">MRR</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">{formatCurrency(stats.mrr)}</p>
                  {mrrGrowth !== 0 && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${mrrGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mrrGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(mrrGrowth).toFixed(1)}% vs mês anterior
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Teste</p>
                  <p className="text-2xl font-bold">{stats.trial}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inadimplentes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pastDue}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspensas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* MRR Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Evolução do MRR
                    </CardTitle>
                    <CardDescription>Receita recorrente mensal dos últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mrrHistory}>
                          <defs>
                            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="month" 
                            className="text-xs fill-muted-foreground"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            className="text-xs fill-muted-foreground"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), "MRR"]}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="mrr" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            fill="url(#mrrGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Events */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Atividade Recente
                    </CardTitle>
                    <CardDescription>Últimos eventos de assinaturas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                      {recentEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p>Nenhum evento registrado</p>
                        </div>
                      ) : (
                        recentEvents.slice(0, 8).map((event, index) => {
                          const config = eventTypeConfig[event.event_type] || eventTypeConfig.subscription_updated;
                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/platform/tenants/${event.tenant_id}`)}
                            >
                              <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 ${config.color}`}>
                                {config.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.tenant_nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {config.label}
                                  {event.amount && ` • ${formatCurrency(event.amount)}`}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6 space-y-4">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por escola ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="trial">Em Teste</SelectItem>
                  <SelectItem value="past_due">Inadimplentes</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Escola</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Próximo Venc.</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((sub) => {
                          const status = statusConfig[sub.subscription_status || "trial"] || statusConfig.trial;
                          return (
                            <TableRow 
                              key={sub.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/platform/tenants/${sub.id}`)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{sub.nome}</p>
                                    <p className="text-sm text-muted-foreground">{sub.email || "-"}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{sub.plano}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${status.className} flex items-center gap-1 w-fit`}>
                                  {status.icon}
                                  {status.label}
                                </Badge>
                                {sub.blocked_at && (
                                  <p className="text-xs text-destructive mt-1">
                                    Bloqueada {formatDistanceToNow(new Date(sub.blocked_at), { addSuffix: true, locale: ptBR })}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(sub.monthly_price || 0)}
                                <span className="text-muted-foreground text-sm">/mês</span>
                              </TableCell>
                              <TableCell>
                                {sub.subscription_ends_at 
                                  ? format(new Date(sub.subscription_ends_at), "dd/MM/yyyy", { locale: ptBR })
                                  : sub.trial_ends_at
                                    ? <span className="text-blue-600">Teste até {format(new Date(sub.trial_ends_at), "dd/MM", { locale: ptBR })}</span>
                                    : "-"
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={(e) => { e.stopPropagation(); navigate(`/platform/tenants/${sub.id}`); }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Ver Detalhes
                                    </DropdownMenuItem>
                                    {sub.email && (
                                      <DropdownMenuItem 
                                        onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${sub.email}`; }}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Enviar E-mail
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {sub.subscription_status !== "active" && (
                                      <DropdownMenuItem 
                                        onClick={(e) => { e.stopPropagation(); handleActivateSubscription(sub.id); }}
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Ativar Assinatura
                                      </DropdownMenuItem>
                                    )}
                                    {sub.subscription_status === "active" && (
                                      <DropdownMenuItem 
                                        onClick={(e) => { e.stopPropagation(); handleSuspendSubscription(sub.id); }}
                                        className="text-destructive"
                                      >
                                        <Pause className="h-4 w-4 mr-2" />
                                        Suspender
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico Completo
                  </CardTitle>
                  <CardDescription>Todos os eventos de assinaturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentEvents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum evento registrado</p>
                      </div>
                    ) : (
                      recentEvents.map((event, index) => {
                        const config = eventTypeConfig[event.event_type] || eventTypeConfig.subscription_updated;
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/platform/tenants/${event.tenant_id}`)}
                          >
                            <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 ${config.color}`}>
                              {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{event.tenant_nome}</p>
                                <Badge variant="outline" className="text-xs">{config.label}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                {event.old_status && event.new_status && (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {statusConfig[event.old_status]?.label || event.old_status}
                                    </Badge>
                                    <span>→</span>
                                    <Badge variant="outline" className="text-xs">
                                      {statusConfig[event.new_status]?.label || event.new_status}
                                    </Badge>
                                  </>
                                )}
                                {event.amount && (
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(event.amount)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground shrink-0">
                              {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
