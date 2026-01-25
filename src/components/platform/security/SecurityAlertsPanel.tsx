import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  ShieldX,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SecurityAlert, useResolveSecurityAlert } from "@/hooks/useSecurityLogs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SecurityAlertsPanelProps {
  alerts: SecurityAlert[];
  loading?: boolean;
}

export function SecurityAlertsPanel({ alerts, loading }: SecurityAlertsPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { resolveAlert } = useResolveSecurityAlert();
  const queryClient = useQueryClient();

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await resolveAlert(alertId);
      toast.success("Alerta resolvido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast.error("Erro ao resolver alerta");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-lg font-medium text-green-700 dark:text-green-400">
          Nenhum alerta de segurança ativo
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          O sistema está operando normalmente sem ameaças detectadas
        </p>
      </div>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-900",
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          badge: "destructive" as const,
        };
      case "high":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/30",
          border: "border-amber-200 dark:border-amber-900",
          icon: <ShieldAlert className="h-5 w-5 text-amber-600" />,
          badge: "secondary" as const,
        };
      case "medium":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          border: "border-yellow-200 dark:border-yellow-900",
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          badge: "outline" as const,
        };
      default:
        return {
          bg: "bg-muted/50",
          border: "border-muted",
          icon: <ShieldX className="h-5 w-5 text-muted-foreground" />,
          badge: "outline" as const,
        };
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cross_tenant_access: "Acesso Cross-Tenant",
      unauthorized_access: "Acesso Não Autorizado",
      suspicious_activity: "Atividade Suspeita",
      brute_force: "Tentativa de Força Bruta",
      data_exfiltration: "Extração de Dados",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        const isResolving = resolvingId === alert.id;

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}
          >
            <div className="flex items-start gap-3">
              {styles.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium">{alert.title}</h4>
                  <Badge variant={styles.badge} className="text-xs uppercase">
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getAlertTypeLabel(alert.alert_type)}
                  </Badge>
                </div>
                {alert.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {alert.metadata && (alert.metadata as any).user_email && (
                    <span>Usuário: {(alert.metadata as any).user_email}</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolve(alert.id)}
                disabled={isResolving}
              >
                {isResolving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Resolver
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
