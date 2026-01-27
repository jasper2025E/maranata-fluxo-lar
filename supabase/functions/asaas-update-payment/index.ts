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
    const { faturaId, novoValor, descricao } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura com dados do Asaas
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        alunos(nome_completo, tenant_id),
        cursos(nome)
      `)
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    const tenantId = fatura.tenant_id || fatura.alunos?.tenant_id || null;

    // Se não tem cobrança no Asaas, não precisa atualizar
    if (!fatura.asaas_payment_id) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Fatura não possui cobrança Asaas para atualizar"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter credenciais do gateway
    const credentials = await getAsaasCredentials(supabase, tenantId);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;
    const gatewayConfigId = credentials.configId;

    // Calcular novo valor
    const valorAtualizado = novoValor ?? fatura.valor_total ?? fatura.valor;

    // Verificar status da cobrança atual no Asaas
    const checkResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
      headers: { "access_token": ASAAS_API_KEY },
    });

    if (!checkResponse.ok) {
      throw new Error("Erro ao verificar cobrança no Asaas");
    }

    const currentPayment = await checkResponse.json();

    // Se já está pago ou cancelado, não pode atualizar
    if (currentPayment.status === "RECEIVED" || currentPayment.status === "CONFIRMED") {
      throw new Error("Cobrança já foi paga, não é possível alterar o valor");
    }

    if (currentPayment.status === "REFUNDED" || currentPayment.status === "REFUND_REQUESTED") {
      throw new Error("Cobrança foi estornada, não é possível alterar");
    }

    // Atualizar a cobrança no Asaas
    const updateData: Record<string, unknown> = {
      value: Number(valorAtualizado.toFixed(2)),
    };

    if (descricao) {
      updateData.description = descricao;
    }

    const updateResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error("Erro Asaas Update:", updateResult);
      
      // Log failed transaction
      await logGatewayTransaction(supabase, {
        tenantId: tenantId || "",
        gatewayConfigId,
        gatewayType: "asaas",
        operation: "update_payment",
        status: "failed",
        faturaId,
        amount: valorAtualizado,
        externalReference: fatura.asaas_payment_id,
        errorMessage: updateResult.errors?.[0]?.description || "Erro ao atualizar cobrança",
        requestPayload: updateData,
        responsePayload: updateResult,
        durationMs: Date.now() - startTime,
      });
      
      throw new Error(updateResult.errors?.[0]?.description || "Erro ao atualizar cobrança no Asaas");
    }

    // Atualizar fatura no banco com o novo status
    await supabase
      .from("faturas")
      .update({
        asaas_status: updateResult.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    // Log successful transaction
    await logGatewayTransaction(supabase, {
      tenantId: tenantId || "",
      gatewayConfigId,
      gatewayType: "asaas",
      operation: "update_payment",
      status: "success",
      faturaId,
      amount: valorAtualizado,
      externalReference: fatura.asaas_payment_id,
      responsePayload: { paymentId: updateResult.id, value: updateResult.value, status: updateResult.status },
      durationMs: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      payment: updateResult,
      message: "Cobrança atualizada com sucesso no Asaas",
      novoValor: valorAtualizado,
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
