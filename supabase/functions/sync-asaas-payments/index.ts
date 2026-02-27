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

// Configurações otimizadas para evitar timeout
const BATCH_SIZE = 30; // Processar no máximo 30 faturas por execução
const REQUEST_DELAY_MS = 100; // Delay entre requests para evitar rate limiting
const MAX_EXECUTION_TIME_MS = 25000; // Parar antes de 30s (timeout do edge function)

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  const results: { 
    synced: number; 
    errors: string[]; 
    skipped: number;
    orphaned: number;
    details: Array<{ faturaId: string; oldStatus: string; newStatus: string; asaasStatus: string }> 
  } = {
    synced: 0,
    errors: [],
    skipped: 0,
    orphaned: 0,
    details: [],
  };

  try {
    console.log("[sync-asaas-payments] Iniciando sincronização otimizada...");
    
    // =============================================
    // FASE 0: DETECTAR FATURAS "ÓRFÃS" (sem cobrança no gateway)
    // =============================================
    const hoje = new Date();
    const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const { data: faturasOrfas } = await supabase
      .from("faturas")
      .select("id, tenant_id, aluno_id, data_vencimento, valor")
      .is("asaas_payment_id", null)
      .eq("status", "Aberta")
      .lt("data_vencimento", em7Dias.toISOString().split('T')[0])
      .gte("data_vencimento", hoje.toISOString().split('T')[0])
      .limit(50);

    // Notificar sobre órfãs (máximo 1x por dia)
    if (faturasOrfas && faturasOrfas.length > 0) {
      const orfasPorTenant: Record<string, number> = {};
      for (const f of faturasOrfas) {
        const tid = f.tenant_id || 'default';
        orfasPorTenant[tid] = (orfasPorTenant[tid] || 0) + 1;
      }

      const { data: notificacaoRecente } = await supabase
        .from("notifications")
        .select("id")
        .eq("title", "Faturas sem Cobrança")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!notificacaoRecente || notificacaoRecente.length === 0) {
        for (const [tid, count] of Object.entries(orfasPorTenant)) {
          if (tid !== 'default') {
            await supabase.from("notifications").insert({
              tenant_id: tid,
              title: "Faturas sem Cobrança",
              message: `${count} faturas vencem em até 7 dias sem cobrança no gateway. Gere as cobranças para evitar inadimplência.`,
              type: "warning",
              link: "/faturas"
            });
          }
        }
      }
    }

    // =============================================
    // FASE 1: BUSCAR FATURAS PRIORITÁRIAS PARA SINCRONIZAR
    // =============================================
    
    // Buscar apenas faturas que PRECISAM ser sincronizadas:
    // 1. Faturas vencidas (prioridade máxima)
    // 2. Faturas abertas com status divergente do Asaas
    const { data: faturasVencidas, error: fetchVencidasError } = await supabase
      .from("faturas")
      .select("id, tenant_id, status, asaas_payment_id, asaas_status, gateway_config_id, valor, valor_total, data_vencimento")
      .not("asaas_payment_id", "is", null)
      .lt("data_vencimento", new Date().toISOString().split('T')[0])
      .in("status", ["Aberta", "Vencida"])
      .order("data_vencimento", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchVencidasError) {
      console.error("[sync-asaas-payments] Erro ao buscar faturas vencidas:", fetchVencidasError);
    }

    // Faturas abertas (apenas se sobrar espaço no batch)
    const remainingSlots = BATCH_SIZE - (faturasVencidas?.length || 0);
    let faturasAbertas: typeof faturasVencidas = [];
    
    if (remainingSlots > 0) {
      const { data, error: fetchAbertasError } = await supabase
        .from("faturas")
        .select("id, tenant_id, status, asaas_payment_id, asaas_status, gateway_config_id, valor, valor_total, data_vencimento")
        .not("asaas_payment_id", "is", null)
        .gte("data_vencimento", new Date().toISOString().split('T')[0])
        .eq("status", "Aberta")
        .order("data_vencimento", { ascending: true })
        .limit(remainingSlots);

      if (fetchAbertasError) {
        console.error("[sync-asaas-payments] Erro ao buscar faturas abertas:", fetchAbertasError);
      }
      faturasAbertas = data || [];
    }

    // Combinar listas sem duplicatas
    const seenIds = new Set<string>();
    const faturas: Array<{
      id: string;
      tenant_id: string | null;
      status: string;
      asaas_payment_id: string;
      asaas_status: string | null;
      gateway_config_id: string | null;
      valor: number;
      valor_total: number | null;
      data_vencimento: string;
    }> = [];

    for (const f of [...(faturasVencidas || []), ...(faturasAbertas || [])]) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        faturas.push(f);
      }
    }

    if (faturas.length === 0) {
      console.log("[sync-asaas-payments] Nenhuma fatura pendente para sincronizar");
      return new Response(JSON.stringify({ 
        ...results, 
        message: "Nenhuma fatura pendente", 
        faturasOrfas: faturasOrfas?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-asaas-payments] ${faturas.length} faturas para verificar (batch de ${BATCH_SIZE})`);

    // Agrupar faturas por tenant
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
      // Verificar tempo restante
      if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
        console.log("[sync-asaas-payments] Tempo limite atingido, parando processamento");
        break;
      }

      // Buscar credenciais do tenant
      let credentials: { apiKey: string; apiUrl: string; configId: string | null };
      try {
        credentials = await getAsaasCredentials(supabase, tenantId === 'default' ? null : tenantId);
      } catch (credError) {
        console.warn(`[sync-asaas-payments] Tenant ${tenantId} sem API key Asaas:`, credError);
        continue;
      }

      if (!credentials.apiKey) {
        console.warn(`[sync-asaas-payments] Tenant ${tenantId} sem API key Asaas configurada`);
        continue;
      }

      const ASAAS_API_URL = credentials.apiUrl;

      // Processar faturas do tenant
      for (const fatura of tenantFaturas) {
        // Verificar tempo restante antes de cada request
        if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
          console.log("[sync-asaas-payments] Tempo limite atingido durante processamento");
          break;
        }

        try {
          // Adicionar delay entre requests para evitar rate limiting
          await sleep(REQUEST_DELAY_MS);

          // Consultar status no Asaas
          const response = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
            headers: {
              'access_token': credentials.apiKey,
              'Content-Type': 'application/json',
            },
          });

          // Tratar cobrança não encontrada (deletada no Asaas)
          if (response.status === 404) {
            console.log(`[sync-asaas-payments] Cobrança ${fatura.asaas_payment_id} não existe mais no Asaas - desvinculando`);
            
            // Desvincular a fatura do Asaas (mantém dados locais)
            await supabase.from("faturas").update({
              asaas_payment_id: null,
              asaas_status: null,
              asaas_boleto_url: null,
              asaas_boleto_barcode: null,
              asaas_boleto_bar_code: null,
              asaas_pix_qrcode: null,
              asaas_pix_payload: null,
              asaas_invoice_url: null,
              updated_at: new Date().toISOString(),
            }).eq("id", fatura.id);

            results.orphaned++;
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();
            results.errors.push(`Fatura ${fatura.id}: ${response.status} - ${errorText.substring(0, 100)}`);
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
            // Apenas atualizar asaas_status se diferente
            shouldUpdate = true;
          }

          if (!shouldUpdate) {
            results.skipped++;
            continue;
          }

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

          // Log da transação (sem notificação de sincronização)
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
        } catch (faturaError) {
          const errorMessage = faturaError instanceof Error ? faturaError.message : String(faturaError);
          results.errors.push(`Fatura ${fatura.id}: ${errorMessage.substring(0, 100)}`);
          console.error(`[sync-asaas-payments] Erro na fatura ${fatura.id}:`, errorMessage);
        }
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[sync-asaas-payments] Concluído em ${executionTime}ms: ${results.synced} sincronizadas, ${results.skipped} puladas, ${results.orphaned} órfãs desvinculadas, ${results.errors.length} erros`);

    // Log do webhook/sync
    await supabase.from("webhook_logs").insert({
      source: "sync-asaas-payments",
      event_type: "cron_sync",
      payload: { 
        source: "cron", 
        faturasProcessadas: faturas.length,
        synced: results.synced,
        skipped: results.skipped,
        orphaned: results.orphaned,
        errors: results.errors.length,
      },
      status: results.errors.length === 0 ? "processed" : "partial",
      processing_time_ms: executionTime,
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
