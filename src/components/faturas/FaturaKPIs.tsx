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
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", variants[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgingCard({ aging }: { aging: { ate30: number; de31a60: number; mais60: number } }) {
  const total = aging.ate30 + aging.de31a60 + aging.mais60;
  
  return (
    <Card className="border shadow-sm col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Aging de Inadimplência
        </CardTitle>
        <CardDescription className="text-xs">Faturas vencidas por período</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-2xl font-bold text-warning">{aging.ate30}</p>
            <p className="text-xs text-muted-foreground">0-30 dias</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-2xl font-bold text-orange-500">{aging.de31a60}</p>
            <p className="text-xs text-muted-foreground">31-60 dias</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-2xl font-bold text-destructive">{aging.mais60}</p>
            <p className="text-xs text-muted-foreground">+60 dias</p>
          </div>
        </div>
        {total > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total em atraso:</span>
              <span className="font-semibold text-destructive">{total} faturas</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FaturaKPIs() {
  const { data: kpis, isLoading } = useFaturaKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Faturamento Mensal"
          value={formatCurrency(kpis.faturamentoMensal)}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="A Receber"
          value={formatCurrency(kpis.valorAReceber)}
          description={`${kpis.faturasAbertas + kpis.faturasVencidas} faturas pendentes`}
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
          description={`${kpis.faturasVencidas} faturas vencidas`}
          icon={AlertTriangle}
          variant={kpis.inadimplencia > 10 ? "destructive" : kpis.inadimplencia > 5 ? "warning" : "success"}
        />
        <KPICard
          title="Descontos"
          value={formatCurrency(kpis.descontosConcedidos)}
          icon={Percent}
          variant="warning"
        />
        <KPICard
          title="Juros Arrecadados"
          value={formatCurrency(kpis.jurosArrecadados)}
          icon={TrendingUp}
          variant="success"
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total de Faturas"
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
        <AgingCard aging={kpis.aging} />
      </div>
    </div>
  );
}
