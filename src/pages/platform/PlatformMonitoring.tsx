import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Activity,
  RefreshCw,
  Building2,
  Users,
  GraduationCap,
  Receipt,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Server,
  Database,
  Wifi,
  WifiOff,
  Shield,
  ShieldAlert,
  ShieldX,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformMetrics {
  // Schools
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  
  // Users
  totalUsers: number;
  activeUsersToday: number;
  newUsersWeek: number;
  
  // Students
  totalAlunos: number;
  alunosAtivos: number;
  newAlunosWeek: number;
  
  // Financial
  totalFaturas: number;
  faturasHoje: number;
  valorRecebidoHoje: number;
  valorRecebidoMes: number;
  faturasVencidas: number;
  valorVencido: number;
  
  // System
  lastSync: Date;
  systemStatus: "online" | "degraded" | "offline";
  dbStatus: "healthy" | "warning" | "error";
}

interface RecentActivity {
  id: string;
  type: "tenant_created" | "payment_received" | "user_login" | "invoice_created" | "subscription_changed";
  description: string;
  tenant?: string;
  timestamp: Date;
  value?: number;
}

interface SecurityMetrics {
  totalRequests: number;
  allowedRequests: number;
  deniedRequests: number;
  crossTenantAttempts: number;
  uniqueUsers: number;
}

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  createdAt: Date;
  userEmail?: string;
}

