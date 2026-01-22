import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let eventType = '';
  let payload: any = null;
  let logStatus = 'received';
  let errorMessage: string | null = null;

  try {
    const ASAAS_WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    
    // Verificar token do webhook (opcional, mas recomendado)
    const accessToken = req.headers.get("asaas-access-token");
    if (ASAAS_WEBHOOK_TOKEN && accessToken !== ASAAS_WEBHOOK_TOKEN) {
      console.warn("Token de webhook inválido");
      // Continuar mesmo assim para não bloquear webhooks do Asaas
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

    // Atualizar fatura
    const updateData: any = {
      asaas_status: payment.status,
      updated_at: new Date().toISOString(),
    };

    // Se foi pago, atualizar status e registrar pagamento
    if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH", "DUNNING_RECEIVED"].includes(payment.status)) {
      updateData.status = "Paga";
      updateData.saldo_restante = 0;

      // Buscar fatura para verificar se já tem pagamento registrado
      const { data: fatura } = await supabase
        .from("faturas")
        .select("id, valor, valor_total")
        .eq("id", faturaId)
        .single();

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

          await supabase
            .from("pagamentos")
            .insert({
              fatura_id: faturaId,
              valor: payment.value,
              metodo: metodo,
              data_pagamento: payment.paymentDate || new Date().toISOString().split('T')[0],
              gateway: "asaas",
              gateway_id: payment.id,
              gateway_status: payment.status,
              referencia: payment.invoiceNumber || payment.id,
            });

          // Criar notificação de pagamento
          await supabase
            .from("notifications")
            .insert({
              title: "Pagamento Recebido",
              message: `Pagamento de R$ ${payment.value.toFixed(2)} recebido via ${metodo}`,
              type: "success",
              link: "/faturas",
            });
        }
      }
    } else if (["OVERDUE", "DUNNING_REQUESTED"].includes(payment.status)) {
      updateData.status = "Vencida";
    } else if (["REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED"].includes(payment.status)) {
      updateData.status = "Cancelada";
      updateData.motivo_cancelamento = `Asaas: ${payment.status}`;
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