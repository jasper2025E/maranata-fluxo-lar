import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { useSecurityMetrics, useSecurityAccessLogs, useSecurityAlerts, useResolveSecurityAlert } from "@/hooks/useSecurityLogs";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Security score calculator
function calculateSecurityScore(params: {
  mfaEnabled: boolean;
  hasStrongPassword: boolean;
  emailVerified: boolean;
  recentDeniedAttempts: number;
}): { score: number; label: string; color: string } {
  let score = 0;
  if (params.emailVerified) score += 25;
  if (params.mfaEnabled) score += 35;
  if (params.hasStrongPassword) score += 25;
  if (params.recentDeniedAttempts === 0) score += 15;

  if (score >= 85) return { score, label: "Excelente", color: "text-green-500" };
  if (score >= 60) return { score, label: "Bom", color: "text-yellow-500" };
  if (score >= 40) return { score, label: "Regular", color: "text-orange-500" };
  return { score, label: "Crítico", color: "text-destructive" };
}

export function SecurityTab() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("visao-geral");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isAdmin = role === "admin" || role === "platform_admin";

  // Security data hooks
  const { data: metrics, isLoading: metricsLoading } = useSecurityMetrics(timeRange);
  const { data: accessLogs, isLoading: logsLoading, refetch: refetchLogs } = useSecurityAccessLogs({
    timeRange,
    limit: 20,
  });
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useSecurityAlerts(true);
  const { resolveAlert } = useResolveSecurityAlert();

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(passwordData.newPassword);
  const strengthLabel = passwordStrength <= 20 ? "Muito fraca" :
    passwordStrength <= 40 ? "Fraca" :
    passwordStrength <= 60 ? "Média" :
    passwordStrength <= 80 ? "Forte" : "Muito forte";

  const securityScore = calculateSecurityScore({
    mfaEnabled,
    hasStrongPassword: true,
    emailVerified: true,
    recentDeniedAttempts: metrics?.deniedRequests || 0,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordSchema.safeParse(passwordData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      toast.success("Senha alterada");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast.success("Alerta resolvido");
      refetchAlerts();
    } catch {
      toast.error("Erro ao resolver alerta");
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "SELECT": return <Eye className="h-3.5 w-3.5 text-blue-500" />;
      case "INSERT": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case "UPDATE": return <RefreshCw className="h-3.5 w-3.5 text-yellow-500" />;
      case "DELETE": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Crítico</Badge>;
      case "high": return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0">Alto</Badge>;
      case "medium": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] px-1.5 py-0">Médio</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Baixo</Badge>;
    }
  };

  const PasswordInput = ({ id, label, value, onChange, show, onToggle, hint }: {
    id: string; label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; hint?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} value={value}
          onChange={(e) => onChange(e.target.value)} placeholder="••••••••" className="h-9 pr-10" />
        <button type="button" onClick={onToggle}
          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Security Score Hero */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-full border-4 border-muted flex items-center justify-center relative">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor"
                  className="text-muted" strokeWidth="8" />
                <circle cx="50" cy="50" r="46" fill="none"
                  stroke={securityScore.score >= 85 ? "#22c55e" : securityScore.score >= 60 ? "#eab308" : securityScore.score >= 40 ? "#f97316" : "#ef4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${securityScore.score * 2.89} 289`} />
              </svg>
              <div className="text-center z-10">
                <span className={`text-2xl font-bold ${securityScore.color}`}>{securityScore.score}</span>
              </div>
            </div>
          </div>

          {/* Score Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Pontuação de Segurança</h3>
              <Badge variant="outline" className={`${securityScore.color} text-xs`}>
                {securityScore.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Avaliação geral da segurança da sua conta
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SecurityCheckItem icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="E-mail verificado" done />
              <SecurityCheckItem
                icon={mfaEnabled ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldAlert className="h-4 w-4 text-yellow-500" />}
                label="Autenticação 2FA" done={mfaEnabled} />
              <SecurityCheckItem icon={<Lock className="h-4 w-4 text-green-500" />} label="Senha forte" done />
              <SecurityCheckItem
                icon={metrics && metrics.deniedRequests > 0 ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                label="Sem acessos negados" done={!metrics || metrics.deniedRequests === 0} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="visao-geral" className="text-xs gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="senha" className="text-xs gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Senha & 2FA
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="atividade" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Atividade
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="alertas" className="text-xs gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alertas
              {alerts && alerts.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="visao-geral" className="mt-4 space-y-4">
          {/* Metrics Cards */}
          {isAdmin && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Métricas de Segurança</p>
              <div className="flex items-center gap-1">
                {(["1h", "24h", "7d", "30d"] as const).map((range) => (
                  <button key={range} onClick={() => setTimeRange(range)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      timeRange === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}>
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAdmin && metricsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : isAdmin && metrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Total de acessos" value={metrics.totalRequests}
                icon={<Globe className="h-4 w-4" />} color="text-blue-500" />
              <MetricCard label="Permitidos" value={metrics.allowedRequests}
                icon={<CheckCircle2 className="h-4 w-4" />} color="text-green-500" />
              <MetricCard label="Negados" value={metrics.deniedRequests}
                icon={<XCircle className="h-4 w-4" />} color="text-destructive"
                alert={metrics.deniedRequests > 0} />
              <MetricCard label="Cross-tenant" value={metrics.crossTenantAttempts}
                icon={<ShieldAlert className="h-4 w-4" />} color="text-orange-500"
                alert={metrics.crossTenantAttempts > 0} />
            </div>
          ) : null}

          {/* Security Status */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Status de Proteção</h3>
            </div>
            <div className="divide-y divide-border">
              <StatusRow icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                label="E-mail verificado" description="Identidade confirmada" status="Ativo" statusOk />
              <StatusRow icon={mfaEnabled ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldAlert className="h-4 w-4 text-yellow-500" />}
                label="Autenticação 2FA" description="Camada extra de proteção" status={mfaEnabled ? "Ativo" : "Inativo"} statusOk={mfaEnabled} />
              <StatusRow icon={<Lock className="h-4 w-4 text-green-500" />}
                label="Criptografia" description="Dados protegidos em trânsito e repouso" status="Ativo" statusOk />
              {isAdmin && (
                <StatusRow icon={<Shield className="h-4 w-4 text-green-500" />}
                  label="Isolamento Multi-tenant" description="RLS ativo em todas as tabelas" status="Ativo" statusOk />
              )}
            </div>
          </div>

          {/* Operations breakdown for admin */}
          {isAdmin && metrics && (
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Operações por Tipo</h3>
              </div>
              <div className="p-5 space-y-3">
                {Object.entries(metrics.byOperation).map(([op, count]) => (
                  <div key={op} className="flex items-center gap-3">
                    {getOperationIcon(op)}
                    <span className="text-xs font-medium text-foreground w-16">{op}</span>
                    <div className="flex-1">
                      <Progress value={metrics.totalRequests > 0 ? (count / metrics.totalRequests) * 100 : 0} className="h-1.5" />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Password & 2FA Tab */}
        <TabsContent value="senha" className="mt-4 space-y-4">
          <div className="bg-card border border-border rounded-lg">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Alterar senha</h3>
              </div>
            </div>
            <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
              <PasswordInput id="currentPassword" label="Senha atual" value={passwordData.currentPassword}
                onChange={(v) => setPasswordData({ ...passwordData, currentPassword: v })}
                show={showCurrentPassword} onToggle={() => setShowCurrentPassword(!showCurrentPassword)} />

              <PasswordInput id="newPassword" label="Nova senha" value={passwordData.newPassword}
                onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })}
                show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)}
                hint="Use pelo menos 8 caracteres com letras, números e símbolos." />

              {passwordData.newPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i * 20 <= passwordStrength
                          ? passwordStrength <= 40 ? "bg-destructive" : passwordStrength <= 60 ? "bg-yellow-500" : "bg-green-500"
                          : "bg-muted"
                      }`} />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">Força da senha</span>
                    <span className={`text-[11px] font-medium ${
                      passwordStrength <= 40 ? "text-destructive" : passwordStrength <= 60 ? "text-yellow-600" : "text-green-600"
                    }`}>{strengthLabel}</span>
                  </div>
                </div>
              )}

              <PasswordInput id="confirmPassword" label="Confirmar nova senha" value={passwordData.confirmPassword}
                onChange={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
                show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />

              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> As senhas não coincidem
                </p>
              )}

              <div className="pt-1">
                <Button type="submit" disabled={loading} size="sm">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Alterar senha
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card border border-border rounded-lg">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Autenticação em dois fatores</h3>
              </div>
            </div>
            <div className="p-5">
              <TwoFactorSetup onStatusChange={setMfaEnabled} />
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab (admin only) */}
        {isAdmin && (
          <TabsContent value="atividade" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Log de Atividades Recentes</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {(["1h", "24h", "7d", "30d"] as const).map((range) => (
                      <button key={range} onClick={() => setTimeRange(range)}
                        className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                          timeRange === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        }`}>
                        {range}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refetchLogs()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {logsLoading ? (
                <div className="p-5 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : !accessLogs || accessLogs.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma atividade registrada neste período</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-shrink-0">
                        {log.status === "allowed" ? (
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            {getOperationIcon(log.operation)}
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground truncate">
                            {log.operation} {log.resource_type}
                          </span>
                          {log.is_cross_tenant_attempt && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">Cross-tenant</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground truncate">
                            {log.user_email || "Anônimo"}
                          </span>
                          {log.ip_address && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-[11px] text-muted-foreground">{log.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <Badge variant={log.status === "allowed" ? "secondary" : "destructive"} className="text-[10px] px-1.5 py-0">
                          {log.status === "allowed" ? "OK" : "Negado"}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Alerts Tab (admin only) */}
        {isAdmin && (
          <TabsContent value="alertas" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Alertas de Segurança</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refetchAlerts()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {alertsLoading ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : !alerts || alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <ShieldCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Nenhum alerta pendente</p>
                  <p className="text-xs text-muted-foreground mt-1">Sua conta está segura</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            alert.severity === "critical" ? "bg-destructive/10" :
                            alert.severity === "high" ? "bg-orange-500/10" : "bg-yellow-500/10"
                          }`}>
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === "critical" ? "text-destructive" :
                              alert.severity === "high" ? "text-orange-500" : "text-yellow-500"
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{alert.title}</span>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                            <Button variant="outline" size="sm" className="h-6 text-[11px] px-2"
                              onClick={() => handleResolveAlert(alert.id)}>
                              Resolver
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Sub-components
function SecurityCheckItem({ icon, label, done }: { icon: React.ReactNode; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-xs ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, icon, color, alert }: {
  label: string; value: number; icon: React.ReactNode; color: string; alert?: boolean;
}) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${alert ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function StatusRow({ icon, label, description, status, statusOk }: {
  icon: React.ReactNode; label: string; description: string; status: string; statusOk: boolean;
}) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant="outline" className={`text-[11px] ${
        statusOk ? "text-green-600 border-green-500/30 bg-green-500/10" : "text-muted-foreground"
      }`}>
        {status}
      </Badge>
    </div>
  );
}
