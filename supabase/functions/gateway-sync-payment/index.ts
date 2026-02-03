import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getDefaultTenantGateway, 
  getTenantGatewayCredentials,
  logGatewayTransaction,
  GatewayCredentials 
} from "../_shared/gateway-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  faturaId: string;
  action: "sync" | "create" | "get" | "cancel";
  billingType?: string;
}

interface SyncResponse {
  success: boolean;
  gatewayType?: string;
  paymentId?: string;
  pixQrCode?: string;
  boletoBarcode?: string;
  paymentUrl?: string;
  invoiceUrl?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let supabase: SupabaseClient | null = null;
  let tenantId: string | null = null;
  let faturaId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autenticação não fornecido");
    }

    // Verify user and get tenant
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error("Tenant não encontrado para este usuário");
    }
    tenantId = profile.tenant_id;

    if (!tenantId) {
      throw new Error("Tenant não encontrado para este usuário");
    }

    // Parse request
    const { faturaId: reqFaturaId, action = "sync", billingType = "BOLETO" }: SyncRequest = await req.json();
    faturaId = reqFaturaId;

    if (!faturaId) {
      throw new Error("ID da fatura não fornecido");
    }

    // Get fatura with tenant validation
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        alunos:aluno_id (nome_completo, responsavel_id),
        responsaveis:responsavel_id (id, nome, cpf, email, telefone, asaas_customer_id)
      `)
      .eq("id", faturaId)
      .eq("tenant_id", tenantId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada ou acesso negado");
    }

    // Get default gateway for tenant (tenantId is guaranteed to be string here)
    const gateway = await getDefaultTenantGateway(supabase, tenantId as string);
    
    if (!gateway) {
      throw new Error("Nenhum gateway de pagamento configurado para este tenant");
    }

    console.log(`[gateway-sync-payment] Tenant: ${tenantId}, Gateway: ${gateway.gatewayType}, Action: ${action}`);

    // Route to appropriate gateway handler
    let result: SyncResponse;

    switch (gateway.gatewayType) {
      case "asaas":
        result = await handleAsaasSync(supabase, fatura, gateway, action, billingType);
        break;
      
      case "stripe":
        result = await handleStripeSync(supabase, fatura, gateway, action);
        break;
      
      case "mercado_pago":
        result = await handleMercadoPagoSync(supabase, fatura, gateway, action);
        break;
      
      default:
        throw new Error(`Gateway ${gateway.gatewayType} não suportado`);
    }

    // Log transaction
    await logGatewayTransaction(supabase, {
      tenantId: tenantId as string,
      gatewayConfigId: gateway.configId,
      gatewayType: gateway.gatewayType,
      operation: action,
      status: result.success ? "success" : "failed",
      faturaId,
      externalReference: result.paymentId,
      amount: fatura.valor,
      errorMessage: result.error,
      durationMs: Date.now() - startTime,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.success ? 200 : 400,
    });

  } catch (error: any) {
    console.error("[gateway-sync-payment] Error:", error);

    // Log error if we have context
    if (supabase && tenantId && faturaId) {
      await logGatewayTransaction(supabase, {
        tenantId,
        gatewayType: "unknown",
        operation: "sync",
        status: "failed",
        faturaId,
        errorMessage: error.message,
        durationMs: Date.now() - startTime,
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Handler para Asaas - Reutiliza lógica existente das edge functions
 */
async function handleAsaasSync(
  supabase: SupabaseClient,
  fatura: any,
  gateway: GatewayCredentials,
  action: string,
  billingType: string
): Promise<SyncResponse> {
  const apiKey = gateway.apiKey;
  const apiUrl = gateway.apiUrl;

  if (!apiKey) {
    throw new Error("Chave API do Asaas não configurada");
  }

  const responsavel = fatura.responsaveis;
  
  // Se action é GET ou SYNC e já tem payment_id, buscar dados
  if ((action === "get" || action === "sync") && fatura.asaas_payment_id) {
    return await getAsaasPaymentData(supabase, fatura, apiKey, apiUrl);
  }

  // Se action é CREATE ou não tem payment_id, criar cobrança
  if (action === "create" || !fatura.asaas_payment_id) {
    // Garantir que temos um customer
    let customerId = responsavel?.asaas_customer_id;
    
    if (!customerId && responsavel) {
      customerId = await ensureAsaasCustomer(supabase, responsavel, apiKey, apiUrl);
    }

    if (!customerId) {
      throw new Error("Responsável sem customer no Asaas");
    }

    return await createAsaasPayment(supabase, fatura, customerId, billingType, apiKey, apiUrl);
  }

  return { success: false, error: "Ação não reconhecida" };
}

async function getAsaasPaymentData(
  supabase: SupabaseClient,
  fatura: any,
  apiKey: string,
  apiUrl: string
): Promise<SyncResponse> {
  const paymentId = fatura.asaas_payment_id;

  // Buscar payment
  const paymentRes = await fetch(`${apiUrl}/payments/${paymentId}`, {
    headers: { access_token: apiKey },
  });

  if (!paymentRes.ok) {
    throw new Error("Erro ao buscar pagamento no Asaas");
  }

  const payment = await paymentRes.json();

  // =============================================
  // SYNC BIDIRECIONAL: Atualizar status local se divergente
  // =============================================
  const ASAAS_PAID_STATUSES = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'];
  const ASAAS_OVERDUE_STATUSES = ['OVERDUE', 'DUNNING_REQUESTED'];
  const ASAAS_CANCELLED_STATUSES = ['REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL'];

  let statusChanged = false;
  let newLocalStatus = fatura.status;
  const oldLocalStatus = fatura.status;

  if (payment.status !== fatura.asaas_status) {
    // Mapear status
    if (ASAAS_PAID_STATUSES.includes(payment.status) && fatura.status !== 'Paga') {
      newLocalStatus = 'Paga';
      statusChanged = true;
    } else if (ASAAS_OVERDUE_STATUSES.includes(payment.status) && fatura.status !== 'Vencida') {
      newLocalStatus = 'Vencida';
      statusChanged = true;
    } else if (ASAAS_CANCELLED_STATUSES.includes(payment.status) && fatura.status !== 'Cancelada') {
      newLocalStatus = 'Cancelada';
      statusChanged = true;
    }
  }

  // Buscar PIX QR Code
  let pixQrCode = fatura.asaas_pix_qrcode;
  if (!pixQrCode) {
    try {
      const pixRes = await fetch(`${apiUrl}/payments/${paymentId}/pixQrCode`, {
        headers: { access_token: apiKey },
      });
      if (pixRes.ok) {
        const pixData = await pixRes.json();
        pixQrCode = pixData.encodedImage;
        
        // Atualizar na fatura
        await supabase
          .from("faturas")
          .update({ 
            asaas_pix_qrcode: pixQrCode,
            asaas_pix_payload: pixData.payload,
          })
          .eq("id", fatura.id);
      }
    } catch (e) {
      console.warn("Erro ao buscar PIX:", e);
    }
  }

  // Buscar boleto
  let boletoBarcode = fatura.asaas_boleto_barcode;
  let boletoBarCode = fatura.asaas_boleto_bar_code;
  if ((!boletoBarcode || !boletoBarCode) && payment.bankSlipUrl) {
    try {
      const boletoRes = await fetch(`${apiUrl}/payments/${paymentId}/identificationField`, {
        headers: { access_token: apiKey },
      });
      if (boletoRes.ok) {
        const boletoData = await boletoRes.json();
        boletoBarcode = boletoData.identificationField;
        boletoBarCode = boletoData.barCode;
        
        await supabase
          .from("faturas")
          .update({ 
            asaas_boleto_barcode: boletoBarcode,
            asaas_boleto_bar_code: boletoBarCode,
            asaas_boleto_url: payment.bankSlipUrl,
          })
          .eq("id", fatura.id);
      }
    } catch (e) {
      console.warn("Erro ao buscar boleto:", e);
    }
  }

  // =============================================
  // ATUALIZAR STATUS COM SYNC BIDIRECIONAL
  // =============================================
  const updateData: Record<string, unknown> = {
    asaas_status: payment.status,
    asaas_invoice_url: payment.invoiceUrl,
    payment_url: payment.invoiceUrl,
    updated_at: new Date().toISOString(),
  };

  if (statusChanged) {
    updateData.status = newLocalStatus;
    if (newLocalStatus === 'Paga') {
      updateData.saldo_restante = 0;
    }
    if (newLocalStatus === 'Cancelada') {
      updateData.motivo_cancelamento = `Gateway sync: ${payment.status}`;
    }
    console.log(`[gateway-sync-payment] Sync bidirecional: ${oldLocalStatus} → ${newLocalStatus} (asaas: ${payment.status})`);
  }

  await supabase
    .from("faturas")
    .update(updateData)
    .eq("id", fatura.id);

  // =============================================
  // NOTIFICAR USUÁRIO SE HOUVE CORREÇÃO
  // =============================================
  if (statusChanged && fatura.tenant_id) {
    await supabase.from("notifications").insert({
      tenant_id: fatura.tenant_id,
      title: "Fatura Sincronizada",
      message: `Status corrigido automaticamente: ${oldLocalStatus} → ${newLocalStatus}`,
      type: "info",
      link: "/faturas"
    });

    // Se pago, garantir que pagamento existe
    if (ASAAS_PAID_STATUSES.includes(payment.status)) {
      const { data: existingPayment } = await supabase
        .from("pagamentos")
        .select("id")
        .eq("fatura_id", fatura.id)
        .eq("gateway", "asaas")
        .eq("gateway_id", payment.id)
        .maybeSingle();

      if (!existingPayment) {
        const metodo = payment.billingType === "PIX" ? "PIX" 
          : payment.billingType === "BOLETO" ? "Boleto"
          : payment.billingType === "CREDIT_CARD" ? "Cartão"
          : "Asaas";

        await supabase.from("pagamentos").insert({
          fatura_id: fatura.id,
          valor: payment.value || fatura.valor,
          metodo,
          data_pagamento: payment.paymentDate || new Date().toISOString().split('T')[0],
          gateway: "asaas",
          gateway_id: payment.id,
          gateway_status: payment.status,
          gateway_config_id: fatura.gateway_config_id,
          referencia: payment.invoiceNumber || payment.id,
          tenant_id: fatura.tenant_id,
        });
        console.log(`[gateway-sync-payment] Pagamento registrado via sync para fatura ${fatura.id}`);
      }
    }
  }

  return {
    success: true,
    gatewayType: "asaas",
    paymentId,
    pixQrCode,
    boletoBarcode,
    paymentUrl: payment.invoiceUrl,
    invoiceUrl: payment.invoiceUrl,
  };
}

async function createAsaasPayment(
  supabase: SupabaseClient,
  fatura: any,
  customerId: string,
  billingType: string,
  apiKey: string,
  apiUrl: string
): Promise<SyncResponse> {
  const payload = {
    customer: customerId,
    billingType,
    value: fatura.valor,
    dueDate: fatura.data_vencimento,
    description: `Mensalidade ${fatura.mes_referencia}/${fatura.ano_referencia}`,
    externalReference: fatura.id,
  };

  const res = await fetch(`${apiUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.description || "Erro ao criar cobrança no Asaas");
  }

  const payment = await res.json();

  // Atualizar fatura
  await supabase
    .from("faturas")
    .update({
      asaas_payment_id: payment.id,
      asaas_status: payment.status,
      asaas_billing_type: payment.billingType,
      asaas_due_date: payment.dueDate,
      asaas_invoice_url: payment.invoiceUrl,
      payment_url: payment.invoiceUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fatura.id);

  // Buscar PIX e boleto em PARALELO com retry otimizado
  let pixQrCode: string | undefined;
  let boletoBarcode: string | undefined;
  let boletoBarCode: string | undefined;

  // Primeira tentativa imediata em paralelo (sem delay)
  const fetchPaymentDetails = async (retryCount = 0): Promise<void> => {
    const promises: Promise<void>[] = [];

    if (!pixQrCode) {
      promises.push(
        fetch(`${apiUrl}/payments/${payment.id}/pixQrCode`, {
          headers: { access_token: apiKey },
        })
          .then(async (res) => {
            if (res.ok) {
              const pixData = await res.json();
              pixQrCode = pixData.encodedImage;
              await supabase
                .from("faturas")
                .update({ 
                  asaas_pix_qrcode: pixQrCode,
                  asaas_pix_payload: pixData.payload,
                })
                .eq("id", fatura.id);
            }
          })
          .catch((e) => console.warn(`PIX attempt ${retryCount + 1} failed:`, e))
      );
    }

    if (!boletoBarcode) {
      promises.push(
        fetch(`${apiUrl}/payments/${payment.id}/identificationField`, {
          headers: { access_token: apiKey },
        })
          .then(async (res) => {
            if (res.ok) {
              const boletoData = await res.json();
              boletoBarcode = boletoData.identificationField;
              boletoBarCode = boletoData.barCode;
              await supabase
                .from("faturas")
                .update({ 
                  asaas_boleto_barcode: boletoBarcode,
                  asaas_boleto_bar_code: boletoBarCode,
                })
                .eq("id", fatura.id);
            }
          })
          .catch((e) => console.warn(`Boleto attempt ${retryCount + 1} failed:`, e))
      );
    }

    await Promise.all(promises);
  };

  // Tentativa 1: imediata
  await fetchPaymentDetails(0);
  
  // Tentativa 2: apenas se necessário, com delay curto
  if (!pixQrCode || !boletoBarcode) {
    await new Promise(r => setTimeout(r, 500));
    await fetchPaymentDetails(1);
  }
  
  // Tentativa 3: apenas se ainda necessário
  if (!pixQrCode || !boletoBarcode) {
    await new Promise(r => setTimeout(r, 1000));
    await fetchPaymentDetails(2);
  }

  return {
    success: true,
    gatewayType: "asaas",
    paymentId: payment.id,
    pixQrCode,
    boletoBarcode,
    paymentUrl: payment.invoiceUrl,
    invoiceUrl: payment.invoiceUrl,
  };
}

