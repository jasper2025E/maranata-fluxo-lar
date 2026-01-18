import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schemas
const responsavelSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome muito longo").trim(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos numéricos"),
  telefone: z.string().min(10, "Telefone inválido").max(20, "Telefone muito longo").trim(),
  email: z.string().email("Email inválido").max(255, "Email muito longo").toLowerCase().trim(),
});

const alunoSchema = z.object({
  nome_completo: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome muito longo").trim(),
  data_nascimento: z.string().nullable().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date < new Date();
  }, "Data de nascimento inválida"),
  curso_id: z.string().uuid("ID do curso inválido"),
});

const enrollmentSchema = z.object({
  responsavel: responsavelSchema,
  alunos: z.array(alunoSchema).min(1, "Pelo menos um aluno é necessário").max(10, "Máximo de 10 alunos por inscrição"),
  utm_params: z.record(z.string().nullable()).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido no corpo da requisição" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side validation with Zod
    const validationResult = enrollmentSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Dados inválidos", 
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { responsavel, alunos, utm_params } = validationResult.data;

    console.log("Processing enrollment checkout:", { responsavel: responsavel.email, alunosCount: alunos.length });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate that all curso_ids exist in the database
    const cursoIds = alunos.map(a => a.curso_id);
    const { data: cursos, error: cursosError } = await supabaseAdmin
      .from("cursos")
      .select("id, nome, mensalidade, ativo")
      .in("id", cursoIds);

    if (cursosError) {
      console.error("Error fetching courses:", cursosError);
      throw new Error("Erro ao buscar cursos");
    }

    // Validate all courses exist and are active
    for (const aluno of alunos) {
      const curso = cursos?.find(c => c.id === aluno.curso_id);
      if (!curso) {
        return new Response(
          JSON.stringify({ error: `Curso não encontrado para o aluno ${aluno.nome_completo}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (curso.ativo === false) {
        return new Response(
          JSON.stringify({ error: `Curso "${curso.nome}" não está disponível para matrículas` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const total = alunos.reduce((sum, aluno) => {
      const curso = cursos?.find(c => c.id === aluno.curso_id);
      return sum + (curso?.mensalidade || 0);
    }, 0);

    if (total <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor total inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Total calculated:", total);

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
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
      console.log("Using existing customer:", customerId);
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
      console.log("Created new customer:", customerId);
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

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating enrollment checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
