import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

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

    const { faturaId, billingType = "UNDEFINED" } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura com dados do aluno e responsável
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        alunos(nome_completo, responsavel_id),
        cursos(nome),
        responsaveis(id, nome, cpf, email, telefone, asaas_customer_id)
      `)
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    if (fatura.status === "Paga" || fatura.status === "Cancelada") {
      throw new Error(`Fatura já está ${fatura.status.toLowerCase()}`);
    }

    // Verificar se já existe cobrança no Asaas
    if (fatura.asaas_payment_id) {
      // Buscar dados atualizados do pagamento
      const existingPayment = await fetch(`${ASAAS_API_URL}/payments/${fatura.asaas_payment_id}`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      
      if (existingPayment.ok) {
        const paymentData = await existingPayment.json();
        return new Response(JSON.stringify({ 
          success: true, 
          payment: paymentData,
          invoiceUrl: paymentData.invoiceUrl,
          pixQrCode: fatura.asaas_pix_qrcode,
          pixPayload: fatura.asaas_pix_payload,
          boletoUrl: fatura.asaas_boleto_url,
          message: "Cobrança já existe no Asaas"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Buscar ou criar responsável
    let responsavel = fatura.responsaveis;
    if (!responsavel && fatura.alunos?.responsavel_id) {
      const { data: resp } = await supabase
        .from("responsaveis")
        .select("*")
        .eq("id", fatura.alunos.responsavel_id)
        .single();
      responsavel = resp;
    }

    if (!responsavel) {
      throw new Error("Responsável não encontrado. Vincule um responsável ao aluno.");
    }

    // Criar cliente no Asaas se não existir
    let customerId = responsavel.asaas_customer_id;
    if (!customerId) {
      const customerData = {
        name: responsavel.nome,
        cpfCnpj: responsavel.cpf?.replace(/\D/g, '') || null,
        email: responsavel.email || null,
        mobilePhone: responsavel.telefone?.replace(/\D/g, '') || null,
        notificationDisabled: false,
      };

      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_API_KEY,
        },
        body: JSON.stringify(customerData),
      });

      const customerResult = await customerResponse.json();
      
      if (!customerResponse.ok) {
        throw new Error(customerResult.errors?.[0]?.description || "Erro ao criar cliente no Asaas");
      }

      customerId = customerResult.id;
      
      await supabase
        .from("responsaveis")
        .update({ asaas_customer_id: customerId })
        .eq("id", responsavel.id);
    }

    // Calcular valor da fatura
    const valorFatura = fatura.valor_total || fatura.valor || 0;
    const mesReferencia = meses[fatura.mes_referencia - 1];
    const description = `Mensalidade ${mesReferencia}/${fatura.ano_referencia} - ${fatura.alunos?.nome_completo || 'Aluno'} - ${fatura.cursos?.nome || 'Curso'}`;

    // Criar cobrança no Asaas
    const paymentData: any = {
      customer: customerId,
      billingType: billingType, // UNDEFINED permite PIX, Boleto e Cartão
      value: Number(valorFatura.toFixed(2)),
      dueDate: fatura.data_vencimento,
      description: description,
      externalReference: faturaId,
      postalService: false,
    };

    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("Erro Asaas Payment:", paymentResult);
      throw new Error(paymentResult.errors?.[0]?.description || "Erro ao criar cobrança no Asaas");
    }

    // Buscar QR Code PIX
    let pixQrCode = null;
    let pixPayload = null;
    
    if (billingType === "UNDEFINED" || billingType === "PIX") {
      const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentResult.id}/pixQrCode`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      
      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        pixQrCode = pixData.encodedImage;
        pixPayload = pixData.payload;
      }
    }

    // Buscar linha digitável do boleto
    let boletoUrl = null;
    let boletoBarcode = null;
    
    if (billingType === "UNDEFINED" || billingType === "BOLETO") {
      const boletoResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentResult.id}/identificationField`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      
      if (boletoResponse.ok) {
        const boletoData = await boletoResponse.json();
        boletoBarcode = boletoData.identificationField;
        boletoUrl = paymentResult.bankSlipUrl;
      }
    }

    // Atualizar fatura com dados do Asaas
    await supabase
      .from("faturas")
      .update({
        asaas_payment_id: paymentResult.id,
        asaas_invoice_url: paymentResult.invoiceUrl,
        asaas_pix_qrcode: pixQrCode,
        asaas_pix_payload: pixPayload,
        asaas_boleto_url: boletoUrl || paymentResult.bankSlipUrl,
        asaas_boleto_barcode: boletoBarcode,
        asaas_status: paymentResult.status,
        asaas_due_date: paymentResult.dueDate,
        asaas_billing_type: paymentResult.billingType,
        payment_url: paymentResult.invoiceUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    return new Response(JSON.stringify({ 
      success: true, 
      payment: paymentResult,
      invoiceUrl: paymentResult.invoiceUrl,
      pixQrCode,
      pixPayload,
      boletoUrl: boletoUrl || paymentResult.bankSlipUrl,
      boletoBarcode,
      message: "Cobrança criada com sucesso no Asaas"
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
