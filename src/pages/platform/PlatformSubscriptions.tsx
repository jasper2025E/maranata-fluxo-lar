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
  MoreVertical
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";

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
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  trial: { label: "Em Teste", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Clock className="h-3 w-3" /> },
  active: { label: "Ativa", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  past_due: { label: "Inadimplente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "Cancelada", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <Clock className="h-3 w-3" /> },
  suspended: { label: "Suspensa", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function PlatformSubscriptions() {
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchSubscriptions();
  }, [isPlatformAdmin, navigate]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome, email, subscription_status, subscription_started_at, subscription_ends_at, trial_ends_at, grace_period_ends_at, monthly_price, stripe_customer_id, stripe_subscription_id, plano, blocked_at, blocked_reason")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
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
      fetchSubscriptions();
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
      fetchSubscriptions();
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

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64 bg-slate-700" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 bg-slate-800" />
            ))}
          </div>
          <Skeleton className="h-96 bg-slate-800" />
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
              Assinaturas
            </h1>
            <p className="text-slate-400">
              Gerencie as assinaturas e pagamentos das escolas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscriptions}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">MRR</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.mrr)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Ativas</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Em Teste</p>
                  <p className="text-2xl font-bold text-white">{stats.trial}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Inadimplentes</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.pastDue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Suspensas</p>
                  <p className="text-2xl font-bold text-red-400">{stats.suspended}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por escola ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
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
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Escola</TableHead>
                    <TableHead className="text-slate-400">Plano</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Valor</TableHead>
                    <TableHead className="text-slate-400">Próximo Venc.</TableHead>
                    <TableHead className="text-slate-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400">Nenhuma assinatura encontrada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => {
                      const status = statusConfig[sub.subscription_status || "trial"];
                      return (
                        <TableRow 
                          key={sub.id} 
                          className="border-slate-700 hover:bg-slate-800/50 cursor-pointer"
                          onClick={() => navigate(`/platform/tenants/${sub.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{sub.nome}</p>
                                <p className="text-sm text-slate-400">{sub.email || "-"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {sub.plano}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                            {sub.blocked_at && (
                              <p className="text-xs text-red-400 mt-1">
                                Bloqueada {formatDistanceToNow(new Date(sub.blocked_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-white">
                            {formatCurrency(sub.monthly_price || 0)}
                            <span className="text-slate-400 text-sm">/mês</span>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {sub.subscription_ends_at 
                              ? format(new Date(sub.subscription_ends_at), "dd/MM/yyyy", { locale: ptBR })
                              : sub.trial_ends_at
                                ? <span className="text-blue-400">Teste até {format(new Date(sub.trial_ends_at), "dd/MM", { locale: ptBR })}</span>
                                : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/platform/tenants/${sub.id}`); }}
                                  className="text-slate-300 focus:bg-slate-700 focus:text-white"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                {sub.email && (
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${sub.email}`; }}
                                    className="text-slate-300 focus:bg-slate-700 focus:text-white"
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Enviar E-mail
                                  </DropdownMenuItem>
                                )}
                                {sub.subscription_status !== "active" && (
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); handleActivateSubscription(sub.id); }}
                                    className="text-green-400 focus:bg-green-500/20 focus:text-green-300"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Ativar Assinatura
                                  </DropdownMenuItem>
                                )}
                                {sub.subscription_status === "active" && (
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); handleSuspendSubscription(sub.id); }}
                                    className="text-red-400 focus:bg-red-500/20 focus:text-red-300"
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
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
      </div>
    </PlatformLayout>
  );
}
