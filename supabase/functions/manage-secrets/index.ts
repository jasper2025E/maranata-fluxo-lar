import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for role checking
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // SECURITY: Only platform_admin can access system secrets
    // School admins MUST NOT see platform API credentials
    // ============================================
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isPlatformAdmin = roles?.some((r) => r.role === "platform_admin");
    
    if (!isPlatformAdmin) {
      console.error(`Access denied: User ${user.id} (${user.email}) attempted to access manage-secrets`);
      return new Response(
        JSON.stringify({ error: "Acesso restrito. Esta função é exclusiva para administradores da plataforma." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, secretName, secretValue } = await req.json();

    if (action === "list") {
      // Return list of configured secrets with masked values
      const secrets = {
        ASAAS_API_KEY: {
          configured: !!Deno.env.get("ASAAS_API_KEY"),
          maskedValue: maskSecret(Deno.env.get("ASAAS_API_KEY") || ""),
          prefix: Deno.env.get("ASAAS_API_KEY")?.substring(0, 10) || "",
        },
        STRIPE_SECRET_KEY: {
          configured: !!Deno.env.get("STRIPE_SECRET_KEY"),
          maskedValue: maskSecret(Deno.env.get("STRIPE_SECRET_KEY") || ""),
          prefix: Deno.env.get("STRIPE_SECRET_KEY")?.substring(0, 10) || "",
        },
        STRIPE_PUBLIC_KEY: {
          configured: !!Deno.env.get("STRIPE_PUBLIC_KEY"),
          maskedValue: maskSecret(Deno.env.get("STRIPE_PUBLIC_KEY") || ""),
          prefix: Deno.env.get("STRIPE_PUBLIC_KEY")?.substring(0, 10) || "",
        },
        STRIPE_WEBHOOK_SECRET: {
          configured: !!Deno.env.get("STRIPE_WEBHOOK_SECRET"),
          maskedValue: maskSecret(Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""),
          prefix: Deno.env.get("STRIPE_WEBHOOK_SECRET")?.substring(0, 10) || "",
        },
        ASAAS_WEBHOOK_TOKEN: {
          configured: !!Deno.env.get("ASAAS_WEBHOOK_TOKEN"),
          maskedValue: maskSecret(Deno.env.get("ASAAS_WEBHOOK_TOKEN") || ""),
          prefix: Deno.env.get("ASAAS_WEBHOOK_TOKEN")?.substring(0, 10) || "",
        },
        RESEND_API_KEY: {
          configured: !!Deno.env.get("RESEND_API_KEY"),
          maskedValue: maskSecret(Deno.env.get("RESEND_API_KEY") || ""),
          prefix: Deno.env.get("RESEND_API_KEY")?.substring(0, 10) || "",
        },
      };

      return new Response(
        JSON.stringify({ secrets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "test") {
      // Test connection to external services
      if (secretName === "ASAAS_API_KEY") {
        const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
        if (!asaasApiKey) {
          return new Response(
            JSON.stringify({ success: false, error: "Chave não configurada" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isProduction = !asaasApiKey.includes("sandbox");
        const baseUrl = isProduction 
          ? "https://api.asaas.com/v3" 
          : "https://sandbox.asaas.com/api/v3";

        try {
          const response = await fetch(`${baseUrl}/finance/balance`, {
            headers: {
              "access_token": asaasApiKey,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: "Conexão estabelecida com sucesso",
                environment: isProduction ? "production" : "sandbox",
                balance: data.balance,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            const errorData = await response.text();
            return new Response(
              JSON.stringify({ success: false, error: `Erro na API: ${response.status}`, details: errorData }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
          return new Response(
            JSON.stringify({ success: false, error: `Erro de conexão: ${errorMessage}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      if (secretName === "STRIPE_SECRET_KEY") {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
          return new Response(
            JSON.stringify({ success: false, error: "Chave não configurada" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          const response = await fetch("https://api.stripe.com/v1/balance", {
            headers: {
              "Authorization": `Bearer ${stripeSecretKey}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const isLive = stripeSecretKey.startsWith("sk_live_");
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: "Conexão estabelecida com sucesso",
                environment: isLive ? "production" : "test",
                currency: data.available?.[0]?.currency?.toUpperCase() || "N/A",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            return new Response(
              JSON.stringify({ success: false, error: `Erro na API: ${response.status}` }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
          return new Response(
            JSON.stringify({ success: false, error: `Erro de conexão: ${errorMessage}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: "Secret não suportado para teste" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in manage-secrets:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function maskSecret(secret: string): string {
  if (!secret) return "••••••••";
  if (secret.length <= 8) return "••••••••";
  if (secret.length <= 16) {
    // For secrets between 9-16 chars, show first 4, mask middle, show last 4
    const middleLength = Math.max(0, secret.length - 8);
    return secret.substring(0, 4) + "•".repeat(middleLength) + secret.slice(-4);
  }
  // For longer secrets, show first 8, mask middle (max 20), show last 4
  const repeatCount = Math.max(0, Math.min(20, secret.length - 12));
  return secret.substring(0, 8) + "•".repeat(repeatCount) + secret.slice(-4);
}
