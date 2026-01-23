import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPESECRETAPI");
    if (!stripeSecretKey) {
      throw new Error("Stripe não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { tenantId, paymentMethodId, setupIntentId } = await req.json();

    if (!tenantId || !setupIntentId) {
      throw new Error("Dados obrigatórios não fornecidos");
    }

    // Retrieve SetupIntent to get payment method
    console.log("Retrieving SetupIntent:", setupIntentId);
    
    const setupIntentResponse = await fetch(
      `https://api.stripe.com/v1/setup_intents/${setupIntentId}`,
      {
        headers: { "Authorization": `Bearer ${stripeSecretKey}` },
      }
    );

    const setupIntent = await setupIntentResponse.json();

    if (setupIntent.error) {
      throw new Error(setupIntent.error.message);
    }

    if (setupIntent.status !== "succeeded") {
      throw new Error("SetupIntent não foi confirmado com sucesso");
    }

    const pmId = paymentMethodId || setupIntent.payment_method;

    if (!pmId) {
      throw new Error("Método de pagamento não encontrado");
    }

    // Get payment method details from Stripe
    const pmResponse = await fetch(
      `https://api.stripe.com/v1/payment_methods/${pmId}`,
      {
        headers: { "Authorization": `Bearer ${stripeSecretKey}` },
      }
    );

    const paymentMethod = await pmResponse.json();

    if (paymentMethod.error) {
      throw new Error(paymentMethod.error.message);
    }

    const card = paymentMethod.card;

    // Set as default payment method on customer
    const customerId = setupIntent.customer;
    
    await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "invoice_settings[default_payment_method]": pmId,
      }),
    });

    // Remove old payment methods from database
    await supabase
      .from("tenant_payment_methods")
      .delete()
      .eq("tenant_id", tenantId);

    // Save new payment method to database
    const { error: insertError } = await supabase
      .from("tenant_payment_methods")
      .insert({
        tenant_id: tenantId,
        stripe_payment_method_id: pmId,
        card_brand: card.brand,
        card_last_four: card.last4,
        card_exp_month: card.exp_month,
        card_exp_year: card.exp_year,
        is_default: true,
      });

    if (insertError) {
      console.error("Error saving payment method:", insertError);
      throw new Error("Erro ao salvar método de pagamento");
    }

    // Enable auto billing on tenant
    await supabase
      .from("tenants")
      .update({ 
        auto_billing_enabled: true,
        stripe_customer_id: customerId,
      })
      .eq("id", tenantId);

    // Log to subscription history
    await supabase.from("subscription_history").insert({
      tenant_id: tenantId,
      event_type: "payment_method_added",
      metadata: {
        card_brand: card.brand,
        card_last_four: card.last4,
      },
    });

    console.log("Payment method saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        card: {
          brand: card.brand,
          last4: card.last4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no stripe-save-payment-method:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
