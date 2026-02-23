import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getAsaasCredentials } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();

  try {
    console.log("Iniciando sync de juros/multa no Asaas...");

    // Buscar faturas vencidas que têm asaas_payment_id
    const { data: faturas, error } = await supabase
      .from("faturas")
      .select("id, asaas_payment_id, tenant_id, status, data_vencimento")
      .not("asaas_payment_id", "is", null)
      .in("status", ["Vencida", "Aberta"])
      .order("status", { ascending: true })
      .order("data_vencimento", { ascending: true })
      .limit(10);

    if (error) throw new Error(`Erro ao buscar faturas: ${error.message}`);
    if (!faturas || faturas.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Nenhuma fatura para atualizar", updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Agrupar por tenant para buscar configs uma vez por escola
    const tenantIds = [...new Set(faturas.map(f => f.tenant_id).filter(Boolean))];
    const tenantConfigs: Record<string, { jurosMensal: number; multaPercentual: number; multaFixa: number }> = {};

    for (const tid of tenantIds) {
      const { data: escola } = await supabase
        .from("escola")
        .select("juros_percentual_mensal_padrao, juros_percentual_diario_padrao, multa_percentual_padrao, multa_fixa_padrao")
        .eq("tenant_id", tid)
        .maybeSingle();

      if (escola) {
        tenantConfigs[tid!] = {
          jurosMensal: escola.juros_percentual_mensal_padrao || (escola.juros_percentual_diario_padrao ? escola.juros_percentual_diario_padrao * 30 : 0),
          multaPercentual: escola.multa_percentual_padrao || 0,
          multaFixa: escola.multa_fixa_padrao || 0,
        };
      }
    }

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const fatura of faturas) {
      const config = tenantConfigs[fatura.tenant_id!];
      if (!config || (config.jurosMensal === 0 && config.multaPercentual === 0 && config.multaFixa === 0)) {
        continue; // Sem taxas configuradas
      }

      try {
        const credentials = await getAsaasCredentials(supabase, fatura.tenant_id);
        
        const updateData: Record<string, unknown> = {};

        if (config.jurosMensal > 0) {
          updateData.interest = { value: Number(config.jurosMensal.toFixed(2)) };
        }
        if (config.multaFixa > 0) {
          updateData.fine = { value: Number(config.multaFixa.toFixed(2)), type: "FIXED" };
        } else if (config.multaPercentual > 0) {
          updateData.fine = { value: Number(config.multaPercentual.toFixed(2)) };
        }

        if (Object.keys(updateData).length === 0) continue;

        const response = await fetch(`${credentials.apiUrl}/payments/${fatura.asaas_payment_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "access_token": credentials.apiKey,
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          updated++;
        } else {
          const errData = await response.json();
          failed++;
          errors.push(`${fatura.id}: ${errData.errors?.[0]?.description || response.status}`);
        }

        // Delay entre requisições
        await new Promise(r => setTimeout(r, 100));
      } catch (err: unknown) {
        failed++;
        errors.push(`${fatura.id}: ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: faturas.length,
      updated,
      failed,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
