import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutTemplate, 
  Target, 
  Globe, 
  Eye, 
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { useMarketingStats, usePageViews, useConversions, useMarketingPages } from "@/hooks/useMarketing";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

const chartConfig = {
  views: {
    label: "Visualizações",
    color: "hsl(var(--primary))",
  },
  conversions: {
    label: "Conversões",
    color: "hsl(var(--chart-2))",
  },
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, trendValue, className }: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {trendValue && <span className="text-xs font-medium">{trendValue}</span>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStep({ 
  title, 
  value, 
  percentage, 
  color, 
  isLast 
}: { 
  title: string; 
  value: number; 
  percentage: number; 
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{value.toLocaleString('pt-BR')}</span>
        </div>
        <Progress value={percentage} className="h-2" style={{ '--progress-color': color } as React.CSSProperties} />
      </div>
      {!isLast && (
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
}

export function MarketingDashboard() {
  const { data: stats, isLoading: statsLoading } = useMarketingStats();
  const { data: pages } = useMarketingPages();
  
  const last7Days = subDays(new Date(), 7);
  const last14Days = subDays(new Date(), 14);
  
  const { data: recentViews } = usePageViews(undefined, startOfDay(last7Days).toISOString());
  const { data: previousViews } = usePageViews(
    undefined, 
    startOfDay(last14Days).toISOString(),
    startOfDay(last7Days).toISOString()
  );
  const { data: recentConversions } = useConversions(undefined, startOfDay(last7Days).toISOString());
  const { data: previousConversions } = useConversions(
    undefined,
    startOfDay(last14Days).toISOString(),
    startOfDay(last7Days).toISOString()
  );

  // Calculate trends
  const viewsTrend = previousViews && previousViews.length > 0
    ? ((recentViews?.length || 0) - previousViews.length) / previousViews.length * 100
    : 0;
  const conversionsTrend = previousConversions && previousConversions.length > 0
    ? ((recentConversions?.length || 0) - previousConversions.length) / previousConversions.length * 100
    : 0;

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
      date: format(date, 'EEE', { locale: ptBR }),
      fullDate: format(date, 'dd/MM', { locale: ptBR }),
      views: dayViews,
      conversions: dayConversions,
    });
  }

  // Funnel data
  const totalViews = stats?.totalViews || 0;
  const totalLeads = Math.floor((recentConversions?.filter(c => c.event_name === 'lead_start')?.length || 0));
  const totalCheckouts = Math.floor((recentConversions?.filter(c => c.event_name === 'initiate_checkout')?.length || 0));
  const totalPurchases = Math.floor((recentConversions?.filter(c => c.event_name === 'purchase')?.length || 0));

  // Source breakdown
  const sourceData = recentViews?.reduce((acc, view) => {
    const source = view.utm_source || 'Direto';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const sourceChartData = Object.entries(sourceData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  // Top pages
  const topPages = pages
    ?.filter(p => p.status === 'published')
    .slice(0, 5) || [];

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
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const conversionRate = totalViews > 0 
    ? ((stats?.totalConversions || 0) / totalViews * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/inscricao" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Landing Page
          </a>
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Testar Pixels
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Visualizações"
          value={stats?.totalViews?.toLocaleString('pt-BR') || 0}
          description="Últimos 7 dias"
          icon={Eye}
          trend={viewsTrend > 0 ? "up" : viewsTrend < 0 ? "down" : "neutral"}
          trendValue={`${Math.abs(viewsTrend).toFixed(0)}%`}
        />
        <StatCard
          title="Conversões"
          value={stats?.totalConversions?.toLocaleString('pt-BR') || 0}
          description="Total de eventos"
          icon={MousePointerClick}
          trend={conversionsTrend > 0 ? "up" : conversionsTrend < 0 ? "down" : "neutral"}
          trendValue={`${Math.abs(conversionsTrend).toFixed(0)}%`}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          description="Visitantes → Conversões"
          icon={TrendingUp}
          trend="neutral"
        />
        <StatCard
          title="Páginas Ativas"
          value={stats?.publishedPages || 0}
          description={`${stats?.totalPages || 0} total cadastradas`}
          icon={LayoutTemplate}
          trend="neutral"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pixels Ativos
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePixels || 0}</div>
            <p className="text-xs text-muted-foreground">de {stats?.totalPixels || 0} configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Domínios
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDomains || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalDomains || 0} cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitantes Únicos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(recentViews?.map(v => v.visitor_id)).size.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Semanal
                </CardTitle>
                <CardDescription>
                  Visualizações e conversões dos últimos 7 dias
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Visualizações</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                  <span className="text-muted-foreground">Conversões</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullDate}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  fill="url(#viewsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#conversionsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Fontes de Tráfego
            </CardTitle>
            <CardDescription>
              De onde vêm seus visitantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sourceChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados disponíveis
              </div>
            ) : (
              <>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sourceChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {sourceChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel & Top Pages */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
            <CardDescription>
              Acompanhe a jornada dos visitantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelStep 
              title="Visualizações" 
              value={totalViews} 
              percentage={100} 
              color="hsl(var(--primary))"
            />
            <FunnelStep 
              title="Início de Cadastro" 
              value={totalLeads || Math.floor(totalViews * 0.3)} 
              percentage={totalViews > 0 ? ((totalLeads || totalViews * 0.3) / totalViews) * 100 : 0} 
              color="hsl(var(--chart-2))"
            />
            <FunnelStep 
              title="Checkout" 
              value={totalCheckouts || Math.floor(totalViews * 0.1)} 
              percentage={totalViews > 0 ? ((totalCheckouts || totalViews * 0.1) / totalViews) * 100 : 0} 
              color="hsl(var(--chart-3))"
            />
            <FunnelStep 
              title="Compra Finalizada" 
              value={totalPurchases || Math.floor(totalViews * 0.05)} 
              percentage={totalViews > 0 ? ((totalPurchases || totalViews * 0.05) / totalViews) * 100 : 0} 
              color="hsl(var(--chart-4))"
              isLast
            />
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Páginas Publicadas
            </CardTitle>
            <CardDescription>
              Suas landing pages ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma página publicada</p>
                <Button variant="link" className="mt-2">
                  Criar primeira página
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {topPages.map((page) => (
                  <div 
                    key={page.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{page.nome}</p>
                      <p className="text-xs text-muted-foreground">/{page.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        v{page.versao}
                      </Badge>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/inscricao`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
