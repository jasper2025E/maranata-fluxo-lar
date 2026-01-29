import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getAsaasCredentials,
  logGatewayTransaction 
} from "../_shared/gateway-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiveInCashRequest {
  faturaId: string;
  paymentDate?: string;
  value?: number;
  notifyCustomer?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Token de autenticação não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Buscar tenant do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Tenant não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { faturaId, paymentDate, value, notifyCustomer = false }: ReceiveInCashRequest = await req.json();

    if (!faturaId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da fatura não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Buscar fatura com validação de tenant
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("id, asaas_payment_id, valor, valor_total, tenant_id")
      .eq("id", faturaId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (faturaError || !fatura) {
      return new Response(
        JSON.stringify({ success: false, error: "Fatura não encontrada ou acesso negado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (!fatura.asaas_payment_id) {
      console.log("Fatura sem cobrança Asaas, nada a sincronizar");
      return new Response(
        JSON.stringify({ success: true, message: "Fatura sem cobrança Asaas vinculada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter credenciais do Asaas
    const { apiKey, apiUrl, configId } = await getAsaasCredentials(supabase, profile.tenant_id);

    // Obter data atual no fuso horário do Brasil (Asaas opera em BRT)
    // Isso evita rejeição por "data futura" quando há diferença de fuso
    const getBrazilDate = (): string => {
      const now = new Date();
      // Converter para horário de Brasília (UTC-3)
      const brazilOffset = -3 * 60; // -3 horas em minutos
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brazilTime = new Date(utcTime + (brazilOffset * 60000));
      
      const year = brazilTime.getFullYear();
      const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
      const day = String(brazilTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Validar e ajustar paymentDate para evitar rejeição por "data futura"
    let safePaymentDate = paymentDate;
    if (paymentDate) {
      const brazilToday = getBrazilDate();
      // Se a data enviada for posterior à data atual no Brasil, usar data do Brasil
      if (paymentDate > brazilToday) {
        console.log(`[asaas-receive-in-cash] Data ${paymentDate} é futura no Brasil (${brazilToday}). Ajustando...`);
        safePaymentDate = brazilToday;
      }
    }

    // Chamar API do Asaas para confirmar recebimento em dinheiro
    const asaasPayload: Record<string, unknown> = {
      notifyCustomer,
    };

    if (safePaymentDate) {
      asaasPayload.paymentDate = safePaymentDate;
    }

    if (value) {
      asaasPayload.value = value;
    }

    console.log(`[asaas-receive-in-cash] Payment ID: ${fatura.asaas_payment_id}, Payload:`, asaasPayload);

    const asaasRes = await fetch(`${apiUrl}/payments/${fatura.asaas_payment_id}/receiveInCash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: JSON.stringify(asaasPayload),
    });

    const asaasData = await asaasRes.json();

    if (!asaasRes.ok) {
      console.error("[asaas-receive-in-cash] Erro Asaas:", asaasData);
      
      await logGatewayTransaction(supabase, {
        tenantId: profile.tenant_id,
        gatewayConfigId: configId,
        gatewayType: "asaas",
        operation: "receive_in_cash",
        status: "failed",
        faturaId,
        externalReference: fatura.asaas_payment_id,
        amount: value || fatura.valor_total || fatura.valor,
        errorCode: asaasData.errors?.[0]?.code,
        errorMessage: asaasData.errors?.[0]?.description || "Erro desconhecido",
        durationMs: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: asaasData.errors?.[0]?.description || "Erro ao confirmar recebimento no Asaas" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Atualizar status da fatura localmente - IMPORTANTE: atualizar tanto asaas_status quanto status principal
    const updateResult = await supabase
      .from("faturas")
      .update({
        status: "Paga",
        asaas_status: asaasData.status || "RECEIVED_IN_CASH",
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);
    
    if (updateResult.error) {
      console.error("[asaas-receive-in-cash] Erro ao atualizar fatura local:", updateResult.error);
    }

    // Log sucesso
    await logGatewayTransaction(supabase, {
      tenantId: profile.tenant_id,
      gatewayConfigId: configId,
      gatewayType: "asaas",
      operation: "receive_in_cash",
      status: "success",
      faturaId,
      externalReference: fatura.asaas_payment_id,
      amount: value || fatura.valor_total || fatura.valor,
      responsePayload: asaasData,
      durationMs: Date.now() - startTime,
    });

    console.log("[asaas-receive-in-cash] Sucesso:", asaasData.status);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: asaasData.status,
        paymentId: fatura.asaas_payment_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[asaas-receive-in-cash] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
