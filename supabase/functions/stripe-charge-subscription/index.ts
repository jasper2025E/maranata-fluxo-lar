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

    // This can be called by cron or manually
    // Check for optional auth header (for manual calls)
    const authHeader = req.headers.get("Authorization");
    let isManualCall = false;
    
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (!authError && user) {
        isManualCall = true;
      }
    }

    const body = await req.json().catch(() => ({}));
    const { tenantId } = body;

    // If tenantId provided, charge specific tenant
    // Otherwise, charge all tenants with billing due today
    let tenantsToCharge = [];

    if (tenantId) {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .eq("auto_billing_enabled", true)
        .single();

      if (error || !tenant) {
        throw new Error("Tenant não encontrado ou cobrança automática desabilitada");
      }

      tenantsToCharge = [tenant];
    } else {
      // Get all tenants with billing due today
      const today = new Date();
      const billingDay = today.getDate();

      const { data: tenants, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("auto_billing_enabled", true)
        .eq("billing_day", billingDay)
        .in("subscription_status", ["active", "trial"]);

      if (error) {
        throw new Error("Erro ao buscar tenants");
      }

      tenantsToCharge = tenants || [];
    }

    console.log(`Processing ${tenantsToCharge.length} tenants for billing`);

    const results = [];

    for (const tenant of tenantsToCharge) {
      try {
        // Get payment method
        const { data: paymentMethod } = await supabase
          .from("tenant_payment_methods")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("is_default", true)
          .single();

        if (!paymentMethod) {
          results.push({
            tenantId: tenant.id,
            success: false,
            error: "Nenhum método de pagamento cadastrado",
          });
          continue;
        }

        // Get plan price
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("price, name")
          .eq("id", tenant.plano)
          .single();

        if (!plan) {
          results.push({
            tenantId: tenant.id,
            success: false,
            error: "Plano não encontrado",
          });
          continue;
        }

        const amount = plan.price; // Already in cents

        console.log(`Charging tenant ${tenant.id}: ${amount} cents for ${plan.name}`);

        // Create PaymentIntent and charge
        const paymentIntentResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            amount: amount.toString(),
            currency: "brl",
            customer: tenant.stripe_customer_id,
            payment_method: paymentMethod.stripe_payment_method_id,
            off_session: "true",
            confirm: "true",
            description: `Assinatura ${plan.name} - ${tenant.nome}`,
            "metadata[tenant_id]": tenant.id,
            "metadata[plan_id]": tenant.plano,
            "metadata[type]": "subscription_renewal",
          }),
        });

        const paymentIntent = await paymentIntentResponse.json();

        if (paymentIntent.error) {
          console.error(`Payment failed for tenant ${tenant.id}:`, paymentIntent.error);

          // Log failed payment
          await supabase.from("subscription_history").insert({
            tenant_id: tenant.id,
            event_type: "payment_failed",
            amount: amount / 100,
            metadata: {
              error: paymentIntent.error.message,
              payment_intent_id: paymentIntent.id,
            },
          });

          // Update tenant status if payment failed
          if (paymentIntent.error.code === "card_declined" || 
              paymentIntent.error.code === "expired_card") {
            await supabase
              .from("tenants")
              .update({ 
                subscription_status: "past_due",
                grace_period_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq("id", tenant.id);
          }

          results.push({
            tenantId: tenant.id,
            success: false,
            error: paymentIntent.error.message,
          });
          continue;
        }

        if (paymentIntent.status === "succeeded") {
          console.log(`Payment succeeded for tenant ${tenant.id}`);

          // Update tenant billing dates
          const nextBillingDate = new Date();
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          nextBillingDate.setDate(tenant.billing_day || 1);

          await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              last_billing_date: new Date().toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              grace_period_ends_at: null,
              blocked_at: null,
              blocked_reason: null,
            })
            .eq("id", tenant.id);

          // Log successful payment
          await supabase.from("subscription_history").insert({
            tenant_id: tenant.id,
            event_type: "payment_received",
            old_status: tenant.subscription_status,
            new_status: "active",
            amount: amount / 100,
            stripe_event_id: paymentIntent.id,
            metadata: {
              payment_intent_id: paymentIntent.id,
              plan_name: plan.name,
              card_last_four: paymentMethod.card_last_four,
            },
          });

          results.push({
            tenantId: tenant.id,
            success: true,
            paymentIntentId: paymentIntent.id,
            amount: amount / 100,
          });
        } else {
          // Payment requires action (3D Secure, etc.)
          results.push({
            tenantId: tenant.id,
            success: false,
            requiresAction: true,
            error: "Pagamento requer autenticação adicional",
          });
        }
      } catch (tenantError) {
        console.error(`Error processing tenant ${tenant.id}:`, tenantError);
        results.push({
          tenantId: tenant.id,
          success: false,
          error: tenantError instanceof Error ? tenantError.message : "Erro desconhecido",
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: tenantsToCharge.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no stripe-charge-subscription:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
