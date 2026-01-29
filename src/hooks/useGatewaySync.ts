import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GatewayInfo {
  id: string;
  gatewayType: string;
  environment: "sandbox" | "production";
  isActive: boolean;
  isDefault: boolean;
  displayName: string;
}

export interface GatewaySyncResult {
  success: boolean;
  gatewayType?: string;
  paymentId?: string;
  pixQrCode?: string;
  boletoBarcode?: string;
  paymentUrl?: string;
  error?: string;
}

export interface SyncProgress {
  step: 'validating' | 'syncing' | 'done' | 'error';
  message: string;
  progress: number;
  currentIndex?: number;
  totalCount?: number;
}

/**
 * Hook para sincronização dinâmica com o gateway padrão configurado
 * Abstrai a lógica de detecção e comunicação com qualquer gateway
 */
export function useGatewaySync() {
  const [isSyncing, setIsSyncing] = useState(false);

  // Query para buscar o gateway padrão do tenant
  const { data: defaultGateway, isLoading: isLoadingGateway, refetch: refetchGateway } = useQuery({
    queryKey: ["default-gateway"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_gateway_configs")
        .select("id, gateway_type, environment, is_active, is_default")
        .eq("is_active", true)
        .eq("is_default", true)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar gateway padrão:", error);
        return null;
      }

      if (!data) {
        // Tenta buscar qualquer gateway ativo
        const { data: anyGateway } = await supabase
          .from("tenant_gateway_configs")
          .select("id, gateway_type, environment, is_active, is_default")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (anyGateway) {
          return {
            id: anyGateway.id,
            gatewayType: anyGateway.gateway_type,
            environment: anyGateway.environment as "sandbox" | "production",
            isActive: anyGateway.is_active,
            isDefault: anyGateway.is_default,
            displayName: getGatewayDisplayName(anyGateway.gateway_type),
          } as GatewayInfo;
        }
        return null;
      }

      return {
        id: data.id,
        gatewayType: data.gateway_type,
        environment: data.environment as "sandbox" | "production",
        isActive: data.is_active,
        isDefault: data.is_default,
        displayName: getGatewayDisplayName(data.gateway_type),
      } as GatewayInfo;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  /**
   * Sincroniza uma única fatura com o gateway padrão
   */
  const syncFatura = async (
    faturaId: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<GatewaySyncResult> => {
    onProgress?.({ step: 'syncing', message: 'Sincronizando com gateway...', progress: 10 });

    try {
      const { data, error } = await supabase.functions.invoke("gateway-sync-payment", {
        body: { faturaId, action: "sync" },
      });

      if (error) {
        onProgress?.({ step: 'error', message: error.message, progress: 0 });
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        onProgress?.({ step: 'error', message: data?.error || 'Erro desconhecido', progress: 0 });
        return { success: false, error: data?.error };
      }

      onProgress?.({ step: 'done', message: 'Sincronizado com sucesso!', progress: 100 });
      
      return {
        success: true,
        gatewayType: data.gatewayType,
        paymentId: data.paymentId,
        pixQrCode: data.pixQrCode,
        boletoBarcode: data.boletoBarcode,
        paymentUrl: data.paymentUrl,
      };
    } catch (err: any) {
      onProgress?.({ step: 'error', message: err.message, progress: 0 });
      return { success: false, error: err.message };
    }
  };

  /**
   * Sincroniza múltiplas faturas em lote - OTIMIZADO
   * Usa batch processing com paralelização controlada
   */
  const syncMultipleFaturas = async (
    faturaIds: string[],
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{ successCount: number; failedCount: number; results: GatewaySyncResult[] }> => {
    setIsSyncing(true);
    const results: GatewaySyncResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Processar em batches de 3 para não sobrecarregar API mas manter velocidade
    const batchSize = 3;
    
    for (let i = 0; i < faturaIds.length; i += batchSize) {
      const batch = faturaIds.slice(i, i + batchSize);
      
      onProgress?.({
        step: 'syncing',
        message: `Sincronizando ${i + 1} a ${Math.min(i + batchSize, faturaIds.length)} de ${faturaIds.length}...`,
        progress: (i / faturaIds.length) * 100,
        currentIndex: i + 1,
        totalCount: faturaIds.length,
      });

      // Processar batch em paralelo
      const batchResults = await Promise.all(
        batch.map(faturaId => syncFatura(faturaId))
      );

      batchResults.forEach(result => {
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      });

      // Delay curto entre batches (apenas se há mais)
      if (i + batchSize < faturaIds.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    onProgress?.({
      step: 'done',
      message: `${successCount} sincronizada(s), ${failedCount} com erro`,
      progress: 100,
      currentIndex: faturaIds.length,
      totalCount: faturaIds.length,
    });

    setIsSyncing(false);
    return { successCount, failedCount, results };
  };

  /**
   * Cria uma nova cobrança no gateway padrão
   */
  const createPayment = async (
    faturaId: string,
    billingType: string = "BOLETO"
  ): Promise<GatewaySyncResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("gateway-sync-payment", {
        body: { faturaId, action: "create", billingType },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return { success: false, error: data?.error };
      }

      return {
        success: true,
        gatewayType: data.gatewayType,
        paymentId: data.paymentId,
        pixQrCode: data.pixQrCode,
        boletoBarcode: data.boletoBarcode,
        paymentUrl: data.paymentUrl,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Busca dados de pagamento de uma fatura
   */
  const getPaymentData = async (faturaId: string): Promise<GatewaySyncResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("gateway-sync-payment", {
        body: { faturaId, action: "get" },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return { success: false, error: data?.error };
      }

      return {
        success: true,
        gatewayType: data.gatewayType,
        paymentId: data.paymentId,
        pixQrCode: data.pixQrCode,
        boletoBarcode: data.boletoBarcode,
        paymentUrl: data.paymentUrl,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    // Estado
    defaultGateway,
    isLoadingGateway,
    isSyncing,
    isGatewayConfigured: !!defaultGateway,
    
    // Ações
    syncFatura,
    syncMultipleFaturas,
    createPayment,
    getPaymentData,
    refetchGateway,
  };
}

/**
 * Retorna o nome amigável do gateway
 */
function getGatewayDisplayName(gatewayType: string): string {
  const names: Record<string, string> = {
    asaas: "Asaas",
    mercado_pago: "Mercado Pago",
    stripe: "Stripe",
    pagseguro: "PagSeguro",
    pagarme: "Pagar.me",
    cielo: "Cielo",
  };
  return names[gatewayType] || gatewayType;
}
