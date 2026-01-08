import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Stripe keys not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Only process if it has enrollment metadata
      if (!session.metadata?.responsavel) {
        console.log("Not an enrollment checkout, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Processing enrollment for session:", session.id);

      const responsavel = JSON.parse(session.metadata.responsavel);
      const alunos = JSON.parse(session.metadata.alunos);
      const utmParams = session.metadata.utm_params ? JSON.parse(session.metadata.utm_params) : {};

      // Initialize Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Check if responsável already exists
      const { data: existingResponsavel } = await supabaseAdmin
        .from("responsaveis")
        .select("id")
        .eq("cpf", responsavel.cpf.replace(/\D/g, ""))
        .maybeSingle();

      let responsavelId: string;

      if (existingResponsavel) {
        responsavelId = existingResponsavel.id;
        console.log("Using existing responsavel:", responsavelId);
      } else {
        // Create new responsável
        const { data: newResponsavel, error: respError } = await supabaseAdmin
          .from("responsaveis")
          .insert({
            nome: responsavel.nome,
            cpf: responsavel.cpf.replace(/\D/g, ""),
            telefone: responsavel.telefone,
            email: responsavel.email,
            stripe_customer_id: session.customer as string,
            ativo: true,
          })
          .select("id")
          .single();

        if (respError) {
          console.error("Error creating responsavel:", respError);
          throw respError;
        }

        responsavelId = newResponsavel.id;
        console.log("Created new responsavel:", responsavelId);
      }

      // Create alunos and faturas
      for (const aluno of alunos) {
        // Get curso details
        const { data: curso } = await supabaseAdmin
          .from("cursos")
          .select("id, nome, mensalidade")
          .eq("id", aluno.curso_id)
          .single();

        if (!curso) {
          console.error("Course not found:", aluno.curso_id);
          continue;
        }

        // Create aluno
        const { data: newAluno, error: alunoError } = await supabaseAdmin
          .from("alunos")
          .insert({
            nome_completo: aluno.nome_completo,
            data_nascimento: aluno.data_nascimento,
            curso_id: aluno.curso_id,
            responsavel_id: responsavelId,
            email_responsavel: responsavel.email,
            telefone_responsavel: responsavel.telefone,
            status_matricula: "ativo",
            data_matricula: new Date().toISOString().split("T")[0],
          })
          .select("id")
          .single();

        if (alunoError) {
          console.error("Error creating aluno:", alunoError);
          continue;
        }

        console.log("Created aluno:", newAluno.id);

        // Create fatura for first month (already paid)
        const now = new Date();
        const { error: faturaError } = await supabaseAdmin
          .from("faturas")
          .insert({
            aluno_id: newAluno.id,
            curso_id: aluno.curso_id,
            responsavel_id: responsavelId,
            valor: curso.mensalidade,
            valor_original: curso.mensalidade,
            mes_referencia: now.getMonth() + 1,
            ano_referencia: now.getFullYear(),
            data_emissao: now.toISOString().split("T")[0],
            data_vencimento: now.toISOString().split("T")[0],
            status: "Paga",
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
          });

        if (faturaError) {
          console.error("Error creating fatura:", faturaError);
        } else {
          console.log("Created fatura for aluno:", newAluno.id);
        }
      }

      // Track conversion in marketing
      try {
        await supabaseAdmin.from("marketing_conversions").insert({
          page_id: "00000000-0000-0000-0000-000000000000", // Default landing page
          event_name: "Purchase",
          valor: (session.amount_total || 0) / 100,
          visitor_id: session.customer as string,
          dados: {
            session_id: session.id,
            utm_source: utmParams.source,
            utm_medium: utmParams.medium,
            utm_campaign: utmParams.campaign,
          },
        });
      } catch (convError) {
        console.log("Could not track conversion:", convError);
      }

      console.log("Enrollment completed successfully");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
