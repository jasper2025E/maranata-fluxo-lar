import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, AlertCircle, GraduationCap, Users, Award, Heart, Phone, Mail, MapPin, FileSearch, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader, PortalFooter } from "@/components/portal";
import { BlockRenderer } from "@/components/website/BlockRenderer";
import { PortalLinkBlock } from "@/components/portal/PortalLinkBlock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WebsiteBlock } from "@/hooks/useWebsiteBuilder";
import { firstRow } from "@/lib/tenantRpc";

interface TenantData {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  status: string;
  blocked_at: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

interface WebsiteData {
  id: string;
  tenant_id: string;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  custom_css: string | null;
}

export default function EscolaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [blocks, setBlocks] = useState<WebsiteBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantAndWebsite() {
      if (!slug) {
        setError("Escola não identificada");
        setIsLoading(false);
        return;
      }

      try {
        // Get tenant by slug using the new function
        const { data: tenantData, error: tenantError } = await supabase
          .rpc("get_tenant_by_slug", { p_slug: slug });

        const tenantInfo = firstRow<TenantData>(tenantData);

        if (tenantError || !tenantInfo) {
          setError("Escola não encontrada");
          setIsLoading(false);
          return;
        }

        // Check if blocked
        if (tenantInfo.blocked_at) {
          setError("Esta escola não está disponível no momento");
          setIsLoading(false);
          return;
        }

        setTenant(tenantInfo);

        // Try to get website config (optional)
        const { data: websiteData } = await supabase
          .from("school_website_config_public")
          .select("*")
          .eq("tenant_id", tenantInfo.id)
          .maybeSingle();

        if (websiteData) {
          setWebsite({
            id: websiteData.id,
            tenant_id: websiteData.tenant_id,
            is_published: true,
            // SEO data is no longer exposed in public view for security
            // Use tenant name as fallback for SEO
            seo_title: websiteData.school_name || null,
            seo_description: null,
            custom_css: null,
          });

          // Get homepage blocks if available
          const { data: pagesData } = await supabase
            .from("school_website_pages")
            .select("id")
            .eq("tenant_id", tenantInfo.id)
            .eq("is_homepage", true)
            .maybeSingle();

          if (pagesData) {
            const { data: blocksData } = await supabase
              .from("school_website_blocks")
              .select("*")
              .eq("page_id", pagesData.id)
              .order("block_order");

            if (blocksData) {
              setBlocks(blocksData as unknown as WebsiteBlock[]);
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading school:", err);
        setError("Erro ao carregar página da escola");
        setIsLoading(false);
      }
    }

    loadTenantAndWebsite();
  }, [slug]);

// Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto mb-6 text-destructive" />
          <h1 className="text-3xl font-bold mb-3">Página não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            {error || "A escola que você está procurando não existe ou foi desativada."}
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const colors = {
    primary: tenant.primary_color || "#7C3AED",
    secondary: tenant.secondary_color || "#EC4899",
    accent: "#f59e0b",
  };

  const pageTitle = website?.seo_title || tenant.nome;
  const pageDescription = website?.seo_description || `Bem-vindo à ${tenant.nome} - Educação de qualidade para o futuro do seu filho.`;

  // Default landing page when no blocks are configured
  const DefaultLandingPage = () => (
    <>
      {/* Hero Section */}
      <section 
        className="relative py-24 px-4 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)` 
        }}
      >
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {tenant.logo_url && (
            <img 
              src={tenant.logo_url} 
              alt={tenant.nome}
              className="h-24 w-auto mx-auto mb-8 rounded-2xl shadow-lg"
            />
          )}
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: colors.primary }}
          >
            {tenant.nome}
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Educação de qualidade, cuidado e amor. Aqui seu filho desenvolve todo o seu potencial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: colors.primary }}
              onClick={() => navigate(`/escola/${slug}/matricula`)}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Fazer Matrícula
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl"
              onClick={() => navigate(`/escola/${slug}/portal`)}
            >
              <FileSearch className="mr-2 h-5 w-5" />
              Área do Responsável
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, label: "Anos de Experiência", value: "10+" },
              { icon: Users, label: "Alunos Formados", value: "500+" },
              { icon: Award, label: "Aprovações", value: "95%" },
              { icon: Heart, label: "Satisfação", value: "98%" },
            ].map((stat, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <stat.icon 
                    className="h-10 w-10 mx-auto mb-3"
                    style={{ color: colors.primary }}
                  />
                  <div className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4" style={{ backgroundColor: `${colors.primary}08` }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Por que escolher a {tenant.nome}?
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Oferecemos o melhor ambiente para o desenvolvimento do seu filho
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Equipe Qualificada", 
                description: "Professores experientes e dedicados ao desenvolvimento integral de cada aluno."
              },
              { 
                title: "Estrutura Moderna", 
                description: "Ambientes seguros e equipados para proporcionar a melhor experiência de aprendizado."
              },
              { 
                title: "Ensino Personalizado", 
                description: "Acompanhamento individual respeitando o ritmo e as necessidades de cada criança."
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-0">
                  <div 
                    className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <GraduationCap className="h-6 w-6" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      {(tenant.telefone || tenant.email || tenant.endereco) && (
        <section className="py-20 px-4 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Entre em Contato</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {tenant.telefone && (
                <Card className="p-6">
                  <CardContent className="p-0 flex flex-col items-center">
                    <Phone className="h-8 w-8 mb-3" style={{ color: colors.primary }} />
                    <div className="font-medium">Telefone</div>
                    <a href={`tel:${tenant.telefone}`} className="text-muted-foreground hover:text-primary">
                      {tenant.telefone}
                    </a>
                  </CardContent>
                </Card>
              )}
              {tenant.email && (
                <Card className="p-6">
                  <CardContent className="p-0 flex flex-col items-center">
                    <Mail className="h-8 w-8 mb-3" style={{ color: colors.primary }} />
                    <div className="font-medium">E-mail</div>
                    <a href={`mailto:${tenant.email}`} className="text-muted-foreground hover:text-primary break-all">
                      {tenant.email}
                    </a>
                  </CardContent>
                </Card>
              )}
              {tenant.endereco && (
                <Card className="p-6">
                  <CardContent className="p-0 flex flex-col items-center">
                    <MapPin className="h-8 w-8 mb-3" style={{ color: colors.primary }} />
                    <div className="font-medium">Endereço</div>
                    <span className="text-muted-foreground text-sm">{tenant.endereco}</span>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {tenant.logo_url && <meta property="og:image" content={tenant.logo_url} />}
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <PortalHeader
          escolaNome={tenant.nome}
          escolaLogo={tenant.logo_url}
          primaryColor={colors.primary}
        />

        <main className="flex-1">
          {/* Render custom blocks if available, otherwise show default landing */}
          {blocks.length > 0 ? (
            blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                colors={colors}
                tenantId={tenant.id}
                onNavigate={(target) => {
                  if (target.startsWith("#")) {
                    const element = document.querySelector(target);
                    element?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    navigate(target);
                  }
                }}
              />
            ))
          ) : (
            <DefaultLandingPage />
          )}

          {/* Portal Link Block - Always show */}
          <PortalLinkBlock
            content={{
              title: "Área do Responsável",
              subtitle: "Consulte suas faturas e boletos de forma rápida usando apenas seu CPF",
              button_text: "Consultar Boletos",
            }}
            settings={{ style: "gradient" }}
            colors={colors}
          />
        </main>

        <PortalFooter
          escolaNome={tenant.nome}
          escolaLogo={tenant.logo_url}
          telefone={tenant.telefone}
          email={tenant.email}
          endereco={tenant.endereco}
          primaryColor={colors.primary}
        />
      </div>

      {/* Custom CSS if any */}
      {website?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: website.custom_css }} />
      )}
    </>
  );
}
