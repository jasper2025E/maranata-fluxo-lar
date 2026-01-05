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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSignature = req.headers.get("stripe-signature");
    const payload = await req.text();

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

    const isValid = await verifyWebhookSignature(payload, stripeSignature, webhookSecret);
    if (!isValid) {
      console.error("Assinatura do webhook inválida");
      return new Response(
        JSON.stringify({ error: "Assinatura inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Assinatura verificada com sucesso");

    const event = JSON.parse(payload);
    console.log(`Evento recebido: ${event.type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const faturaId = session.metadata?.fatura_id;

        console.log(`Checkout completado - Session: ${session.id}, Fatura: ${faturaId}`);

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

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
