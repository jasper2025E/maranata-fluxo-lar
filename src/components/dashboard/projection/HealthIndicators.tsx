import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HealthIndicator, HealthStatus } from "@/hooks/useFinancialProjection";
import { TrendingUp, TrendingDown, Shield, Wallet, PiggyBank, AlertTriangle, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HealthIndicatorsProps {
  indicators: HealthIndicator[];
  overallHealth: HealthStatus;
}

const statusConfig = {
  healthy: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Saudável",
    icon: "🟢",
  },
  attention: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    label: "Atenção",
    icon: "🟡",
  },
  risk: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    label: "Risco",
    icon: "🔴",
  },
};

const indicatorIcons: Record<string, React.ElementType> = {
  "cash-flow": Wallet,
  "runway": PiggyBank,
  "recurring": Receipt,
  "delinquency": AlertTriangle,
  "fixed-costs": TrendingDown,
};

export function HealthIndicators({ indicators, overallHealth }: HealthIndicatorsProps) {
  const { t } = useTranslation();
  const overallConfig = statusConfig[overallHealth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("projection.financialHealth")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("projection.healthDescription")}
          </p>
        </div>
        
        {/* Overall Health Badge */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border",
          overallConfig.bg,
          overallConfig.border
        )}>
          <span className="text-lg">{overallConfig.icon}</span>
          <span className={cn("font-semibold text-sm", overallConfig.text)}>
            {overallConfig.label}
          </span>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {indicators.map((indicator, index) => {
          const config = statusConfig[indicator.status];
          const Icon = indicatorIcons[indicator.id] || Shield;

          return (
            <motion.div
              key={indicator.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "relative p-4 rounded-xl border transition-all duration-200",
                "hover:shadow-md",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("h-4 w-4", config.text)} />
                <span className="text-xs font-medium text-muted-foreground">
                  {indicator.label}
                </span>
              </div>
              
              <p className={cn("text-lg font-bold", config.text)}>
                {indicator.description}
              </p>
              
              <div className="absolute top-3 right-3 text-sm">
                {config.icon}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
