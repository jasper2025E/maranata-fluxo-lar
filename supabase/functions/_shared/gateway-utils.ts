// Shared utilities for multi-tenant gateway operations
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface GatewayCredentials {
  configId: string;
  gatewayType: string;
  environment: "sandbox" | "production";
  apiKey: string;
  apiUrl: string;
  settings: Record<string, unknown>;
  secrets: Record<string, string>;
}

// Encryption key from environment
const getEncryptionKey = (): string => {
  return Deno.env.get("GATEWAY_ENCRYPTION_KEY") || 
         Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32);
};

// Decrypt secret using AES-256-GCM
async function decryptSecret(encryptedText: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(getEncryptionKey().padEnd(32, '0').substring(0, 32));
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  return decoder.decode(decrypted);
}

// Get Supabase admin client
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

// Get gateway credentials for a tenant
export async function getTenantGatewayCredentials(
  supabase: SupabaseClient,
  tenantId: string,
  gatewayType: "asaas" | "mercado_pago" | "stripe" | string = "asaas"
): Promise<GatewayCredentials | null> {
  // Find active gateway config for tenant
  const { data: config, error: configError } = await supabase
    .from("tenant_gateway_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("gateway_type", gatewayType)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (configError) {
    console.error("Error fetching gateway config:", configError);
    return null;
  }

  if (!config) {
    console.log(`No active ${gatewayType} config for tenant ${tenantId}`);
    return null;
  }

  // Fetch and decrypt secrets
  const { data: secrets, error: secretsError } = await supabase
    .from("tenant_gateway_secrets")
    .select("key_name, encrypted_value")
    .eq("gateway_config_id", config.id);

  if (secretsError) {
    console.error("Error fetching gateway secrets:", secretsError);
    return null;
  }

  const decryptedSecrets: Record<string, string> = {};
  for (const secret of secrets || []) {
    try {
      decryptedSecrets[secret.key_name] = await decryptSecret(secret.encrypted_value);
    } catch (e) {
      console.error(`Failed to decrypt ${secret.key_name}:`, e);
    }
  }

  // Determine API URL based on gateway type and environment
  let apiUrl = "";
  const isProduction = config.environment === "production";

  switch (gatewayType) {
    case "asaas":
      apiUrl = isProduction 
        ? "https://www.asaas.com/api/v3" 
        : "https://sandbox.asaas.com/api/v3";
      break;
    case "mercado_pago":
      apiUrl = "https://api.mercadopago.com";
      break;
    case "stripe":
      apiUrl = "https://api.stripe.com";
      break;
    default:
      apiUrl = config.settings?.api_url as string || "";
  }

  return {
    configId: config.id,
    gatewayType: config.gateway_type,
    environment: config.environment,
    apiKey: decryptedSecrets["api_key"] || decryptedSecrets["access_token"] || decryptedSecrets["secret_key"] || "",
    apiUrl,
    settings: config.settings || {},
    secrets: decryptedSecrets,
  };
}

// Get default gateway for a tenant (any type that is active and default)
export async function getDefaultTenantGateway(
  supabase: SupabaseClient,
  tenantId: string
): Promise<GatewayCredentials | null> {
  const { data: config, error } = await supabase
    .from("tenant_gateway_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .eq("is_default", true)
    .maybeSingle();

  if (error || !config) {
    // Try to get any active gateway
    const { data: anyConfig, error: anyError } = await supabase
      .from("tenant_gateway_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (anyError || !anyConfig) {
      return null;
    }

    return getTenantGatewayCredentials(supabase, tenantId, anyConfig.gateway_type);
  }

  return getTenantGatewayCredentials(supabase, tenantId, config.gateway_type);
}

// Fallback to global ASAAS_API_KEY if tenant has no gateway configured
export async function getAsaasCredentials(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<{ apiKey: string; apiUrl: string; configId: string | null }> {
  // Try tenant-specific config first
  if (tenantId) {
    const tenantCreds = await getTenantGatewayCredentials(supabase, tenantId, "asaas");
    if (tenantCreds && tenantCreds.apiKey) {
      return {
        apiKey: tenantCreds.apiKey,
        apiUrl: tenantCreds.apiUrl,
        configId: tenantCreds.configId,
      };
    }
  }

  // Fallback to global API key (legacy support)
  const globalKey = Deno.env.get("ASAAS_API_KEY");
  if (!globalKey) {
    throw new Error("Nenhum gateway Asaas configurado para este tenant");
  }

  // Determine environment from key
  const isProduction = !globalKey.includes("sandbox");
  
  return {
    apiKey: globalKey,
    apiUrl: isProduction 
      ? "https://www.asaas.com/api/v3" 
      : "https://sandbox.asaas.com/api/v3",
    configId: null,
  };
}

// Log gateway transaction
export async function logGatewayTransaction(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    gatewayConfigId?: string | null;
    gatewayType: string;
    operation: string;
    status: "success" | "failed" | "pending";
    faturaId?: string;
    pagamentoId?: string;
    amount?: number;
    externalReference?: string;
    errorCode?: string;
    errorMessage?: string;
    requestPayload?: Record<string, unknown>;
    responsePayload?: Record<string, unknown>;
    durationMs?: number;
  }
): Promise<void> {
  try {
    await supabase.from("gateway_transaction_logs").insert({
      tenant_id: params.tenantId,
      gateway_config_id: params.gatewayConfigId,
      gateway_type: params.gatewayType,
      operation: params.operation,
      status: params.status,
      fatura_id: params.faturaId,
      pagamento_id: params.pagamentoId,
      amount: params.amount,
      external_reference: params.externalReference,
      error_code: params.errorCode,
      error_message: params.errorMessage,
      request_payload: params.requestPayload,
      response_payload: params.responsePayload,
      duration_ms: params.durationMs,
    });
  } catch (e) {
    console.error("Failed to log gateway transaction:", e);
  }
}
