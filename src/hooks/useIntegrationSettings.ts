import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface WebhookEvents {
  PAYMENT_CREATED: boolean;
  PAYMENT_RECEIVED: boolean;
  PAYMENT_CONFIRMED: boolean;
  PAYMENT_OVERDUE: boolean;
  PAYMENT_REFUNDED: boolean;
  PAYMENT_DELETED: boolean;
  [key: string]: boolean;
}

export interface SecuritySettings {
  validate_webhook_token: boolean;
  rate_limiting: boolean;
  audit_logs: boolean;
  [key: string]: boolean;
}

export interface IntegrationSetting {
  id: string;
  setting_key: string;
  setting_value: Json;
  description: string | null;
  updated_at: string;
}

export function useIntegrationSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ["integration-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("*");

      if (error) throw error;

      // Convert array to object keyed by setting_key
      const settingsMap: Record<string, IntegrationSetting> = {};
      (data || []).forEach((setting) => {
        settingsMap[setting.setting_key] = setting as IntegrationSetting;
      });

      return settingsMap;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({
      settingKey,
      settingValue,
    }: {
      settingKey: string;
      settingValue: Json;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("integration_settings")
        .update({
          setting_value: settingValue,
          updated_by: user?.user?.id,
        })
        .eq("setting_key", settingKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  const getWebhookEvents = (): WebhookEvents => {
    const defaultEvents: WebhookEvents = {
      PAYMENT_CREATED: true,
      PAYMENT_RECEIVED: true,
      PAYMENT_CONFIRMED: true,
      PAYMENT_OVERDUE: true,
      PAYMENT_REFUNDED: false,
      PAYMENT_DELETED: false,
    };
    
    if (!settings?.webhook_events?.setting_value) return defaultEvents;
    const value = settings.webhook_events.setting_value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return { ...defaultEvents, ...(value as unknown as WebhookEvents) };
    }
    return defaultEvents;
  };

  const getSecuritySettings = (): SecuritySettings => {
    const defaultSettings: SecuritySettings = {
      validate_webhook_token: true,
      rate_limiting: true,
      audit_logs: true,
    };
    
    if (!settings?.security_settings?.setting_value) return defaultSettings;
    const value = settings.security_settings.setting_value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return { ...defaultSettings, ...(value as unknown as SecuritySettings) };
    }
    return defaultSettings;
  };

  const updateWebhookEvents = (events: WebhookEvents) => {
    return updateSettingMutation.mutateAsync({
      settingKey: "webhook_events",
      settingValue: events as unknown as Json,
    });
  };

  const updateSecuritySettings = (securitySettings: SecuritySettings) => {
    return updateSettingMutation.mutateAsync({
      settingKey: "security_settings",
      settingValue: securitySettings as unknown as Json,
    });
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    getWebhookEvents,
    getSecuritySettings,
    updateWebhookEvents,
    updateSecuritySettings,
    isSaving: updateSettingMutation.isPending,
  };
}
