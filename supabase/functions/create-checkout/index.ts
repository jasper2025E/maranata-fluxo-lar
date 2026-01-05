import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY não configurada");
      throw new Error("Stripe não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { faturaId, successUrl, cancelUrl } = await req.json();

    if (!faturaId) {
      throw new Error("ID da fatura é obrigatório");
    }

    console.log(`Criando checkout para fatura: ${faturaId}`);

    // Buscar dados da fatura com aluno e responsável
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        alunos(nome_completo, email_responsavel, responsavel_id),
        cursos(nome),
        responsaveis(id, nome, email, stripe_customer_id)
      `)
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      console.error("Erro ao buscar fatura:", faturaError);
      throw new Error("Fatura não encontrada");
    }

    if (fatura.status === "Paga") {
      throw new Error("Esta fatura já foi paga");
    }

    if (fatura.status === "Cancelada") {
      throw new Error("Esta fatura está cancelada");
    }

    // Se já tem checkout session, verificar se ainda é válido
    if (fatura.stripe_checkout_session_id && fatura.payment_url) {
      console.log("Checkout session já existe, retornando URL existente");
      return new Response(
        JSON.stringify({ 
          url: fatura.payment_url,
          sessionId: fatura.stripe_checkout_session_id,
          existing: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const mesNome = meses[fatura.mes_referencia - 1];
    const descricao = `${fatura.cursos?.nome || "Curso"} - ${fatura.alunos?.nome_completo || "Aluno"} - ${mesNome}/${fatura.ano_referencia}`;

    // Criar ou buscar customer no Stripe
    let customerId = fatura.responsaveis?.stripe_customer_id;
    const customerEmail = fatura.responsaveis?.email || fatura.alunos?.email_responsavel;
    const customerName = fatura.responsaveis?.nome || fatura.alunos?.nome_completo;

    if (!customerId && customerEmail) {
      console.log("Criando customer no Stripe...");
      
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: customerEmail,
          name: customerName || "",
          "metadata[fatura_id]": faturaId,
          "metadata[aluno_nome]": fatura.alunos?.nome_completo || "",
        }),
      });

      const customer = await customerResponse.json();
      
      if (customer.error) {
        console.error("Erro ao criar customer:", customer.error);
        throw new Error(customer.error.message);
      }

      customerId = customer.id;

      // Salvar stripe_customer_id no responsável
      if (fatura.responsaveis?.id) {
        await supabase
          .from("responsaveis")
          .update({ stripe_customer_id: customerId })
          .eq("id", fatura.responsaveis.id);
      }
    }

    // Criar Checkout Session no Stripe
    console.log("Criando Checkout Session...");
    
    // Usar valor_total se disponível (já com desconto, juros e multa calculados)
    const valorFinal = fatura.valor_total || fatura.valor;
    
    // Construir descrição detalhada
    let descricaoCompleta = descricao;
    if (fatura.valor_desconto_aplicado && fatura.valor_desconto_aplicado > 0) {
      descricaoCompleta += ` (Desconto: R$ ${fatura.valor_desconto_aplicado.toFixed(2)})`;
    }
    if (fatura.valor_juros_aplicado && fatura.valor_juros_aplicado > 0) {
      descricaoCompleta += ` (Juros: R$ ${fatura.valor_juros_aplicado.toFixed(2)})`;
    }
    if (fatura.valor_multa_aplicado && fatura.valor_multa_aplicado > 0) {
      descricaoCompleta += ` (Multa: R$ ${fatura.valor_multa_aplicado.toFixed(2)})`;
    }
    
    const baseUrl = successUrl?.split("/faturas")[0] || successUrl?.split("?")[0] || "https://example.com";
    const sessionParams = new URLSearchParams({
      "mode": "payment",
      "success_url": successUrl || `${baseUrl}/pagamento/resultado?success=true&fatura_id=${faturaId}`,
      "cancel_url": cancelUrl || `${baseUrl}/pagamento/resultado?canceled=true&fatura_id=${faturaId}`,
      "line_items[0][price_data][currency]": "brl",
      "line_items[0][price_data][product_data][name]": descricaoCompleta,
      "line_items[0][price_data][unit_amount]": Math.round(valorFinal * 100).toString(),
      "line_items[0][quantity]": "1",
      "payment_method_types[0]": "card",
      "metadata[fatura_id]": faturaId,
      "metadata[aluno_nome]": fatura.alunos?.nome_completo || "",
      "metadata[curso_nome]": fatura.cursos?.nome || "",
      "metadata[valor_original]": (fatura.valor_original || fatura.valor).toString(),
      "metadata[desconto]": (fatura.valor_desconto_aplicado || 0).toString(),
      "metadata[juros]": (fatura.valor_juros_aplicado || 0).toString(),
      "metadata[multa]": (fatura.valor_multa_aplicado || 0).toString(),
      "locale": "pt-BR",
    });

    if (customerId) {
      sessionParams.append("customer", customerId);
    } else if (customerEmail) {
      sessionParams.append("customer_email", customerEmail);
    }

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionParams,
    });

    const session = await sessionResponse.json();

    if (session.error) {
      console.error("Erro ao criar checkout session:", session.error);
      throw new Error(session.error.message);
    }

    console.log("Checkout Session criada:", session.id);

    // Salvar dados do Stripe na fatura
    const { error: updateError } = await supabase
      .from("faturas")
      .update({
        stripe_checkout_session_id: session.id,
        payment_url: session.url,
        stripe_payment_intent_id: session.payment_intent,
      })
      .eq("id", faturaId);

    if (updateError) {
      console.error("Erro ao atualizar fatura:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
        existing: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no create-checkout:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