export default function PlatformMonitoring() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("today");
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    activeUsersToday: 0,
    newUsersWeek: 0,
    totalAlunos: 0,
    alunosAtivos: 0,
    newAlunosWeek: 0,
    totalFaturas: 0,
    faturasHoje: 0,
    valorRecebidoHoje: 0,
    valorRecebidoMes: 0,
    faturasVencidas: 0,
    valorVencido: 0,
    lastSync: new Date(),
    systemStatus: "online",
    dbStatus: "healthy",
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalRequests: 0,
    allowedRequests: 0,
    deniedRequests: 0,
    crossTenantAttempts: 0,
    uniqueUsers: 0,
  });
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  useEffect(() => {
    if (isPlatformAdmin()) {
      fetchData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isPlatformAdmin]);

  const fetchData = async () => {
    if (loading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const now = new Date();
      const today = startOfDay(now);
      const weekAgo = subDays(now, 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all data in parallel
      const [
        tenantsRes,
        usersRes,
        alunosRes,
        faturasRes,
        pagamentosHojeRes,
        pagamentosMesRes,
        auditRes,
        securityLogsRes,
        securityAlertsRes
      ] = await Promise.all([
        supabase.from("tenants").select("*"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("alunos").select("id, status_matricula, created_at"),
        supabase.from("faturas").select("id, status, valor_total, data_vencimento, created_at"),
        supabase.from("pagamentos").select("valor").gte("data_pagamento", today.toISOString()),
        supabase.from("pagamentos").select("valor").gte("data_pagamento", monthStart.toISOString()),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("security_access_logs").select("*").gte("created_at", subDays(now, 1).toISOString()),
        supabase.from("security_alerts").select("*").is("resolved_at", null).order("created_at", { ascending: false }).limit(10)
      ]);

      const tenants = tenantsRes.data || [];
      const users = usersRes.data || [];
      const alunos = alunosRes.data || [];
      const faturas = faturasRes.data || [];

      // Calculate tenant metrics
      const activeTenants = tenants.filter(t => t.subscription_status === "active" || t.status === "ativo").length;
      const trialTenants = tenants.filter(t => t.subscription_status === "trial").length;
      const suspendedTenants = tenants.filter(t => t.subscription_status === "suspended" || t.status === "suspenso").length;

      // Calculate user metrics
      const newUsersWeek = users.filter(u => new Date(u.created_at) >= weekAgo).length;

      // Calculate student metrics
      const alunosAtivos = alunos.filter(a => a.status_matricula === "ativo").length;
      const newAlunosWeek = alunos.filter(a => new Date(a.created_at!) >= weekAgo).length;

      // Calculate financial metrics
      const faturasHoje = faturas.filter(f => new Date(f.created_at!) >= today).length;
      const faturasVencidas = faturas.filter(f => 
        f.status !== "Paga" && f.status !== "Cancelada" && new Date(f.data_vencimento) < now
      );
      const valorVencido = faturasVencidas.reduce((sum, f) => sum + (f.valor_total || 0), 0);
      
      const valorRecebidoHoje = (pagamentosHojeRes.data || []).reduce((sum, p) => sum + p.valor, 0);
      const valorRecebidoMes = (pagamentosMesRes.data || []).reduce((sum, p) => sum + p.valor, 0);

      // Map audit logs to recent activity
      const activity: RecentActivity[] = (auditRes.data || []).slice(0, 10).map(log => ({
        id: log.id,
        type: getActivityType(log.tabela, log.acao),
        description: getActivityDescription(log),
        timestamp: new Date(log.created_at!),
      }));

      // Calculate security metrics
      const secLogs = securityLogsRes.data || [];
      const secMetrics: SecurityMetrics = {
        totalRequests: secLogs.length,
        allowedRequests: secLogs.filter((l: any) => l.status === 'allowed').length,
        deniedRequests: secLogs.filter((l: any) => l.status === 'denied').length,
        crossTenantAttempts: secLogs.filter((l: any) => l.is_cross_tenant_attempt).length,
        uniqueUsers: new Set(secLogs.map((l: any) => l.user_id)).size,
      };

      // Map security alerts
      const alerts: SecurityAlert[] = (securityAlertsRes.data || []).map((a: any) => ({
        id: a.id,
        alertType: a.alert_type,
        severity: a.severity,
        title: a.title,
        description: a.description || '',
        createdAt: new Date(a.created_at),
        userEmail: a.metadata?.user_email,
      }));

      setMetrics({
        totalTenants: tenants.length,
        activeTenants,
        trialTenants,
        suspendedTenants,
        totalUsers: users.length,
        activeUsersToday: 0, // Would need auth logs for this
        newUsersWeek,
        totalAlunos: alunos.length,
        alunosAtivos,
        newAlunosWeek,
        totalFaturas: faturas.length,
        faturasHoje,
        valorRecebidoHoje,
        valorRecebidoMes,
        faturasVencidas: faturasVencidas.length,
        valorVencido,
        lastSync: new Date(),
        systemStatus: "online",
        dbStatus: "healthy",
      });

      setRecentActivity(activity);
      setSecurityMetrics(secMetrics);
      setSecurityAlerts(alerts);

    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityType = (tabela: string, acao: string): RecentActivity["type"] => {
    if (tabela === "tenants" && acao === "INSERT") return "tenant_created";
    if (tabela === "pagamentos") return "payment_received";
    if (tabela === "faturas") return "invoice_created";
    return "user_login";
  };

  const getActivityDescription = (log: any): string => {
    const actions: Record<string, string> = {
      INSERT: "criado",
      UPDATE: "atualizado",
      DELETE: "removido",
    };
    return `${log.tabela} ${actions[log.acao] || log.acao}`;
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "tenant_created": return Building2;
      case "payment_received": return DollarSign;
      case "invoice_created": return Receipt;
      case "subscription_changed": return Zap;
      default: return Activity;
    }
  };

  if (!isPlatformAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
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
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              Monitoramento em Tempo Real
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe métricas e atividades da plataforma
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <div className={`h-2 w-2 rounded-full ${
                metrics.systemStatus === "online" ? "bg-green-500 animate-pulse" : 
                metrics.systemStatus === "degraded" ? "bg-yellow-500" : "bg-red-500"
              }`} />
              <span className="text-sm text-muted-foreground">
                {metrics.systemStatus === "online" ? "Sistema online" : "Problemas detectados"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Server className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">Operacional</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Banco de Dados</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">Saudável</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <span className="font-medium">
                    {format(metrics.lastSync, "HH:mm:ss", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Escolas</p>
                  <p className="text-2xl font-bold">{metrics.totalTenants}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-xs">{metrics.activeTenants} ativas</Badge>
                    {metrics.trialTenants > 0 && (
                      <Badge variant="secondary" className="text-xs">{metrics.trialTenants} teste</Badge>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                  <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{metrics.newUsersWeek} esta semana
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alunos</p>
                  <p className="text-2xl font-bold">{metrics.totalAlunos}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {metrics.alunosAtivos} ativos
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recebido hoje</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.valorRecebidoHoje)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mês: {formatCurrency(metrics.valorRecebidoMes)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.suspendedTenants > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {metrics.suspendedTenants} escola(s) suspensa(s)
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Verificar situação de pagamento
                      </p>
                    </div>
                  </div>
                )}

                {metrics.faturasVencidas > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {metrics.faturasVencidas} fatura(s) vencida(s)
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Total: {formatCurrency(metrics.valorVencido)}
                      </p>
                    </div>
                  </div>
                )}

                {metrics.suspendedTenants === 0 && metrics.faturasVencidas === 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Nenhum alerta no momento
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Sistema operando normalmente
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma atividade recente
                    </p>
                  ) : (
                    recentActivity.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(activity.timestamp, "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Security Monitoring Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-2 border-dashed border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Monitoramento de Segurança
              </CardTitle>
              <CardDescription>
                Rastreamento de acessos e detecção de tentativas cross-tenant (últimas 24h)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{securityMetrics.totalRequests}</p>
                  <p className="text-xs text-muted-foreground">Total Acessos</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{securityMetrics.allowedRequests}</p>
                  <p className="text-xs text-muted-foreground">Permitidos</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <ShieldX className="h-5 w-5 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{securityMetrics.deniedRequests}</p>
                  <p className="text-xs text-muted-foreground">Negados</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <ShieldAlert className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{securityMetrics.crossTenantAttempts}</p>
                  <p className="text-xs text-muted-foreground">Cross-Tenant</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{securityMetrics.uniqueUsers}</p>
                  <p className="text-xs text-muted-foreground">Usuários Únicos</p>
                </div>
              </div>

              {/* Security Alerts */}
              {securityAlerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Alertas de Segurança Ativos
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {securityAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' :
                          alert.severity === 'high' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900' :
                          'bg-muted/50 border-muted'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <ShieldAlert className={`h-4 w-4 mt-0.5 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-amber-600' : 'text-muted-foreground'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(alert.createdAt, "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {securityAlerts.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Nenhum alerta de segurança ativo
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Não foram detectadas tentativas de acesso cross-tenant
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Métricas do Dia</CardTitle>
              <CardDescription>
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Faturas criadas</p>
                  <p className="text-3xl font-bold">{metrics.faturasHoje}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Novos alunos (semana)</p>
                  <p className="text-3xl font-bold">{metrics.newAlunosWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Novos usuários (semana)</p>
                  <p className="text-3xl font-bold">{metrics.newUsersWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total faturas</p>
                  <p className="text-3xl font-bold">{metrics.totalFaturas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
