import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FinancialAlert } from "@/hooks/useFinancialProjection";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface AlertsPanelProps {
  alerts: FinancialAlert[];
}

const alertConfig = {
  danger: {
    icon: AlertTriangle,
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    titleColor: "text-rose-700 dark:text-rose-300",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-700 dark:text-amber-300",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-700 dark:text-blue-300",
  },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const { t } = useTranslation();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  if (visibleAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t("projection.alerts")}
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("projection.noAlerts")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t("projection.alerts")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {visibleAlerts.length} {t("projection.activeAlerts")}
        </span>
      </div>

      <div className="space-y-3">
        {visibleAlerts.map((alert, index) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "relative p-4 rounded-xl border",
                config.bg,
                config.border
              )}
            >
              <button
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-background/50 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex gap-3 pr-8">
                <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className={cn("text-sm font-semibold", config.titleColor)}>
                    {alert.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
