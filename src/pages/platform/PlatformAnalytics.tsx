import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Repeat,
  UserMinus,
  Crown,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";
import {
  MetricCard,
  MrrChart,
  ChurnChart,
  ConversionChart,
  GrowthChart,
  ActivityFeed,
} from "@/components/platform/analytics";

export default function PlatformAnalytics() {
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const { data: analytics, isLoading, refetch } = usePlatformAnalytics();

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
    }
  }, [isPlatformAdmin, navigate]);

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[380px]" />
            <Skeleton className="h-[380px]" />
          </div>
        </div>
      </PlatformLayout>
    );
  }

  if (!analytics) {
    return (
      <PlatformLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Erro ao carregar dados</p>
          <Button onClick={() => refetch()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              Métricas avançadas e indicadores de performance do SaaS
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Primary KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="MRR"
            value={formatCurrency(analytics.currentMrr)}
            icon={DollarSign}
            variant="success"
            trend={analytics.mrrGrowth !== 0 ? {
              value: analytics.mrrGrowth,
              isPositive: analytics.mrrGrowth > 0,
            } : undefined}
            index={0}
          />
          <MetricCard
            title="Taxa de Churn"
            value={`${analytics.churnRate.toFixed(1)}%`}
            subtitle="Últimos 6 meses"
            icon={UserMinus}
            variant={analytics.churnRate > 5 ? "danger" : analytics.churnRate > 2 ? "warning" : "success"}
            index={1}
          />
          <MetricCard
            title="Conversão de Trials"
            value={`${analytics.trialConversionRate.toFixed(0)}%`}
            subtitle="Trial → Assinante"
            icon={Target}
            variant={analytics.trialConversionRate > 30 ? "success" : analytics.trialConversionRate > 15 ? "warning" : "danger"}
            index={2}
          />
          <MetricCard
            title="ARPU"
            value={formatCurrency(analytics.averageRevenuePerTenant)}
            subtitle="Receita média por cliente"
            icon={Crown}
            variant="premium"
            index={3}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="LTV Estimado"
            value={formatCurrency(analytics.ltv)}
            subtitle="Lifetime Value"
            icon={TrendingUp}
            variant="info"
            index={4}
          />
          <MetricCard
            title="Clientes Ativos"
            value={analytics.activeTenants}
            subtitle={`de ${analytics.totalTenants} total`}
            icon={Users}
            variant="default"
            index={5}
          />
          <MetricCard
            title="Em Trial"
            value={analytics.trialTenants}
            subtitle="Aguardando conversão"
            icon={Repeat}
            variant="info"
            index={6}
          />
          <MetricCard
            title="Churned"
            value={analytics.churnedTenants}
            subtitle="Cancelados/Suspensos"
            icon={TrendingDown}
            variant="danger"
            index={7}
          />
        </div>

        {/* MRR Evolution Chart */}
        <MrrChart data={analytics.monthlyMetrics} />

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <GrowthChart data={analytics.monthlyMetrics} />
          <ActivityFeed events={analytics.recentEvents} />
        </div>

        {/* Bottom Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChurnChart data={analytics.monthlyMetrics} />
          <ConversionChart data={analytics.monthlyMetrics} />
        </div>
      </div>
    </PlatformLayout>
  );
}
