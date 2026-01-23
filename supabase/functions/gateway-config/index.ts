import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64, decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = Deno.env.get("GATEWAY_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32);

interface GatewayConfigRequest {
  action: "list" | "create" | "update" | "delete" | "test" | "get_secrets" | "set_secret";
  configId?: string;
  tenantId?: string;
  data?: {
    gateway_type?: string;
    display_name?: string;
    environment?: string;
    is_active?: boolean;
    is_default?: boolean;
    allowed_methods?: string[];
    currency?: string;
    settings?: Record<string, unknown>;
  };
  secret?: {
    key_name: string;
    value: string;
  };
}

// Simple encryption using Web Crypto API
async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return encodeBase64(combined.buffer);
}

async function decrypt(encryptedText: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const combined = decodeBase64(encryptedText);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  return decoder.decode(decrypted);
}

function maskSecret(value: string): string {
  if (!value || value.length < 8) return "••••••••";
  return value.substring(0, 8) + "••••••••" + value.slice(-4);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's tenant and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    const isPlatformAdmin = roles?.some(r => r.role === "platform_admin");

    if (!isAdmin && !isPlatformAdmin) {
      throw new Error("Admin access required");
    }

    const body: GatewayConfigRequest = await req.json();
    const { action, configId, tenantId, data, secret } = body;

    // Determine which tenant to operate on
    const targetTenantId = isPlatformAdmin && tenantId ? tenantId : profile?.tenant_id;

    if (!targetTenantId && !isPlatformAdmin) {
      throw new Error("Tenant not found");
    }

    switch (action) {
      case "list": {
        // List all gateway configurations for tenant
        let query = supabase
          .from("tenant_gateway_configs")
          .select("*")
          .order("created_at", { ascending: false });

        if (targetTenantId) {
          query = query.eq("tenant_id", targetTenantId);
        }

        const { data: configs, error } = await query;

        if (error) throw error;

        // Get masked secrets for each config
        const configsWithSecrets = await Promise.all(
          (configs || []).map(async (config) => {
            const { data: secrets } = await supabase
              .from("tenant_gateway_secrets")
              .select("key_name, key_prefix, last_rotated")
              .eq("gateway_config_id", config.id);

            return {
              ...config,
              secrets: secrets?.map(s => ({
                key_name: s.key_name,
                masked_value: s.key_prefix ? `${s.key_prefix}••••••••` : "••••••••",
                last_rotated: s.last_rotated,
              })) || [],
            };
          })
        );

        return new Response(
          JSON.stringify({ success: true, configs: configsWithSecrets }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        if (!data || !targetTenantId) {
          throw new Error("Data and tenant required");
        }

        const { data: newConfig, error } = await supabase
          .from("tenant_gateway_configs")
          .insert({
            tenant_id: targetTenantId,
            gateway_type: data.gateway_type,
            display_name: data.display_name,
            environment: data.environment || "sandbox",
            is_active: false, // Start inactive until secrets are configured
            is_default: data.is_default || false,
            allowed_methods: data.allowed_methods || ["pix", "boleto"],
            currency: data.currency || "BRL",
            settings: data.settings || {},
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Log transaction
        await supabase.from("gateway_transaction_logs").insert({
          tenant_id: targetTenantId,
          gateway_config_id: newConfig.id,
          operation: "config_created",
          gateway_type: data.gateway_type,
          status: "success",
          request_payload: { display_name: data.display_name },
        });

        return new Response(
          JSON.stringify({ success: true, config: newConfig }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!configId || !data) {
          throw new Error("Config ID and data required");
        }

        const { data: updatedConfig, error } = await supabase
          .from("tenant_gateway_configs")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq("id", configId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, config: updatedConfig }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!configId) {
          throw new Error("Config ID required");
        }

        // Check if gateway has been used
        const { count } = await supabase
          .from("faturas")
          .select("id", { count: "exact", head: true })
          .eq("gateway_config_id", configId);

        if (count && count > 0) {
          // Don't delete, just deactivate
          await supabase
            .from("tenant_gateway_configs")
            .update({ is_active: false, is_default: false })
            .eq("id", configId);

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Gateway desativado (possui faturas vinculadas)" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("tenant_gateway_configs")
          .delete()
          .eq("id", configId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "set_secret": {
        if (!configId || !secret) {
          throw new Error("Config ID and secret required");
        }

        // Encrypt the secret
        const encryptedValue = await encrypt(secret.value);
        const keyPrefix = secret.value.substring(0, 8);

        // Upsert the secret
        const { error } = await supabase
          .from("tenant_gateway_secrets")
          .upsert({
            gateway_config_id: configId,
            key_name: secret.key_name,
            encrypted_value: encryptedValue,
            key_prefix: keyPrefix,
            last_rotated: new Date().toISOString(),
          }, {
            onConflict: "gateway_config_id,key_name",
          });

        if (error) throw error;

        // Log (without the secret value)
        const { data: config } = await supabase
          .from("tenant_gateway_configs")
          .select("tenant_id, gateway_type")
          .eq("id", configId)
          .single();

        if (config) {
          await supabase.from("gateway_transaction_logs").insert({
            tenant_id: config.tenant_id,
            gateway_config_id: configId,
            operation: "secret_updated",
            gateway_type: config.gateway_type,
            status: "success",
            request_payload: { key_name: secret.key_name },
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            masked_value: maskSecret(secret.value) 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_secrets": {
        // Only returns decrypted secrets for internal use (testing connection)
        if (!configId) {
          throw new Error("Config ID required");
        }

        const { data: secrets, error } = await supabase
          .from("tenant_gateway_secrets")
          .select("key_name, encrypted_value")
          .eq("gateway_config_id", configId);

        if (error) throw error;

        const decryptedSecrets: Record<string, string> = {};
        
        for (const s of secrets || []) {
          try {
            decryptedSecrets[s.key_name] = await decrypt(s.encrypted_value);
          } catch (e) {
            console.error(`Failed to decrypt ${s.key_name}:`, e);
          }
        }

        return new Response(
          JSON.stringify({ success: true, secrets: decryptedSecrets }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "test": {
        if (!configId) {
          throw new Error("Config ID required");
        }

        // Get config and secrets
        const { data: config } = await supabase
          .from("tenant_gateway_configs")
          .select("*")
          .eq("id", configId)
          .single();

        if (!config) {
          throw new Error("Config not found");
        }

        const { data: secrets } = await supabase
          .from("tenant_gateway_secrets")
          .select("key_name, encrypted_value")
          .eq("gateway_config_id", configId);

        const decryptedSecrets: Record<string, string> = {};
        for (const s of secrets || []) {
          try {
            decryptedSecrets[s.key_name] = await decrypt(s.encrypted_value);
          } catch (e) {
            console.error(`Failed to decrypt ${s.key_name}:`, e);
          }
        }

        let testResult = { success: false, message: "", environment: "" };
        const startTime = Date.now();

        // Test based on gateway type
        switch (config.gateway_type) {
          case "asaas": {
            const apiKey = decryptedSecrets["api_key"];
            if (!apiKey) {
              testResult = {
                success: false,
                message: "Configure a API Key antes de testar",
                environment: config.environment,
              };
              break;
            }

            const isProduction = config.environment === "production" || !apiKey.includes("sandbox");
            const baseUrl = isProduction 
              ? "https://api.asaas.com/v3" 
              : "https://sandbox.asaas.com/api/v3";

            const response = await fetch(`${baseUrl}/finance/balance`, {
              headers: { "access_token": apiKey },
            });

            if (response.ok) {
              const data = await response.json();
              testResult = {
                success: true,
                message: `Saldo: R$ ${data.balance?.toFixed(2) || "0.00"}`,
                environment: isProduction ? "production" : "sandbox",
              };
            } else {
              testResult = {
                success: false,
                message: `Erro: ${response.status}`,
                environment: config.environment,
              };
            }
            break;
          }

          case "mercado_pago": {
            const accessToken = decryptedSecrets["access_token"];
            if (!accessToken) {
              testResult = {
                success: false,
                message: "Configure o Access Token antes de testar",
                environment: config.environment,
              };
              break;
            }

            const response = await fetch("https://api.mercadopago.com/users/me", {
              headers: { 
                "Authorization": `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              testResult = {
                success: true,
                message: `Conta: ${data.email || data.nickname}`,
                environment: accessToken.startsWith("TEST-") ? "sandbox" : "production",
              };
            } else {
              testResult = {
                success: false,
                message: `Erro: ${response.status}`,
                environment: config.environment,
              };
            }
            break;
          }

          default:
            testResult = {
              success: false,
              message: "Gateway não suportado para teste",
              environment: config.environment,
            };
        }

        const duration = Date.now() - startTime;

        // Update connection status
        await supabase
          .from("tenant_gateway_configs")
          .update({
            last_connection_test: new Date().toISOString(),
            connection_status: testResult.success ? "connected" : "error",
            connection_error: testResult.success ? null : testResult.message,
          })
          .eq("id", configId);

        // Log
        await supabase.from("gateway_transaction_logs").insert({
          tenant_id: config.tenant_id,
          gateway_config_id: configId,
          operation: "connection_test",
          gateway_type: config.gateway_type,
          status: testResult.success ? "success" : "failed",
          error_message: testResult.success ? null : testResult.message,
          duration_ms: duration,
        });

        return new Response(
          JSON.stringify({ success: true, result: testResult }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Gateway config error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
