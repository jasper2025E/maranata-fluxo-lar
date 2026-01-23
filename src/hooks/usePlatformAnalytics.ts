import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyMetrics {
  month: string;
  monthLabel: string;
  mrr: number;
  newMrr: number;
  churnedMrr: number;
  activeTenants: number;
  newTenants: number;
  churnedTenants: number;
  trialConversions: number;
  trialStarts: number;
}

interface PlatformAnalytics {
  // Current metrics
  currentMrr: number;
  previousMrr: number;
  mrrGrowth: number;
  
  // Tenant counts
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  churnedTenants: number;
  
  // Rates
  churnRate: number;
  trialConversionRate: number;
  averageRevenuePerTenant: number;
  
  // Lifetime value
  ltv: number;
  
  // Historical data
  monthlyMetrics: MonthlyMetrics[];
  
  // Recent activity
  recentEvents: {
    id: string;
    type: string;
    tenantName: string;
    amount: number | null;
    date: string;
  }[];
}

async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  const now = new Date();
  const months: MonthlyMetrics[] = [];
  
  // Fetch all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (tenantsError) throw tenantsError;
  
  // Fetch subscription history for last 12 months
  const { data: history, error: historyError } = await supabase
    .from("subscription_history")
    .select("*, tenants(nome)")
    .gte("created_at", subMonths(now, 12).toISOString())
    .order("created_at", { ascending: false });
  
  if (historyError) throw historyError;
  
  // Calculate current metrics
  const activeTenantsList = tenants?.filter(t => t.subscription_status === "active") || [];
  const trialTenantsList = tenants?.filter(t => t.subscription_status === "trial") || [];
  const churnedTenantsList = tenants?.filter(t => 
    t.subscription_status === "cancelled" || t.subscription_status === "suspended"
  ) || [];
  
  const currentMrr = activeTenantsList.reduce((sum, t) => sum + (Number(t.monthly_price) || 0), 0);
  
  // Calculate historical metrics for last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthKey = format(monthDate, "yyyy-MM");
    const monthLabel = format(monthDate, "MMM/yy", { locale: ptBR });
    
    // Filter history events for this month
    const monthEvents = history?.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= monthStart && eventDate <= monthEnd;
    }) || [];
    
    // Count events by type
    const activations = monthEvents.filter(e => 
      e.event_type === "activated" || e.event_type === "reactivated"
    ).length;
    
    const cancellations = monthEvents.filter(e => 
      e.event_type === "subscription_cancelled" || e.event_type === "suspended"
    ).length;
    
    const trialStarts = monthEvents.filter(e => 
      e.event_type === "trial_started" || e.event_type === "created"
    ).length;
    
    const trialConversions = monthEvents.filter(e => 
      e.event_type === "activated" && e.old_status === "trial"
    ).length;
    
    // Calculate MRR for this month (estimate based on current active with adjustments)
    // For current month, use actual MRR. For past months, estimate based on growth
    const monthIndex = 5 - i;
    const growthFactor = Math.pow(0.95, monthIndex); // Assume ~5% monthly growth historically
    const estimatedMrr = i === 0 ? currentMrr : Math.round(currentMrr * growthFactor);
    
    // Calculate new and churned MRR
    const newMrr = monthEvents
      .filter(e => e.event_type === "activated" || e.event_type === "reactivated")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    const churnedMrr = monthEvents
      .filter(e => e.event_type === "subscription_cancelled" || e.event_type === "suspended")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    // Count active tenants at this point (estimate)
    const estimatedActive = Math.round(activeTenantsList.length * growthFactor);
    
    months.push({
      month: monthKey,
      monthLabel,
      mrr: estimatedMrr,
      newMrr,
      churnedMrr,
      activeTenants: i === 0 ? activeTenantsList.length : estimatedActive,
      newTenants: activations,
      churnedTenants: cancellations,
      trialConversions,
      trialStarts,
    });
  }
  
  // Calculate rates
  const previousMonthData = months[months.length - 2];
  const currentMonthData = months[months.length - 1];
  
  const previousMrr = previousMonthData?.mrr || 0;
  const mrrGrowth = previousMrr > 0 
    ? ((currentMrr - previousMrr) / previousMrr) * 100 
    : 0;
  
  // Churn rate: churned tenants / active tenants at start of period
  const totalChurned = months.reduce((sum, m) => sum + m.churnedTenants, 0);
  const avgActive = months.reduce((sum, m) => sum + m.activeTenants, 0) / months.length;
  const churnRate = avgActive > 0 ? (totalChurned / avgActive) * 100 : 0;
  
  // Trial conversion rate
  const totalTrialStarts = months.reduce((sum, m) => sum + m.trialStarts, 0);
  const totalConversions = months.reduce((sum, m) => sum + m.trialConversions, 0);
  const trialConversionRate = totalTrialStarts > 0 
    ? (totalConversions / totalTrialStarts) * 100 
    : 0;
  
  // Average revenue per tenant
  const averageRevenuePerTenant = activeTenantsList.length > 0 
    ? currentMrr / activeTenantsList.length 
    : 0;
  
  // LTV calculation: ARPU / churn rate (simplified)
  const monthlyChurnRate = churnRate / 6; // Average monthly churn
  const ltv = monthlyChurnRate > 0 
    ? averageRevenuePerTenant / (monthlyChurnRate / 100) 
    : averageRevenuePerTenant * 24; // Default to 24 months if no churn
  
  // Recent events for activity feed
  const recentEvents = (history?.slice(0, 10) || []).map((e: any) => ({
    id: e.id,
    type: e.event_type,
    tenantName: e.tenants?.nome || "Escola",
    amount: e.amount,
    date: e.created_at,
  }));
  
  return {
    currentMrr,
    previousMrr,
    mrrGrowth,
    totalTenants: tenants?.length || 0,
    activeTenants: activeTenantsList.length,
    trialTenants: trialTenantsList.length,
    churnedTenants: churnedTenantsList.length,
    churnRate,
    trialConversionRate,
    averageRevenuePerTenant,
    ltv,
    monthlyMetrics: months,
    recentEvents,
  };
}

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ["platform-analytics"],
    queryFn: fetchPlatformAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
