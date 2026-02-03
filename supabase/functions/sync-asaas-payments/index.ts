import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, logGatewayTransaction, getAsaasCredentials } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  paymentDate?: string;
  billingType: string;
  invoiceNumber?: string;
}

const ASAAS_PAID_STATUSES = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'];
const ASAAS_OVERDUE_STATUSES = ['OVERDUE', 'DUNNING_REQUESTED'];
const ASAAS_CANCELLED_STATUSES = ['REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL'];

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  const results: { synced: number; errors: string[]; details: Array<{ faturaId: string; oldStatus: string; newStatus: string; asaasStatus: string }> } = {
    synced: 0,
    errors: [],
    details: [],
  };

  try {
    console.log("[sync-asaas-payments] Iniciando sincronização...");
    
    // Buscar faturas abertas/vencidas que têm asaas_payment_id
    const { data: faturas, error: fetchError } = await supabase
      .from("faturas")
      .select("id, tenant_id, status, asaas_payment_id, asaas_status, gateway_config_id, valor, valor_total")
      .not("asaas_payment_id", "is", null)
      .in("status", ["Aberta", "Vencida"])
      .limit(50); // Processar em lotes para evitar timeout

    if (fetchError) {
      throw new Error(`Erro ao buscar faturas: ${fetchError.message}`);
    }

    if (!faturas || faturas.length === 0) {
      console.log("[sync-asaas-payments] Nenhuma fatura pendente para sincronizar");
      return new Response(JSON.stringify({ ...results, message: "Nenhuma fatura pendente" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-asaas-payments] ${faturas.length} faturas para verificar`);

    // Agrupar faturas por tenant para buscar API key correta
    const faturasByTenant: Record<string, typeof faturas> = {};
    for (const fatura of faturas) {
      const tenantId = fatura.tenant_id || 'default';
      if (!faturasByTenant[tenantId]) {
        faturasByTenant[tenantId] = [];
      }
      faturasByTenant[tenantId].push(fatura);
    }

    // Processar cada tenant
    for (const [tenantId, tenantFaturas] of Object.entries(faturasByTenant)) {
      // Buscar credenciais do tenant usando a função utilitária correta
      let credentials: { apiKey: string; apiUrl: string; configId: string | null };
      try {
        credentials = await getAsaasCredentials(supabase, tenantId === 'default' ? null : tenantId);
      } catch (credError) {
        console.warn(`[sync-asaas-payments] Tenant ${tenantId} sem API key Asaas configurada:`, credError);
        continue;
      }

      if (!credentials.apiKey) {
        console.warn(`[sync-asaas-payments] Tenant ${tenantId} sem API key Asaas configurada`);
        continue;
      }

      const ASAAS_API_URL = credentials.apiUrl;

      // Processar faturas do tenant
      for (const fatura of tenantFaturas) {
        try {
          // Consultar status no Asaas
          const response = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
            headers: {
              'access_token': credentials.apiKey,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            results.errors.push(`Fatura ${fatura.id}: ${response.status} - ${errorText}`);
            continue;
          }

          const payment: AsaasPayment = await response.json();
          
          // Verificar se há divergência
          const localStatus = fatura.status;
          let newLocalStatus = localStatus;
          let shouldUpdate = false;

          if (ASAAS_PAID_STATUSES.includes(payment.status) && localStatus !== 'Paga') {
            newLocalStatus = 'Paga';
            shouldUpdate = true;
          } else if (ASAAS_OVERDUE_STATUSES.includes(payment.status) && localStatus !== 'Vencida') {
            newLocalStatus = 'Vencida';
            shouldUpdate = true;
          } else if (ASAAS_CANCELLED_STATUSES.includes(payment.status) && localStatus !== 'Cancelada') {
            newLocalStatus = 'Cancelada';
            shouldUpdate = true;
          } else if (fatura.asaas_status !== payment.status) {
            // Apenas atualizar asaas_status se diferente (trigger cuida do resto)
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            console.log(`[sync-asaas-payments] Fatura ${fatura.id}: ${localStatus} → ${newLocalStatus} (asaas: ${payment.status})`);

            const updateData: Record<string, unknown> = {
              asaas_status: payment.status,
              updated_at: new Date().toISOString(),
            };

            // Se pago, atualizar status e saldo
            if (ASAAS_PAID_STATUSES.includes(payment.status)) {
              updateData.status = 'Paga';
              updateData.saldo_restante = 0;

              // Verificar se já existe pagamento registrado
              const { data: existingPayment } = await supabase
                .from("pagamentos")
                .select("id")
                .eq("fatura_id", fatura.id)
                .eq("gateway", "asaas")
                .eq("gateway_id", payment.id)
                .single();

              if (!existingPayment) {
                // Registrar pagamento
                const metodo = payment.billingType === "PIX" ? "PIX" 
                  : payment.billingType === "BOLETO" ? "Boleto"
                  : payment.billingType === "CREDIT_CARD" ? "Cartão"
                  : "Asaas";

                await supabase.from("pagamentos").insert({
                  fatura_id: fatura.id,
                  valor: payment.value,
                  metodo,
                  data_pagamento: payment.paymentDate || new Date().toISOString().split('T')[0],
                  gateway: "asaas",
                  gateway_id: payment.id,
                  gateway_status: payment.status,
                  gateway_config_id: fatura.gateway_config_id,
                  referencia: payment.invoiceNumber || payment.id,
                  tenant_id: fatura.tenant_id,
                });

                console.log(`[sync-asaas-payments] Pagamento registrado para fatura ${fatura.id}`);
              }
            } else if (ASAAS_OVERDUE_STATUSES.includes(payment.status)) {
              updateData.status = 'Vencida';
            } else if (ASAAS_CANCELLED_STATUSES.includes(payment.status)) {
              updateData.status = 'Cancelada';
              updateData.motivo_cancelamento = `Sync: ${payment.status}`;
            }

            await supabase.from("faturas").update(updateData).eq("id", fatura.id);

            // Log da transação
            await logGatewayTransaction(supabase, {
              tenantId: fatura.tenant_id || "",
              gatewayConfigId: fatura.gateway_config_id,
              gatewayType: "asaas",
              operation: "sync_payment_status",
              status: "success",
              faturaId: fatura.id,
              amount: payment.value,
              externalReference: payment.id,
              requestPayload: { source: "cron", localStatus, asaasStatus: payment.status },
              responsePayload: { newStatus: newLocalStatus },
              durationMs: Date.now() - startTime,
            });

            results.synced++;
            results.details.push({
              faturaId: fatura.id,
              oldStatus: localStatus,
              newStatus: newLocalStatus,
              asaasStatus: payment.status,
            });
          }
        } catch (faturaError) {
          const errorMessage = faturaError instanceof Error ? faturaError.message : String(faturaError);
          results.errors.push(`Fatura ${fatura.id}: ${errorMessage}`);
          console.error(`[sync-asaas-payments] Erro na fatura ${fatura.id}:`, errorMessage);
        }
      }
    }

    console.log(`[sync-asaas-payments] Concluído: ${results.synced} sincronizadas, ${results.errors.length} erros`);

    // Log do webhook/sync
    await supabase.from("webhook_logs").insert({
      source: "sync-asaas-payments",
      event_type: "cron_sync",
      payload: { source: "cron", faturasProcessadas: faturas.length },
      status: results.errors.length === 0 ? "processed" : "partial",
      processing_time_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[sync-asaas-payments] Erro geral:", errorMessage);

    await supabase.from("webhook_logs").insert({
      source: "sync-asaas-payments",
      event_type: "cron_sync",
      payload: {},
      status: "failed",
      error_message: errorMessage,
      processing_time_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
