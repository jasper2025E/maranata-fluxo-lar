import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Users, TrendingDown } from "lucide-react";

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

  const getStatusColor = (taxa: number) => {
    if (taxa <= 5) return { text: "text-success", bg: "bg-success" };
    if (taxa <= 15) return { text: "text-warning", bg: "bg-warning" };
    return { text: "text-destructive", bg: "bg-destructive" };
  };

  const status = getStatusColor(taxa);

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {t("dashboard.delinquency")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Taxa Principal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("dashboard.delinquencyRate")}</p>
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("text-4xl font-bold", status.text)}
            >
              {taxa.toFixed(1)}%
            </motion.p>
          </div>
          <div className={cn("h-16 w-16 rounded-full flex items-center justify-center", `${status.bg}/10`)}>
            <TrendingDown className={cn("h-8 w-8", status.text)} />
          </div>
        </div>

        <Progress value={taxa} max={100} className="h-2" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("dashboard.overdueInvoices")}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{faturasVencidas}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("dashboard.overdueResponsibles")}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{responsaveisInadimplentes}</p>
          </div>
        </div>

        {/* Valor Total */}
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-sm text-muted-foreground mb-1">{t("dashboard.totalOverdue")}</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(valorTotal)}</p>
        </div>

        {/* Aging */}
        {aging && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("dashboard.agingTitle")}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                <p className="text-lg font-bold text-warning">{aging.ate30}</p>
                <p className="text-[10px] text-muted-foreground">0-30 {t("dashboard.days")}</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                <p className="text-lg font-bold text-orange-500">{aging.de31a60}</p>
                <p className="text-[10px] text-muted-foreground">31-60 {t("dashboard.days")}</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-lg font-bold text-destructive">{aging.mais60}</p>
                <p className="text-[10px] text-muted-foreground">+60 {t("dashboard.days")}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
