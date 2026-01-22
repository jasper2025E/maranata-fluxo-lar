import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApiRequestLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  duration_ms: number | null;
  request_body: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string | null;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  error_message: string | null;
  processing_time_ms: number | null;
  ip_address: string | null;
  created_at: string;
}

interface LogsFilters {
  search?: string;
  source?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useWebhookLogs(filters: LogsFilters = {}) {
  return useQuery({
    queryKey: ["webhook-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit || 100);

      if (filters.source) {
        query = query.eq("source", filters.source);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      if (filters.search) {
        query = query.or(
          `event_type.ilike.%${filters.search}%,source.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WebhookLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useApiRequestLogs(filters: LogsFilters = {}) {
  return useQuery({
    queryKey: ["api-request-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("api_request_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit || 100);

      if (filters.status) {
        const statusCode = parseInt(filters.status);
        if (!isNaN(statusCode)) {
          query = query.eq("status_code", statusCode);
        }
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      if (filters.search) {
        query = query.or(
          `endpoint.ilike.%${filters.search}%,method.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ApiRequestLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
