import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";

interface FinancialSummaryCardProps {
  receitas: number;
  despesas: number;
  saldo: number;
  saldoAnterior?: number;
  meta?: number;
  className?: string;
}

export function FinancialSummaryCard({
  receitas,
  despesas,
  saldo,
  saldoAnterior = 0,
  meta,
  className,
}: FinancialSummaryCardProps) {
  const { t } = useTranslation();
  const isPositive = saldo >= 0;
  const saldoDoMes = receitas - despesas;
  const progressMeta = meta ? Math.min((receitas / meta) * 100, 100) : 0;

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {t("dashboard.monthlyFinancialSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Previous Month Balance */}
        {saldoAnterior !== 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
            <span className="text-sm text-muted-foreground">{t("dashboard.previousBalance")}</span>
            <span className={cn(
              "text-sm font-semibold",
              saldoAnterior >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(saldoAnterior)}
            </span>
          </div>
        )}

        {/* Main Balance */}
        <div className="text-center py-4 px-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/30">
          <p className="text-sm text-muted-foreground mb-1">{t("dashboard.currentBalance")}</p>
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-4xl font-bold tracking-tight",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {formatCurrency(saldo)}
          </motion.p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className={cn("text-sm font-medium", isPositive ? "text-success" : "text-destructive")}>
              {isPositive ? t("dashboard.surplus") : t("dashboard.deficit")}
            </span>
          </div>
          {saldoAnterior !== 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t("dashboard.monthResult")}: <span className={cn("font-semibold", saldoDoMes >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(saldoDoMes)}</span>
              {" + "}
              {t("dashboard.previousBalance").toLowerCase()}: <span className={cn("font-semibold", saldoAnterior >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(saldoAnterior)}</span>
            </p>
          )}
        </div>

        {/* Income vs Expenses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("dashboard.revenues")}
              </span>
            </div>
            <p className="text-xl font-bold text-success">{formatCurrency(receitas)}</p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("dashboard.expenses")}
              </span>
            </div>
            <p className="text-xl font-bold text-destructive">{formatCurrency(despesas)}</p>
          </div>
        </div>

        {/* Meta Progress */}
        {meta && meta > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {t("dashboard.monthlyGoal")}
              </span>
              <span className="font-medium text-foreground">
                {formatCurrency(receitas)} / {formatCurrency(meta)}
              </span>
            </div>
            <Progress value={progressMeta} className="h-2.5" />
            <p className="text-xs text-muted-foreground text-right">
              {t("dashboard.goalReached", { percent: progressMeta.toFixed(1) })}
            </p>
          </div>
        )}

        {/* Alert if deficit */}
        {!isPositive && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">{t("dashboard.deficitAlert")}</p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {t("dashboard.deficitAlertDesc")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
