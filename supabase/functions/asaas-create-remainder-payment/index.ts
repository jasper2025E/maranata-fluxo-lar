import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getAsaasCredentials,
  logGatewayTransaction 
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
        codigo_sequencial, asaas_payment_id, tenant_id, gateway_config_id,
        juros_percentual_diario, juros_percentual_mensal, multa,
        alunos(nome_completo, responsavel_id),
        cursos(nome),
        responsaveis(nome, cpf, email, telefone, asaas_customer_id)
      `)
      .eq("id", faturaOrigemId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (faturaError || !faturaOrigem) {
      return new Response(
        JSON.stringify({ success: false, error: "Fatura original não encontrada ou acesso negado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

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
        tenant_id: profile.tenant_id,
        gateway_config_id: faturaOrigem.gateway_config_id,
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

    console.log(`[asaas-create-remainder-payment] Fatura derivada criada: ${novaFatura.id}`);

    // Verificar se há responsável com customer_id no Asaas
    const responsavel = faturaOrigem.responsaveis as any;
    let asaasCustomerId = responsavel?.asaas_customer_id;

    // Se não tem customer_id, criar no Asaas
    if (!asaasCustomerId && responsavel) {
      try {
        const { apiKey, apiUrl } = await getAsaasCredentials(supabase, profile.tenant_id);
        
        const customerPayload = {
          name: responsavel.nome,
          cpfCnpj: responsavel.cpf?.replace(/\D/g, ''),
          email: responsavel.email,
          phone: responsavel.telefone?.replace(/\D/g, ''),
          externalReference: faturaOrigem.responsavel_id,
        };

        const customerRes = await fetch(`${apiUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            access_token: apiKey,
          },
          body: JSON.stringify(customerPayload),
        });

        const customerData = await customerRes.json();
        
        if (customerRes.ok && customerData.id) {
          asaasCustomerId = customerData.id;
          
          // Salvar customer_id no responsável
          await supabase
            .from("responsaveis")
            .update({ asaas_customer_id: customerData.id })
            .eq("id", faturaOrigem.responsavel_id);
        }
      } catch (custErr) {
        console.warn("Erro ao criar customer Asaas:", custErr);
        // Continua sem customer - a cobrança pode falhar
      }
    }

    // Criar cobrança no Asaas para a nova fatura
    let asaasPaymentId: string | null = null;
    let asaasPaymentData: any = null;

    try {
      const { apiKey, apiUrl, configId } = await getAsaasCredentials(supabase, profile.tenant_id);

      const paymentPayload = {
        customer: asaasCustomerId,
        billingType: "BOLETO",
        value: valorRestante,
        dueDate: dataVencimento,
        description: descricaoFatura,
        externalReference: novaFatura.id,
      };

      console.log(`[asaas-create-remainder-payment] Criando cobrança Asaas:`, paymentPayload);

      const paymentRes = await fetch(`${apiUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: apiKey,
        },
        body: JSON.stringify(paymentPayload),
      });

      asaasPaymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        console.error("[asaas-create-remainder-payment] Erro Asaas:", asaasPaymentData);
        
        await logGatewayTransaction(supabase, {
          tenantId: profile.tenant_id,
          gatewayConfigId: configId,
          gatewayType: "asaas",
          operation: "create_remainder_payment",
          status: "failed",
          faturaId: novaFatura.id,
          amount: valorRestante,
          errorCode: asaasPaymentData.errors?.[0]?.code,
          errorMessage: asaasPaymentData.errors?.[0]?.description || "Erro desconhecido",
          durationMs: Date.now() - startTime,
        });
      } else {
        asaasPaymentId = asaasPaymentData.id;

        // Atualizar fatura com dados do Asaas
        await supabase
          .from("faturas")
          .update({
            asaas_payment_id: asaasPaymentData.id,
            asaas_status: asaasPaymentData.status,
            asaas_due_date: asaasPaymentData.dueDate,
            asaas_billing_type: asaasPaymentData.billingType,
            asaas_invoice_url: asaasPaymentData.invoiceUrl,
            asaas_boleto_url: asaasPaymentData.bankSlipUrl,
            payment_url: asaasPaymentData.invoiceUrl,
          })
          .eq("id", novaFatura.id);

        // Log sucesso
        await logGatewayTransaction(supabase, {
          tenantId: profile.tenant_id,
          gatewayConfigId: configId,
          gatewayType: "asaas",
          operation: "create_remainder_payment",
          status: "success",
          faturaId: novaFatura.id,
          externalReference: asaasPaymentData.id,
          amount: valorRestante,
          responsePayload: { status: asaasPaymentData.status, invoiceUrl: asaasPaymentData.invoiceUrl },
          durationMs: Date.now() - startTime,
        });

        console.log(`[asaas-create-remainder-payment] Cobrança criada: ${asaasPaymentData.id}`);
      }
    } catch (asaasErr) {
      console.error("[asaas-create-remainder-payment] Erro ao criar cobrança:", asaasErr);
      // Não falha - fatura foi criada, cobrança pode ser sincronizada depois
    }

    // Criar notificação
    await supabase.from("notifications").insert({
      tenant_id: profile.tenant_id,
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
        asaasPaymentId,
        invoiceUrl: asaasPaymentData?.invoiceUrl,
        message: asaasPaymentId 
          ? "Fatura e cobrança criadas com sucesso" 
          : "Fatura criada. Sincronize com gateway manualmente.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[asaas-create-remainder-payment] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
