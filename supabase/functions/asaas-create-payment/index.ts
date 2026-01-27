import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getAsaasCredentials, logGatewayTransaction } from "../_shared/gateway-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = getSupabaseAdmin();
  let tenantId: string | null = null;
  let gatewayConfigId: string | null = null;

  try {
    const { faturaId, billingType = "UNDEFINED" } = await req.json();

    if (!faturaId) {
      throw new Error("faturaId é obrigatório");
    }

    // Buscar fatura com dados do aluno, responsável e tenant
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        alunos(nome_completo, responsavel_id, tenant_id),
        cursos(nome),
        responsaveis(id, nome, cpf, email, telefone, asaas_customer_id)
      `)
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      throw new Error("Fatura não encontrada");
    }

    tenantId = fatura.tenant_id || fatura.alunos?.tenant_id || null;

    if (fatura.status === "Paga" || fatura.status === "Cancelada") {
      throw new Error(`Fatura já está ${fatura.status.toLowerCase()}`);
    }

    // Obter credenciais do gateway (tenant-specific ou fallback global)
    const credentials = await getAsaasCredentials(supabase, tenantId);
    const ASAAS_API_KEY = credentials.apiKey;
    const ASAAS_API_URL = credentials.apiUrl;
    gatewayConfigId = credentials.configId;

    // Verificar se já existe cobrança no Asaas
    if (fatura.asaas_payment_id) {
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
      if (/^(\d)\1+$/.test(cleanCpf)) return false;
      
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

    // Função para criar cliente no Asaas
    const createAsaasCustomer = async (): Promise<string> => {
      const rawCpfCnpj = responsavel.cpf?.replace(/\D/g, '') || '';
      let validCpfCnpj: string | null = null;
      
      if (rawCpfCnpj.length === 11 && isValidCPF(rawCpfCnpj)) {
        validCpfCnpj = rawCpfCnpj;
      } else if (rawCpfCnpj.length === 14 && isValidCNPJ(rawCpfCnpj)) {
        validCpfCnpj = rawCpfCnpj;
      } else if (rawCpfCnpj.length > 0) {
        console.warn(`CPF/CNPJ inválido para responsável ${responsavel.nome}: ${rawCpfCnpj}`);
      }

      const customerData: Record<string, unknown> = {
        name: responsavel.nome,
        email: responsavel.email || null,
        mobilePhone: responsavel.telefone?.replace(/\D/g, '') || null,
        notificationDisabled: false,
      };
      
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

      const newCustomerId = customerResult.id;
      
      // Salvar novo customer_id no banco
      await supabase
        .from("responsaveis")
        .update({ asaas_customer_id: newCustomerId })
        .eq("id", responsavel.id);
      
      return newCustomerId;
    };

    // Usar customer_id existente ou criar novo
    let customerId = responsavel.asaas_customer_id;
    if (!customerId) {
      customerId = await createAsaasCustomer();
    }

    // Calcular valor da fatura
    const valorFatura = fatura.valor_total || fatura.valor || 0;
    const mesReferencia = meses[fatura.mes_referencia - 1];
    const description = `Mensalidade ${mesReferencia}/${fatura.ano_referencia} - ${fatura.alunos?.nome_completo || 'Aluno'} - ${fatura.cursos?.nome || 'Curso'}`;

    // Ajustar data de vencimento
    let dueDate = fatura.data_vencimento;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(fatura.data_vencimento);
    dataVencimento.setHours(0, 0, 0, 0);
    
    if (dataVencimento < hoje) {
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      dueDate = amanha.toISOString().split('T')[0];
      console.log(`Data de vencimento ajustada de ${fatura.data_vencimento} para ${dueDate}`);
    }

    // Função para criar cobrança
    const createPayment = async (customerIdToUse: string) => {
      const paymentData = {
        customer: customerIdToUse,
        billingType: billingType,
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

      return { response: paymentResponse, data: await paymentResponse.json() };
    };

    // Tentar criar cobrança
    let paymentResult = await createPayment(customerId);

    // Se falhou com "invalid_customer" (cliente removido), recriar cliente e tentar novamente
    if (!paymentResult.response.ok && paymentResult.data.errors?.[0]?.code === "invalid_customer") {
      console.log("Cliente Asaas inválido/removido. Recriando cliente...");
      
      // Limpar customer_id antigo
      await supabase
        .from("responsaveis")
        .update({ asaas_customer_id: null })
        .eq("id", responsavel.id);
      
      // Criar novo cliente
      customerId = await createAsaasCustomer();
      
      // Tentar criar cobrança novamente
      paymentResult = await createPayment(customerId);
    }

    if (!paymentResult.response.ok) {
      console.error("Erro Asaas Payment:", paymentResult.data);
      
      await logGatewayTransaction(supabase, {
        tenantId: tenantId || "",
        gatewayConfigId,
        gatewayType: "asaas",
        operation: "create_payment",
        status: "failed",
        faturaId,
        amount: valorFatura,
        errorMessage: paymentResult.data.errors?.[0]?.description || "Erro ao criar cobrança",
        requestPayload: { billingType, value: valorFatura },
        responsePayload: paymentResult.data,
        durationMs: Date.now() - startTime,
      });
      
      throw new Error(paymentResult.data.errors?.[0]?.description || "Erro ao criar cobrança no Asaas");
    }

    // Extrair dados do pagamento criado
    const payment = paymentResult.data;

    // Buscar QR Code PIX - SEMPRE tenta buscar para garantir dados completos
    let pixQrCode = null;
    let pixPayload = null;
    
    console.log("Buscando QR Code PIX para pagamento:", payment.id);
    const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${payment.id}/pixQrCode`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    
    if (pixResponse.ok) {
      const pixData = await pixResponse.json();
      pixQrCode = pixData.encodedImage;
      pixPayload = pixData.payload;
      console.log("PIX QR Code obtido com sucesso:", !!pixQrCode);
    } else {
      const pixErrorText = await pixResponse.text();
      console.warn("Falha ao obter PIX QR Code:", pixResponse.status, pixErrorText);
    }

    // Buscar linha digitável do boleto - SEMPRE tenta buscar para garantir dados completos
    let boletoUrl = null;
    let boletoBarcode = null;
    
    console.log("Buscando código de barras do boleto para pagamento:", payment.id);
    const boletoResponse = await fetch(`${ASAAS_API_URL}/payments/${payment.id}/identificationField`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    
    if (boletoResponse.ok) {
      const boletoData = await boletoResponse.json();
      boletoBarcode = boletoData.identificationField;
      boletoUrl = payment.bankSlipUrl;
      console.log("Boleto barcode obtido com sucesso:", !!boletoBarcode);
    } else {
      const boletoErrorText = await boletoResponse.text();
      console.warn("Falha ao obter barcode do boleto:", boletoResponse.status, boletoErrorText);
    }

    // Atualizar fatura com dados do Asaas e gateway_config_id
    await supabase
      .from("faturas")
      .update({
        asaas_payment_id: payment.id,
        asaas_invoice_url: payment.invoiceUrl,
        asaas_pix_qrcode: pixQrCode,
        asaas_pix_payload: pixPayload,
        asaas_boleto_url: boletoUrl || payment.bankSlipUrl,
        asaas_boleto_barcode: boletoBarcode,
        asaas_status: payment.status,
        asaas_due_date: payment.dueDate,
        asaas_billing_type: payment.billingType,
        payment_url: payment.invoiceUrl,
        gateway_config_id: gatewayConfigId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaId);

    // Log successful transaction
    await logGatewayTransaction(supabase, {
      tenantId: tenantId || "",
      gatewayConfigId,
      gatewayType: "asaas",
      operation: "create_payment",
      status: "success",
      faturaId,
      amount: valorFatura,
      externalReference: payment.id,
      responsePayload: { paymentId: payment.id, status: payment.status },
      durationMs: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      payment: payment,
      invoiceUrl: payment.invoiceUrl,
      pixQrCode,
      pixPayload,
      boletoUrl: boletoUrl || payment.bankSlipUrl,
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
