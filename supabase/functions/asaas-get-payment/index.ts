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

  try {
    const supabase = getSupabaseAdmin();

    const { faturaId } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura com tenant
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select("asaas_payment_id, asaas_pix_qrcode, asaas_pix_payload, asaas_boleto_url, asaas_boleto_barcode, asaas_boleto_bar_code, tenant_id, gateway_config_id")
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    if (!fatura.asaas_payment_id) {
      throw new Error("Fatura não tem cobrança no Asaas");
    }

    // Obter credenciais do gateway
    const credentials = await getAsaasCredentials(supabase, fatura.tenant_id);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;

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
    let boletoBarcode = fatura.asaas_boleto_barcode;
    let boletoBarCode = fatura.asaas_boleto_bar_code;
    let boletoUrl = fatura.asaas_boleto_url;
    let needsUpdate = false;
    
    // Buscar PIX QR Code se não existir
    // Importante: pode ficar disponível tanto antes quanto depois da confirmação.
    if (!pixQrCode && payment.billingType !== "CREDIT_CARD") {
      console.log("Buscando QR Code PIX para pagamento:", fatura.asaas_payment_id);
      const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}/pixQrCode`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      
      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        pixQrCode = pixData.encodedImage;
        pixPayload = pixData.payload;
        needsUpdate = true;
        console.log("PIX QR Code obtido com sucesso");
      } else {
        console.warn("Falha ao obter PIX QR Code:", pixResponse.status);
      }
    }

    // Buscar código de barras do boleto se não existir
    // Importante: o Asaas pode liberar `identificationField`/`barCode` apenas após registro bancário.
    // Portanto, não bloquear por status aqui — sempre tentar quando estiver ausente.
    if ((!boletoBarcode || !boletoBarCode) && payment.billingType !== "CREDIT_CARD") {
      console.log("Buscando código de barras do boleto para pagamento:", fatura.asaas_payment_id);
      const boletoResponse = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}/identificationField`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      
      if (boletoResponse.ok) {
        const boletoData = await boletoResponse.json();
        boletoBarcode = boletoData.identificationField;
        boletoBarCode = boletoData.barCode;
        boletoUrl = payment.bankSlipUrl;
        needsUpdate = true;
        console.log("Boleto barcode obtido com sucesso");
      } else {
        console.warn("Falha ao obter barcode do boleto:", boletoResponse.status);
      }
    }

    // Atualizar banco se houve mudanças
    if (needsUpdate) {
      await supabase
        .from("faturas")
        .update({
          asaas_pix_qrcode: pixQrCode,
          asaas_pix_payload: pixPayload,
          asaas_boleto_barcode: boletoBarcode,
          asaas_boleto_bar_code: boletoBarCode,
          asaas_boleto_url: boletoUrl || payment.bankSlipUrl,
          asaas_status: payment.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", faturaId);
    } else {
      // Só atualiza status
      await supabase
        .from("faturas")
        .update({
          asaas_status: payment.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", faturaId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      payment,
      pixQrCode,
      pixPayload,
      boletoUrl: boletoUrl || payment.bankSlipUrl,
      boletoBarcode,
      boletoBarCode,
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
