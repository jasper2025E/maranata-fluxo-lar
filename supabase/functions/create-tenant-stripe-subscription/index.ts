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

    // Check if user is platform admin
    const { data: isAdmin } = await supabase.rpc("is_platform_admin", { _user_id: user.id });
    if (!isAdmin) {
      throw new Error("Acesso negado");
    }

    const { tenantId } = await req.json();

    if (!tenantId) {
      throw new Error("Tenant ID é obrigatório");
    }

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tenantError) {
      console.error("Erro ao buscar tenant:", tenantError);
      throw new Error("Tenant não encontrado");
    }

    if (!tenant) {
      throw new Error("Tenant não encontrado");
    }

    if (!tenant.stripe_customer_id) {
      throw new Error("Tenant não possui customer ID no Stripe");
    }

    if (tenant.stripe_subscription_id) {
      throw new Error("Tenant já possui uma subscription ativa");
    }

    // Get price - use monthly_price from tenant (in centavos)
    const amount = (tenant.monthly_price || 170) * 100; // Convert to centavos if not already
    let priceId: string | null = null;

    if (!priceId) {
      // Create a price in Stripe
      console.log("Criando price no Stripe...");
      
      // First, get or create product
      const productSearch = await fetch(
        `https://api.stripe.com/v1/products?active=true&limit=1`,
        {
          headers: { "Authorization": `Bearer ${stripeSecretKey}` },
        }
      );
      const products = await productSearch.json();
      
      let productId: string;
      if (products.data && products.data.length > 0) {
        productId = products.data[0].id;
      } else {
        // Create product
        const createProduct = await fetch(
          "https://api.stripe.com/v1/products",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${stripeSecretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              name: "Assinatura Maranata",
              description: "Assinatura mensal do sistema",
            }),
          }
        );
        const newProduct = await createProduct.json();
        productId = newProduct.id;
      }

      // Create recurring price
      const createPrice = await fetch(
        "https://api.stripe.com/v1/prices",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            product: productId,
            unit_amount: String(amount),
            currency: "brl",
            "recurring[interval]": "month",
            nickname: tenant.plano || "pro",
          }),
        }
      );
      const newPrice = await createPrice.json();
      
      if (newPrice.error) {
        throw new Error(`Erro ao criar price: ${newPrice.error.message}`);
      }
      
      priceId = newPrice.id;
      console.log("Price criado:", priceId);
    }

    // Create subscription
    console.log("Criando subscription no Stripe...");
    const subscriptionResponse = await fetch(
      "https://api.stripe.com/v1/subscriptions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: tenant.stripe_customer_id,
          "items[0][price]": priceId!,
          payment_behavior: "default_incomplete",
          "payment_settings[save_default_payment_method]": "on_subscription",
          "expand[0]": "latest_invoice.payment_intent",
        }),
      }
    );

    const subscription = await subscriptionResponse.json();

    if (subscription.error) {
      throw new Error(`Erro ao criar subscription: ${subscription.error.message}`);
    }

    console.log("Subscription criada:", subscription.id);

    // Update tenant with subscription ID
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status === "active" ? "active" : 
                            subscription.status === "trialing" ? "trial" : "past_due",
        next_billing_date: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString().split("T")[0]
          : null,
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("Erro ao atualizar tenant:", updateError);
    }

    // Log the action
    await supabase.from("subscription_history").insert({
      tenant_id: tenantId,
      event_type: "subscription_created_manual",
      old_status: tenant.subscription_status,
      new_status: subscription.status,
      amount: amount,
      metadata: {
        subscription_id: subscription.id,
        price_id: priceId,
        created_by: user.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
