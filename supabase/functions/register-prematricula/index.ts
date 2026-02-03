import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage (in-memory, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

function getRateLimitKey(req: Request): string {
  // Try to get real IP from headers (Cloudflare, etc.)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  
  return cfConnectingIp || realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }
  
  if (!record || record.resetAt < now) {
    // First request or window expired
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

// Validation schemas
const responsavelSchema = z.object({
  nome: z.string().min(2).max(200).trim(),
  cpf: z.string().regex(/^\d{11}$/),
  telefone: z.string().min(10).max(20).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
});

const alunoSchema = z.object({
  nome_completo: z.string().min(2).max(200).trim(),
  data_nascimento: z.string().nullable(),
  curso_id: z.string().uuid(),
});

const requestSchema = z.object({
  responsavel: responsavelSchema,
  alunos: z.array(alunoSchema).min(1).max(10),
  tenant_id: z.string().uuid(),
  utm_params: z.record(z.string().nullable()).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientKey = getRateLimitKey(req);
  const rateLimitResult = checkRateLimit(clientKey);
  
  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for ${clientKey}`);
    return new Response(
      JSON.stringify({ 
        error: "Muitas requisições. Tente novamente em alguns segundos.",
        retryAfter: rateLimitResult.retryAfter 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60)
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Validate request
    const validationResult = requestSchema.safeParse(body);
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

    const { responsavel, alunos, tenant_id, utm_params } = validationResult.data;

    console.log("Processing pre-matricula:", { email: responsavel.email, alunosCount: alunos.length, tenant_id });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, nome")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error("Tenant not found:", tenant_id);
      return new Response(
        JSON.stringify({ error: "Escola não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all curso_ids exist and belong to this tenant
    const cursoIds = alunos.map(a => a.curso_id);
    const { data: cursos, error: cursosError } = await supabase
      .from("cursos")
      .select("id, nome, mensalidade, ativo, tenant_id")
      .in("id", cursoIds)
      .eq("tenant_id", tenant_id);

    if (cursosError) {
      console.error("Error fetching courses:", cursosError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar cursos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all courses exist, are active, and belong to tenant
    for (const aluno of alunos) {
      const curso = cursos?.find(c => c.id === aluno.curso_id);
      if (!curso) {
        return new Response(
          JSON.stringify({ error: `Curso não encontrado para ${aluno.nome_completo}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!curso.ativo) {
        return new Response(
          JSON.stringify({ error: `Curso "${curso.nome}" não está disponível` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if responsável already exists
    const { data: existingResp } = await supabase
      .from("responsaveis")
      .select("id")
      .eq("cpf", responsavel.cpf)
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    let responsavelId: string;

    if (existingResp) {
      responsavelId = existingResp.id;
      console.log("Using existing responsavel:", responsavelId);
    } else {
      // Create new responsável
      const { data: newResp, error: respError } = await supabase
        .from("responsaveis")
        .insert({
          nome: responsavel.nome,
          cpf: responsavel.cpf,
          telefone: responsavel.telefone,
          email: responsavel.email,
          ativo: true,
          tenant_id: tenant_id,
        })
        .select("id")
        .single();

      if (respError) {
        console.error("Error creating responsavel:", respError);
        return new Response(
          JSON.stringify({ error: "Erro ao registrar responsável" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      responsavelId = newResp.id;
      console.log("Created new responsavel:", responsavelId);

      // Notificar novo responsável cadastrado via site
      await supabase.from("notifications").insert({
        tenant_id: tenant_id,
        title: "Novo Responsável Cadastrado",
        message: `${responsavel.nome} se cadastrou via site da escola`,
        type: "info",
        link: "/responsaveis"
      });
    }

    // Create alunos with status "pendente" (pre-matricula)
    const createdAlunos: string[] = [];
    for (const aluno of alunos) {
      const cursoInfo = cursos?.find(c => c.id === aluno.curso_id);
      
      const { data: newAluno, error: alunoError } = await supabase
        .from("alunos")
        .insert({
          nome_completo: aluno.nome_completo,
          data_nascimento: aluno.data_nascimento,
          curso_id: aluno.curso_id,
          responsavel_id: responsavelId,
          email_responsavel: responsavel.email,
          telefone_responsavel: responsavel.telefone,
          status_matricula: "pendente",
          tenant_id: tenant_id,
        })
        .select("id")
        .single();

      if (alunoError) {
        console.error("Error creating aluno:", alunoError);
        continue;
      }

      createdAlunos.push(newAluno.id);
      console.log("Created aluno:", newAluno.id);

      // Notificar nova pré-matrícula
      await supabase.from("notifications").insert({
        tenant_id: tenant_id,
        title: "Nova Pré-Matrícula",
        message: `${aluno.nome_completo} - ${cursoInfo?.nome || 'Curso'} (aguardando aprovação)`,
        type: "info",
        link: "/alunos"
      });
    }

    // Track conversion (optional)
    try {
      await supabase.from("marketing_conversions").insert({
        page_id: "00000000-0000-0000-0000-000000000000",
        event_name: "PreMatricula",
        visitor_id: responsavelId,
        dados: {
          tenant_id,
          alunos_count: createdAlunos.length,
          utm_source: utm_params?.source,
          utm_medium: utm_params?.medium,
          utm_campaign: utm_params?.campaign,
        },
      });
    } catch (convError) {
      console.log("Could not track conversion:", convError);
    }

    console.log("Pre-matricula completed:", { responsavelId, alunos: createdAlunos.length });

    return new Response(
      JSON.stringify({ 
        success: true, 
        responsavel_id: responsavelId,
        alunos_count: createdAlunos.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing pre-matricula:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
