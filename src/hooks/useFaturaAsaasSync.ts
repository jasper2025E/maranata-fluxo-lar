import { supabase } from "@/integrations/supabase/client";

export interface AsaasSyncResult {
  success: boolean;
  faturaId?: string;
  asaasPaymentId?: string;
  pixQrCode?: string;
  boletoBarcode?: string;
  error?: string;
}

export interface FaturaCreateData {
  aluno_id: string;
  curso_id: string;
  responsavel_id?: string;
  valor: number;
  data_vencimento: string;
  mes_referencia: number;
  ano_referencia: number;
}

export interface SyncProgress {
  step: 'validating' | 'creating_asaas' | 'fetching_pix' | 'fetching_boleto' | 'saving' | 'done' | 'error';
  message: string;
  progress: number;
  currentIndex?: number;
  totalCount?: number;
}

/**
 * Valida se o responsável tem dados válidos para criar cobrança no ASAAS
 */
export async function validateResponsavelForAsaas(responsavelId: string): Promise<{ valid: boolean; error?: string; responsavel?: any }> {
  const { data: responsavel, error } = await supabase
    .from("responsaveis")
    .select("id, nome, cpf, email, telefone, asaas_customer_id")
    .eq("id", responsavelId)
    .maybeSingle();

  if (error || !responsavel) {
    return { valid: false, error: "Responsável não encontrado" };
  }

  const cpf = responsavel.cpf?.replace(/\D/g, '') || '';
  if (!cpf || (cpf.length !== 11 && cpf.length !== 14)) {
    return { valid: false, error: `Responsável "${responsavel.nome}" não tem CPF/CNPJ válido` };
  }

  return { valid: true, responsavel };
}

/**
 * Cria cobrança no ASAAS e aguarda PIX + Boleto estarem prontos
 * Retorna os dados completos ou falha
 */
export async function createAsaasPaymentWithFullSync(
  faturaId: string,
  maxRetries = 5,
  onProgress?: (step: string) => void
): Promise<AsaasSyncResult> {
  // 1. Criar cobrança no ASAAS
  onProgress?.("Criando cobrança no ASAAS...");
  
  const { data: createResult, error: createError } = await supabase.functions.invoke("asaas-create-payment", {
    body: { faturaId, billingType: "BOLETO" },
  });

  if (createError || !createResult?.success) {
    return {
      success: false,
      error: createResult?.error || createError?.message || "Erro ao criar cobrança no ASAAS",
    };
  }

  // 2. Fazer polling até ter PIX + Boleto completos
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    onProgress?.(`Buscando dados de pagamento... (${attempt}/${maxRetries})`);
    
    const { data: paymentData, error: getError } = await supabase.functions.invoke("asaas-get-payment", {
      body: { faturaId },
    });

    if (getError) {
      console.warn(`Tentativa ${attempt}/${maxRetries} - Erro ao buscar payment:`, getError);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        continue;
      }
      return { success: false, error: "Timeout ao buscar dados do pagamento" };
    }

    if (paymentData?.pixQrCode && paymentData?.boletoBarcode) {
      return {
        success: true,
        faturaId,
        asaasPaymentId: paymentData.payment?.id,
        pixQrCode: paymentData.pixQrCode,
        boletoBarcode: paymentData.boletoBarcode,
      };
    }

    // Aguardar antes da próxima tentativa (backoff exponencial)
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }

  return {
    success: false,
    error: "PIX/Boleto não ficaram prontos após várias tentativas",
  };
}

/**
 * Fluxo completo: ASAAS primeiro, banco depois
 * Se ASAAS falhar, NÃO salva a fatura
 */
