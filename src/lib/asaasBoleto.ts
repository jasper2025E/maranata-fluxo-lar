import { supabase } from "@/integrations/supabase/client";

export type AsaasBoletoWaitProgress = {
  attempt: number;
  total: number;
  delayMs: number;
  message: string;
};

function digits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Regras de prontidão (sem cálculo local):
 * - Linha digitável: `identificationField` (47 dígitos)
 * - Código de barras: `barCode` (44 dígitos)
 */
export function isAsaasBoletoReady(fields: {
  boletoBarcode?: string | null;
  boletoBarCode?: string | null;
  status?: string | null;
}): boolean {
  return digits(fields.boletoBarcode).length === 47 && digits(fields.boletoBarCode).length === 44;
}

export async function waitForAsaasBoletoReady(
  faturaId: string,
  opts?: {
    delaysMs?: number[];
    onProgress?: (p: AsaasBoletoWaitProgress) => void;
  }
): Promise<{
  success: boolean;
  boletoBarcode?: string;
  boletoBarCode?: string;
  payment?: any;
  error?: string;
}> {
  const delaysMs = opts?.delaysMs ?? [0, 5000, 10000, 30000];

  let lastData: any = null;
  let lastError: any = null;

  for (let i = 0; i < delaysMs.length; i++) {
    const delayMs = delaysMs[i];
    const attempt = i + 1;

    if (delayMs > 0) {
      opts?.onProgress?.({
        attempt,
        total: delaysMs.length,
        delayMs,
        message: `Aguardando registro bancário (tentativa ${attempt}/${delaysMs.length})...`,
      });
      await new Promise((r) => setTimeout(r, delayMs));
    }

    opts?.onProgress?.({
      attempt,
      total: delaysMs.length,
      delayMs: 0,
      message: `Sincronizando boleto no ASAAS (tentativa ${attempt}/${delaysMs.length})...`,
    });

    const { data, error } = await supabase.functions.invoke("asaas-get-payment", {
      body: { faturaId },
    });

    if (error) {
      lastError = error;
      continue;
    }

    lastData = data;

    if (
      data?.success &&
      isAsaasBoletoReady({
        boletoBarcode: data?.boletoBarcode,
        boletoBarCode: data?.boletoBarCode,
        status: data?.payment?.status,
      })
    ) {
      return {
        success: true,
        boletoBarcode: data?.boletoBarcode,
        boletoBarCode: data?.boletoBarCode,
        payment: data?.payment,
      };
    }
  }

  return {
    success: false,
    boletoBarcode: lastData?.boletoBarcode,
    boletoBarCode: lastData?.boletoBarCode,
    payment: lastData?.payment,
    error: lastData?.error || lastError?.message || "Boleto ainda não está pronto (linha digitável/código de barras não disponíveis).",
  };
}
