import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingRequest {
  escola: {
    nome: string;
    cnpj: string | null;
    telefone: string;
    endereco: string | null;
  };
  admin: {
    nome: string;
    email: string;
    password: string;
  };
  plan?: string;
  planLimits?: {
    limite_alunos: number;
    limite_usuarios: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
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

    const { escola, admin, plan, planLimits }: OnboardingRequest = await req.json();

    // Validate required fields
    if (!escola?.nome || !escola?.telefone) {
      return new Response(
        JSON.stringify({ error: "Nome e telefone da escola são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!admin?.nome || !admin?.email || !admin?.password) {
      return new Response(
        JSON.stringify({ error: "Nome, e-mail e senha do administrador são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === admin.email.toLowerCase()
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Este e-mail já está cadastrado no sistema" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Use selected plan or default to basic
    const selectedPlan = plan || "basic";
    const limiteAlunos = planLimits?.limite_alunos || 50;
    const limiteUsuarios = planLimits?.limite_usuarios || 3;

    // 1. Create Stripe customer
    let stripeCustomer;
    try {
      stripeCustomer = await stripe.customers.create({
        email: admin.email,
        name: escola.nome,
        metadata: {
          escola_nome: escola.nome,
          cnpj: escola.cnpj || "",
        },
      });
    } catch (stripeError: any) {
      console.error("Error creating Stripe customer:", stripeError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cliente no sistema de pagamentos. Tente novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create a PaymentIntent for R$1.00 verification charge
    // This will charge R$1.00 AND save the card for future use
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: 100, // R$1.00 in centavos
        currency: "brl",
        customer: stripeCustomer.id,
        description: "Verificação de cartão - Taxa de ativação (reembolsável)",
        setup_future_usage: "off_session", // Save the card for future automatic charges
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: "card_verification",
          escola_nome: escola.nome,
          admin_email: admin.email,
          plan: selectedPlan,
        },
      });
    } catch (paymentError: any) {
      console.error("Error creating PaymentIntent:", paymentError);
      // Cleanup Stripe customer
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      return new Response(
        JSON.stringify({ error: "Erro ao configurar verificação do cartão. Tente novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create the tenant with Stripe info
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        nome: escola.nome,
        cnpj: escola.cnpj,
        telefone: escola.telefone,
        endereco: escola.endereco,
        email: admin.email,
        plano: selectedPlan,
        status: "ativo",
        subscription_status: "trial",
        trial_ends_at: trialEndsAt.toISOString(),
        data_contrato: new Date().toISOString().split("T")[0],
        limite_alunos: limiteAlunos,
        limite_usuarios: limiteUsuarios,
        stripe_customer_id: stripeCustomer.id,
        auto_billing_enabled: false, // Will be enabled after card is verified
        billing_day: trialEndsAt.getDate(),
        next_billing_date: trialEndsAt.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Error creating tenant:", tenantError);
      // Cleanup Stripe
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      return new Response(
        JSON.stringify({ error: "Erro ao criar escola. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create the admin user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true, // Auto-confirm email for trial
      user_metadata: {
        nome: admin.nome,
        tenant_id: tenant.id,
      },
    });

    if (authError) {
      // Rollback: delete tenant and Stripe
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message || "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create the profile (upsert to handle edge cases)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authUser.user.id,
        email: admin.email,
        nome: admin.nome,
        tenant_id: tenant.id,
      }, { onConflict: 'id' });

    if (profileError) {
      // Rollback everything
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      
      console.error("Error creating profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil. Por favor, tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authUser.user.id,
        role: "admin",
      });

    if (roleError) {
      // Rollback everything
      await supabaseAdmin.from("profiles").delete().eq("id", authUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      
      console.error("Error assigning role:", roleError);
      return new Response(
        JSON.stringify({ error: "Erro ao configurar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Create escola record (synced with tenant)
    const { error: escolaError } = await supabaseAdmin
      .from("escola")
      .insert({
        nome: escola.nome,
        cnpj: escola.cnpj,
        telefone: escola.telefone,
        endereco: escola.endereco,
        email: admin.email,
        tenant_id: tenant.id,
        ano_letivo: new Date().getFullYear(),
      });

    if (escolaError) {
      console.error("Error creating escola record:", escolaError);
      // Non-critical, don't rollback
    }

    // 8. Log the onboarding event
    await supabaseAdmin.from("subscription_history").insert({
      tenant_id: tenant.id,
      event_type: "onboarding_started",
      new_status: "trial",
      amount: 100, // R$1.00 verification charge
      metadata: {
        admin_email: admin.email,
        escola_nome: escola.nome,
        selected_plan: selectedPlan,
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: stripeCustomer.id,
        payment_intent_id: paymentIntent.id,
        verification_charge: "R$1,00",
      },
    });

    // 9. Create welcome notification
    await supabaseAdmin.from("notifications").insert({
      user_id: authUser.user.id,
      tenant_id: tenant.id,
      title: "Bem-vindo ao sistema!",
      message: `Sua escola ${escola.nome} foi criada com sucesso. Você tem 14 dias de teste grátis no plano ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}. Foi cobrado R$1,00 para verificação do cartão. Após o período de teste, a mensalidade será cobrada automaticamente.`,
      type: "success",
      read: false,
    });

    // Return PaymentIntent client_secret for frontend to confirm the R$1.00 charge
    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        user_id: authUser.user.id,
        plan: selectedPlan,
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: stripeCustomer.id,
        payment_intent_client_secret: paymentIntent.client_secret,
        verification_amount: "R$ 1,00",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
