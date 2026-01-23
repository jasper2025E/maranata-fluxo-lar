import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "payment_failed" | "subscription_expiring" | "subscription_expired" | "payment_reminder";
  tenant_id: string;
  metadata?: Record<string, unknown>;
}

const getEmailTemplate = (
  type: string,
  tenantName: string,
  metadata?: Record<string, unknown>
): { subject: string; html: string } => {
  switch (type) {
    case "payment_failed":
      return {
        subject: `⚠️ Falha no pagamento - ${tenantName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Falha no Pagamento</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Houve uma <strong>falha no processamento do pagamento</strong> da assinatura da escola <strong>${tenantName}</strong>.
              </p>
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  <strong>Ação necessária:</strong> Verifique os dados de pagamento e tente novamente.
                </p>
              </div>
              ${metadata?.amount ? `<p style="color: #6b7280; font-size: 14px;">Valor: <strong>R$ ${Number(metadata.amount).toFixed(2)}</strong></p>` : ""}
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Se o problema persistir, entre em contato com nosso suporte.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SITE_URL") || "https://app.example.com"}/assinatura" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Regularizar Pagamento
                </a>
              </div>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Este é um email automático do sistema de gestão escolar.
            </p>
          </div>
        `,
      };

    case "subscription_expiring":
      const daysLeft = metadata?.days_left || 7;
      return {
        subject: `⏰ Sua assinatura expira em ${daysLeft} dias - ${tenantName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Assinatura Expirando</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                A assinatura da escola <strong>${tenantName}</strong> irá expirar em <strong>${daysLeft} dias</strong>.
              </p>
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Importante:</strong> Renove sua assinatura para continuar utilizando todos os recursos do sistema.
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SITE_URL") || "https://app.example.com"}/assinatura" 
                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Renovar Agora
                </a>
              </div>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Este é um email automático do sistema de gestão escolar.
            </p>
          </div>
        `,
      };

    case "subscription_expired":
      return {
        subject: `🚨 Assinatura expirada - ${tenantName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Assinatura Expirada</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                A assinatura da escola <strong>${tenantName}</strong> <strong>expirou</strong>.
              </p>
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  <strong>Acesso restrito:</strong> Algumas funcionalidades podem estar desabilitadas. Renove agora para restaurar o acesso completo.
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SITE_URL") || "https://app.example.com"}/assinatura" 
                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Renovar Assinatura
                </a>
              </div>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Este é um email automático do sistema de gestão escolar.
            </p>
          </div>
        `,
      };

    case "payment_reminder":
      return {
        subject: `💳 Lembrete de pagamento - ${tenantName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💳 Lembrete de Pagamento</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Este é um lembrete de que o pagamento da assinatura da escola <strong>${tenantName}</strong> está próximo do vencimento.
              </p>
              ${metadata?.amount ? `<p style="color: #6b7280; font-size: 14px;">Valor: <strong>R$ ${Number(metadata.amount).toFixed(2)}</strong></p>` : ""}
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SITE_URL") || "https://app.example.com"}/assinatura" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Ver Assinatura
                </a>
              </div>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Este é um email automático do sistema de gestão escolar.
            </p>
          </div>
        `,
      };

    default:
      return {
        subject: `Notificação - ${tenantName}`,
        html: `<p>Notificação do sistema para ${tenantName}</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, tenant_id, metadata }: NotificationRequest = await req.json();

    if (!type || !tenant_id) {
      throw new Error("Missing required fields: type and tenant_id");
    }

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, nome, email")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Tenant not found: ${tenant_id}`);
    }

    // Fetch admin emails for this tenant
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("email")
      .eq("tenant_id", tenant_id);

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
    }

    // Also get users with admin role for this tenant
    const adminEmails: string[] = [];
    
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        // Check if this user has admin role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", admin.email) // We need to match by user_id, not email
          .in("role", ["admin", "platform_admin"]);
        
        if (admin.email) {
          adminEmails.push(admin.email);
        }
      }
    }

    // Add tenant email if exists
    if (tenant.email && !adminEmails.includes(tenant.email)) {
      adminEmails.push(tenant.email);
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found for tenant:", tenant_id);
      return new Response(
        JSON.stringify({ success: false, message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { subject, html } = getEmailTemplate(type, tenant.nome, metadata);

    // Send email to all admins using Resend API directly
    const sendEmail = async (to: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Sistema Escolar <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email: ${error}`);
      }
      
      return response.json();
    };

    const emailResults = await Promise.allSettled(
      adminEmails.map((email) => sendEmail(email))
    );

    const successCount = emailResults.filter((r) => r.status === "fulfilled").length;
    const failCount = emailResults.filter((r) => r.status === "rejected").length;

    console.log(`Emails sent: ${successCount} success, ${failCount} failed`);

    // Log notification in subscription_history
    await supabase.from("subscription_history").insert({
      tenant_id,
      event_type: `notification_${type}`,
      metadata: {
        emails_sent: successCount,
        emails_failed: failCount,
        recipients: adminEmails,
        ...metadata,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: successCount,
        emails_failed: failCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-subscription-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
