import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

// Stripe webhooks come from Stripe servers, not browsers
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

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET não configurado");
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

    // ============================================================
    // STRIPE PROCESSA APENAS ASSINATURAS DO SISTEMA (SaaS)
    // Pagamentos de faturas de alunos são via Asaas
    // ============================================================

    switch (event.type) {
      // Checkout de assinatura completado
      case "checkout.session.completed": {
        const session = event.data.object;
        const tenantId = session.metadata?.tenant_id;
        const planId = session.metadata?.plan_id;

        // APENAS processar se for checkout de assinatura (mode: subscription)
        if (session.mode !== "subscription") {
          console.log(`Ignorando checkout não-assinatura: ${session.id}, mode: ${session.mode}`);
          break;
        }

        if (!tenantId) {
          console.log(`Checkout de assinatura sem tenant_id, ignorando`);
          break;
        }

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
            grace_period_ends_at: null,
            blocked_at: null,
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
        break;
      }

      // Assinatura atualizada
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenant_id;
        
        if (!tenantId) {
          console.log("Subscription update sem tenant_id, ignorando");
          break;
        }

        console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

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
        break;
      }

      // Assinatura cancelada
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenant_id;
        
        if (!tenantId) {
          console.log("Subscription delete sem tenant_id, ignorando");
          break;
        }

        console.log(`Subscription cancelled: ${subscription.id}`);

        await supabase
          .from("tenants")
          .update({
            subscription_status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("id", tenantId);

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
        break;
      }

      // Fatura de assinatura paga
      case "invoice.paid": {
        const invoice = event.data.object;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        
        if (!tenantId) {
          console.log("Invoice paid sem tenant_id, ignorando");
          break;
        }

        console.log(`Invoice paid: ${invoice.id}`);

        // Ignorar primeira fatura (já processada no checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") {
          console.log("Ignorando invoice de criação de assinatura");
          break;
        }

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

        // Calculate next billing date and ensure auto-billing is enabled
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Garantir status ativo, limpar bloqueios, e configurar próxima cobrança
        await supabase
          .from("tenants")
          .update({ 
            subscription_status: "active",
            grace_period_ends_at: null,
            blocked_at: null,
            blocked_reason: null,
            next_billing_date: nextBillingDate.toISOString().split("T")[0],
            auto_billing_enabled: true,
          })
          .eq("id", tenantId);
        break;
      }

      // Falha no pagamento da assinatura
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        
        if (!tenantId) {
          console.log("Invoice payment_failed sem tenant_id, ignorando");
          break;
        }

        console.log(`Invoice payment failed: ${invoice.id}`);

        await supabase
          .from("tenants")
          .update({
            subscription_status: "past_due",
            grace_period_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", tenantId);

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

        // Criar notificação no sistema
        await supabase.from("notifications").insert({
          tenant_id: tenantId,
          title: "Falha no Pagamento da Assinatura",
          message: `Não foi possível processar o pagamento de R$ ${(invoice.amount_due / 100).toFixed(2)}. Atualize seus dados de pagamento.`,
          type: "error",
          link: "/configuracoes"
        });

        // Enviar notificação por email
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