export async function createFaturaWithAsaasSync(
  data: FaturaCreateData,
  onProgress?: (progress: SyncProgress) => void
): Promise<AsaasSyncResult> {
  const { aluno_id, curso_id, responsavel_id, valor, data_vencimento, mes_referencia, ano_referencia } = data;

  try {
    // Step 1: Validar responsável
    onProgress?.({ step: 'validating', message: 'Validando responsável...', progress: 10 });
    
    if (!responsavel_id) {
      return { success: false, error: "Aluno sem responsável vinculado. Não é possível criar cobrança no ASAAS." };
    }

    const validation = await validateResponsavelForAsaas(responsavel_id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Step 2: Criar fatura temporária no banco (necessário para ASAAS)
    onProgress?.({ step: 'saving', message: 'Preparando fatura...', progress: 20 });
    
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .insert({
        aluno_id,
        curso_id,
        responsavel_id,
        valor,
        valor_original: valor,
        valor_bruto: valor,
        data_vencimento,
        mes_referencia,
        ano_referencia,
        status: 'Aberta',
      })
      .select()
      .single();

    if (faturaError || !fatura) {
      return { success: false, error: faturaError?.message || "Erro ao criar fatura" };
    }

    // Step 3: Criar cobrança no ASAAS e aguardar dados completos
    onProgress?.({ step: 'creating_asaas', message: 'Criando cobrança no ASAAS...', progress: 40 });
    
    const asaasResult = await createAsaasPaymentWithFullSync(fatura.id, 5, (step) => {
      onProgress?.({ 
        step: step.includes('PIX') ? 'fetching_pix' : step.includes('Boleto') ? 'fetching_boleto' : 'creating_asaas',
        message: step,
        progress: 60,
      });
    });

    if (!asaasResult.success) {
      // ROLLBACK: Deletar a fatura criada
      onProgress?.({ step: 'error', message: 'Revertendo...', progress: 0 });
      
      await supabase.from("faturas").delete().eq("id", fatura.id);
      
      return {
        success: false,
        error: `Falha na sincronização ASAAS: ${asaasResult.error}. A fatura NÃO foi criada.`,
      };
    }

    // Step 4: Verificar se os dados estão no banco
    onProgress?.({ step: 'done', message: 'Fatura criada e sincronizada!', progress: 100 });
    
    return {
      success: true,
      faturaId: fatura.id,
      asaasPaymentId: asaasResult.asaasPaymentId,
      pixQrCode: asaasResult.pixQrCode,
      boletoBarcode: asaasResult.boletoBarcode,
    };

  } catch (error: any) {
    return { success: false, error: error.message || "Erro inesperado" };
  }
}

/**
 * Cria múltiplas faturas com sincronização ASAAS obrigatória
 * Para: se uma falhar, retorna quantas foram criadas com sucesso
 */
export async function createMultipleFaturasWithAsaasSync(
  dataList: FaturaCreateData[],
  onProgress?: (progress: SyncProgress) => void
): Promise<{ successCount: number; failedAt?: number; error?: string; createdIds: string[] }> {
  const createdIds: string[] = [];

  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i];
    
    onProgress?.({
      step: 'creating_asaas',
      message: `Criando fatura ${i + 1} de ${dataList.length}...`,
      progress: ((i) / dataList.length) * 100,
      currentIndex: i + 1,
      totalCount: dataList.length,
    });

    const result = await createFaturaWithAsaasSync(data, (innerProgress) => {
      onProgress?.({
        ...innerProgress,
        currentIndex: i + 1,
        totalCount: dataList.length,
        message: `Fatura ${i + 1}/${dataList.length}: ${innerProgress.message}`,
      });
    });

    if (!result.success) {
      return {
        successCount: i,
        failedAt: i + 1,
        error: result.error,
        createdIds,
      };
    }

    if (result.faturaId) {
      createdIds.push(result.faturaId);
    }

    // Pequeno delay entre faturas para não sobrecarregar API
    if (i < dataList.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  onProgress?.({
    step: 'done',
    message: `${dataList.length} faturas criadas com sucesso!`,
    progress: 100,
    currentIndex: dataList.length,
    totalCount: dataList.length,
  });

  return {
    successCount: dataList.length,
    createdIds,
  };
}

/**
 * Verifica se uma fatura tem dados ASAAS completos (PIX + Boleto)
 */
export function isFaturaAsaasComplete(fatura: { 
  asaas_payment_id?: string | null; 
  asaas_pix_qrcode?: string | null; 
  asaas_boleto_barcode?: string | null;
}): boolean {
  return !!(
    fatura.asaas_payment_id && 
    fatura.asaas_pix_qrcode && 
    fatura.asaas_boleto_barcode
  );
}

/**
 * Tenta sincronizar dados ASAAS faltantes de uma fatura
 */
export async function syncFaturaAsaasData(faturaId: string): Promise<AsaasSyncResult> {
  try {
    const { data, error } = await supabase.functions.invoke("asaas-get-payment", {
      body: { faturaId },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.pixQrCode && data?.boletoBarcode) {
      return {
        success: true,
        faturaId,
        pixQrCode: data.pixQrCode,
        boletoBarcode: data.boletoBarcode,
      };
    }

    return { success: false, error: "Dados de pagamento ainda não disponíveis" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
