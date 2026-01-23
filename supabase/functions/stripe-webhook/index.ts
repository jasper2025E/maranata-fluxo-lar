import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

// Stripe webhooks come from Stripe servers, not browsers
// We use minimal CORS for preflight but validate via signature
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Função para verificar assinatura do webhook
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) {
      console.error("Assinatura inválida: partes ausentes");
      return false;
    }

    const timestamp = timestampPart.split("=")[1];
    const expectedSignature = signaturePart.split("=")[1];

    // Verify timestamp is not too old (5 minutes tolerance)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      console.error("Webhook timestamp too old");
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return false;
  }
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let eventType = '';
  let payload: any = null;
  let logStatus = 'received';
  let errorMessage: string | null = null;

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSignature = req.headers.get("stripe-signature");
    const payloadText = await req.text();

    console.log("Webhook recebido");

    // CRITICAL: Verify webhook signature - required for security
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET não configurado - rejeitando webhook");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stripeSignature) {
      console.error("Stripe signature header missing");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyWebhookSignature(payloadText, stripeSignature, webhookSecret);
    if (!isValid) {
      console.error("Assinatura do webhook inválida");
      return new Response(
        JSON.stringify({ error: "Assinatura inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Assinatura verificada com sucesso");

    const event = JSON.parse(payloadText);
    payload = event;
    eventType = event.type || 'unknown';
    console.log(`Evento recebido: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const faturaId = session.metadata?.fatura_id;
        const tenantId = session.metadata?.tenant_id;
        const planId = session.metadata?.plan_id;

        console.log(`Checkout completado - Session: ${session.id}, Mode: ${session.mode}`);

        // Handle subscription checkout
        if (session.mode === "subscription" && tenantId) {
          console.log(`Subscription checkout para tenant: ${tenantId}, plano: ${planId}`);
          
          const { error: updateError } = await supabase
            .from("tenants")
            .update({
              plano: planId,
              subscription_status: "active",
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              subscription_started_at: new Date().toISOString(),
              monthly_price: session.amount_total / 100,
            })
            .eq("id", tenantId);

          if (updateError) {
            console.error("Erro ao atualizar tenant:", updateError);
            throw updateError;
          }

          // Registrar no histórico
          await supabase.from("subscription_history").insert({
            tenant_id: tenantId,
            event_type: "activated",
            old_status: "trial",
            new_status: "active",
            amount: session.amount_total / 100,
            stripe_event_id: event.id,
            metadata: {
              plan_id: planId,
              subscription_id: session.subscription,
              message: `Plano ${planId} ativado com sucesso`,
            },
          });

          console.log(`Tenant ${tenantId} atualizado para plano ${planId}`);
        }

        // Handle invoice checkout (existing logic)
        if (faturaId && session.payment_status === "paid") {
          // Atualizar status da fatura
          const { error: faturaError } = await supabase
            .from("faturas")
            .update({
              status: "Paga",
              stripe_payment_intent_id: session.payment_intent,
            })
            .eq("id", faturaId);

          if (faturaError) {
            console.error("Erro ao atualizar fatura:", faturaError);
            throw faturaError;
          }

          // Buscar dados completos da fatura para registrar valores detalhados
          const { data: faturaCompleta } = await supabase
            .from("faturas")
            .select("valor_original, valor_desconto_aplicado, valor_juros_aplicado, valor_multa_aplicado")
            .eq("id", faturaId)
            .single();

          // Registrar pagamento com detalhes de desconto, juros e multa
          const { error: pagamentoError } = await supabase
            .from("pagamentos")
            .insert({
              fatura_id: faturaId,
              valor: session.amount_total / 100,
              valor_original: faturaCompleta?.valor_original || session.amount_total / 100,
              desconto_aplicado: faturaCompleta?.valor_desconto_aplicado || 0,
              juros_aplicado: faturaCompleta?.valor_juros_aplicado || 0,
              multa_aplicada: faturaCompleta?.valor_multa_aplicado || 0,
              metodo: "Stripe",
              referencia: session.payment_intent,
              gateway: "stripe",
              gateway_id: session.id,
              gateway_status: "completed",
              data_pagamento: new Date().toISOString().split("T")[0],
            });

          if (pagamentoError) {
            console.error("Erro ao registrar pagamento:", pagamentoError);
          }

          console.log(`Fatura ${faturaId} marcada como paga`);

          // Criar notificação
          await supabase.from("notifications").insert({
            title: "Pagamento recebido via Stripe",
            message: `Pagamento de R$ ${(session.amount_total / 100).toFixed(2)} recebido.`,
            type: "success",
            link: "/faturas",
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenant_id;
        
        console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

        if (tenantId) {
          const statusMap: Record<string, string> = {
            active: "active",
            past_due: "past_due",
            canceled: "cancelled",
            unpaid: "suspended",
            trialing: "trial",
          };

          const newStatus = statusMap[subscription.status] || subscription.status;

          await supabase
            .from("tenants")
            .update({
              subscription_status: newStatus,
              monthly_price: subscription.items?.data?.[0]?.price?.unit_amount 
                ? subscription.items.data[0].price.unit_amount / 100 
                : undefined,
            })
            .eq("id", tenantId);

          // Registrar no histórico
          await supabase.from("subscription_history").insert({
            tenant_id: tenantId,
            event_type: "subscription_updated",
            new_status: newStatus,
            stripe_event_id: event.id,
            metadata: {
              subscription_id: subscription.id,
              stripe_status: subscription.status,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenant_id;
        
        console.log(`Subscription cancelled: ${subscription.id}`);

        if (tenantId) {
          await supabase
            .from("tenants")
            .update({
              subscription_status: "cancelled",
              stripe_subscription_id: null,
            })
            .eq("id", tenantId);

          // Registrar no histórico
          await supabase.from("subscription_history").insert({
            tenant_id: tenantId,
            event_type: "subscription_cancelled",
            new_status: "cancelled",
            stripe_event_id: event.id,
            metadata: {
              subscription_id: subscription.id,
              message: "Assinatura cancelada",
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        
        console.log(`Invoice paid: ${invoice.id}`);

        if (tenantId && invoice.billing_reason !== "subscription_create") {
          // Registrar renovação
          await supabase.from("subscription_history").insert({
            tenant_id: tenantId,
            event_type: "payment_received",
            new_status: "active",
            amount: invoice.amount_paid / 100,
            stripe_event_id: event.id,
            metadata: {
              invoice_id: invoice.id,
              message: "Pagamento da assinatura recebido",
            },
          });

          // Garantir status ativo
          await supabase
            .from("tenants")
            .update({ subscription_status: "active" })
            .eq("id", tenantId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        
        console.log(`Invoice payment failed: ${invoice.id}`);

        if (tenantId) {
          await supabase
            .from("tenants")
            .update({
              subscription_status: "past_due",
              grace_period_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq("id", tenantId);

          // Registrar falha
          await supabase.from("subscription_history").insert({
            tenant_id: tenantId,
            event_type: "payment_failed",
            new_status: "past_due",
            stripe_event_id: event.id,
            metadata: {
              invoice_id: invoice.id,
              message: "Falha no pagamento da assinatura",
            },
          });

          // Enviar notificação por email aos admins
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-subscription-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "payment_failed",
                tenant_id: tenantId,
                metadata: {
                  invoice_id: invoice.id,
                  amount: invoice.amount_due / 100,
                },
              }),
            });
            console.log(`Payment failed notification sent for tenant: ${tenantId}`);
          } catch (notifError) {
            console.error("Error sending payment failed notification:", notifError);
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);

        // Buscar fatura pelo payment_intent_id
        const { data: fatura } = await supabase
          .from("faturas")
          .select("id, status")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();

        if (fatura && fatura.status !== "Paga") {
          await supabase
            .from("faturas")
            .update({ status: "Paga" })
            .eq("id", fatura.id);

          console.log(`Fatura ${fatura.id} atualizada via payment_intent.succeeded`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent failed: ${paymentIntent.id}`);
        console.log(`Motivo: ${paymentIntent.last_payment_error?.message}`);

        // Buscar fatura pelo payment_intent_id
        const { data: fatura } = await supabase
          .from("faturas")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();

        if (fatura) {
          // Criar notificação de falha
          await supabase.from("notifications").insert({
            title: "Falha no pagamento",
            message: `Pagamento falhou: ${paymentIntent.last_payment_error?.message || "Erro desconhecido"}`,
            type: "error",
            link: "/faturas",
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const faturaId = session.metadata?.fatura_id;

        console.log(`Checkout expirado - Fatura: ${faturaId}`);

        if (faturaId) {
          // Limpar dados do checkout expirado
          await supabase
            .from("faturas")
            .update({
              stripe_checkout_session_id: null,
              payment_url: null,
            })
            .eq("id", faturaId);
        }
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    logStatus = 'processed';

    // Log webhook event
    await supabase.from("webhook_logs").insert({
      source: "stripe",
      event_type: eventType,
      payload,
      status: logStatus,
      processing_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no webhook:", error);
    logStatus = 'failed';

    // Log failed webhook event
    await supabase.from("webhook_logs").insert({
      source: "stripe",
      event_type: eventType || 'unknown',
      payload: payload || {},
      status: logStatus,
      error_message: errorMessage,
      processing_time_ms: Date.now() - startTime,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
