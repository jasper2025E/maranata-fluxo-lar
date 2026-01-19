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

    const { faturaId } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("asaas_payment_id, asaas_pix_qrcode, asaas_pix_payload, asaas_boleto_url, asaas_boleto_barcode")
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    if (!fatura.asaas_payment_id) {
      throw new Error("Fatura não tem cobrança no Asaas");
    }

    // Buscar dados atualizados do pagamento
    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
      headers: { "access_token": ASAAS_API_KEY },
    });

    if (!paymentResponse.ok) {
      throw new Error("Erro ao buscar pagamento no Asaas");
    }

    const payment = await paymentResponse.json();

    // Buscar QR Code PIX atualizado se necessário
    let pixQrCode = fatura.asaas_pix_qrcode;
    let pixPayload = fatura.asaas_pix_payload;
    
    if (!pixQrCode && payment.billingType !== "CREDIT_CARD") {
      const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}/pixQrCode`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      
      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        pixQrCode = pixData.encodedImage;
        pixPayload = pixData.payload;
        
        // Salvar no banco
        await supabase
          .from("faturas")
          .update({
            asaas_pix_qrcode: pixQrCode,
            asaas_pix_payload: pixPayload,
          })
          .eq("id", faturaId);
      }
    }

    // Atualizar status no banco
    await supabase
      .from("faturas")
      .update({
        asaas_status: payment.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    return new Response(JSON.stringify({ 
      success: true, 
      payment,
      pixQrCode,
      pixPayload,
      boletoUrl: fatura.asaas_boleto_url || payment.bankSlipUrl,
      boletoBarcode: fatura.asaas_boleto_barcode,
      invoiceUrl: payment.invoiceUrl,
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
