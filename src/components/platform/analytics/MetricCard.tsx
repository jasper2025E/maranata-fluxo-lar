import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info" | "premium";
  index?: number;
}

const variantConfig = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  info: {
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  premium: {
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  index = 0,
}: MetricCardProps) {
  const colors = variantConfig[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}>
                  <span>{trend.isPositive ? "↑" : "↓"}</span>
                  <span>{Math.abs(trend.value).toFixed(1)}%</span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
              {subtitle && !trend && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              colors.iconBg
            )}>
              <Icon className={cn("h-6 w-6", colors.iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
