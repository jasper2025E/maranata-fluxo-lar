import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Percent, 
  AlertTriangle,
  Clock,
  CheckCircle2 
} from "lucide-react";
import { useFaturaKPIs, formatCurrency } from "@/hooks/useFaturas";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function KPICard({ title, value, description, icon: Icon, variant = 'default' }: KPICardProps) {
  const variants = {
    default: "text-primary bg-primary/10 border-primary/20",
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
          </div>
          <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center", variants[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground min-h-4 mt-2">{description ?? ""}</p>
      </CardContent>
    </Card>
  );
}

function AgingCard({ aging }: { aging: { ate30: number; de31a60: number; mais60: number } }) {
  const total = aging.ate30 + aging.de31a60 + aging.mais60;
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Aging de Inadimplência
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
            Total: <span className="font-semibold text-destructive">{total}</span> faturas
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function FaturaKPIs() {
  const { data: kpis, isLoading } = useFaturaKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {[...Array(8)].map((_, i) => (
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
    <div className="grid auto-rows-fr grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      <KPICard
        title="Faturamento Mensal"
        value={formatCurrency(kpis.faturamentoMensal)}
        icon={DollarSign}
        variant="success"
      />
      <KPICard
        title="A Receber"
        value={formatCurrency(kpis.valorAReceber)}
        description={`${kpis.faturasAbertas + kpis.faturasVencidas} pendentes`}
        icon={Receipt}
        variant="default"
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
        description={`${kpis.faturasVencidas} vencidas`}
        icon={AlertTriangle}
        variant={kpis.inadimplencia > 10 ? "destructive" : kpis.inadimplencia > 5 ? "warning" : "success"}
      />
      <KPICard
        title="Total Faturas"
        value={kpis.totalFaturas}
        icon={Receipt}
        variant="default"
      />
      <KPICard
        title="Faturas Pagas"
        value={kpis.faturasPagas}
        icon={CheckCircle2}
        variant="success"
      />
      <KPICard
        title="Descontos"
        value={formatCurrency(kpis.descontosConcedidos)}
        icon={Percent}
        variant="warning"
      />
      <AgingCard aging={kpis.aging} />
    </div>
  );
}
