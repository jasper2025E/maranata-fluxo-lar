import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getAsaasCredentials, logGatewayTransaction } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Esta função apenas deleta o pagamento no Asaas SEM alterar o status local da fatura.
 * Útil para recriar cobranças com billingType diferente.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  try {
    const { faturaId } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("asaas_payment_id, tenant_id, gateway_config_id")
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    if (!fatura.asaas_payment_id) {
      // Não há cobrança para deletar, apenas limpar campos
      await supabase
        .from("faturas")
        .update({
          asaas_payment_id: null,
          asaas_status: null,
          asaas_billing_type: null,
          asaas_pix_qrcode: null,
          asaas_pix_payload: null,
          asaas_boleto_url: null,
          asaas_boleto_barcode: null,
          asaas_boleto_bar_code: null,
          asaas_invoice_url: null,
          asaas_due_date: null,
          payment_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", faturaId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Campos limpos (não havia cobrança)"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter credenciais do gateway
    const credentials = await getAsaasCredentials(supabase, fatura.tenant_id);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;

    // Deletar cobrança no Asaas
    const deleteResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
      method: "DELETE",
      headers: { "access_token": ASAAS_API_KEY },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.warn("Aviso ao deletar no Asaas (continuando):", errorData);
      
      await logGatewayTransaction(supabase, {
        tenantId: fatura.tenant_id || "",
        gatewayConfigId: fatura.gateway_config_id || credentials.configId,
        gatewayType: "asaas",
        operation: "delete_remote_payment",
        status: "failed",
        faturaId,
        externalReference: fatura.asaas_payment_id,
        errorMessage: errorData.errors?.[0]?.description || "Aviso ao deletar",
        durationMs: Date.now() - startTime,
      });
    } else {
      await logGatewayTransaction(supabase, {
        tenantId: fatura.tenant_id || "",
        gatewayConfigId: fatura.gateway_config_id || credentials.configId,
        gatewayType: "asaas",
        operation: "delete_remote_payment",
        status: "success",
        faturaId,
        externalReference: fatura.asaas_payment_id,
        durationMs: Date.now() - startTime,
      });
    }

    // Limpar campos Asaas da fatura SEM alterar o status
    await supabase
      .from("faturas")
      .update({
        asaas_payment_id: null,
        asaas_status: null,
        asaas_billing_type: null,
        asaas_pix_qrcode: null,
        asaas_pix_payload: null,
        asaas_boleto_url: null,
        asaas_boleto_barcode: null,
        asaas_boleto_bar_code: null,
        asaas_invoice_url: null,
        asaas_due_date: null,
        payment_url: null,
        gateway_config_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cobrança deletada no Asaas (status local preservado)"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Erro:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
