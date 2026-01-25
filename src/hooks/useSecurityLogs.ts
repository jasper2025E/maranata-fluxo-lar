import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subHours } from "date-fns";

export interface SecurityAccessLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  tenant_id: string | null;
  user_tenant_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  operation: string;
  status: string;
  is_cross_tenant_attempt: boolean;
  is_platform_admin: boolean;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  user_id: string | null;
  tenant_id: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface RLSPolicyInfo {
  table_name: string;
  policy_name: string;
  policy_type: string;
  has_tenant_isolation: boolean;
}

interface SecurityFilters {
  timeRange?: "1h" | "24h" | "7d" | "30d";
  status?: "all" | "allowed" | "denied";
  crossTenantOnly?: boolean;
  limit?: number;
}

export function useSecurityAccessLogs(filters: SecurityFilters = {}) {
  return useQuery({
    queryKey: ["security-access-logs", filters],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (filters.timeRange) {
        case "1h":
          startDate = subHours(now, 1);
          break;
        case "7d":
          startDate = subDays(now, 7);
          break;
        case "30d":
          startDate = subDays(now, 30);
          break;
        case "24h":
        default:
          startDate = subDays(now, 1);
          break;
      }

      let query = supabase
        .from("security_access_logs")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(filters.limit || 100);

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.crossTenantOnly) {
        query = query.eq("is_cross_tenant_attempt", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SecurityAccessLog[];
    },
    refetchInterval: 30000,
  });
}

export function useSecurityAlerts(unresolvedOnly = true) {
  return useQuery({
    queryKey: ["security-alerts", unresolvedOnly],
    queryFn: async () => {
      let query = supabase
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (unresolvedOnly) {
        query = query.is("resolved_at", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SecurityAlert[];
    },
    refetchInterval: 30000,
  });
}

export function useSecurityMetrics(timeRange: "1h" | "24h" | "7d" | "30d" = "24h") {
  return useQuery({
    queryKey: ["security-metrics", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case "1h":
          startDate = subHours(now, 1);
          break;
        case "7d":
          startDate = subDays(now, 7);
          break;
        case "30d":
          startDate = subDays(now, 30);
          break;
        case "24h":
        default:
          startDate = subDays(now, 1);
          break;
      }

      const { data: logs, error } = await supabase
        .from("security_access_logs")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const logsData = logs || [];

      return {
        totalRequests: logsData.length,
        allowedRequests: logsData.filter((l) => l.status === "allowed").length,
        deniedRequests: logsData.filter((l) => l.status === "denied").length,
        crossTenantAttempts: logsData.filter((l) => l.is_cross_tenant_attempt).length,
        uniqueUsers: new Set(logsData.map((l) => l.user_id).filter(Boolean)).size,
        uniqueTenants: new Set(logsData.map((l) => l.tenant_id).filter(Boolean)).size,
        byOperation: {
          SELECT: logsData.filter((l) => l.operation === "SELECT").length,
          INSERT: logsData.filter((l) => l.operation === "INSERT").length,
          UPDATE: logsData.filter((l) => l.operation === "UPDATE").length,
          DELETE: logsData.filter((l) => l.operation === "DELETE").length,
        },
        byResourceType: logsData.reduce((acc, log) => {
          acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
    refetchInterval: 30000,
  });
}

export function useResolveSecurityAlert() {
  const resolveAlert = async (alertId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("security_alerts")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.user.id,
      })
      .eq("id", alertId);

    if (error) throw error;
  };

  return { resolveAlert };
}
