import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Server, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SystemStatusWidgetProps {
  isMaintenanceMode?: boolean;
  className?: string;
}

export function SystemStatusWidget({ isMaintenanceMode = false, className }: SystemStatusWidgetProps) {
  const status = isMaintenanceMode ? "maintenance" : "online";
  
  const statusConfig = {
    online: {
      icon: CheckCircle2,
      label: "Sistema Online",
      description: "Todos os serviços operacionais",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      badgeVariant: "default" as const,
      badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    maintenance: {
      icon: AlertTriangle,
      label: "Manutenção",
      description: "Sistema em manutenção programada",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      badgeVariant: "outline" as const,
      badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("border-border/50 overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
              config.bgColor
            )}>
              <StatusIcon className={cn("h-6 w-6", config.color)} />
            </div>

            {/* Status Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{config.label}</h3>
                <Badge variant={config.badgeVariant} className={cn("text-xs", config.badgeClass)}>
                  {status === "online" ? (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Ativo
                    </span>
                  ) : (
                    "Em progresso"
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
            </div>

            {/* Quick Stats */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Server className="h-3.5 w-3.5" />
                  <span className="text-xs">API</span>
                </div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">99.9%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-xs">Latência</span>
                </div>
                <p className="text-sm font-medium text-foreground">45ms</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
