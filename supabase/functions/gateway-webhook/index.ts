import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, logGatewayTransaction } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  // Always respond to OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  // Parse path: /gateway-webhook/{gateway_type}/{webhook_token}
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Path will be like: /gateway-webhook/asaas/TOKEN or /functions/v1/gateway-webhook/asaas/TOKEN
  const gwIndex = pathParts.indexOf('gateway-webhook');
  const gatewayType = gwIndex >= 0 ? pathParts[gwIndex + 1] : null;
  const webhookToken = gwIndex >= 0 ? pathParts[gwIndex + 2] : null;

  console.log(`[gateway-webhook] Received ${req.method} for gateway=${gatewayType}, token=${webhookToken?.substring(0, 8)}...`);

  // Validate token against tenant_gateway_configs
  let tenantId: string | null = null;
  let gatewayConfigId: string | null = null;

  if (webhookToken) {
    const { data: config } = await supabase
      .from("tenant_gateway_configs")
      .select("id, tenant_id, gateway_type, is_active")
      .eq("webhook_token", webhookToken)
      .eq("is_active", true)
      .maybeSingle();

    if (!config) {
      console.error("[gateway-webhook] Token inválido ou config inativa");
      // Still return 200 to avoid Asaas penalties
      return new Response(JSON.stringify({ received: true, error: "invalid_token" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    tenantId = config.tenant_id;
    gatewayConfigId = config.id;
    console.log(`[gateway-webhook] Tenant=${tenantId}, ConfigId=${gatewayConfigId}`);
  }

  // Parse body
  let event: any;
  try {
    event = await req.json();
  } catch (e) {
    console.error("[gateway-webhook] Erro ao parsear JSON:", e);
    return new Response(JSON.stringify({ received: true, error: "invalid_json" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const eventType = event.event || 'unknown';
  const payment = event.payment;

  console.log(`[gateway-webhook] Event: ${eventType}, Payment ID: ${payment?.id}`);

  // Log webhook immediately
  try {
    await supabase.from("webhook_logs").insert({
      source: gatewayType || "unknown",
      event_type: eventType,
      payload: event,
      status: 'received',
      processing_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });
  } catch (logErr) {
    console.error("[gateway-webhook] Erro ao salvar log:", logErr);
  }

  // Process asynchronously - respond 200 immediately
  if (gatewayType === 'asaas' && payment) {
    // Fire and forget - process in background
    processAsaasWebhook(supabase, event, tenantId, gatewayConfigId, startTime).catch(err => {
      console.error("[gateway-webhook] Erro no processamento async:", err);
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function processAsaasWebhook(
  supabase: any,
  event: any,
  tenantId: string | null,
  gatewayConfigId: string | null,
  startTime: number
) {
  const { event: evtType, payment } = event;

  if (!payment?.externalReference) {
    console.log("[gateway-webhook] Sem externalReference, ignorando processamento");
    return;
  }

  const faturaId = payment.externalReference;

  // Check for duplicate within 5 minutes
  const { data: recentLogs } = await supabase
    .from("webhook_logs")
    .select("payload")
    .eq("source", "asaas")
    .eq("event_type", evtType)
    .eq("status", "processed")
    .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(10);

  const isDuplicate = recentLogs?.some((log: any) => {
    const logPayload = log.payload as { payment?: { id?: string } };
    return logPayload?.payment?.id === payment.id;
  });

  if (isDuplicate) {
    console.log(`[gateway-webhook] Duplicado para payment ${payment.id}`);
    await supabase.from("webhook_logs").insert({
      source: "asaas",
      event_type: evtType,
      payload: event,
      status: 'skipped',
      processing_time_ms: Date.now() - startTime,
      error_message: "duplicate_event_within_5min",
    });
    return;
  }

  // Fetch fatura
  const { data: fatura } = await supabase
    .from("faturas")
    .select("id, valor, valor_total, tenant_id, gateway_config_id, status, asaas_status")
    .eq("id", faturaId)
    .single();

  if (!fatura) {
    console.log(`[gateway-webhook] Fatura ${faturaId} não encontrada`);
    return;
  }

  // Use tenant from fatura if not from token
  const effectiveTenantId = tenantId || fatura.tenant_id;
  const effectiveGatewayConfigId = gatewayConfigId || fatura.gateway_config_id;

  // Idempotency check
  if (fatura.asaas_status === payment.status) {
    console.log(`[gateway-webhook] Status ${payment.status} já processado para fatura ${faturaId}`);
    return;
  }

  // Build update
  const updateData: any = {
    asaas_status: payment.status,
    updated_at: new Date().toISOString(),
  };

  // Payment received
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH", "DUNNING_RECEIVED"].includes(payment.status)) {
    updateData.status = "Paga";
    updateData.saldo_restante = 0;

    // Check if payment record already exists
    const { data: existingPayment } = await supabase
      .from("pagamentos")
      .select("id")
      .eq("fatura_id", faturaId)
      .eq("gateway", "asaas")
      .eq("gateway_id", payment.id)
      .single();

    if (!existingPayment) {
      const metodo = payment.billingType === "PIX" ? "PIX"
        : payment.billingType === "BOLETO" ? "Boleto"
        : payment.billingType === "CREDIT_CARD" ? "Cartão"
        : "Asaas";

      const { data: novoPagamento } = await supabase
        .from("pagamentos")
        .insert({
          fatura_id: faturaId,
          valor: payment.value,
          metodo,
          data_pagamento: payment.paymentDate || new Date().toISOString().split('T')[0],
          gateway: "asaas",
          gateway_id: payment.id,
          gateway_status: payment.status,
          gateway_config_id: effectiveGatewayConfigId,
          referencia: payment.invoiceNumber || payment.id,
          tenant_id: effectiveTenantId,
        })
        .select("id")
        .single();

      await logGatewayTransaction(supabase, {
        tenantId: effectiveTenantId || "",
        gatewayConfigId: effectiveGatewayConfigId,
        gatewayType: "asaas",
        operation: "webhook_payment_received",
        status: "success",
        faturaId,
        pagamentoId: novoPagamento?.id,
        amount: payment.value,
        externalReference: payment.id,
        responsePayload: { status: payment.status, billingType: payment.billingType },
        durationMs: Date.now() - startTime,
      });

      await supabase.from("notifications").insert({
        title: "Pagamento Recebido",
        message: `Pagamento de R$ ${payment.value.toFixed(2)} recebido via ${metodo}`,
        type: "success",
        link: "/faturas",
        tenant_id: effectiveTenantId,
      });
    }
  } else if (["OVERDUE", "DUNNING_REQUESTED"].includes(payment.status)) {
    updateData.status = "Vencida";
  } else if (["REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE", "AWAITING_CHARGEBACK_REVERSAL"].includes(payment.status)) {
    updateData.status = "Cancelada";
    updateData.motivo_cancelamento = `Asaas: ${payment.status}`;

    const alertType = payment.status.includes("CHARGEBACK") ? "Contestação" : "Estorno";
    await supabase.from("notifications").insert({
      tenant_id: effectiveTenantId,
      title: `Alerta: ${alertType} de Pagamento`,
      message: `Cobrança ${payment.status === 'REFUNDED' ? 'estornada' : 'contestada'} - R$ ${payment.value.toFixed(2)}`,
      type: "warning",
      link: "/faturas",
    });
  }

  // Update fatura
  await supabase.from("faturas").update(updateData).eq("id", faturaId);

  // Log as processed
  await supabase.from("webhook_logs").insert({
    source: "asaas",
    event_type: evtType,
    payload: event,
    status: 'processed',
    processing_time_ms: Date.now() - startTime,
  });

  console.log(`[gateway-webhook] Fatura ${faturaId} atualizada: ${updateData.status || payment.status}`);
}
