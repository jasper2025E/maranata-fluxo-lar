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
    const { responsavelId } = await req.json();

    if (!responsavelId) {
      throw new Error("responsavelId é obrigatório");
    }

    // Buscar dados do responsável com tenant
    const { data: responsavel, error: respError } = await supabase
      .from("responsaveis")
      .select("*, tenant_id")
      .eq("id", responsavelId)
      .single();

    if (respError || !responsavel) {
      throw new Error("Responsável não encontrado");
    }

    const tenantId = responsavel.tenant_id;

    // Se já tem customer_id, retornar
    if (responsavel.asaas_customer_id) {
      return new Response(JSON.stringify({ 
        success: true, 
        customerId: responsavel.asaas_customer_id,
        message: "Cliente já existe no Asaas"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter credenciais do gateway
    const credentials = await getAsaasCredentials(supabase, tenantId);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;

    // Criar cliente no Asaas
    const customerData = {
      name: responsavel.nome,
      cpfCnpj: responsavel.cpf?.replace(/\D/g, '') || null,
      email: responsavel.email || null,
      phone: responsavel.telefone?.replace(/\D/g, '') || null,
      mobilePhone: responsavel.telefone?.replace(/\D/g, '') || null,
      notificationDisabled: false,
    };

    const asaasResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(customerData),
    });

    const asaasResult = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error("Erro Asaas:", asaasResult);
      
      await logGatewayTransaction(supabase, {
        tenantId: tenantId || "",
        gatewayConfigId: credentials.configId,
        gatewayType: "asaas",
        operation: "create_customer",
        status: "failed",
        errorMessage: asaasResult.errors?.[0]?.description || "Erro ao criar cliente",
        requestPayload: { name: responsavel.nome },
        responsePayload: asaasResult,
        durationMs: Date.now() - startTime,
      });
      
      throw new Error(asaasResult.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
    }

    // Atualizar responsável com o ID do Asaas
    await supabase
      .from("responsaveis")
      .update({ asaas_customer_id: asaasResult.id })
      .eq("id", responsavelId);

    // Log successful transaction
    await logGatewayTransaction(supabase, {
      tenantId: tenantId || "",
      gatewayConfigId: credentials.configId,
      gatewayType: "asaas",
      operation: "create_customer",
      status: "success",
      externalReference: asaasResult.id,
      responsePayload: { customerId: asaasResult.id },
      durationMs: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      customerId: asaasResult.id,
      message: "Cliente criado no Asaas com sucesso"
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
