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

    // Buscar responsável com tenant
    const { data: responsavel, error: responsavelError } = await supabase
      .from("responsaveis")
      .select("id, nome, cpf, email, telefone, asaas_customer_id, tenant_id")
      .eq("id", responsavelId)
      .single();

    if (responsavelError || !responsavel) {
      throw new Error("Responsável não encontrado");
    }

    if (!responsavel.asaas_customer_id) {
      // Se não tem cliente no ASAAS, não precisa atualizar
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Responsável não possui cliente ASAAS vinculado",
        skipped: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter credenciais do gateway
    const credentials = await getAsaasCredentials(supabase, responsavel.tenant_id);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;

    // Preparar dados para atualização
    const updateData: Record<string, string | undefined> = {};
    
    if (responsavel.nome) {
      updateData.name = responsavel.nome;
    }
    
    if (responsavel.cpf) {
      updateData.cpfCnpj = responsavel.cpf.replace(/\D/g, '');
    }
    
    if (responsavel.email) {
      updateData.email = responsavel.email;
    }
    
    // Sempre desativar notificações para evitar taxa de R$0,99
    updateData.notificationDisabled = "true";

    if (responsavel.telefone) {
      const phone = responsavel.telefone.replace(/\D/g, '');
      // ASAAS requer telefone com DDD (mínimo 10 dígitos)
      if (phone.length >= 10) {
        updateData.phone = phone;
      }
    }

    // Atualizar cliente no ASAAS
    console.log(`Atualizando cliente ASAAS ${responsavel.asaas_customer_id}:`, updateData);
    
    const updateResponse = await fetch(`${ASAAS_API_URL}/customers/${responsavel.asaas_customer_id}`, {
      method: "PUT",
      headers: { 
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const responseData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error("Erro ao atualizar no ASAAS:", responseData);
      
      await logGatewayTransaction(supabase, {
        tenantId: responsavel.tenant_id || "",
        gatewayConfigId: credentials.configId,
        gatewayType: "asaas",
        operation: "update_customer",
        status: "failed",
        externalReference: responsavel.asaas_customer_id,
        errorMessage: responseData.errors?.[0]?.description || "Erro ao atualizar cliente",
        durationMs: Date.now() - startTime,
      });
      
      throw new Error(responseData.errors?.[0]?.description || "Erro ao atualizar cliente no ASAAS");
    }

    // Log successful update
    await logGatewayTransaction(supabase, {
      tenantId: responsavel.tenant_id || "",
      gatewayConfigId: credentials.configId,
      gatewayType: "asaas",
      operation: "update_customer",
      status: "success",
      externalReference: responsavel.asaas_customer_id,
      durationMs: Date.now() - startTime,
    });

    console.log("Cliente ASAAS atualizado com sucesso:", responseData.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cliente atualizado no ASAAS com sucesso",
      customer: {
        id: responseData.id,
        name: responseData.name,
        email: responseData.email,
      },
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
