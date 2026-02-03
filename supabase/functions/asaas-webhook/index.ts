import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, logGatewayTransaction } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();

  let eventType = '';
  let payload: any = null;
  let logStatus = 'received';
  let errorMessage: string | null = null;

  try {
    const ASAAS_WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    
    // Validar token do webhook - OBRIGATÓRIO para segurança
    const accessToken = req.headers.get("asaas-access-token");
    
    // Se o token está configurado, validação é obrigatória
    if (ASAAS_WEBHOOK_TOKEN) {
      if (!accessToken || accessToken !== ASAAS_WEBHOOK_TOKEN) {
        console.error("Token de webhook inválido ou ausente");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Se não há token configurado, apenas logar warning (ambiente de desenvolvimento)
      console.warn("ASAAS_WEBHOOK_TOKEN não configurado - webhook sem validação");
    }

    const event = await req.json();
    payload = event;
    eventType = event.event || 'unknown';
    console.log("Asaas Webhook Event:", JSON.stringify(event, null, 2));

    const { event: evtType, payment } = event;

    if (!payment || !payment.externalReference) {
      console.log("Webhook sem externalReference, ignorando");
      logStatus = 'processed';
      
      // Log webhook event
      await supabase.from("webhook_logs").insert({
        source: "asaas",
        event_type: eventType,
        payload,
        status: logStatus,
        processing_time_ms: Date.now() - startTime,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      });
      
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const faturaId = payment.externalReference;

    // Buscar fatura para obter tenant_id, gateway_config_id E status atual (idempotência)
    const { data: fatura } = await supabase
      .from("faturas")
      .select("id, valor, valor_total, tenant_id, gateway_config_id, status, asaas_status")
      .eq("id", faturaId)
      .single();

    // Verificar idempotência - se já foi processado com mesmo status, ignorar
    if (fatura && fatura.asaas_status === payment.status) {
      console.log(`[asaas-webhook] Fatura ${faturaId}: Status ${payment.status} já processado (idempotente)`);
      
      await supabase.from("webhook_logs").insert({
        source: "asaas",
        event_type: eventType,
        payload,
        status: 'skipped',
        processing_time_ms: Date.now() - startTime,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      });
      
      return new Response(JSON.stringify({ received: true, skipped: true, reason: "already_processed" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mapear status do Asaas para status interno
    const statusMap: Record<string, string> = {
      PENDING: "Aberta",
      RECEIVED: "Paga",
      CONFIRMED: "Paga",
      RECEIVED_IN_CASH: "Paga",
      OVERDUE: "Vencida",
      REFUNDED: "Cancelada",
      REFUND_REQUESTED: "Cancelada",
      CHARGEBACK_REQUESTED: "Cancelada",
      CHARGEBACK_DISPUTE: "Cancelada",
      AWAITING_CHARGEBACK_REVERSAL: "Cancelada",
      DUNNING_REQUESTED: "Vencida",
      DUNNING_RECEIVED: "Paga",
      AWAITING_RISK_ANALYSIS: "Aberta",
    };

    const newStatus = statusMap[payment.status] || "Aberta";
    const oldStatus = fatura?.status || "desconhecido";

    // Log detalhado de transição de status
    console.log(`[asaas-webhook] Fatura ${faturaId}: ${oldStatus} → ${newStatus} (asaas: ${fatura?.asaas_status} → ${payment.status})`);

    // Atualizar fatura
    const updateData: any = {
      asaas_status: payment.status,
      updated_at: new Date().toISOString(),
    };

    // Se foi pago, atualizar status e registrar pagamento
    if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH", "DUNNING_RECEIVED"].includes(payment.status)) {
      updateData.status = "Paga";
      updateData.saldo_restante = 0;

      if (fatura) {
        // Verificar se já existe pagamento para esta fatura via Asaas
        const { data: existingPayment } = await supabase
          .from("pagamentos")
          .select("id")
          .eq("fatura_id", faturaId)
          .eq("gateway", "asaas")
          .eq("gateway_id", payment.id)
          .single();

        if (!existingPayment) {
          // Registrar pagamento
          const metodo = payment.billingType === "PIX" ? "PIX" 
            : payment.billingType === "BOLETO" ? "Boleto"
            : payment.billingType === "CREDIT_CARD" ? "Cartão"
            : "Asaas";

          const { data: novoPagamento } = await supabase
            .from("pagamentos")
            .insert({
              fatura_id: faturaId,
              valor: payment.value,
              metodo: metodo,
              data_pagamento: payment.paymentDate || new Date().toISOString().split('T')[0],
              gateway: "asaas",
              gateway_id: payment.id,
              gateway_status: payment.status,
              gateway_config_id: fatura.gateway_config_id, // Link to gateway config
              referencia: payment.invoiceNumber || payment.id,
              tenant_id: fatura.tenant_id,
            })
            .select("id")
            .single();

          // Log transaction
          await logGatewayTransaction(supabase, {
            tenantId: fatura.tenant_id || "",
            gatewayConfigId: fatura.gateway_config_id,
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

          // Criar notificação de pagamento
          await supabase
            .from("notifications")
            .insert({
              title: "Pagamento Recebido",
              message: `Pagamento de R$ ${payment.value.toFixed(2)} recebido via ${metodo}`,
              type: "success",
              link: "/faturas",
              tenant_id: fatura.tenant_id,
            });
        }
      }
    } else if (["OVERDUE", "DUNNING_REQUESTED"].includes(payment.status)) {
      updateData.status = "Vencida";
    } else if (["REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE", "AWAITING_CHARGEBACK_REVERSAL"].includes(payment.status)) {
      updateData.status = "Cancelada";
      updateData.motivo_cancelamento = `Asaas: ${payment.status}`;

      // Notificar sobre estorno/chargeback
      if (fatura) {
        const alertType = payment.status.includes("CHARGEBACK") ? "Contestação" : "Estorno";
        await supabase.from("notifications").insert({
          tenant_id: fatura.tenant_id,
          title: `Alerta: ${alertType} de Pagamento`,
          message: `Cobrança ${payment.status === 'REFUNDED' ? 'estornada' : 'contestada'} - R$ ${payment.value.toFixed(2)}`,
          type: "warning",
          link: "/faturas"
        });
      }
    }

    await supabase
      .from("faturas")
      .update(updateData)
      .eq("id", faturaId);

    console.log(`Fatura ${faturaId} atualizada: ${newStatus}`);
    logStatus = 'processed';

    // Log webhook event
    await supabase.from("webhook_logs").insert({
      source: "asaas",
      event_type: eventType,
      payload,
      status: logStatus,
      processing_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return new Response(JSON.stringify({ received: true, status: newStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Erro no webhook:", error);
    errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logStatus = 'failed';

    // Notificar erro de integração
    try {
      // Tentar extrair tenant_id do payload se disponível
      const tenantId = payload?.payment?.externalReference 
        ? (await supabase.from("faturas").select("tenant_id").eq("id", payload.payment.externalReference).single())?.data?.tenant_id
        : null;
      
      if (tenantId) {
        await supabase.from("notifications").insert({
          tenant_id: tenantId,
          title: "Erro na Integração Asaas",
          message: `Falha ao processar webhook: ${errorMessage}`,
          type: "error",
          link: "/configuracoes"
        });
      }
    } catch (notifError) {
      console.error("Erro ao criar notificação:", notifError);
    }

    // Log failed webhook event
    await supabase.from("webhook_logs").insert({
      source: "asaas",
      event_type: eventType || 'unknown',
      payload: payload || {},
      status: logStatus,
      error_message: errorMessage,
      processing_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
