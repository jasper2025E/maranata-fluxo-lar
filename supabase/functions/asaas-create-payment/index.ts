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

    // Função para validar CPF
    const isValidCPF = (cpf: string): boolean => {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) return false;
      if (/^(\d)\1+$/.test(cleanCpf)) return false; // Todos dígitos iguais
      
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
      }
      let digit = 11 - (sum % 11);
      if (digit > 9) digit = 0;
      if (digit !== parseInt(cleanCpf.charAt(9))) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
      }
      digit = 11 - (sum % 11);
      if (digit > 9) digit = 0;
      if (digit !== parseInt(cleanCpf.charAt(10))) return false;
      
      return true;
    };

    // Função para validar CNPJ
    const isValidCNPJ = (cnpj: string): boolean => {
      const cleanCnpj = cnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14) return false;
      if (/^(\d)\1+$/.test(cleanCnpj)) return false;
      
      const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCnpj.charAt(i)) * weights1[i];
      }
      let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (digit !== parseInt(cleanCnpj.charAt(12))) return false;
      
      sum = 0;
      for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCnpj.charAt(i)) * weights2[i];
      }
      digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (digit !== parseInt(cleanCnpj.charAt(13))) return false;
      
      return true;
    };

    // Criar cliente no Asaas se não existir
    let customerId = responsavel.asaas_customer_id;
    if (!customerId) {
      // Validar e formatar CPF/CNPJ
      const rawCpfCnpj = responsavel.cpf?.replace(/\D/g, '') || '';
      let validCpfCnpj: string | null = null;
      
      if (rawCpfCnpj.length === 11 && isValidCPF(rawCpfCnpj)) {
        validCpfCnpj = rawCpfCnpj;
      } else if (rawCpfCnpj.length === 14 && isValidCNPJ(rawCpfCnpj)) {
        validCpfCnpj = rawCpfCnpj;
      } else if (rawCpfCnpj.length > 0) {
        console.warn(`CPF/CNPJ inválido para responsável ${responsavel.nome}: ${rawCpfCnpj}`);
        // Continuar sem CPF - Asaas permite criar cliente sem CPF
      }

      const customerData: Record<string, unknown> = {
        name: responsavel.nome,
        email: responsavel.email || null,
        mobilePhone: responsavel.telefone?.replace(/\D/g, '') || null,
        notificationDisabled: false,
      };
      
      // Só incluir cpfCnpj se for válido
      if (validCpfCnpj) {
        customerData.cpfCnpj = validCpfCnpj;
      }

      console.log("Criando cliente Asaas:", JSON.stringify({ ...customerData, cpfCnpj: validCpfCnpj ? '***' : null }));

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
        console.error("Erro Asaas Customer:", customerResult);
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

    // Ajustar data de vencimento - se for no passado, usar hoje ou amanhã
    let dueDate = fatura.data_vencimento;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(fatura.data_vencimento);
    dataVencimento.setHours(0, 0, 0, 0);
    
    if (dataVencimento < hoje) {
      // Data no passado - usar amanhã para dar tempo de processamento
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      dueDate = amanha.toISOString().split('T')[0];
      console.log(`Data de vencimento ajustada de ${fatura.data_vencimento} para ${dueDate}`);
    }

    // Criar cobrança no Asaas
    const paymentData: any = {
      customer: customerId,
      billingType: billingType, // UNDEFINED permite PIX, Boleto e Cartão
      value: Number(valorFatura.toFixed(2)),
      dueDate: dueDate,
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
