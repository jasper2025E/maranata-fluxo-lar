import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, MousePointerClick, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface WebsiteAnalyticsCardProps {
  tenantId: string;
}

// Mock data - in real implementation, fetch from analytics table
const mockStats = {
  pageViews: 1234,
  pageViewsChange: 12.5,
  uniqueVisitors: 456,
  uniqueVisitorsChange: 8.2,
  leads: 23,
  leadsChange: 45.0,
  avgTimeOnSite: "2m 34s",
  avgTimeChange: -5.3,
  bounceRate: 42,
  bounceRateChange: -3.1,
  topPages: [
    { path: "/", views: 890 },
    { path: "#prematricula", views: 234 },
    { path: "#sobre", views: 156 },
  ],
};

export function WebsiteAnalyticsCard({ tenantId }: WebsiteAnalyticsCardProps) {
  const stats = mockStats;
  
  const metrics = [
    {
      label: "Visualizações",
      value: stats.pageViews.toLocaleString("pt-BR"),
      change: stats.pageViewsChange,
      icon: Eye,
    },
    {
      label: "Visitantes Únicos",
      value: stats.uniqueVisitors.toLocaleString("pt-BR"),
      change: stats.uniqueVisitorsChange,
      icon: Users,
    },
    {
      label: "Leads Gerados",
      value: stats.leads.toLocaleString("pt-BR"),
      change: stats.leadsChange,
      icon: MousePointerClick,
    },
    {
      label: "Tempo Médio",
      value: stats.avgTimeOnSite,
      change: stats.avgTimeChange,
      icon: Clock,
    },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Métricas do Site
            </CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Beta
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isPositive = metric.change > 0;
            const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
            
            return (
              <div key={metric.label} className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`flex items-center gap-1 text-xs ${
                  isPositive ? "text-success" : "text-destructive"
                }`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Top Pages */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Páginas mais visitadas</h4>
          <div className="space-y-2">
            {stats.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-4">{index + 1}.</span>
                  <span>{page.path === "/" ? "Página inicial" : page.path}</span>
                </div>
                <span className="text-muted-foreground">{page.views}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