async function ensureAsaasCustomer(
  supabase: SupabaseClient,
  responsavel: any,
  apiKey: string,
  apiUrl: string
): Promise<string | null> {
  if (responsavel.asaas_customer_id) {
    return responsavel.asaas_customer_id;
  }

  const cpf = responsavel.cpf?.replace(/\D/g, "");
  if (!cpf || (cpf.length !== 11 && cpf.length !== 14)) {
    throw new Error("Responsável sem CPF/CNPJ válido");
  }

  // Verificar se já existe no Asaas
  const searchRes = await fetch(`${apiUrl}/customers?cpfCnpj=${cpf}`, {
    headers: { access_token: apiKey },
  });

  if (searchRes.ok) {
    const { data } = await searchRes.json();
    if (data?.length > 0) {
      // Atualizar no banco
      await supabase
        .from("responsaveis")
        .update({ asaas_customer_id: data[0].id })
        .eq("id", responsavel.id);
      return data[0].id;
    }
  }

  // Criar novo customer
  const createRes = await fetch(`${apiUrl}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify({
      name: responsavel.nome,
      cpfCnpj: cpf,
      email: responsavel.email,
      phone: responsavel.telefone?.replace(/\D/g, ""),
    }),
  });

  if (!createRes.ok) {
    const error = await createRes.json();
    throw new Error(error.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
  }

  const customer = await createRes.json();
  
  await supabase
    .from("responsaveis")
    .update({ asaas_customer_id: customer.id })
    .eq("id", responsavel.id);

  return customer.id;
}

/**
 * Handler para Stripe (placeholder para futuro)
 */
async function handleStripeSync(
  supabase: SupabaseClient,
  fatura: any,
  gateway: GatewayCredentials,
  action: string
): Promise<SyncResponse> {
  // TODO: Implementar integração Stripe para cobranças de alunos
  return {
    success: false,
    gatewayType: "stripe",
    error: "Integração Stripe para cobranças ainda não implementada",
  };
}

/**
 * Handler para Mercado Pago (placeholder para futuro)
 */
async function handleMercadoPagoSync(
  supabase: SupabaseClient,
  fatura: any,
  gateway: GatewayCredentials,
  action: string
): Promise<SyncResponse> {
  // TODO: Implementar integração Mercado Pago
  return {
    success: false,
    gatewayType: "mercado_pago",
    error: "Integração Mercado Pago ainda não implementada",
  };
}
