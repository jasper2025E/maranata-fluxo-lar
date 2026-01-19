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

    const { responsavelId } = await req.json();

    if (!responsavelId) {
      throw new Error("responsavelId é obrigatório");
    }

    // Buscar dados do responsável
    const { data: responsavel, error: respError } = await supabase
      .from("responsaveis")
      .select("*")
      .eq("id", responsavelId)
      .single();

    if (respError || !responsavel) {
      throw new Error("Responsável não encontrado");
    }

    // Se já tem customer_id, retornar
    if (responsavel.asaas_customer_id) {
      return new Response(JSON.stringify({ 
        success: true, 
        customerId: responsavel.asaas_customer_id,
        message: "Cliente já existe no Asaas"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar cliente no Asaas
    const customerData = {
      name: responsavel.nome,
      cpfCnpj: responsavel.cpf?.replace(/\D/g, '') || null,
      email: responsavel.email || null,
      phone: responsavel.telefone?.replace(/\D/g, '') || null,
      mobilePhone: responsavel.telefone?.replace(/\D/g, '') || null,
      notificationDisabled: false,
    };

    const asaasResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(customerData),
    });

    const asaasResult = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error("Erro Asaas:", asaasResult);
      throw new Error(asaasResult.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
    }

    // Atualizar responsável com o ID do Asaas
    await supabase
      .from("responsaveis")
      .update({ asaas_customer_id: asaasResult.id })
      .eq("id", responsavelId);

    return new Response(JSON.stringify({ 
      success: true, 
      customerId: asaasResult.id,
      message: "Cliente criado no Asaas com sucesso"
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
