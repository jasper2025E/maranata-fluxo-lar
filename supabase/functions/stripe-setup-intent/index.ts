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

    // ============================================
    // SECURITY: Validate user is authenticated
    // ============================================
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

    const { tenantId } = await req.json();

    if (!tenantId) {
      throw new Error("ID do tenant é obrigatório");
    }

    // ============================================
    // SECURITY: Verify user belongs to this tenant
    // Only allow users from the same tenant OR platform_admin
    // ============================================
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const { data: isPlatformAdmin } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .single();

    // User must belong to the tenant OR be a platform_admin
    if (!isPlatformAdmin && userProfile?.tenant_id !== tenantId) {
      console.error(`User ${user.id} attempted to access tenant ${tenantId} but belongs to ${userProfile?.tenant_id}`);
      return new Response(
        JSON.stringify({ error: "Acesso negado. Você não tem permissão para gerenciar esta escola." }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, nome, email, stripe_customer_id")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error("Escola não encontrada");
    }

    // Create or get Stripe customer
    let customerId = tenant.stripe_customer_id;

    if (!customerId) {
      // Check if customer exists
      const customerCheck = await fetch(
        `https://api.stripe.com/v1/customers/${customerId}`,
        {
          headers: { "Authorization": `Bearer ${stripeSecretKey}` },
        }
      );
      const customerData = await customerCheck.json();

      if (customerData.error || customerData.deleted) {
        customerId = null;
      }
    }

    if (!customerId && tenant.email) {
      console.log("Creating Stripe customer...");
      
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: tenant.email,
          name: tenant.nome || "",
          "metadata[tenant_id]": tenantId,
        }),
      });

      const customer = await customerResponse.json();
      
      if (customer.error) {
        throw new Error(customer.error.message);
      }

      customerId = customer.id;

      // Save to tenant
      await supabase
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenantId);
    }

    if (!customerId) {
      throw new Error("Não foi possível criar/obter customer. Verifique se a escola possui email cadastrado.");
    }

    // Create SetupIntent for saving card
    console.log("Creating SetupIntent for tenant:", tenantId);
    
    const setupIntentResponse = await fetch("https://api.stripe.com/v1/setup_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        "payment_method_types[]": "card",
        usage: "off_session",
        "metadata[tenant_id]": tenantId,
        "metadata[user_id]": user.id,
      }),
    });

    const setupIntent = await setupIntentResponse.json();

    if (setupIntent.error) {
      throw new Error(setupIntent.error.message);
    }

    console.log("SetupIntent created:", setupIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no stripe-setup-intent:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
