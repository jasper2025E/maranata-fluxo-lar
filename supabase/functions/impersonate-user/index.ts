import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImpersonateRequest {
  action: "start" | "get_users";
  target_user_id?: string;
  tenant_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is a platform_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestingUserId = userData.user.id;

    // Check if requesting user is platform_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId)
      .single();

    if (roleError || roleData?.role !== "platform_admin") {
      return new Response(
        JSON.stringify({ error: "Only platform admins can impersonate users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ImpersonateRequest = await req.json();
    const { action, target_user_id, tenant_id } = body;

    if (action === "get_users") {
      // Get users for a specific tenant or all users
      let query = supabaseAdmin
        .from("profiles")
        .select(`
          id,
          nome,
          email,
          tenant_id,
          user_roles!inner(role)
        `)
        .neq("user_roles.role", "platform_admin");

      if (tenant_id) {
        query = query.eq("tenant_id", tenant_id);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "start") {
      if (!target_user_id) {
        return new Response(
          JSON.stringify({ error: "Target user ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent impersonating another platform_admin
      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", target_user_id)
        .single();

      if (targetRole?.role === "platform_admin") {
        return new Response(
          JSON.stringify({ error: "Cannot impersonate another platform admin" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get target user info
      const { data: targetUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(target_user_id);

      if (targetError || !targetUser) {
        return new Response(
          JSON.stringify({ error: "Target user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a magic link for impersonation
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: targetUser.user.email!,
        options: {
          redirectTo: `${req.headers.get("origin")}/dashboard?impersonated=true`,
        },
      });

      if (linkError) {
        console.error("Error generating link:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to generate impersonation link" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the impersonation action
      await supabaseAdmin.from("audit_logs").insert({
        user_id: requestingUserId,
        acao: "impersonate_start",
        tabela: "auth.users",
        registro_id: target_user_id,
        dados_novos: {
          target_email: targetUser.user.email,
          platform_admin_id: requestingUserId,
          platform_admin_email: userData.user.email,
        },
      });

      // Extract token from the link
      const url = new URL(linkData.properties.action_link);
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      return new Response(
        JSON.stringify({
          success: true,
          impersonation_url: linkData.properties.action_link,
          token_hash: tokenHash,
          type: type,
          target_user: {
            id: targetUser.user.id,
            email: targetUser.user.email,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
