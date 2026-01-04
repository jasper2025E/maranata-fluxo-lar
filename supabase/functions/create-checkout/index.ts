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
    
    const baseUrl = successUrl?.split("?")[0] || "https://example.com";
    const sessionParams = new URLSearchParams({
      "mode": "payment",
      "success_url": successUrl || `${baseUrl}/faturas?success=true&fatura_id=${faturaId}`,
      "cancel_url": cancelUrl || `${baseUrl}/faturas?canceled=true`,
      "line_items[0][price_data][currency]": "brl",
      "line_items[0][price_data][product_data][name]": descricao,
      "line_items[0][price_data][unit_amount]": Math.round(fatura.valor * 100).toString(),
      "line_items[0][quantity]": "1",
      "payment_method_types[0]": "card",
      "payment_method_types[1]": "boleto",
      "payment_method_types[2]": "pix",
      "metadata[fatura_id]": faturaId,
      "metadata[aluno_nome]": fatura.alunos?.nome_completo || "",
      "metadata[curso_nome]": fatura.cursos?.nome || "",
      "locale": "pt-BR",
      "payment_method_options[boleto][expires_after_days]": "3",
      "payment_method_options[pix][expires_after_seconds]": "86400",
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
