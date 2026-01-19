import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AsaasPaymentResult {
  success: boolean;
  payment?: any;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixPayload?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  error?: string;
  message?: string;
}

export const useAsaas = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createPayment = async (faturaId: string, billingType: string = "UNDEFINED"): Promise<AsaasPaymentResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-create-payment", {
        body: { faturaId, billingType },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message || "Cobrança criada no Asaas!");
      } else {
        toast.error(data.error || "Erro ao criar cobrança");
      }

      return data;
    } catch (error: any) {
      console.error("Erro ao criar pagamento Asaas:", error);
      toast.error(error.message || "Erro ao criar cobrança no Asaas");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getPayment = async (faturaId: string): Promise<AsaasPaymentResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-get-payment", {
        body: { faturaId },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Erro ao buscar pagamento Asaas:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPayment = async (faturaId: string, motivo?: string): Promise<AsaasPaymentResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-cancel-payment", {
        body: { faturaId, motivo },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success("Cobrança cancelada com sucesso");
      } else {
        toast.error(data.error || "Erro ao cancelar cobrança");
      }

      return data;
    } catch (error: any) {
      console.error("Erro ao cancelar pagamento Asaas:", error);
      toast.error(error.message || "Erro ao cancelar cobrança");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomer = async (responsavelId: string): Promise<{ success: boolean; customerId?: string; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-create-customer", {
        body: { responsavelId },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Erro ao criar cliente Asaas:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createPayment,
    getPayment,
    cancelPayment,
    createCustomer,
  };
};
