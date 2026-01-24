import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Users, TrendingDown, TrendingUp, CircleAlert } from "lucide-react";

interface AgingData {
  ate30: number;
  de31a60: number;
  mais60: number;
}

interface InadimplenciaCardProps {
  taxa: number;
  valorTotal: number;
  faturasVencidas: number;
  responsaveisInadimplentes: number;
  aging?: AgingData;
  className?: string;
}

export function InadimplenciaCard({
  taxa,
  valorTotal,
  faturasVencidas,
  responsaveisInadimplentes,
  aging,
  className,
}: InadimplenciaCardProps) {
  const { t } = useTranslation();

  const getStatusConfig = (taxa: number) => {
    if (taxa === 0) return { 
      color: "success", 
      label: "Excelente",
      icon: TrendingUp,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent"
    };
    if (taxa <= 5) return { 
      color: "success", 
      label: "Saudável",
      icon: TrendingUp,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent"
    };
    if (taxa <= 10) return { 
      color: "warning", 
      label: "Atenção",
      icon: CircleAlert,
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent"
    };
    if (taxa <= 20) return { 
      color: "warning", 
      label: "Moderado",
      icon: AlertTriangle,
      gradient: "from-orange-500/10 via-orange-500/5 to-transparent"
    };
    return { 
      color: "destructive", 
      label: "Crítico",
      icon: TrendingDown,
      gradient: "from-red-500/10 via-red-500/5 to-transparent"
    };
  };

  const status = getStatusConfig(taxa);
  const StatusIcon = status.icon;

  const colorClasses = {
    success: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500",
      ring: "ring-emerald-500/20",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    },
    warning: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
      ring: "ring-amber-500/20",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    },
    destructive: {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500",
      ring: "ring-red-500/20",
      badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
    }
  };

  const colors = colorClasses[status.color as keyof typeof colorClasses];

  // Calculate progress percentage for the ring
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (Math.min(taxa, 100) / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}>
        {/* Gradient Background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          status.gradient
        )} />
        
        <CardContent className="relative p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                colors.badge,
                "border"
              )}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t("dashboard.delinquency")}
                </h3>
                <p className="text-xs text-muted-foreground">Análise de inadimplência</p>
              </div>
            </div>
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border",
              colors.badge
            )}>
              {status.label}
            </span>
          </div>

          {/* Main Rate Display */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                {t("dashboard.delinquencyRate")}
              </p>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="flex items-baseline gap-1"
              >
                <span className={cn("text-5xl font-bold tracking-tight", colors.text)}>
                  {taxa.toFixed(1)}
                </span>
                <span className={cn("text-2xl font-semibold", colors.text)}>%</span>
              </motion.div>
            </div>
            
            {/* Circular Progress */}
            <div className="relative">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={colors.text}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <StatusIcon className={cn("h-8 w-8", colors.text)} />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {t("dashboard.overdueInvoices")}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{faturasVencidas}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="group p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {t("dashboard.overdueResponsibles")}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{responsaveisInadimplentes}</p>
            </motion.div>
          </div>

          {/* Total Value */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "p-4 rounded-xl border",
              taxa > 0 
                ? "bg-red-500/5 border-red-500/20" 
                : "bg-emerald-500/5 border-emerald-500/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">
                  {t("dashboard.totalOverdue")}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  taxa > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {formatCurrency(valorTotal)}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                taxa > 0 ? "bg-red-500/10" : "bg-emerald-500/10"
              )}>
                <TrendingDown className={cn(
                  "h-6 w-6",
                  taxa > 0 ? "text-red-500" : "text-emerald-500 rotate-180"
                )} />
              </div>
            </div>
          </motion.div>

          {/* Aging Breakdown */}
          {aging && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {t("dashboard.agingTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {aging.ate30 + aging.de31a60 + aging.mais60} total
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center cursor-default"
                >
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {aging.ate30}
                  </p>
                  <p className="text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70">
                    0-30 {t("dashboard.days")}
                  </p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center cursor-default"
                >
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {aging.de31a60}
                  </p>
                  <p className="text-[11px] font-medium text-orange-600/70 dark:text-orange-400/70">
                    31-60 {t("dashboard.days")}
                  </p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-center cursor-default"
                >
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {aging.mais60}
                  </p>
                  <p className="text-[11px] font-medium text-red-600/70 dark:text-red-400/70">
                    +60 {t("dashboard.days")}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
