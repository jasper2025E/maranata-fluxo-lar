import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getAsaasCredentials, logGatewayTransaction } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  try {
    const { faturaId, motivo } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura com tenant
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("asaas_payment_id, tenant_id, gateway_config_id")
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    if (!fatura.asaas_payment_id) {
      // Se não tem cobrança no Asaas, apenas atualizar localmente
      await supabase
        .from("faturas")
        .update({
          status: "Cancelada",
          motivo_cancelamento: motivo || "Cancelado pelo usuário",
          cancelada_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", faturaId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Fatura cancelada localmente"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter credenciais do gateway
    const credentials = await getAsaasCredentials(supabase, fatura.tenant_id);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;

    // Cancelar cobrança no Asaas
    const cancelResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
      method: "DELETE",
      headers: { "access_token": ASAAS_API_KEY },
    });

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json();
      console.error("Erro ao cancelar no Asaas:", errorData);
      
      await logGatewayTransaction(supabase, {
        tenantId: fatura.tenant_id || "",
        gatewayConfigId: fatura.gateway_config_id || credentials.configId,
        gatewayType: "asaas",
        operation: "cancel_payment",
        status: "failed",
        faturaId,
        externalReference: fatura.asaas_payment_id,
        errorMessage: errorData.errors?.[0]?.description || "Erro ao cancelar",
        durationMs: Date.now() - startTime,
      });
      
      // Continuar mesmo com erro para atualizar localmente
    } else {
      // Log successful cancellation
      await logGatewayTransaction(supabase, {
        tenantId: fatura.tenant_id || "",
        gatewayConfigId: fatura.gateway_config_id || credentials.configId,
        gatewayType: "asaas",
        operation: "cancel_payment",
        status: "success",
        faturaId,
        externalReference: fatura.asaas_payment_id,
        durationMs: Date.now() - startTime,
      });
    }

    // Atualizar fatura
    await supabase
      .from("faturas")
      .update({
        status: "Cancelada",
        asaas_status: "DELETED",
        motivo_cancelamento: motivo || "Cancelado pelo usuário",
        cancelada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cobrança cancelada com sucesso"
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
