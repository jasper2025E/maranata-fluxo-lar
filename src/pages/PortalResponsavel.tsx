import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, AlertCircle, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader, PortalFooter, BuscaCpf, FaturaCard, ResponsavelInfo } from "@/components/portal";
import { usePortalResponsavel } from "@/hooks/usePortalResponsavel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { firstRow } from "@/lib/tenantRpc";

interface TenantData {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  blocked_at?: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

export default function PortalResponsavel() {
  const { slug } = useParams<{ slug: string }>();
  
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  
  const { data, isLoading, error, consultarCpf, limparConsulta } = usePortalResponsavel();

  useEffect(() => {
    async function loadTenant() {
      if (!slug) {
        setTenantError("Escola não identificada");
        setIsLoadingTenant(false);
        return;
      }

      try {
        const { data: tenantData, error: tenantErr } = await supabase
          .rpc("get_tenant_by_slug", { p_slug: slug });

        const tenantInfo = firstRow<any>(tenantData);

        if (tenantErr || !tenantInfo) {
          setTenantError("Escola não encontrada");
          setIsLoadingTenant(false);
          return;
        }

        if (tenantInfo.blocked_at) {
          setTenantError("Esta escola não está disponível no momento");
          setIsLoadingTenant(false);
          return;
        }

        // Get additional info
        const { data: fullTenant } = await supabase
          .from("tenants")
          .select("slug, telefone, email, endereco")
          .eq("id", tenantInfo.id)
          .single();

        setTenant({
          id: tenantInfo.id,
          nome: tenantInfo.nome,
          slug: fullTenant?.slug || slug || "",
          logo_url: tenantInfo.logo_url,
          primary_color: tenantInfo.primary_color,
          secondary_color: tenantInfo.secondary_color,
          telefone: fullTenant?.telefone || null,
          email: fullTenant?.email || null,
          endereco: fullTenant?.endereco || null,
        });
        
        setIsLoadingTenant(false);
      } catch (err) {
        console.error("Error loading tenant:", err);
        setTenantError("Erro ao carregar escola");
        setIsLoadingTenant(false);
      }
    }

    loadTenant();
  }, [slug]);

  const handleSearch = async (cpf: string) => {
    if (tenant) {
      await consultarCpf(cpf, tenant.id);
    }
  };

  // Loading tenant
  if (isLoadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tenant error
  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Escola não encontrada</h1>
          <p className="text-muted-foreground">
            {tenantError || "A escola que você está procurando não existe."}
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.primary_color || "#3b82f6";

  // Group faturas by status
  const faturasVencidas = data?.faturas.filter(f => f.status === "vencida") || [];
  const faturasAbertas = data?.faturas.filter(f => f.status === "aberta") || [];
  const faturasPagas = data?.faturas.filter(f => f.status === "paga") || [];

  return (
    <>
      <Helmet>
        <title>Área do Responsável - {tenant.nome}</title>
        <meta name="description" content={`Consulte seus boletos e faturas da ${tenant.nome}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/20">
        <PortalHeader
          escolaNome={tenant.nome}
          escolaLogo={tenant.logo_url}
          primaryColor={primaryColor}
        />

        <main className="flex-1 container py-8 px-4">
          {!data ? (
            // Search form
            <div className="max-w-lg mx-auto py-12">
              <BuscaCpf
                onSearch={handleSearch}
                isLoading={isLoading}
                error={error}
                primaryColor={primaryColor}
              />
            </div>
          ) : (
            // Results
            <div className="max-w-4xl mx-auto">
              <ResponsavelInfo
                responsavel={data.responsavel}
                alunos={data.alunos}
                onVoltar={limparConsulta}
                primaryColor={primaryColor}
              />

              {/* Faturas */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Suas Faturas
                </h2>

                {data.faturas.length === 0 ? (
                  <div className="text-center py-12 bg-muted/50 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nenhuma fatura encontrada.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue={faturasVencidas.length > 0 ? "vencidas" : "abertas"}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="vencidas" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Vencidas
                        {faturasVencidas.length > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            {faturasVencidas.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="abertas" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Abertas
                        {faturasAbertas.length > 0 && (
                          <Badge variant="outline" className="ml-1">
                            {faturasAbertas.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="pagas" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Pagas
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="vencidas">
                      {faturasVencidas.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          Nenhuma fatura vencida! 🎉
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {faturasVencidas.map((fatura, index) => (
                            <FaturaCard
                              key={index}
                              fatura={fatura}
                              primaryColor={primaryColor}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="abertas">
                      {faturasAbertas.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma fatura em aberto.
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {faturasAbertas.map((fatura, index) => (
                            <FaturaCard
                              key={index}
                              fatura={fatura}
                              primaryColor={primaryColor}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="pagas">
                      {faturasPagas.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum pagamento registrado ainda.
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {faturasPagas.map((fatura, index) => (
                            <FaturaCard
                              key={index}
                              fatura={fatura}
                              primaryColor={primaryColor}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          )}
        </main>

        <PortalFooter
          escolaNome={tenant.nome}
          escolaLogo={tenant.logo_url}
          telefone={tenant.telefone}
          email={tenant.email}
          endereco={tenant.endereco}
          primaryColor={primaryColor}
        />
      </div>
    </>
  );
}
