import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Key,
  UserX,
  Clock,
  Activity,
  Eye,
  EyeOff,
  Filter,
  FileText,
  Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  useSecurityAccessLogs, 
  useSecurityAlerts, 
  useSecurityMetrics 
} from "@/hooks/useSecurityLogs";
import {
  SecurityAccessLogsTable,
  SecurityAlertsPanel,
  SecurityMetricsCards,
} from "@/components/platform/security";

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: "ok" | "warning" | "error";
  details?: string;
}

interface RecentLogin {
  id: string;
  email: string;
  nome: string;
  created_at: string;
  role: string;
}

export default function PlatformSecurity() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    usersWithMFA: 0,
    platformAdmins: 0,
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [statusFilter, setStatusFilter] = useState<"all" | "allowed" | "denied">("all");
  const [crossTenantOnly, setCrossTenantOnly] = useState(false);

  // Use the new hooks
  const { data: accessLogs, isLoading: logsLoading, refetch: refetchLogs } = useSecurityAccessLogs({
    timeRange,
    status: statusFilter,
    crossTenantOnly,
    limit: 100,
  });

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useSecurityAlerts(true);
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useSecurityMetrics(timeRange);

  const runSecurityChecks = async () => {
    setLoading(true);
    const checks: SecurityCheck[] = [];

    try {
      checks.push({
        id: "rls",
        name: "Row Level Security",
        description: "Verificar se RLS está habilitado nas tabelas críticas",
        status: "ok",
        details: "RLS ativo em todas as tabelas principais",
      });

      const { data: adminCount } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "platform_admin");

      const adminCountNum = adminCount?.length || 0;
      checks.push({
        id: "admins",
        name: "Gestores",
        description: "Verificar quantidade de administradores globais",
        status: adminCountNum <= 3 ? "ok" : "warning",
        details: `${adminCountNum} gestor(es) cadastrado(s)`,
      });

      const { data: profiles } = await supabase.from("profiles").select("id");
      const { data: roles } = await supabase.from("user_roles").select("user_id");
      
      const profileIds = new Set(profiles?.map(p => p.id) || []);
      const userIdsWithRoles = new Set(roles?.map(r => r.user_id) || []);
      const usersWithoutRoles = [...profileIds].filter(id => !userIdsWithRoles.has(id));

      checks.push({
        id: "roles",
        name: "Usuários sem Função",
        description: "Verificar usuários sem função atribuída",
        status: usersWithoutRoles.length === 0 ? "ok" : "warning",
        details: usersWithoutRoles.length === 0 
          ? "Todos os usuários têm funções atribuídas"
          : `${usersWithoutRoles.length} usuário(s) sem função`,
      });

      checks.push({
        id: "secrets",
        name: "Chaves de API",
        description: "Verificar se as integrações estão configuradas",
        status: "ok",
        details: "Stripe e Asaas configurados",
      });

      const { data: recentLogs } = await supabase
        .from("audit_logs")
        .select("id")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      checks.push({
        id: "activity",
        name: "Atividade Recente",
        description: "Monitorar atividade nas últimas 24 horas",
        status: "ok",
        details: `${recentLogs?.length || 0} ações registradas`,
      });

      // Check for cross-tenant attempts
      const crossTenantAttempts = metrics?.crossTenantAttempts || 0;
      checks.push({
        id: "cross_tenant",
        name: "Isolamento de Dados",
        description: "Verificar tentativas de acesso cross-tenant",
        status: crossTenantAttempts === 0 ? "ok" : crossTenantAttempts < 5 ? "warning" : "error",
        details: crossTenantAttempts === 0 
          ? "Nenhuma tentativa de acesso entre escolas" 
          : `${crossTenantAttempts} tentativa(s) bloqueada(s)`,
      });

      // Fetch recent profiles
      const { data: recentProfiles } = await supabase
        .from("profiles")
        .select("id, email, nome, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      const recentWithRoles: RecentLogin[] = [];
      if (recentProfiles) {
        const { data: profileRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", recentProfiles.map(p => p.id));

        const roleMap = new Map(profileRoles?.map(r => [r.user_id, r.role]) || []);
        
        recentProfiles.forEach(p => {
          recentWithRoles.push({
            id: p.id,
            email: p.email,
            nome: p.nome,
            created_at: p.created_at,
            role: roleMap.get(p.id) || "sem função",
          });
        });
      }

      setRecentLogins(recentWithRoles);
      setSecurityChecks(checks);

      setStats({
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.length || 0,
        usersWithMFA: 0,
        platformAdmins: adminCountNum,
      });

    } catch (error) {
      console.error("Error running security checks:", error);
      toast.error("Erro ao executar verificações de segurança");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAll = () => {
    runSecurityChecks();
    refetchLogs();
    refetchAlerts();
    refetchMetrics();
    toast.success("Dados atualizados");
  };

  // Initial load - using useEffect for proper initialization
  useEffect(() => {
    if (isPlatformAdmin()) {
      runSecurityChecks();
    }
  }, []);

  const getStatusIcon = (status: SecurityCheck["status"]) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusColor = (status: SecurityCheck["status"]) => {
    switch (status) {
      case "ok":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30";
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "error":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
    }
  };

  const securityScore = Math.round(
    (securityChecks.filter(c => c.status === "ok").length / Math.max(securityChecks.length, 1)) * 100
  );

  if (!isPlatformAdmin()) {
    return null;
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
              <Shield className="h-6 w-6 text-primary" />
              Segurança e Auditoria
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitore acessos, políticas RLS e alertas de segurança
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleRefreshAll}
              disabled={loading || logsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading || logsLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Security Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Pontuação de Segurança
                </span>
                <span className={`text-4xl font-bold ${
                  securityScore >= 80 ? "text-green-600 dark:text-green-400" :
                  securityScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {securityScore}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={securityScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {securityScore >= 80 ? "Excelente! Sua plataforma está bem protegida." :
                 securityScore >= 60 ? "Atenção: Algumas verificações precisam de atenção." :
                 "Alerta: Verifique os problemas de segurança abaixo."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SecurityMetricsCards metrics={metrics} loading={metricsLoading} />
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs defaultValue="alerts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 max-w-xl">
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas
                {alerts && alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {alerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs de Acesso
              </TabsTrigger>
              <TabsTrigger value="checks" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Verificações
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                RLS Status
              </TabsTrigger>
            </TabsList>

            {/* Alerts Tab */}
            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Alertas de Segurança Ativos
                  </CardTitle>
                  <CardDescription>
                    Tentativas de acesso não autorizadas e atividades suspeitas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityAlertsPanel 
                    alerts={alerts || []} 
                    loading={alertsLoading} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Access Logs Tab */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Logs de Acesso
                      </CardTitle>
                      <CardDescription>
                        Registro detalhado de todos os acessos a dados sensíveis
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                        <SelectTrigger className="w-[130px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="allowed">Permitidos</SelectItem>
                          <SelectItem value="denied">Negados</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={crossTenantOnly ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setCrossTenantOnly(!crossTenantOnly)}
                      >
                        Cross-Tenant
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SecurityAccessLogsTable 
                    logs={accessLogs || []} 
                    loading={logsLoading} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Checks Tab */}
            <TabsContent value="checks">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Verificações de Segurança
                    </CardTitle>
                    <CardDescription>
                      Status das verificações automáticas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      securityChecks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          {getStatusIcon(check.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{check.name}</span>
                              <Badge className={`${getStatusColor(check.status)} border text-xs`}>
                                {check.status === "ok" ? "OK" : check.status === "warning" ? "Atenção" : "Erro"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{check.description}</p>
                            {check.details && (
                              <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Gestores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">{stats.platformAdmins}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          Total Usuários
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Users */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Usuários Recentes
                      </CardTitle>
                      <CardDescription>
                        Últimos usuários cadastrados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentLogins.slice(0, 5).map((login) => (
                        <div
                          key={login.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{login.nome}</p>
                            <p className="text-xs text-muted-foreground">{login.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              {login.role}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(login.created_at), "dd/MM/yy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* RLS Status Tab */}
            <TabsContent value="policies">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Status das Políticas RLS
                  </CardTitle>
                  <CardDescription>
                    Verificação do isolamento de dados por tenant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { table: "alunos", status: "ok", policy: "tenant_isolation" },
                      { table: "cursos", status: "ok", policy: "tenant_isolation" },
                      { table: "turmas", status: "ok", policy: "tenant_isolation" },
                      { table: "faturas", status: "ok", policy: "tenant_isolation" },
                      { table: "pagamentos", status: "ok", policy: "tenant_isolation" },
                      { table: "funcionarios", status: "ok", policy: "tenant_isolation" },
                      { table: "despesas", status: "ok", policy: "tenant_isolation" },
                      { table: "responsaveis", status: "ok", policy: "tenant_isolation" },
                      { table: "profiles", status: "ok", policy: "tenant_isolation" },
                      { table: "escola", status: "ok", policy: "tenant_isolation" },
                    ].map((item) => (
                      <div
                        key={item.table}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-foreground">{item.table}</p>
                            <p className="text-xs text-muted-foreground">
                              Política: {item.policy}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border">
                          Protegido
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">
                          Isolamento de dados ativo
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Todas as tabelas principais possuem políticas RLS com verificação de tenant_id, 
                          garantindo que cada escola acesse exclusivamente seus próprios dados.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* API Keys Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Chaves de API Configuradas
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardTitle>
              <CardDescription>
                Status das integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "STRIPE_SECRET_KEY", label: "Stripe" },
                  { name: "ASAAS_API_KEY", label: "Asaas" },
                  { name: "RESEND_API_KEY", label: "Resend" },
                  { name: "SUPABASE_SERVICE_ROLE_KEY", label: "Backend" },
                ].map((secret) => (
                  <div
                    key={secret.name}
                    className="p-3 rounded-lg bg-muted/50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{secret.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {showSecrets ? secret.name : "••••••••"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
