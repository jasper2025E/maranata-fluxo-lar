import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify permissions
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is platform admin
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Não autenticado");
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .single();

    if (!roleData) {
      throw new Error("Apenas gestores podem excluir escolas");
    }

    const { tenantId } = await req.json();
    if (!tenantId) {
      throw new Error("ID do tenant é obrigatório");
    }

    console.log(`Iniciando exclusão do tenant: ${tenantId}`);

    // Delete in order to respect foreign key constraints
    const deleteOperations = [
      // Faturas e pagamentos
      { table: "pagamentos", filter: "tenant_id" },
      { table: "fatura_documentos", filter: "tenant_id" },
      { table: "fatura_descontos", filter: "tenant_id" },
      { table: "fatura_itens", filter: "tenant_id" },
      { table: "fatura_historico", filter: "tenant_id" },
      { table: "faturas", filter: "tenant_id" },
      
      // Alunos e responsáveis
      { table: "alunos", filter: "tenant_id" },
      { table: "responsaveis", filter: "tenant_id" },
      
      // Cursos e turmas
      { table: "funcionario_turmas", filter: "tenant_id" },
      { table: "turmas", filter: "tenant_id" },
      { table: "cursos", filter: "tenant_id" },
      
      // RH
      { table: "ponto_registros", filter: "tenant_id" },
      { table: "contratos", filter: "tenant_id" },
      { table: "funcionario_documentos", filter: "tenant_id" },
      { table: "funcionarios", filter: "tenant_id" },
      { table: "cargos", filter: "tenant_id" },
      { table: "setores", filter: "tenant_id" },
      { table: "pontos_autorizados", filter: "tenant_id" },
      
      // Configurações e logs
      { table: "despesas", filter: "tenant_id" },
      { table: "notifications", filter: "tenant_id" },
      { table: "integration_settings", filter: "tenant_id" },
      { table: "audit_logs", filter: "tenant_id" },
      
      // Perfis e histórico
      { table: "profiles", filter: "tenant_id" },
      { table: "subscription_history", filter: "tenant_id" },
      
      // Escola
      { table: "escola", filter: "tenant_id" },
    ];

    for (const op of deleteOperations) {
      const { error } = await supabaseAdmin
        .from(op.table)
        .delete()
        .eq(op.filter, tenantId);

      if (error) {
        console.log(`Aviso ao deletar ${op.table}:`, error.message);
        // Continue even if some tables are empty or have errors
      } else {
        console.log(`✓ Deletado registros de ${op.table}`);
      }
    }

    // Finally delete the tenant
    const { error: tenantError } = await supabaseAdmin
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (tenantError) {
      console.error("Erro ao deletar tenant:", tenantError);
      throw new Error(`Erro ao excluir escola: ${tenantError.message}`);
    }

    console.log(`✓ Tenant ${tenantId} excluído com sucesso`);

    return new Response(
      JSON.stringify({ success: true, message: "Escola excluída com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no delete-tenant:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
