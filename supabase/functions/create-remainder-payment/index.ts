import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getDefaultTenantGateway,
  logGatewayTransaction,
  GatewayCredentials 
} from "../_shared/gateway-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RemainderPaymentRequest {
  faturaOrigemId: string;
  valorRestante: number;
  dataVencimento: string;
  descricao?: string;
}

interface GatewayPaymentResult {
  success: boolean;
  paymentId?: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  boletoBarcode?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Token de autenticação não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Buscar tenant do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Tenant não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tenantId = profile.tenant_id;

    const { faturaOrigemId, valorRestante, dataVencimento, descricao }: RemainderPaymentRequest = await req.json();

    if (!faturaOrigemId || valorRestante <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Parâmetros inválidos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Buscar fatura original com validação de tenant
    const { data: faturaOrigem, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        id, aluno_id, curso_id, responsavel_id, mes_referencia, ano_referencia,
        codigo_sequencial, tenant_id, gateway_config_id,
        juros_percentual_diario, juros_percentual_mensal, multa,
        alunos(nome_completo, responsavel_id),
        cursos(nome),
        responsaveis(id, nome, cpf, email, telefone, asaas_customer_id)
      `)
      .eq("id", faturaOrigemId)
      .eq("tenant_id", tenantId)
      .single();

    if (faturaError || !faturaOrigem) {
      return new Response(
        JSON.stringify({ success: false, error: "Fatura original não encontrada ou acesso negado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Buscar gateway padrão do tenant
    const gateway = await getDefaultTenantGateway(supabase, tenantId);
    
    if (!gateway) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum gateway de pagamento configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[create-remainder-payment] Gateway: ${gateway.gatewayType}, Tenant: ${tenantId}`);

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const mesRef = meses[(faturaOrigem.mes_referencia as number) - 1] || "";
    const alunoNome = (faturaOrigem.alunos as any)?.nome_completo || "Aluno";
    const cursoNome = (faturaOrigem.cursos as any)?.nome || "Curso";
    
    const descricaoFatura = descricao || 
      `Saldo restante - ${mesRef}/${faturaOrigem.ano_referencia} - ${alunoNome} - ${cursoNome}`;

    // Criar nova fatura para o saldo restante
    const { data: novaFatura, error: insertError } = await supabase
      .from("faturas")
      .insert({
        aluno_id: faturaOrigem.aluno_id,
        curso_id: faturaOrigem.curso_id,
        responsavel_id: faturaOrigem.responsavel_id,
        valor: valorRestante,
        valor_original: valorRestante,
        valor_bruto: valorRestante,
        saldo_restante: valorRestante,
        mes_referencia: faturaOrigem.mes_referencia,
        ano_referencia: faturaOrigem.ano_referencia,
        data_vencimento: dataVencimento,
        data_emissao: new Date().toISOString().split('T')[0],
        status: "Aberta",
        tenant_id: tenantId,
        gateway_config_id: gateway.configId,
        fatura_origem_id: faturaOrigemId,
        tipo_origem: "pagamento_parcial",
        juros_percentual_diario: faturaOrigem.juros_percentual_diario,
        juros_percentual_mensal: faturaOrigem.juros_percentual_mensal,
        multa: faturaOrigem.multa,
        created_by: user.id,
      })
      .select("id, codigo_sequencial")
      .single();

    if (insertError || !novaFatura) {
      console.error("Erro ao criar fatura derivada:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao criar fatura do saldo restante" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`[create-remainder-payment] Fatura derivada criada: ${novaFatura.id}`);

    // Rotear para o handler do gateway específico
    let paymentResult: GatewayPaymentResult;

    switch (gateway.gatewayType) {
      case "asaas":
        paymentResult = await createAsaasPayment(
          supabase, novaFatura.id, faturaOrigem, valorRestante, 
          dataVencimento, descricaoFatura, gateway
        );
        break;
      
      case "stripe":
        paymentResult = await createStripePayment(
          supabase, novaFatura.id, faturaOrigem, valorRestante,
          dataVencimento, descricaoFatura, gateway
        );
        break;
      
      case "mercado_pago":
        paymentResult = await createMercadoPagoPayment(
          supabase, novaFatura.id, faturaOrigem, valorRestante,
          dataVencimento, descricaoFatura, gateway
        );
        break;
      
      default:
        // Gateway não suportado - fatura criada mas sem cobrança automática
        paymentResult = { 
          success: false, 
          error: `Gateway ${gateway.gatewayType} não suportado para criação automática` 
        };
    }

    // Log da transação
    await logGatewayTransaction(supabase, {
      tenantId,
      gatewayConfigId: gateway.configId,
      gatewayType: gateway.gatewayType,
      operation: "create_remainder_payment",
      status: paymentResult.success ? "success" : "failed",
      faturaId: novaFatura.id,
      externalReference: paymentResult.paymentId,
      amount: valorRestante,
      errorMessage: paymentResult.error,
      durationMs: Date.now() - startTime,
    });

    // Criar notificação
    await supabase.from("notifications").insert({
      tenant_id: tenantId,
      title: "Fatura de Saldo Criada",
      message: `Nova cobrança de R$ ${valorRestante.toFixed(2)} criada para ${alunoNome} (saldo restante)`,
      type: "info",
      link: "/faturas",
    });

    return new Response(
      JSON.stringify({
        success: true,
        novaFaturaId: novaFatura.id,
        codigoSequencial: novaFatura.codigo_sequencial,
        gatewayType: gateway.gatewayType,
        paymentId: paymentResult.paymentId,
        invoiceUrl: paymentResult.invoiceUrl,
        message: paymentResult.success 
          ? "Fatura e cobrança criadas com sucesso" 
          : `Fatura criada. ${paymentResult.error || "Sincronize com gateway manualmente."}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[create-remainder-payment] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Handler para criação de cobrança no Asaas
 */
async function createAsaasPayment(
  supabase: SupabaseClient,
  novaFaturaId: string,
  faturaOrigem: any,
  valor: number,
  dataVencimento: string,
  descricao: string,
  gateway: GatewayCredentials
): Promise<GatewayPaymentResult> {
  const apiKey = gateway.apiKey;
  const apiUrl = gateway.apiUrl;

  if (!apiKey) {
    return { success: false, error: "Chave API do gateway não configurada" };
  }

  const responsavel = faturaOrigem.responsaveis as any;
  let customerId = responsavel?.asaas_customer_id;

  // Se não tem customer_id, criar no Asaas
  if (!customerId && responsavel) {
    try {
      const customerPayload = {
        name: responsavel.nome,
        cpfCnpj: responsavel.cpf?.replace(/\D/g, ''),
        email: responsavel.email,
        phone: responsavel.telefone?.replace(/\D/g, ''),
        externalReference: responsavel.id,
      };

      const customerRes = await fetch(`${apiUrl}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: apiKey,
        },
        body: JSON.stringify(customerPayload),
      });

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        customerId = customerData.id;
        
        await supabase
          .from("responsaveis")
          .update({ asaas_customer_id: customerData.id })
          .eq("id", responsavel.id);
      }
    } catch (custErr) {
      console.warn("Erro ao criar customer:", custErr);
    }
  }

  if (!customerId) {
    return { success: false, error: "Responsável sem cadastro no gateway" };
  }

  // Criar cobrança
  const paymentPayload = {
    customer: customerId,
    billingType: "BOLETO",
    value: valor,
    dueDate: dataVencimento,
    description: descricao,
    externalReference: novaFaturaId,
  };

  const paymentRes = await fetch(`${apiUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify(paymentPayload),
  });

  const paymentData = await paymentRes.json();

  if (!paymentRes.ok) {
    console.error("[create-remainder-payment] Erro gateway:", paymentData);
    return { 
      success: false, 
      error: paymentData.errors?.[0]?.description || "Erro ao criar cobrança" 
    };
  }

  // Atualizar fatura com dados do gateway
  await supabase
    .from("faturas")
    .update({
      asaas_payment_id: paymentData.id,
      asaas_status: paymentData.status,
      asaas_due_date: paymentData.dueDate,
      asaas_billing_type: paymentData.billingType,
      asaas_invoice_url: paymentData.invoiceUrl,
      asaas_boleto_url: paymentData.bankSlipUrl,
      payment_url: paymentData.invoiceUrl,
    })
    .eq("id", novaFaturaId);

  // Buscar PIX e boleto em paralelo
  let pixQrCode: string | undefined;
  let boletoBarcode: string | undefined;

  try {
    const [pixRes, boletoRes] = await Promise.all([
      fetch(`${apiUrl}/payments/${paymentData.id}/pixQrCode`, {
        headers: { access_token: apiKey },
      }).catch(() => null),
      fetch(`${apiUrl}/payments/${paymentData.id}/identificationField`, {
        headers: { access_token: apiKey },
      }).catch(() => null),
    ]);

    if (pixRes?.ok) {
      const pixData = await pixRes.json();
      pixQrCode = pixData.encodedImage;
      await supabase
        .from("faturas")
        .update({ 
          asaas_pix_qrcode: pixQrCode,
          asaas_pix_payload: pixData.payload,
        })
        .eq("id", novaFaturaId);
    }

    if (boletoRes?.ok) {
      const boletoData = await boletoRes.json();
      boletoBarcode = boletoData.identificationField;
      await supabase
        .from("faturas")
        .update({ 
          asaas_boleto_barcode: boletoBarcode,
          asaas_boleto_bar_code: boletoData.barCode,
        })
        .eq("id", novaFaturaId);
    }
  } catch (e) {
    console.warn("Erro ao buscar detalhes do pagamento:", e);
  }

  return {
    success: true,
    paymentId: paymentData.id,
    invoiceUrl: paymentData.invoiceUrl,
    pixQrCode,
    boletoBarcode,
  };
}

/**
 * Handler para criação de cobrança no Stripe
 * TODO: Implementar quando necessário
 */
async function createStripePayment(
  supabase: SupabaseClient,
  novaFaturaId: string,
  faturaOrigem: any,
  valor: number,
  dataVencimento: string,
  descricao: string,
  gateway: GatewayCredentials
): Promise<GatewayPaymentResult> {
  // Stripe usa cents
  const amountInCents = Math.round(valor * 100);
  const secretKey = gateway.apiKey;

  if (!secretKey) {
    return { success: false, error: "Chave API do Stripe não configurada" };
  }

  try {
    // Criar Payment Intent ou Invoice no Stripe
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: "brl",
        description: descricao,
        "metadata[fatura_id]": novaFaturaId,
        "metadata[tipo]": "remainder_payment",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message || "Erro ao criar cobrança Stripe" };
    }

    const paymentIntent = await response.json();

    // Atualizar fatura
    await supabase
      .from("faturas")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_url: null, // Stripe não tem URL de pagamento direto sem checkout
      })
      .eq("id", novaFaturaId);

    return {
      success: true,
      paymentId: paymentIntent.id,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Handler para criação de cobrança no Mercado Pago
 * TODO: Implementar quando necessário
 */
async function createMercadoPagoPayment(
  supabase: SupabaseClient,
  novaFaturaId: string,
  faturaOrigem: any,
  valor: number,
  dataVencimento: string,
  descricao: string,
  gateway: GatewayCredentials
): Promise<GatewayPaymentResult> {
  const accessToken = gateway.apiKey;

  if (!accessToken) {
    return { success: false, error: "Token do Mercado Pago não configurado" };
  }

  try {
    // Criar preferência de pagamento no Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: descricao,
            quantity: 1,
            currency_id: "BRL",
            unit_price: valor,
          }
        ],
        external_reference: novaFaturaId,
        expires: true,
        expiration_date_to: new Date(dataVencimento + "T23:59:59.000-03:00").toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Erro ao criar cobrança Mercado Pago" };
    }

    const preference = await response.json();

    // Atualizar fatura
    await supabase
      .from("faturas")
      .update({
        payment_url: preference.init_point,
      })
      .eq("id", novaFaturaId);

    return {
      success: true,
      paymentId: preference.id,
      invoiceUrl: preference.init_point,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
