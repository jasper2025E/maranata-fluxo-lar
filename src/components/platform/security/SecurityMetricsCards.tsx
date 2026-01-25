import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  ShieldAlert,
  Users,
  Building2,
  Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SecurityMetrics {
  totalRequests: number;
  allowedRequests: number;
  deniedRequests: number;
  crossTenantAttempts: number;
  uniqueUsers: number;
  uniqueTenants: number;
  byOperation: {
    SELECT: number;
    INSERT: number;
    UPDATE: number;
    DELETE: number;
  };
  byResourceType: Record<string, number>;
}

interface SecurityMetricsCardsProps {
  metrics: SecurityMetrics | undefined;
  loading?: boolean;
}

export function SecurityMetricsCards({ metrics, loading }: SecurityMetricsCardsProps) {
  if (loading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Acessos",
      value: metrics.totalRequests,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Permitidos",
      value: metrics.allowedRequests,
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Negados",
      value: metrics.deniedRequests,
      icon: ShieldX,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
    {
      title: "Cross-Tenant",
      value: metrics.crossTenantAttempts,
      icon: ShieldAlert,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Usuários Únicos",
      value: metrics.uniqueUsers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Tenants Acessados",
      value: metrics.uniqueTenants,
      icon: Building2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={card.bgColor}>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center text-center">
                <Icon className={`h-6 w-6 mb-2 ${card.color}`} />
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
