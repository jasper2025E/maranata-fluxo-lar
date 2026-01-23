import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  action: "create" | "update" | "delete";
  email: string;
  password?: string;
  nome: string;
  role: "admin" | "staff" | "financeiro" | "secretaria" | "platform_admin";
  userId?: string;
  tenant_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user using admin client getUser
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !userData?.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const requestingUserId = userData.user.id;

    console.log("admin-manage-users: request", {
      requestingUserId,
      method: req.method,
      url: req.url,
    });

    // Check if requesting user is admin or platform_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId);

    const userRoles = roleData?.map(r => r.role) || [];
    const isAdmin = userRoles.includes("admin");
    const isPlatformAdmin = userRoles.includes("platform_admin");

    if (roleError) {
      console.error("admin-manage-users: role lookup error", {
        requestingUserId,
        roleError,
      });
    }

    console.log("admin-manage-users: roles", {
      requestingUserId,
      userRoles,
      isAdmin,
      isPlatformAdmin,
    });

    if (roleError || (!isAdmin && !isPlatformAdmin)) {
      console.warn("admin-manage-users: access denied", {
        requestingUserId,
        userRoles,
      });
      return new Response(
        JSON.stringify({ error: "Only admins can manage users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateUserRequest = await req.json();
    const { action, email, password, nome, role, userId, tenant_id } = body;

    console.log("admin-manage-users: action", {
      requestingUserId,
      action,
      targetUserId: userId ?? null,
      targetRole: role,
      hasTenantId: Boolean(tenant_id),
    });

    if (action === "create") {
      if (!email || !password || !nome || !role) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only platform_admin can create platform_admin users
      if (role === "platform_admin" && !isPlatformAdmin) {
        return new Response(
          JSON.stringify({ error: "Only platform admins can create platform admin users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create the user using admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create profile with optional tenant_id
      const profileData: { id: string; email: string; nome: string; tenant_id?: string } = {
        id: newUser.user.id,
        email,
        nome,
      };
      
      // If tenant_id is provided, include it
      if (tenant_id) {
        profileData.tenant_id = tenant_id;
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert(profileData);

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      // Assign role
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role,
        });

      if (roleInsertError) {
        console.error("Error assigning role:", roleInsertError);
        // Rollback: delete the user if role assignment fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(
          JSON.stringify({ error: "Failed to assign role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: newUser.user.id, 
            email: newUser.user.email,
            nome,
            role 
          } 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID is required for update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user metadata if nome provided
      if (nome) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: { nome } }
        );

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile
        await supabaseAdmin
          .from("profiles")
          .update({ nome })
          .eq("id", userId);
      }

      // Update password if provided
      if (password) {
        const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password }
        );

        if (pwError) {
          return new Response(
            JSON.stringify({ error: pwError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Update role if provided
      if (role) {
        // Delete existing role
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Insert new role
        const { error: roleUpdateError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            role,
          });

        if (roleUpdateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID is required for delete" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent self-deletion
      if (userId === requestingUserId) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete user (cascade will handle profiles and roles)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
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
