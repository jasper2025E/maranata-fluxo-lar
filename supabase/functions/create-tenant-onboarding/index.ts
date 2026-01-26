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

type AdminUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

async function findUserByEmail(
  // Deno edge functions don't have generated DB typings; keep this permissive.
  supabaseAdmin: any,
  email: string
): Promise<AdminUser | null> {
  const emailLower = email.trim().toLowerCase();
  // We avoid relying on a single page to prevent false negatives.
  const perPage = 200;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = (data?.users || []) as AdminUser[];
    const match = users.find((u) => (u.email || "").toLowerCase() === emailLower);
    if (match) return match;

    if (users.length < perPage) break;
  }
  return null;
}

async function isOrphanUser(
  supabaseAdmin: any,
  userId: string
): Promise<boolean> {
  // Orphan = auth user exists but there is no valid profile+tenant binding.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  if (!profile) return true;
  const tenantId = (profile as any).tenant_id as string | null | undefined;
  if (!tenantId) return true;

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantError) throw tenantError;

  return !tenant;
}

async function cleanupOrphanUser(
  supabaseAdmin: any,
  userId: string
) {
  // Best-effort cleanup. Ignore errors to avoid blocking onboarding retries.
  try {
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  } catch {
    // ignore
  }
  try {
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
  } catch {
    // ignore
  }
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch {
    // ignore
  }
}

