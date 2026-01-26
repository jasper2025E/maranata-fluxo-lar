import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  GraduationCap,
  Receipt,
  Target,
  Award,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";
import { differenceInDays } from "date-fns";
import {
  WelcomeCard,
  ProfileWidget,
  AwardsWidget,
  MetricsGrid,
  ActivityChart,
  RecentSchoolsWidget,
  RecentActivityFeed,
  QuickActionsCard,
  CalendarWidget,
  UpcomingActivities,
} from "@/components/platform/dashboard";

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  plano: string;
  status: string;
  subscription_status: string | null;
  data_contrato: string;
  limite_alunos: number;
  limite_usuarios: number;
  created_at: string;
  monthly_price: number | null;
  trial_ends_at: string | null;
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  overdueTenants: number;
  totalUsers: number;
  totalAlunos: number;
  totalFaturas: number;
  receitaTotal: number;
  mrr: number;
}

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const { isPlatformAdmin, user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    overdueTenants: 0,
    totalUsers: 0,
    totalAlunos: 0,
    totalFaturas: 0,
    receitaTotal: 0,
    mrr: 0,
  });
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchData();
    fetchProfile();
  }, [isPlatformAdmin, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, nome")
      .eq("id", user.id)
      .single();

    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    if (data?.nome) setUserName(data.nome);
  };

  const fetchData = async () => {
    try {
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) console.error("Error fetching tenants:", tenantsError);
      setTenants(tenantsData || []);

      const activeTenants = tenantsData?.filter(t => t.subscription_status === "active" || t.status === "ativo").length || 0;
      const trialTenants = tenantsData?.filter(t => t.subscription_status === "trial").length || 0;
      const overdueTenants = tenantsData?.filter(t => t.subscription_status === "past_due" || t.subscription_status === "suspended").length || 0;
      const mrr = tenantsData?.filter(t => t.subscription_status === "active")
        .reduce((sum, t) => sum + (Number(t.monthly_price) || 0), 0) || 0;

      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: alunosCount } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true });

      const { count: faturasCount } = await supabase
        .from("faturas")
        .select("*", { count: "exact", head: true });

      const { data: paidFaturas } = await supabase
        .from("faturas")
        .select("valor_total")
        .eq("status", "Paga");

      const receitaTotal = paidFaturas?.reduce((sum, f) => sum + (Number(f.valor_total) || 0), 0) || 0;

      setStats({
        totalTenants: tenantsData?.length || 0,
        activeTenants,
        trialTenants,
        overdueTenants,
        totalUsers: usersCount || 0,
        totalAlunos: alunosCount || 0,
        totalFaturas: faturasCount || 0,
        receitaTotal,
        mrr,
      });
    } catch (error) {
      console.error("Error fetching platform data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days since user created (simulate active days)
  const activeDays = user?.created_at 
    ? differenceInDays(new Date(), new Date(user.created_at))
    : 30;

  // Generate mock activity data for chart
  const activityChartData = [
    { month: "Mar", value: 15 },
    { month: "Abr", value: 22 },
    { month: "Mai", value: 36 },
    { month: "Jun", value: 28 },
    { month: "Jul", value: 42 },
    { month: "Ago", value: 35 },
  ];

  // Generate achievements data
  const achievements = [
    {
      icon: Building2,
      label: "Escolas",
      value: `${stats.totalTenants}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: GraduationCap,
      label: "Alunos",
      value: `${stats.totalAlunos}`,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
    },
    {
      icon: TrendingUp,
      label: "MRR",
      value: formatCurrency(stats.mrr),
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
  ];

  // Generate metrics data
  const metrics = [
    {
      icon: Building2,
      label: "Escolas",
      value: stats.totalTenants,
      color: "text-primary",
      bgColor: "bg-primary/10",
      chart: [3, 5, 4, 7, 6, 8, stats.totalTenants],
    },
    {
      icon: Users,
      label: "Usuários",
      value: stats.totalUsers,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      chart: [12, 18, 22, 19, 25, 28, stats.totalUsers],
    },
    {
      icon: GraduationCap,
      label: "Alunos",
      value: stats.totalAlunos,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
      chart: [100, 150, 180, 200, 250, 280, stats.totalAlunos],
    },
    {
      icon: Receipt,
      label: "Faturas",
      value: stats.totalFaturas,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      chart: [50, 80, 100, 120, 150, 180, stats.totalFaturas],
    },
  ];

  // Generate recent activities
  const recentActivities = tenants.slice(0, 5).map((tenant, index) => ({
    id: tenant.id,
    type: tenant.subscription_status === "active" 
      ? "subscription_active" as const
      : tenant.subscription_status === "trial"
        ? "subscription_trial" as const
        : "school_created" as const,
    title: tenant.nome,
    description: `Plano ${tenant.plano} • ${tenant.subscription_status === "active" ? "Assinatura ativa" : tenant.subscription_status === "trial" ? "Período de teste" : "Cadastrada"}`,
    time: `${index + 1}h atrás`,
  }));

  // Generate upcoming activities
  const upcomingActivities = tenants
    .filter(t => t.subscription_status === "trial" && t.trial_ends_at)
    .slice(0, 3)
    .map((tenant, index) => ({
      id: tenant.id,
      type: "trial_ending" as const,
      title: tenant.nome,
      time: tenant.trial_ends_at 
        ? `${differenceInDays(new Date(tenant.trial_ends_at), new Date())} dias`
        : "Em breve",
      color: "amber",
    }));

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-12 w-72" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <WelcomeCard 
          avatarUrl={avatarUrl}
          userName={userName}
          stats={{
            tenantsManaged: stats.totalTenants,
            totalRevenue: formatCurrency(stats.receitaTotal),
            activeDays,
          }}
        />

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile and Awards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileWidget 
                avatarUrl={avatarUrl}
                userName={userName}
                stats={{
                  tenantsManaged: stats.totalTenants,
                  totalUsers: stats.totalUsers,
                  activeDays,
                }}
              />
              <AwardsWidget achievements={achievements} />
            </div>

            {/* Metrics Grid */}
            <MetricsGrid metrics={metrics} />

            {/* Activity Chart */}
            <ActivityChart data={activityChartData} />

            {/* Recent Schools */}
            <RecentSchoolsWidget tenants={tenants} />
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Calendar */}
            <CalendarWidget 
              highlightedDates={tenants
                .filter(t => t.trial_ends_at)
                .map(t => new Date(t.trial_ends_at!))}
            />

            {/* Upcoming Activities */}
            <UpcomingActivities activities={upcomingActivities} />

            {/* Recent Activity Feed */}
            <RecentActivityFeed activities={recentActivities} />
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
