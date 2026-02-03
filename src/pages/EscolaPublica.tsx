import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Loader2, 
  AlertCircle, 
  GraduationCap, 
  Users, 
  Award, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  FileSearch, 
  UserPlus,
  Star,
  BookOpen,
  Shield,
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader, PortalFooter } from "@/components/portal";
import { BlockRenderer } from "@/components/website/BlockRenderer";
import { PortalLinkBlock } from "@/components/portal/PortalLinkBlock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WebsiteBlock } from "@/hooks/useWebsiteBuilder";
import { firstRow } from "@/lib/tenantRpc";
import { sanitizeCSS } from "@/lib/cssSanitizer";

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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

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
        const { data: tenantData, error: tenantError } = await supabase
          .rpc("get_tenant_by_slug", { p_slug: slug });

        const tenantInfo = firstRow<TenantData>(tenantData);

        if (tenantError || !tenantInfo) {
          setError("Escola não encontrada");
          setIsLoading(false);
          return;
        }

        if (tenantInfo.blocked_at) {
          setError("Esta escola não está disponível no momento");
          setIsLoading(false);
          return;
        }

        setTenant(tenantInfo);

        // Use the secure minimal view for public website data
        const { data: websiteData } = await supabase
          .from("school_website_public_minimal")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (websiteData) {
          setWebsite({
            id: tenantInfo.id, // Use tenant id since view doesn't expose it
            tenant_id: tenantInfo.id,
            is_published: true,
            seo_title: websiteData.seo_title || tenantInfo.nome,
            seo_description: websiteData.seo_description || null,
            custom_css: null, // CSS is sanitized at render time
          });

          // Fetch pages using tenant id from RPC result
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-4 rounded-full bg-destructive/10 mx-auto w-fit mb-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Página não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            {error || "A escola que você está procurando não existe ou foi desativada."}
          </p>
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            Voltar ao início
          </Button>
        </motion.div>
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

  // Modern Default Landing Page
  const DefaultLandingPage = () => (
    <>
      {/* Hero Section - Modern Gradient */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0"
            style={{ 
              background: `
                radial-gradient(ellipse 80% 50% at 50% -20%, ${colors.primary}30 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 100% 50%, ${colors.secondary}20 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 0% 50%, ${colors.primary}15 0%, transparent 50%),
                linear-gradient(180deg, transparent 0%, ${colors.primary}05 100%)
              `
            }}
          />
          {/* Floating Shapes */}
          <motion.div 
            className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-30 blur-3xl"
            style={{ backgroundColor: colors.primary }}
            animate={{ 
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: colors.secondary }}
            animate={{ 
              y: [0, 30, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 container max-w-6xl mx-auto px-4 py-20">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Logo */}
            {tenant.logo_url && (
              <motion.div variants={scaleIn} className="mb-8">
                <img 
                  src={tenant.logo_url} 
                  alt={tenant.nome}
                  className="h-28 w-auto mx-auto rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}

            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `${colors.primary}15`,
                  color: colors.primary
                }}
              >
                <Sparkles className="h-4 w-4" />
                Matrículas Abertas 2025
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-clip-text text-transparent" style={{
                backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              }}>
                {tenant.nome}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={fadeInUp}
              className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Educação de excelência com amor e dedicação. 
              Aqui seu filho desenvolve todo o seu potencial.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                className="text-lg px-8 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ 
                  backgroundColor: colors.primary,
                  boxShadow: `0 20px 40px -15px ${colors.primary}50`
                }}
                onClick={() => navigate(`/escola/${slug}/matricula`)}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Matricule seu filho
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-7 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300"
                onClick={() => navigate(`/escola/${slug}/portal`)}
              >
                <FileSearch className="mr-2 h-5 w-5" />
                Consultar Boletos
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-3 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <motion.div 
          className="max-w-6xl mx-auto relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, label: "Anos de Experiência", value: "10+" },
              { icon: Users, label: "Alunos Formados", value: "500+" },
              { icon: Award, label: "Taxa de Aprovação", value: "95%" },
              { icon: Heart, label: "Satisfação dos Pais", value: "98%" },
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div 
                      className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${colors.primary}15` }}
                    >
                      <stat.icon className="h-7 w-7" style={{ color: colors.primary }} />
                    </div>
                    <div 
                      className="text-4xl font-bold mb-2"
                      style={{ color: colors.primary }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: `${colors.primary}10`, color: colors.primary }}
            >
              Por que nos escolher?
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Diferenciais da nossa escola
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos o melhor ambiente para o desenvolvimento integral do seu filho
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: BookOpen,
                title: "Metodologia Inovadora", 
                description: "Abordagem pedagógica moderna que estimula a criatividade e o pensamento crítico."
              },
              { 
                icon: Shield,
                title: "Ambiente Seguro", 
                description: "Instalações monitoradas e equipe treinada para garantir a segurança dos alunos."
              },
              { 
                icon: Star,
                title: "Professores Qualificados", 
                description: "Equipe experiente e dedicada ao desenvolvimento de cada aluno."
              },
              { 
                icon: Clock,
                title: "Horário Flexível", 
                description: "Opções de período integral e parcial para atender às necessidades da família."
              },
              { 
                icon: Users,
                title: "Turmas Reduzidas", 
                description: "Atenção individualizada com turmas de tamanho ideal para o aprendizado."
              },
              { 
                icon: Heart,
                title: "Valores Cristãos", 
                description: "Formação baseada em princípios e valores que constroem o caráter."
              },
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg group">
                  <CardContent className="p-0">
                    <div 
                      className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${colors.primary}10` }}
                    >
                      <feature.icon className="h-7 w-7" style={{ color: colors.primary }} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
        />
        <motion.div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            Venha conhecer nossa escola
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Agende uma visita e descubra por que somos a escolha certa para a educação do seu filho
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-7 rounded-2xl bg-white hover:bg-white/90 shadow-xl"
              style={{ color: colors.primary }}
              onClick={() => navigate(`/escola/${slug}/matricula`)}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Fazer Pré-Matrícula
            </Button>
            {tenant.telefone && (
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-7 rounded-2xl border-2 border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <a href={`tel:${tenant.telefone}`}>
                  <Phone className="mr-2 h-5 w-5" />
                  {tenant.telefone}
                </a>
              </Button>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Contact Section */}
      {(tenant.telefone || tenant.email || tenant.endereco) && (
        <section className="py-24 px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Entre em Contato</h2>
              <p className="text-muted-foreground text-lg">
                Estamos prontos para atender você
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-6">
              {tenant.telefone && (
                <motion.div variants={fadeInUp}>
                  <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg h-full">
                    <CardContent className="p-0">
                      <div 
                        className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}10` }}
                      >
                        <Phone className="h-8 w-8" style={{ color: colors.primary }} />
                      </div>
                      <div className="font-bold text-lg mb-2">Telefone</div>
                      <a 
                        href={`tel:${tenant.telefone}`} 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {tenant.telefone}
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {tenant.email && (
                <motion.div variants={fadeInUp}>
                  <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg h-full">
                    <CardContent className="p-0">
                      <div 
                        className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}10` }}
                      >
                        <Mail className="h-8 w-8" style={{ color: colors.primary }} />
                      </div>
                      <div className="font-bold text-lg mb-2">E-mail</div>
                      <a 
                        href={`mailto:${tenant.email}`} 
                        className="text-muted-foreground hover:text-primary transition-colors break-all"
                      >
                        {tenant.email}
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {tenant.endereco && (
                <motion.div variants={fadeInUp}>
                  <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg h-full">
                    <CardContent className="p-0">
                      <div 
                        className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}10` }}
                      >
                        <MapPin className="h-8 w-8" style={{ color: colors.primary }} />
                      </div>
                      <div className="font-bold text-lg mb-2">Endereço</div>
                      <span className="text-muted-foreground text-sm">{tenant.endereco}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
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

      <div className="min-h-screen flex flex-col bg-background">
        <PortalHeader
          escolaNome={tenant.nome}
          escolaLogo={tenant.logo_url}
          primaryColor={colors.primary}
        />

        <main className="flex-1">
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

      {website?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeCSS(website.custom_css) }} />
      )}
    </>
  );
}
