import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SecretInfo {
  configured: boolean;
  maskedValue: string;
  prefix: string;
}

interface SecretsData {
  ASAAS_API_KEY: SecretInfo;
  STRIPE_SECRET_KEY: SecretInfo;
  STRIPE_PUBLIC_KEY: SecretInfo;
  STRIPE_WEBHOOK_SECRET: SecretInfo;
  ASAAS_WEBHOOK_TOKEN: SecretInfo;
  RESEND_API_KEY: SecretInfo;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  environment?: string;
  balance?: number;
  currency?: string;
}

export function useSecrets() {
  const queryClient = useQueryClient();

  const { data: secrets, isLoading, error, refetch } = useQuery({
    queryKey: ["secrets"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("manage-secrets", {
        body: { action: "list" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.secrets as SecretsData;
    },
    retry: false,
  });

  const testConnection = useMutation({
    mutationFn: async (secretName: string): Promise<TestResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("manage-secrets", {
        body: { action: "test", secretName },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data as TestResult;
    },
  });

  return {
    secrets,
    isLoading,
    error,
    refetch,
    testConnection: testConnection.mutateAsync,
    isTestingConnection: testConnection.isPending,
  };
}
