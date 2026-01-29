import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader, PortalFooter } from "@/components/portal";
import { BlockRenderer } from "@/components/website/BlockRenderer";
import { PortalLinkBlock } from "@/components/portal/PortalLinkBlock";
import type { WebsiteBlock } from "@/hooks/useWebsiteBuilder";

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
        // Get tenant by slug
        const { data: tenantData, error: tenantError } = await supabase
          .rpc("get_tenant_by_slug", { p_slug: slug });

        if (tenantError || !tenantData || tenantData.length === 0) {
          setError("Escola não encontrada");
          setIsLoading(false);
          return;
        }

        const tenantInfo = tenantData[0] as TenantData;

        // Check if blocked
        if (tenantInfo.blocked_at) {
          setError("Esta escola não está disponível no momento");
          setIsLoading(false);
          return;
        }

        // Get additional tenant info (telefone, email, endereco)
        const { data: fullTenant } = await supabase
          .from("tenants")
          .select("telefone, email, endereco")
          .eq("id", tenantInfo.id)
          .single();

        setTenant({
          ...tenantInfo,
          telefone: fullTenant?.telefone || null,
          email: fullTenant?.email || null,
          endereco: fullTenant?.endereco || null,
        });

        // Get website config
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
            seo_title: websiteData.seo_title || null,
            seo_description: websiteData.seo_description || null,
            custom_css: null,
          });

          // Get homepage - check if there's a pages table or use the config
          const { data: pagesData } = await supabase
            .from("school_website_pages")
            .select("id")
            .eq("tenant_id", tenantInfo.id)
            .eq("is_homepage", true)
            .maybeSingle();

          if (pagesData) {
            // Get blocks for homepage
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            {error || "A escola que você está procurando não existe ou foi desativada."}
          </p>
        </div>
      </div>
    );
  }

  const colors = {
    primary: tenant.primary_color || "#3b82f6",
    secondary: tenant.secondary_color || "#8b5cf6",
    accent: "#f59e0b",
  };

  const pageTitle = website?.seo_title || tenant.nome;
  const pageDescription = website?.seo_description || `Bem-vindo à ${tenant.nome}`;

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
          {/* Render blocks */}
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
            // Default content if no blocks configured
            <div className="py-20 px-4 text-center">
              <h1
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: colors.primary }}
              >
                {tenant.nome}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Bem-vindo ao site da nossa escola. Explore nossas opções abaixo.
              </p>
            </div>
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
