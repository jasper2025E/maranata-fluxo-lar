import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Planos disponíveis com preços em centavos
const PLANS = {
  basic: {
    name: "Plano Básico",
    price: 9900, // R$ 99,00
    features: ["Até 50 alunos", "Gestão de faturas", "Relatórios básicos", "Suporte por email"],
  },
  pro: {
    name: "Plano Profissional",
    price: 19900, // R$ 199,00
    features: ["Até 200 alunos", "Integração Asaas/PIX", "Relatórios avançados", "Suporte prioritário", "Gestão de RH"],
  },
  enterprise: {
    name: "Plano Enterprise",
    price: 49900, // R$ 499,00
    features: ["Alunos ilimitados", "Todas as integrações", "API personalizada", "Suporte dedicado 24/7", "Treinamento incluso"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPESECRETAPI");
    if (!stripeSecretKey) {
      throw new Error("Stripe não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { tenantId, planId, successUrl, cancelUrl } = await req.json();

    if (!tenantId || !planId) {
      throw new Error("ID do tenant e plano são obrigatórios");
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      throw new Error("Plano inválido");
    }

    console.log(`Criando checkout de assinatura para tenant: ${tenantId}, plano: ${planId}`);

    // Buscar dados do tenant com validação completa
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, nome, email, cnpj, stripe_customer_id, subscription_status, plano")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error("Erro ao buscar tenant:", tenantError);
      throw new Error("Escola não encontrada");
    }

    // Validação de dados obrigatórios
    const missingFields: string[] = [];

    if (!tenant.email || tenant.email.trim() === "") {
      missingFields.push("Email");
    }

    if (!tenant.cnpj || tenant.cnpj.trim() === "") {
      missingFields.push("CNPJ");
    }

    if (!tenant.nome || tenant.nome.trim() === "") {
      missingFields.push("Nome da escola");
    }

    if (missingFields.length > 0) {
      console.error("Dados obrigatórios ausentes:", missingFields);
      throw new Error(`Dados obrigatórios não preenchidos: ${missingFields.join(", ")}. Acesse Configurações > Dados da Escola para completar.`);
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tenant.email)) {
      throw new Error("Email da escola inválido. Corrija em Configurações > Dados da Escola.");
    }

    // Validação básica de CNPJ (14 dígitos)
    const cnpjDigits = tenant.cnpj.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      throw new Error("CNPJ da escola inválido. Corrija em Configurações > Dados da Escola.");
    }

    // Verificar se já tem assinatura ativa do mesmo plano
    if (tenant.subscription_status === "active" && tenant.plano === planId) {
      throw new Error("Você já possui este plano ativo");
    }

    // Criar ou buscar customer no Stripe
    let customerId = tenant.stripe_customer_id;

    // Verificar se o customer existe no Stripe
    if (customerId) {
      console.log("Verificando se customer existe no Stripe:", customerId);
      const customerCheck = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
        },
      });
      
      const customerData = await customerCheck.json();
      
      if (customerData.error || customerData.deleted) {
        console.log("Customer não existe ou foi deletado, será criado um novo");
        customerId = null;
        
        // Limpar o ID inválido do banco
        await supabase
          .from("tenants")
          .update({ stripe_customer_id: null })
          .eq("id", tenantId);
      }
    }

    if (!customerId && tenant.email) {
      console.log("Criando customer no Stripe...");
      
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: tenant.email,
          name: tenant.nome || "",
          "metadata[tenant_id]": tenantId,
        }),
      });

      const customer = await customerResponse.json();
      
      if (customer.error) {
        console.error("Erro ao criar customer:", customer.error);
        throw new Error(customer.error.message);
      }

      customerId = customer.id;

      // Salvar stripe_customer_id no tenant
      await supabase
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenantId);
    }

    // Criar ou buscar Price no Stripe
    // Primeiro, buscar produto existente ou criar um novo
    const productSearch = await fetch(
      `https://api.stripe.com/v1/products/search?query=metadata['plan_id']:'${planId}'`,
      {
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
        },
      }
    );
    
    const productSearchResult = await productSearch.json();
    let productId: string;

    if (productSearchResult.data && productSearchResult.data.length > 0) {
      productId = productSearchResult.data[0].id;
    } else {
      // Criar produto
      const productResponse = await fetch("https://api.stripe.com/v1/products", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          name: plan.name,
          description: plan.features.join(", "),
          "metadata[plan_id]": planId,
        }),
      });

      const product = await productResponse.json();
      if (product.error) {
        throw new Error(product.error.message);
      }
      productId = product.id;
    }

    // Buscar price existente ou criar
    const priceSearch = await fetch(
      `https://api.stripe.com/v1/prices?product=${productId}&active=true&type=recurring`,
      {
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
        },
      }
    );

    const priceSearchResult = await priceSearch.json();
    let priceId: string;

    if (priceSearchResult.data && priceSearchResult.data.length > 0) {
      // Usar price existente se o valor for o mesmo
      const existingPrice = priceSearchResult.data.find(
        (p: any) => p.unit_amount === plan.price && p.currency === "brl"
      );
      if (existingPrice) {
        priceId = existingPrice.id;
      } else {
        // Criar novo price
        const priceResponse = await fetch("https://api.stripe.com/v1/prices", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            product: productId,
            unit_amount: plan.price.toString(),
            currency: "brl",
            "recurring[interval]": "month",
          }),
        });

        const price = await priceResponse.json();
        if (price.error) {
          throw new Error(price.error.message);
        }
        priceId = price.id;
      }
    } else {
      // Criar price
      const priceResponse = await fetch("https://api.stripe.com/v1/prices", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          product: productId,
          unit_amount: plan.price.toString(),
          currency: "brl",
          "recurring[interval]": "month",
        }),
      });

      const price = await priceResponse.json();
      if (price.error) {
        throw new Error(price.error.message);
      }
      priceId = price.id;
    }

    // Criar Checkout Session para subscription
    console.log("Criando Checkout Session de assinatura...");
    
    const baseUrl = successUrl?.split("/assinatura")[0] || "https://example.com";
    
    const sessionParams = new URLSearchParams({
      "mode": "subscription",
      "success_url": successUrl || `${baseUrl}/assinatura?success=true&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": cancelUrl || `${baseUrl}/assinatura?canceled=true`,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[tenant_id]": tenantId,
      "metadata[plan_id]": planId,
      "metadata[plan_name]": plan.name,
      "subscription_data[metadata][tenant_id]": tenantId,
      "subscription_data[metadata][plan_id]": planId,
      "locale": "pt-BR",
      "allow_promotion_codes": "true",
    });

    if (customerId) {
      sessionParams.append("customer", customerId);
    } else if (tenant.email) {
      sessionParams.append("customer_email", tenant.email);
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

    // Registrar no histórico
    await supabase.from("subscription_history").insert({
      tenant_id: tenantId,
      event_type: "checkout_started",
      old_status: tenant.subscription_status,
      new_status: tenant.subscription_status,
      amount: plan.price / 100,
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
        checkout_session_id: session.id,
      },
    });

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no create-subscription-checkout:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
