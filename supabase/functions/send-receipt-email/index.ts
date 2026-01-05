import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://sznckclviajjmmvsgrpp.lovable.app",
  "https://preview--sznckclviajjmmvsgrpp.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  
  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  
  return headers;
}

// HTML escape function to prevent injection
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\r\n|\r|\n/g, " "); // Remove line breaks for header injection prevention
}

// Strict sanitization for email "from" name
function sanitizeFromName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '') // Only allow alphanumeric, accented chars, and spaces
    .substring(0, 50) // Limit length
    .trim();
}

interface SendReceiptRequest {
  faturaId: string;
  recipientEmail: string;
  recipientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate origin for non-OPTIONS requests
  if (!origin || !ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
    console.error("Origin not allowed:", origin);
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { faturaId, recipientEmail, recipientName }: SendReceiptRequest = await req.json();

    // Validate inputs
    if (!faturaId || typeof faturaId !== 'string') {
      throw new Error("ID da fatura inválido");
    }
    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      throw new Error("Email do destinatário inválido");
    }
    if (!recipientName || typeof recipientName !== 'string') {
      throw new Error("Nome do destinatário inválido");
    }

    console.log(`Sending receipt email for fatura ${faturaId} to ${recipientEmail}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoice data
    const { data: fatura, error: faturaError } = await supabase
      .from("faturas")
      .select(`
        *,
        alunos(nome_completo),
        cursos(nome)
      `)
      .eq("id", faturaId)
      .single();

    if (faturaError || !fatura) {
      console.error("Error fetching fatura:", faturaError);
      throw new Error("Fatura não encontrada");
    }

    // Fetch payment data
    const { data: pagamento } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("fatura_id", faturaId)
      .order("data_pagamento", { ascending: false })
      .limit(1)
      .single();

    // Fetch school data
    const { data: escola } = await supabase
      .from("escola")
      .select("nome, telefone, email")
      .limit(1)
      .single();

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    };

    // Escape all user-controlled values for HTML injection prevention
    const safeEscolaNome = escapeHtml(escola?.nome || "Sistema de Gestão Escolar");
    const safeRecipientName = escapeHtml(recipientName);
    const safeStudentName = escapeHtml(fatura.alunos?.nome_completo || 'N/A');
    const safeCourseName = escapeHtml(fatura.cursos?.nome || 'N/A');
    const safeFromName = sanitizeFromName(escola?.nome || "Sistema de Gestão Escolar");
    const safeEscolaTelefone = escola?.telefone ? escapeHtml(escola.telefone) : null;
    const safeEscolaEmail = escola?.email ? escapeHtml(escola.email) : null;

    // Create email HTML with escaped values
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pagamento</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
          
          <!-- Header -->
          <div style="text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 25px; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; font-size: 28px; margin: 0 0 8px 0;">📋 Recibo de Pagamento</h1>
            <p style="color: #666; font-size: 14px; margin: 0;">${safeEscolaNome}</p>
            <span style="display: inline-block; background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 15px;">✓ PAGO</span>
          </div>
          
          <!-- Greeting -->
          <p style="color: #333; font-size: 16px; margin-bottom: 25px;">
            Olá <strong>${safeRecipientName}</strong>,
          </p>
          <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
            Confirmamos o recebimento do pagamento referente à mensalidade abaixo. Este email serve como comprovante de quitação.
          </p>
          
          <!-- Student Info -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Dados do Aluno</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px;">Nome:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px;">${safeStudentName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #f0f0f0;">Curso:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px; border-top: 1px solid #f0f0f0;">${safeCourseName}</td>
              </tr>
            </table>
          </div>
          
          <!-- Invoice Info -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Detalhes da Fatura</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px;">Referência:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px;">${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #f0f0f0;">Vencimento:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px; border-top: 1px solid #f0f0f0;">${formatDate(fatura.data_vencimento)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #f0f0f0;">Nº Fatura:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px; border-top: 1px solid #f0f0f0;">${faturaId.slice(0, 8).toUpperCase()}</td>
              </tr>
            </table>
          </div>
          
          ${pagamento ? `
          <!-- Payment Info -->
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Dados do Pagamento</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px;">Data do Pagamento:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px;">${formatDate(pagamento.data_pagamento)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #f0f0f0;">Método:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px; border-top: 1px solid #f0f0f0;">${escapeHtml(pagamento.metodo)}</td>
              </tr>
              ${pagamento.referencia ? `
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; border-top: 1px solid #f0f0f0;">Referência:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right; font-size: 14px; border-top: 1px solid #f0f0f0;">${escapeHtml(pagamento.referencia)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          ` : ''}
          
          <!-- Amount -->
          <div style="text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; margin: 30px 0;">
            <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Valor Pago</div>
            <div style="font-size: 36px; font-weight: 700; color: #10b981;">${formatCurrency(fatura.valor)}</div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
            <p style="font-size: 13px; color: #888; margin: 0;">Este email é um comprovante oficial de pagamento.</p>
            <p style="font-size: 11px; color: #aaa; margin-top: 15px;">
              Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
            </p>
            ${safeEscolaTelefone || safeEscolaEmail ? `
            <p style="font-size: 12px; color: #888; margin-top: 20px;">
              ${safeEscolaTelefone ? `📞 ${safeEscolaTelefone}` : ''} ${safeEscolaEmail ? `| ✉️ ${safeEscolaEmail}` : ''}
            </p>
            ` : ''}
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${safeFromName} <noreply@maranata.com>`,
        to: [recipientEmail],
        subject: `Recibo de Pagamento - ${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Erro ao enviar email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-receipt-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req.headers.get("origin")) },
      }
    );
  }
};

serve(handler);
