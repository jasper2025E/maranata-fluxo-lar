import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  DollarSign,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface ActivityEvent {
  id: string;
  type: string;
  tenantName: string;
  amount: number | null;
  date: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const eventConfig: Record<string, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
}> = {
  created: { 
    label: "Nova escola cadastrada", 
    icon: <Building2 className="h-4 w-4" />, 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  activated: { 
    label: "Assinatura ativada", 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  reactivated: { 
    label: "Assinatura reativada", 
    icon: <Play className="h-4 w-4" />, 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  suspended: { 
    label: "Assinatura suspensa", 
    icon: <Pause className="h-4 w-4" />, 
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  subscription_cancelled: { 
    label: "Assinatura cancelada", 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  subscription_updated: { 
    label: "Assinatura atualizada", 
    icon: <RefreshCw className="h-4 w-4" />, 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  payment_received: { 
    label: "Pagamento recebido", 
    icon: <DollarSign className="h-4 w-4" />, 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  payment_failed: { 
    label: "Pagamento falhou", 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  trial_started: { 
    label: "Trial iniciado", 
    icon: <Clock className="h-4 w-4" />, 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
};

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          Últimos eventos de assinaturas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade recente
              </p>
            ) : (
              events.map((event) => {
                const config = eventConfig[event.type] || eventConfig.created;
                return (
                  <div 
                    key={event.id}
                    className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0"
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      config.bgColor
                    )}>
                      <span className={config.color}>{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.tenantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.label}
                        {event.amount && event.amount > 0 && (
                          <span className="ml-1 font-medium text-foreground">
                            • {formatCurrency(event.amount)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(event.date), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