async function getTenantById(supabaseAdmin: any, tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(
      "id, nome, email, plano, stripe_customer_id, auto_billing_enabled, subscription_status, trial_ends_at"
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureStripeCustomer(
  stripe: Stripe,
  existingCustomerId: string | null | undefined,
  schoolName: string,
  email: string,
  cnpj?: string | null
): Promise<string> {
  let customerId = existingCustomerId || null;

  // Validate existing customer id
  if (customerId) {
    try {
      const customer = (await stripe.customers.retrieve(customerId)) as any;
      // Stripe returns either a Customer or DeletedCustomer
      if (customer?.deleted) customerId = null;
    } catch {
      customerId = null;
    }
  }

  if (!customerId) {
    const created = await stripe.customers.create({
      email,
      name: schoolName,
      metadata: {
        escola_nome: schoolName,
        cnpj: cnpj || "",
      },
    });
    customerId = created.id;
  }

  if (!customerId) {
    throw new Error("Não foi possível criar/obter customer no Stripe");
  }

  return customerId;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Track created resources for catch-all cleanup (edge cases/timeouts between steps)
  let createdStripeCustomerId: string | null = null;
  let createdPaymentIntentId: string | null = null;
  let createdTenantId: string | null = null;
  let createdAuthUserId: string | null = null;

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

    // Publishable key is safe to return to the frontend. We keep it in backend secrets
    // to avoid relying on frontend build-time env (prevents live/test mismatches).
    const stripePublishableKey =
      Deno.env.get("VITE_STRIPE_PUBLISHABLE_KEY") ||
      Deno.env.get("STRIPE_PUBLIC_KEY") ||
      null;

    if (!stripePublishableKey) {
      return new Response(
        JSON.stringify({
          error:
            "Chave publicável do Stripe não configurada. Configure VITE_STRIPE_PUBLISHABLE_KEY (ou STRIPE_PUBLIC_KEY).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretMode = stripeSecretKey.startsWith("sk_live") ? "live" : "test";
    const publishableMode = stripePublishableKey.startsWith("pk_live") ? "live" : "test";
    if (secretMode !== publishableMode) {
      return new Response(
        JSON.stringify({
          error:
            "Configuração do Stripe inconsistente (teste/produção). Ajuste as chaves para o mesmo ambiente.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Check if email already exists (and auto-clean orphan users)
    const existingUser = await findUserByEmail(supabaseAdmin, admin.email);
    if (existingUser) {
      const orphan = await isOrphanUser(supabaseAdmin, existingUser.id);
      if (orphan) {
        await cleanupOrphanUser(supabaseAdmin, existingUser.id);
      } else {
        // If user exists but onboarding wasn't completed (stopped at card step), allow resume.
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("tenant_id")
          .eq("id", existingUser.id)
          .maybeSingle();
        if (profileError) throw profileError;

        const tenantId = (profile as any)?.tenant_id as string | null | undefined;
        if (tenantId) {
          const tenant = await getTenantById(supabaseAdmin, tenantId);
          const canResume =
            tenant &&
            tenant.subscription_status === "trial" &&
            tenant.auto_billing_enabled === false;

          if (canResume) {
            // Create a new SetupIntent for the existing customer (no charge)
            const customerId = await ensureStripeCustomer(
              stripe,
              tenant.stripe_customer_id,
              tenant.nome || escola.nome,
              admin.email,
              escola.cnpj
            );

            // Persist recovered customer id if needed
            if (customerId && customerId !== tenant.stripe_customer_id) {
              await supabaseAdmin
                .from("tenants")
                .update({ stripe_customer_id: customerId })
                .eq("id", tenant.id);
            }

            const setupIntent = await stripe.setupIntents.create({
              customer: customerId,
              payment_method_types: ["card"],
              usage: "off_session",
              metadata: {
                type: "card_verification_resume",
                tenant_id: tenant.id,
                user_id: existingUser.id,
                admin_email: admin.email,
                plan: tenant.plano || "basic",
              },
            });

            return new Response(
              JSON.stringify({
                success: true,
                resume: true,
                tenant_id: tenant.id,
                user_id: existingUser.id,
                trial_ends_at: tenant.trial_ends_at,
                stripe_customer_id: customerId,
                setup_intent_client_secret: setupIntent.client_secret,
                setup_intent_id: setupIntent.id,
                verification_amount: null,
                stripe_publishable_key: stripePublishableKey,
                stripe_mode: secretMode,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({
            error:
              "Este e-mail já está cadastrado. Faça login para continuar ou use 'Esqueci minha senha'.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      createdStripeCustomerId = stripeCustomer.id;
    } catch (stripeError: any) {
      console.error("Error creating Stripe customer:", stripeError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cliente no sistema de pagamentos. Tente novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create a SetupIntent to verify and save the card (NO charge)
    // This validates the card and saves it for future off-session charges
    let setupIntent;
    try {
      setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomer.id,
        payment_method_types: ["card"],
        usage: "off_session", // Save the card for future automatic charges
        metadata: {
          type: "card_verification",
          escola_nome: escola.nome,
          admin_email: admin.email,
          plan: selectedPlan,
        },
      });
      createdPaymentIntentId = setupIntent.id; // Reuse variable for cleanup tracking
    } catch (setupError: any) {
      console.error("Error creating SetupIntent:", setupError);
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
      await stripe.setupIntents.cancel(setupIntent.id).catch(() => {});
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      return new Response(
        JSON.stringify({ error: "Erro ao criar escola. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    createdTenantId = tenant.id;

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
      await stripe.setupIntents.cancel(setupIntent.id).catch(() => {});
      await stripe.customers.del(stripeCustomer.id).catch(() => {});
      
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message || "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    createdAuthUserId = authUser.user.id;

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
      await stripe.setupIntents.cancel(setupIntent.id).catch(() => {});
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
      await stripe.setupIntents.cancel(setupIntent.id).catch(() => {});
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
      amount: 0, // No verification charge
      metadata: {
        admin_email: admin.email,
        escola_nome: escola.nome,
        selected_plan: selectedPlan,
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: stripeCustomer.id,
        setup_intent_id: setupIntent.id,
        verification_charge: "Nenhuma (modo teste)",
      },
    });

    // 9. Create welcome notification
    await supabaseAdmin.from("notifications").insert({
      user_id: authUser.user.id,
      tenant_id: tenant.id,
      title: "Bem-vindo ao sistema!",
      message: `Sua escola ${escola.nome} foi criada com sucesso. Você tem 14 dias de teste grátis no plano ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}. Após o período de teste, a mensalidade será cobrada automaticamente.`,
      type: "success",
      read: false,
    });

    // Return SetupIntent client_secret for frontend to confirm the card (no charge)
    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        user_id: authUser.user.id,
        plan: selectedPlan,
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: stripeCustomer.id,
        setup_intent_client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id,
        verification_amount: null, // No charge
        stripe_publishable_key: stripePublishableKey,
        stripe_mode: secretMode,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    // Catch-all cleanup for edge cases/timeouts between steps.
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      if (createdAuthUserId) {
        await cleanupOrphanUser(supabaseAdmin, createdAuthUserId);
      }

      if (createdTenantId) {
        try {
          await supabaseAdmin.from("tenants").delete().eq("id", createdTenantId);
        } catch {
          // ignore
        }
      }

      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPESECRETAPI");
      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
        if (createdPaymentIntentId) {
          try {
            await stripe.setupIntents.cancel(createdPaymentIntentId);
          } catch {
            // ignore
          }
        }
        if (createdStripeCustomerId) {
          try {
            await stripe.customers.del(createdStripeCustomerId);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore cleanup failures
    }

    console.error("Onboarding error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
