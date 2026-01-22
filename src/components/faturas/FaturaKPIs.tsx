import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Percent, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useFaturaKPIs, formatCurrency } from "@/hooks/useFaturas";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

function KPICard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const iconBgStyles = {
    default: "bg-muted",
    success: "bg-emerald-500/10",
    warning: "bg-amber-500/10",
    danger: "bg-red-500/10",
    info: "bg-blue-500/10",
  };

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <p className={cn("text-xl font-bold tracking-tight", variantStyles[variant])}>
              {value}
            </p>
            {subtitle && (
              <div className="flex items-center gap-1">
                {trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                <span className="text-[11px] text-muted-foreground">{subtitle}</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg shrink-0", iconBgStyles[variant])}>
            <Icon className={cn("h-4 w-4", variantStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgingCard({ aging }: { aging: { ate30: number; de31a60: number; mais60: number } }) {
  const total = aging.ate30 + aging.de31a60 + aging.mais60;
  const segments = [
    { value: aging.ate30, label: "0-30d", color: "bg-amber-400" },
    { value: aging.de31a60, label: "31-60d", color: "bg-orange-500" },
    { value: aging.mais60, label: "+60d", color: "bg-red-500" },
  ];
  
  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm col-span-2 sm:col-span-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Aging
          </p>
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        
        {total > 0 ? (
          <>
            {/* Visual bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-3">
              {segments.map((seg, i) => {
                const width = (seg.value / total) * 100;
                if (width === 0) return null;
                return (
                  <div
                    key={i}
                    className={cn("h-full transition-all", seg.color)}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex justify-between text-center">
              {segments.map((seg, i) => (
                <div key={i} className="flex-1">
                  <p className="text-sm font-bold">{seg.value}</p>
                  <p className="text-[10px] text-muted-foreground">{seg.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
            Sem inadimplência
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KPISkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FaturaKPIs() {
  const { data: kpis, isLoading } = useFaturaKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <KPISkeleton key={i} />)}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
      <KPICard
        title="Faturamento"
        value={formatCurrency(kpis.faturamentoMensal)}
        subtitle="Este mês"
        icon={DollarSign}
        variant="success"
        trend="up"
      />
      <KPICard
        title="A Receber"
        value={formatCurrency(kpis.valorAReceber)}
        subtitle={`${kpis.faturasAbertas + kpis.faturasVencidas} pendentes`}
        icon={Receipt}
        variant="info"
      />
      <KPICard
        title="Ticket Médio"
        value={formatCurrency(kpis.ticketMedio)}
        icon={TrendingUp}
        variant="default"
      />
      <KPICard
        title="Inadimplência"
        value={`${kpis.inadimplencia}%`}
        subtitle={`${kpis.faturasVencidas} vencidas`}
        icon={AlertTriangle}
        variant={kpis.inadimplencia > 10 ? "danger" : kpis.inadimplencia > 5 ? "warning" : "success"}
      />
      <AgingCard aging={kpis.aging} />
    </div>
  );
}
