import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentData {
  responsavel: {
    nome: string;
    cpf: string;
    telefone: string;
    email: string;
  };
  alunos: Array<{
    nome_completo: string;
    data_nascimento: string | null;
    curso_id: string;
  }>;
  utm_params?: Record<string, string | null>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responsavel, alunos, utm_params } = await req.json() as EnrollmentData;

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get course details and calculate total
    const cursoIds = alunos.map(a => a.curso_id);
    const { data: cursos, error: cursosError } = await supabaseAdmin
      .from("cursos")
      .select("id, nome, mensalidade")
      .in("id", cursoIds);

    if (cursosError) throw cursosError;

    const total = alunos.reduce((sum, aluno) => {
      const curso = cursos?.find(c => c.id === aluno.curso_id);
      return sum + (curso?.mensalidade || 0);
    }, 0);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: responsavel.email,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: responsavel.email,
        name: responsavel.nome,
        phone: responsavel.telefone,
        metadata: {
          cpf: responsavel.cpf,
          source: "landing_page",
        },
      });
      customerId = customer.id;
    }

    // Create line items for each student/course
    const lineItems = alunos.map(aluno => {
      const curso = cursos?.find(c => c.id === aluno.curso_id);
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Matrícula: ${aluno.nome_completo}`,
            description: `Curso: ${curso?.nome || "N/A"}`,
          },
          unit_amount: Math.round((curso?.mensalidade || 0) * 100),
        },
        quantity: 1,
      };
    });

    // Store enrollment data in metadata for webhook processing
    const enrollmentMeta = {
      responsavel: JSON.stringify(responsavel),
      alunos: JSON.stringify(alunos),
      utm_params: JSON.stringify(utm_params || {}),
    };

    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/inscricao?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/inscricao?canceled=true`,
      metadata: enrollmentMeta,
      payment_intent_data: {
        metadata: enrollmentMeta,
      },
      locale: "pt-BR",
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating enrollment checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
