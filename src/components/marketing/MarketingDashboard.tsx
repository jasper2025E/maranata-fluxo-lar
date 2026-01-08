import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutTemplate, 
  Target, 
  Globe, 
  Eye, 
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { useMarketingStats, usePageViews, useConversions } from "@/hooks/useMarketing";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

const chartConfig = {
  views: {
    label: "Visualizações",
    color: "hsl(var(--primary))",
  },
  conversions: {
    label: "Conversões",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketingDashboard() {
  const { data: stats, isLoading: statsLoading } = useMarketingStats();
  
  const last7Days = subDays(new Date(), 7);
  const { data: recentViews } = usePageViews(undefined, startOfDay(last7Days).toISOString());
  const { data: recentConversions } = useConversions(undefined, startOfDay(last7Days).toISOString());

  // Prepare chart data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayViews = recentViews?.filter(v => 
      format(new Date(v.created_at), 'yyyy-MM-dd') === dateStr
    ).length || 0;
    const dayConversions = recentConversions?.filter(c => 
      format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr
    ).length || 0;

    chartData.push({
      date: format(date, 'dd/MM', { locale: ptBR }),
      views: dayViews,
      conversions: dayConversions,
    });
  }

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const conversionRate = stats?.totalViews 
    ? ((stats.totalConversions / stats.totalViews) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Páginas"
          value={stats?.totalPages || 0}
          description={`${stats?.publishedPages || 0} publicadas`}
          icon={LayoutTemplate}
          trend="neutral"
        />
        <StatCard
          title="Pixels Ativos"
          value={stats?.activePixels || 0}
          description={`de ${stats?.totalPixels || 0} total`}
          icon={Target}
          trend="neutral"
        />
        <StatCard
          title="Domínios"
          value={stats?.activeDomains || 0}
          description={`${stats?.totalDomains || 0} cadastrados`}
          icon={Globe}
          trend="neutral"
        />
        <StatCard
          title="Visualizações"
          value={stats?.totalViews?.toLocaleString('pt-BR') || 0}
          description="Total de acessos"
          icon={Eye}
          trend="up"
        />
        <StatCard
          title="Conversões"
          value={stats?.totalConversions?.toLocaleString('pt-BR') || 0}
          description={`${conversionRate}% taxa de conversão`}
          icon={MousePointerClick}
          trend="up"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visualizações (Últimos 7 dias)</CardTitle>
            <CardDescription>
              Acessos às suas landing pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  fill="var(--color-views)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversões (Últimos 7 dias)</CardTitle>
            <CardDescription>
              Leads e vendas capturados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="var(--color-conversions)"
                  fill="var(--color-conversions)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
