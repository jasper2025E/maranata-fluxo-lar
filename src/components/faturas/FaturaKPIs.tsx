import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Percent, 
  AlertTriangle,
  Clock,
  CheckCircle2 
} from "lucide-react";
import { useFaturaKPIs, formatCurrency } from "@/hooks/useFaturas";
import { FinancialKPICard } from "@/components/dashboard";

function AgingCard({ aging, t }: { aging: { ate30: number; de31a60: number; mais60: number }; t: (key: string) => string }) {
  const total = aging.ate30 + aging.de31a60 + aging.mais60;
  
  return (
    <Card className="border-border/50 shadow-sm bg-card">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t("invoices.delinquencyAging")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center p-2 rounded-lg bg-warning/10">
            <p className="text-lg font-bold text-warning">{aging.ate30}</p>
            <p className="text-[10px] text-muted-foreground">0-30d</p>
          </div>
          <div className="flex-1 text-center p-2 rounded-lg bg-warning/10">
            <p className="text-lg font-bold text-warning">{aging.de31a60}</p>
            <p className="text-[10px] text-muted-foreground">31-60d</p>
          </div>
          <div className="flex-1 text-center p-2 rounded-lg bg-destructive/10">
            <p className="text-lg font-bold text-destructive">{aging.mais60}</p>
            <p className="text-[10px] text-muted-foreground">+60d</p>
          </div>
        </div>
        {total > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Total: <span className="font-semibold text-destructive">{total}</span> {t("invoices.invoicesLower")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function FaturaKPIs() {
  const { t } = useTranslation();
  const { data: kpis, isLoading } = useFaturaKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid auto-rows-fr grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      <FinancialKPICard
        title={t("invoices.monthlyBilling")}
        value={formatCurrency(kpis.faturamentoMensal)}
        icon={DollarSign}
        variant="success"
        size="sm"
      />
      <FinancialKPICard
        title={t("invoices.toReceive")}
        value={formatCurrency(kpis.valorAReceber)}
        subtitle={t("invoices.pendingCount", { count: kpis.faturasAbertas + kpis.faturasVencidas })}
        icon={Receipt}
        variant="default"
        size="sm"
      />
      <FinancialKPICard
        title={t("invoices.averageTicket")}
        value={formatCurrency(kpis.ticketMedio)}
        icon={TrendingUp}
        variant="info"
        size="sm"
      />
      <FinancialKPICard
        title={t("invoices.delinquency")}
        value={`${kpis.inadimplencia}%`}
        subtitle={t("invoices.overdueCount", { count: kpis.faturasVencidas })}
        icon={AlertTriangle}
        variant={kpis.inadimplencia > 10 ? "danger" : kpis.inadimplencia > 5 ? "warning" : "success"}
        size="sm"
      />
      <FinancialKPICard
        title={t("invoices.totalInvoices")}
        value={kpis.totalFaturas}
        icon={Receipt}
        variant="default"
        size="sm"
      />
      <FinancialKPICard
        title={t("invoices.paidInvoices")}
        value={kpis.faturasPagas}
        icon={CheckCircle2}
        variant="success"
        size="sm"
      />
      <FinancialKPICard
        title={t("invoices.discounts")}
        value={formatCurrency(kpis.descontosConcedidos)}
        icon={Percent}
        variant="warning"
        size="sm"
      />
      
    </div>
  );
}
