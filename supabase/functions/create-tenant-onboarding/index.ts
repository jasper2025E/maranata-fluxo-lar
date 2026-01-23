import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { escola, admin }: OnboardingRequest = await req.json();

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

    // 1. Create the tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        nome: escola.nome,
        cnpj: escola.cnpj,
        telefone: escola.telefone,
        endereco: escola.endereco,
        email: admin.email,
        plano: "basic",
        status: "ativo",
        subscription_status: "trial",
        trial_ends_at: trialEndsAt.toISOString(),
        data_contrato: new Date().toISOString().split("T")[0],
        limite_alunos: 50, // Basic plan limit
        limite_usuarios: 3, // Basic plan limit
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Error creating tenant:", tenantError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar escola. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create the admin user
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
      // Rollback: delete tenant
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message || "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create the profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authUser.user.id,
        email: admin.email,
        nome: admin.nome,
        tenant_id: tenant.id,
      });

    if (profileError) {
      // Rollback: delete user and tenant
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      
      console.error("Error creating profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Assign admin role
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
      
      console.error("Error assigning role:", roleError);
      return new Response(
        JSON.stringify({ error: "Erro ao configurar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create escola record (synced with tenant)
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

    // 6. Log the onboarding event
    await supabaseAdmin.from("subscription_history").insert({
      tenant_id: tenant.id,
      event_type: "onboarding_completed",
      new_status: "trial",
      metadata: {
        admin_email: admin.email,
        escola_nome: escola.nome,
        trial_ends_at: trialEndsAt.toISOString(),
      },
    });

    // 7. Create welcome notification
    await supabaseAdmin.from("notifications").insert({
      user_id: authUser.user.id,
      tenant_id: tenant.id,
      title: "Bem-vindo ao Wevessistem!",
      message: `Sua escola ${escola.nome} foi criada com sucesso. Você tem 14 dias de teste grátis.`,
      type: "success",
      read: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        user_id: authUser.user.id,
        trial_ends_at: trialEndsAt.toISOString(),
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
