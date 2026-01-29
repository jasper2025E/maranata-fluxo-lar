import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  entry.count++;
  return false;
}

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;
  
  return true;
}

function maskEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + "***";
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  const lastFour = cleaned.slice(-4);
  return `(XX) XXXXX-${lastFour}`;
}

function getStatusLabel(status: string, vencimento: string): string {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = new Date(vencimento);
  dataVenc.setHours(0, 0, 0, 0);
  
  if (status === "Paga") return "paga";
  if (status === "Cancelada") return "cancelada";
  if (dataVenc < hoje) return "vencida";
  return "aberta";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { cpf, tenant_id } = await req.json();

    if (!cpf || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "CPF e identificador da escola são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanedCpf = cpf.replace(/\D/g, "");
    
    if (!validateCPF(cleanedCpf)) {
      return new Response(
        JSON.stringify({ error: "CPF inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Portal lookup:", { cpf: cleanedCpf.substring(0, 3) + "***", tenant_id });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate tenant exists and is active
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, nome, status, blocked_at")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error("Tenant not found:", tenant_id);
      return new Response(
        JSON.stringify({ error: "Escola não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tenant.blocked_at || tenant.status === "inativo") {
      return new Response(
        JSON.stringify({ error: "Esta escola não está disponível no momento" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find responsável by CPF in this tenant
    const { data: responsavel, error: respError } = await supabase
      .from("responsaveis")
      .select("id, nome, email, telefone, cpf")
      .eq("cpf", cleanedCpf)
      .eq("tenant_id", tenant_id)
      .eq("ativo", true)
      .single();

    if (respError || !responsavel) {
      console.log("Responsável not found for CPF in tenant");
      return new Response(
        JSON.stringify({ error: "CPF não encontrado. Verifique se o CPF está correto ou entre em contato com a escola." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get alunos linked to this responsável
    const { data: alunos, error: alunosError } = await supabase
      .from("alunos")
      .select(`
        id,
        nome_completo,
        status_matricula,
        cursos:curso_id(nome, nivel)
      `)
      .eq("responsavel_id", responsavel.id)
      .eq("tenant_id", tenant_id)
      .in("status_matricula", ["ativo", "pendente"]);

    if (alunosError) {
      console.error("Error fetching alunos:", alunosError);
    }

    // Get faturas for this responsável
    const { data: faturas, error: faturasError } = await supabase
      .from("faturas")
      .select(`
        id,
        valor,
        valor_total,
        mes_referencia,
        ano_referencia,
        data_vencimento,
        status,
        asaas_pix_payload,
        asaas_pix_qrcode,
        asaas_boleto_url,
        asaas_invoice_url,
        payment_url,
        aluno:alunos(nome_completo)
      `)
      .eq("responsavel_id", responsavel.id)
      .eq("tenant_id", tenant_id)
      .neq("status", "Cancelada")
      .order("data_vencimento", { ascending: false })
      .limit(24);

    if (faturasError) {
      console.error("Error fetching faturas:", faturasError);
    }

    // Format response with masked data
    const meses = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const response = {
      responsavel: {
        nome: responsavel.nome,
        email_parcial: maskEmail(responsavel.email),
        telefone_parcial: maskPhone(responsavel.telefone),
      },
      alunos: (alunos || []).map((a: any) => ({
        nome: a.nome_completo,
        curso: a.cursos?.nome || "Curso não definido",
        nivel: a.cursos?.nivel || "",
        status: a.status_matricula,
      })),
      faturas: (faturas || []).map((f: any) => ({
        referencia: `${meses[f.mes_referencia]}/${f.ano_referencia}`,
        aluno_nome: f.aluno?.nome_completo || "Aluno",
        valor: f.valor_total || f.valor,
        vencimento: f.data_vencimento,
        status: getStatusLabel(f.status, f.data_vencimento),
        pix_payload: f.asaas_pix_payload || null,
        pix_qrcode: f.asaas_pix_qrcode || null,
        boleto_url: f.asaas_boleto_url || null,
        invoice_url: f.asaas_invoice_url || f.payment_url || null,
      })),
      escola: {
        nome: tenant.nome,
      },
    };

    console.log("Portal lookup success:", { 
      responsavel: responsavel.nome, 
      alunos: response.alunos.length,
      faturas: response.faturas.length 
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in portal-consulta-cpf:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar consulta. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
