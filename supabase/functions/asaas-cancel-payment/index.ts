import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { faturaId, motivo } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("asaas_payment_id")
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    if (!fatura.asaas_payment_id) {
      // Se não tem cobrança no Asaas, apenas atualizar localmente
      await supabase
        .from("faturas")
        .update({
          status: "Cancelada",
          motivo_cancelamento: motivo || "Cancelado pelo usuário",
          cancelada_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", faturaId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Fatura cancelada localmente"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cancelar cobrança no Asaas
    const cancelResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
      method: "DELETE",
      headers: { "access_token": ASAAS_API_KEY },
    });

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json();
      console.error("Erro ao cancelar no Asaas:", errorData);
      // Continuar mesmo com erro para atualizar localmente
    }

    // Atualizar fatura
    await supabase
      .from("faturas")
      .update({
        status: "Cancelada",
        asaas_status: "DELETED",
        motivo_cancelamento: motivo || "Cancelado pelo usuário",
        cancelada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cobrança cancelada com sucesso"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Erro:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
