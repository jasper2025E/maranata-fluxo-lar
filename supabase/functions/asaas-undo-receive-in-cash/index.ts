import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getAsaasCredentials,
  logGatewayTransaction 
} from "../_shared/gateway-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UndoReceiveInCashRequest {
  faturaId: string;
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

    const { faturaId }: UndoReceiveInCashRequest = await req.json();

    if (!faturaId) {
      return new Response(
        JSON.stringify({ success: false, error: "ID da fatura não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Buscar fatura com validação de tenant
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("id, asaas_payment_id, asaas_status, valor, valor_total, tenant_id")
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
      console.log("Fatura sem cobrança Asaas, nada a desfazer");
      return new Response(
        JSON.stringify({ success: true, message: "Fatura sem cobrança Asaas vinculada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter credenciais do Asaas
    const { apiKey, apiUrl, configId } = await getAsaasCredentials(supabase, profile.tenant_id);

    console.log(`[asaas-undo-receive-in-cash] Payment ID: ${fatura.asaas_payment_id}, Status atual: ${fatura.asaas_status}`);

    // Chamar API do Asaas para desfazer o recebimento
    const asaasRes = await fetch(`${apiUrl}/payments/${fatura.asaas_payment_id}/undoReceivedInCash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
    });

    const asaasData = await asaasRes.json();

    if (!asaasRes.ok) {
      console.error("[asaas-undo-receive-in-cash] Erro Asaas:", asaasData);
      
      // Verificar se é erro de status inválido (cobrança não estava como recebida)
      const errorDescription = asaasData.errors?.[0]?.description || "";
      const isStatusError = errorDescription.toLowerCase().includes("status") || 
                           errorDescription.toLowerCase().includes("não pode");
      
      if (isStatusError) {
        // Não é realmente um erro - a cobrança pode não ter sido confirmada no Asaas
        console.log("Cobrança não estava como recebida no Asaas, ignorando...");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Cobrança não precisava ser revertida no gateway" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logGatewayTransaction(supabase, {
        tenantId: profile.tenant_id,
        gatewayConfigId: configId,
        gatewayType: "asaas",
        operation: "undo_receive_in_cash",
        status: "failed",
        faturaId,
        externalReference: fatura.asaas_payment_id,
        amount: fatura.valor_total || fatura.valor,
        errorCode: asaasData.errors?.[0]?.code,
        errorMessage: errorDescription || "Erro desconhecido",
        durationMs: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorDescription || "Erro ao desfazer recebimento no Asaas" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Atualizar status da fatura localmente
    await supabase
      .from("faturas")
      .update({
        asaas_status: asaasData.status || "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    // Log sucesso
    await logGatewayTransaction(supabase, {
      tenantId: profile.tenant_id,
      gatewayConfigId: configId,
      gatewayType: "asaas",
      operation: "undo_receive_in_cash",
      status: "success",
      faturaId,
      externalReference: fatura.asaas_payment_id,
      amount: fatura.valor_total || fatura.valor,
      responsePayload: asaasData,
      durationMs: Date.now() - startTime,
    });

    console.log("[asaas-undo-receive-in-cash] Sucesso:", asaasData.status);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: asaasData.status,
        paymentId: fatura.asaas_payment_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[asaas-undo-receive-in-cash] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
