import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CleanupRequest = {
  dryRun?: boolean;
  maxUsers?: number;
};

type AdminUser = {
  id: string;
  email?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth (must be a logged-in platform admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autorização não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("is_platform_admin", {
      _user_id: user.id,
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CleanupRequest = await req.json().catch(() => ({}));
    const dryRun = Boolean(body.dryRun);
    const maxUsers = Math.max(1, Math.min(5000, body.maxUsers ?? 2000));

    // 1) List auth users (paged)
    const allUsers: AdminUser[] = [];
    const perPage = 200;
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const users = (data?.users || []) as AdminUser[];
      allUsers.push(...users);
      if (allUsers.length >= maxUsers) break;
      if (users.length < perPage) break;
    }

    const users = allUsers.slice(0, maxUsers);
    const userIds = users.map((u) => u.id);

    // 2) Load profiles for these users (batched)
    const profileMap = new Map<string, { tenant_id: string | null }>();
    for (const ids of chunk(userIds, 100)) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, tenant_id")
        .in("id", ids);
      if (error) throw error;
      (data || []).forEach((p: any) => profileMap.set(p.id, { tenant_id: p.tenant_id }));
    }

    const tenantIds = new Set<string>();
    for (const v of profileMap.values()) {
      if (v.tenant_id) tenantIds.add(v.tenant_id);
    }

    // 3) Load tenants referenced
    const tenantMap = new Set<string>();
    for (const ids of chunk(Array.from(tenantIds), 200)) {
      const { data, error } = await supabaseAdmin.from("tenants").select("id").in("id", ids);
      if (error) throw error;
      (data || []).forEach((t: any) => tenantMap.add(t.id));
    }

    // 4) Identify orphans
    const orphans: { id: string; email?: string; reason: string }[] = [];
    for (const u of users) {
      const profile = profileMap.get(u.id);
      if (!profile) {
        orphans.push({ id: u.id, email: u.email, reason: "missing_profile" });
        continue;
      }
      if (!profile.tenant_id) {
        orphans.push({ id: u.id, email: u.email, reason: "missing_tenant_id" });
        continue;
      }
      if (!tenantMap.has(profile.tenant_id)) {
        orphans.push({ id: u.id, email: u.email, reason: "tenant_not_found" });
        continue;
      }
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          scanned: users.length,
          orphanCount: orphans.length,
          sampleEmails: orphans
            .map((o) => o.email)
            .filter(Boolean)
            .slice(0, 10),
          reasons: orphans.reduce((acc: Record<string, number>, o) => {
            acc[o.reason] = (acc[o.reason] || 0) + 1;
            return acc;
          }, {}),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5) Delete orphans (best-effort)
    let deleted = 0;
    const orphanIds = orphans.map((o) => o.id);

    for (const ids of chunk(orphanIds, 100)) {
      // Cleanup DB rows first (in case auth deletion doesn't cascade)
      try {
        await supabaseAdmin.from("user_roles").delete().in("user_id", ids);
      } catch {
        // ignore
      }
      try {
        await supabaseAdmin.from("profiles").delete().in("id", ids);
      } catch {
        // ignore
      }
    }

    for (const id of orphanIds) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (!error) deleted++;
      } catch {
        // ignore
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        scanned: users.length,
        orphanCount: orphans.length,
        deletedCount: deleted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("cleanup-orphan-users error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
