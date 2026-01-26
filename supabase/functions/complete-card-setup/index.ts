import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteCardRequest {
  tenant_id: string;
  payment_intent_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPESECRETAPI");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Sistema de pagamentos não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { tenant_id, payment_intent_id }: CompleteCardRequest = await req.json();

    if (!tenant_id || !payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Escola não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retrieve the PaymentIntent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: "Pagamento da verificação não foi concluído" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentMethodId = paymentIntent.payment_method as string;

    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: "Método de pagamento não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set as default payment method for the customer
    await stripe.customers.update(tenant.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Save payment method to database
    await supabaseAdmin.from("tenant_payment_methods").upsert({
      tenant_id: tenant.id,
      stripe_payment_method_id: paymentMethodId,
      card_brand: paymentMethod.card?.brand || "unknown",
      card_last_four: paymentMethod.card?.last4 || "****",
      card_exp_month: paymentMethod.card?.exp_month || 1,
      card_exp_year: paymentMethod.card?.exp_year || 2030,
      is_default: true,
    }, { onConflict: 'tenant_id,stripe_payment_method_id' });

    // Enable auto billing now that card is verified and R$1.00 was charged
    await supabaseAdmin
      .from("tenants")
      .update({
        auto_billing_enabled: true,
      })
      .eq("id", tenant.id);

    // Log the successful verification
    await supabaseAdmin.from("subscription_history").insert({
      tenant_id: tenant.id,
      event_type: "card_verified",
      new_status: tenant.subscription_status,
      amount: 100, // R$1.00
      metadata: {
        payment_intent_id: paymentIntent.id,
        payment_method_id: paymentMethodId,
        card_brand: paymentMethod.card?.brand,
        card_last_four: paymentMethod.card?.last4,
        auto_billing_enabled: true,
        verification_charge: "R$1,00 cobrado com sucesso",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cartão verificado com sucesso! R$1,00 foi cobrado.",
        card_brand: paymentMethod.card?.brand,
        card_last_four: paymentMethod.card?.last4,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Complete card setup error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao finalizar verificação do cartão" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
