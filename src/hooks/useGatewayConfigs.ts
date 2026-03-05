import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type GatewayType = "asaas" | "mercado_pago" | "stripe" | "pagarme" | "gerencianet" | "pix_banco" | "custom_api";
export type PaymentMethodType = "pix" | "boleto" | "credit_card" | "debit_card" | "bank_transfer";
export type GatewayEnvironment = "sandbox" | "production";

export interface GatewaySecret {
  key_name: string;
  masked_value: string;
  last_rotated: string;
}

export interface GatewayConfig {
  id: string;
  tenant_id: string;
  gateway_type: GatewayType;
  display_name: string;
  environment: GatewayEnvironment;
  is_active: boolean;
  is_default: boolean;
  allowed_methods: PaymentMethodType[];
  webhook_url: string | null;
  webhook_token: string | null;
  currency: string;
  settings: Record<string, unknown>;
  last_connection_test: string | null;
  connection_status: string;
  connection_error: string | null;
  created_at: string;
  updated_at: string;
  secrets: GatewaySecret[];
}

export interface GatewayCreateData {
  gateway_type: GatewayType;
  display_name: string;
  environment?: GatewayEnvironment;
  is_default?: boolean;
  allowed_methods?: PaymentMethodType[];
  currency?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  environment: string;
}

// Gateway logo SVGs as data URIs (inline, no external dependencies)
const GATEWAY_LOGOS = {
  asaas: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%230052CC"/><text x="20" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="white">A</text></svg>')}`,
  mercado_pago: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%2300B1EA"/><text x="20" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="white">MP</text></svg>')}`,
  stripe: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%23635BFF"/><text x="20" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="white">S</text></svg>')}`,
  pagarme: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%2365A300"/><text x="20" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="white">P</text></svg>')}`,
  gerencianet: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%23F37021"/><text x="20" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="14" fill="white">Efí</text></svg>')}`,
  pix_banco: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%2332BCAD"/><text x="20" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="12" fill="white">PIX</text></svg>')}`,
  custom_api: "",
};

// Gateway metadata for UI
export const GATEWAY_INFO: Record<GatewayType, {
  name: string;
  description: string;
  logo: string;
  requiredSecrets: { key: string; label: string; placeholder: string }[];
  supportedMethods: PaymentMethodType[];
}> = {
  asaas: {
    name: "Asaas",
    description: "PIX, Boleto e Cartão de Crédito",
    logo: GATEWAY_LOGOS.asaas,
    requiredSecrets: [
      { key: "api_key", label: "API Key", placeholder: "$aact_..." },
    ],
    supportedMethods: ["pix", "boleto", "credit_card"],
  },
  mercado_pago: {
    name: "Mercado Pago",
    description: "PIX, Boleto e Cartão",
    logo: GATEWAY_LOGOS.mercado_pago,
    requiredSecrets: [
      { key: "access_token", label: "Access Token", placeholder: "APP_USR-..." },
      { key: "public_key", label: "Public Key", placeholder: "APP_USR-..." },
    ],
    supportedMethods: ["pix", "boleto", "credit_card", "debit_card"],
  },
  stripe: {
    name: "Stripe",
    description: "Pagamentos Internacionais",
    logo: GATEWAY_LOGOS.stripe,
    requiredSecrets: [
      { key: "secret_key", label: "Secret Key", placeholder: "sk_..." },
      { key: "publishable_key", label: "Publishable Key", placeholder: "pk_..." },
    ],
    supportedMethods: ["credit_card", "debit_card"],
  },
  pagarme: {
    name: "Pagar.me",
    description: "Gateway Nacional",
    logo: GATEWAY_LOGOS.pagarme,
    requiredSecrets: [
      { key: "api_key", label: "API Key", placeholder: "ak_..." },
    ],
    supportedMethods: ["pix", "boleto", "credit_card"],
  },
  gerencianet: {
    name: "Gerencianet (Efí)",
    description: "PIX e Boleto",
    logo: GATEWAY_LOGOS.gerencianet,
    requiredSecrets: [
      { key: "client_id", label: "Client ID", placeholder: "Client_Id_..." },
      { key: "client_secret", label: "Client Secret", placeholder: "Client_Secret_..." },
    ],
    supportedMethods: ["pix", "boleto"],
  },
  pix_banco: {
    name: "PIX Banco",
    description: "PIX via API do Banco",
    logo: GATEWAY_LOGOS.pix_banco,
    requiredSecrets: [
      { key: "api_key", label: "API Key", placeholder: "" },
      { key: "pix_key", label: "Chave PIX", placeholder: "" },
    ],
    supportedMethods: ["pix"],
  },
  custom_api: {
    name: "API Customizada",
    description: "Integração REST personalizada",
    logo: GATEWAY_LOGOS.custom_api,
    requiredSecrets: [
      { key: "api_url", label: "URL da API", placeholder: "https://..." },
      { key: "api_key", label: "API Key", placeholder: "" },
    ],
    supportedMethods: ["pix", "boleto", "credit_card"],
  },
};

export function useGatewayConfigs(tenantId?: string) {
  const queryClient = useQueryClient();

  const { data: configs, isLoading, error, refetch } = useQuery({
    queryKey: ["gateway-configs", tenantId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("gateway-config", {
        body: { action: "list", tenantId },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      return response.data.configs as GatewayConfig[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (data: GatewayCreateData) => {
      const response = await supabase.functions.invoke("gateway-config", {
        body: { action: "create", data, tenantId },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      return response.data.config as GatewayConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-configs"] });
      toast.success("Gateway adicionado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar gateway: ${error.message}`);
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ configId, data }: { configId: string; data: Partial<GatewayCreateData> & { is_active?: boolean } }) => {
      const response = await supabase.functions.invoke("gateway-config", {
        body: { action: "update", configId, data },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      return response.data.config as GatewayConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-configs"] });
      toast.success("Gateway atualizado");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (configId: string) => {
      const response = await supabase.functions.invoke("gateway-config", {
        body: { action: "delete", configId },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gateway-configs"] });
      toast.success(data.message || "Gateway removido");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const setSecret = useMutation({
    mutationFn: async ({ configId, keyName, value }: { configId: string; keyName: string; value: string }) => {
      const response = await supabase.functions.invoke("gateway-config", {
        body: { 
          action: "set_secret", 
          configId, 
          secret: { key_name: keyName, value } 
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-configs"] });
      toast.success("Credencial salva com segurança");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar credencial: ${error.message}`);
    },
  });

  const testConnection = useMutation({
    mutationFn: async (configId: string) => {
      const response = await supabase.functions.invoke("gateway-config", {
        body: { action: "test", configId },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      return response.data.result as TestResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["gateway-configs"] });
      if (result.success) {
        toast.success(`Conexão OK! ${result.message} (${result.environment})`);
      } else {
        toast.error(`Falha na conexão: ${result.message}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao testar: ${error.message}`);
    },
  });

  return {
    configs: configs || [],
    isLoading,
    error,
    refetch,
    createConfig: createConfig.mutateAsync,
    updateConfig: updateConfig.mutateAsync,
    deleteConfig: deleteConfig.mutateAsync,
    setSecret: setSecret.mutateAsync,
    testConnection: testConnection.mutateAsync,
    isCreating: createConfig.isPending,
    isUpdating: updateConfig.isPending,
    isDeleting: deleteConfig.isPending,
    isTesting: testConnection.isPending,
  };
}
