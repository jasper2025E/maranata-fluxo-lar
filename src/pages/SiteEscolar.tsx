import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Globe, 
  Eye, 
  EyeOff, 
  Settings, 
  Palette, 
  Layout, 
  FileText, 
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Image,
  Quote,
  Monitor,
  Layers,
  ArrowLeft,
  Link2,
  BarChart3
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { useSchoolWebsite, useCreateSchoolWebsite, useToggleSchoolWebsite } from "@/hooks/useSchoolWebsite";
import { useTenant } from "@/hooks/useTenant";
import { useEscola } from "@/hooks/useEscola";
import { WebsiteEditorGeneral } from "@/components/website/WebsiteEditorGeneral";
import { WebsiteEditorContent } from "@/components/website/WebsiteEditorContent";
import { WebsiteEditorStyle } from "@/components/website/WebsiteEditorStyle";
import { WebsiteEditorSEO } from "@/components/website/WebsiteEditorSEO";
import { WebsiteEditorGallery } from "@/components/website/WebsiteEditorGallery";
import { WebsiteEditorTestimonials } from "@/components/website/WebsiteEditorTestimonials";
import { WebsitePreview } from "@/components/website/WebsitePreview";
import { WebsiteThemeSelector } from "@/components/website/WebsiteThemeSelector";
import { WebsiteThemeImportExport } from "@/components/website/WebsiteThemeImportExport";
import { WebsitePagesManager } from "@/components/website/WebsitePagesManager";
import { WebsiteBlockEditor } from "@/components/website/WebsiteBlockEditor";
import { WebsiteDomainManager } from "@/components/website/WebsiteDomainManager";
import { WebsiteAnalyticsCard } from "@/components/website/WebsiteAnalyticsCard";
import { WebsitePage } from "@/hooks/useWebsiteBuilder";
import { toast } from "sonner";

export default function SiteEscolar() {
  const { t } = useTranslation();
  const { data: website, isLoading } = useSchoolWebsite();
  const { data: tenant } = useTenant();
  const { data: escola } = useEscola();
  const createWebsite = useCreateSchoolWebsite();
  const toggleWebsite = useToggleSchoolWebsite();
  const [copied, setCopied] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);

  const baseUrl = window.location.origin;
  const publicUrl = website?.slug ? `${baseUrl}/escola/${website.slug}` : null;

  const handleCopyUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("URL copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePublish = () => {
    if (website) {
      toggleWebsite.mutate(!website.enabled);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <PageHeader
            title={t("siteEscolar.title", "Site Escolar")}
            description={t("siteEscolar.description", "Gerencie a landing page pública da sua escola")}
          />
          <div className="space-y-6 mt-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Se não existe configuração, mostrar tela de criação
  if (!website) {
    return (
      <DashboardLayout>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <PageHeader
            title={t("siteEscolar.title", "Site Escolar")}
            description={t("siteEscolar.description", "Gerencie a landing page pública da sua escola")}
          />
          <div className="mt-6">
            <PremiumGate feature="schoolWebsite">
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-6 rounded-full bg-primary/10 mb-6">
                  <Globe className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Crie o Site da Sua Escola</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Configure uma landing page profissional com formulário de pré-matrícula 
                  para atrair novos alunos.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => createWebsite.mutate()}
                  disabled={createWebsite.isPending}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {createWebsite.isPending ? "Criando..." : "Criar Site Escolar"}
                </Button>
              </div>
            </PremiumGate>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Se está editando uma página específica, mostrar editor de blocos
  if (editingPage) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingPage(null)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para páginas
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{editingPage.title}</h1>
                <p className="text-muted-foreground">
                  Edite os blocos desta página
                </p>
              </div>
              <Badge variant={editingPage.is_published ? "default" : "secondary"}>
                {editingPage.is_published ? "Publicada" : "Rascunho"}
              </Badge>
            </div>
          </div>
          
          <WebsiteBlockEditor 
            pageId={editingPage.id} 
            primaryColor={website.primary_color}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <PageHeader
          title={t("siteEscolar.title", "Site Escolar")}
          description={t("siteEscolar.description", "Gerencie a landing page pública da sua escola")}
        />
        <PremiumGate feature="schoolWebsite">
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${website.enabled ? 'bg-success/10' : 'bg-muted'}`}>
                      {website.enabled ? (
                        <Eye className="h-6 w-6 text-success" />
                      ) : (
                        <EyeOff className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {escola?.nome || tenant?.nome || "Sua Escola"}
                        </h3>
                        <Badge variant={website.enabled ? "default" : "secondary"}>
                          {website.enabled ? "Publicado" : "Rascunho"}
                        </Badge>
                      </div>
                      {publicUrl && (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {publicUrl}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={handleCopyUrl}
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {website.enabled && publicUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visualizar
                        </a>
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {website.enabled ? "Online" : "Offline"}
                      </span>
                      <Switch
                        checked={website.enabled}
                        onCheckedChange={handleTogglePublish}
                        disabled={toggleWebsite.isPending}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editor Tabs */}
            <Tabs defaultValue="pages" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
                <TabsTrigger value="pages" className="gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Páginas</span>
                </TabsTrigger>
                <TabsTrigger value="themes" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Temas</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Geral</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <Layout className="h-4 w-4" />
                  <span className="hidden sm:inline">Conteúdo</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Galeria</span>
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="gap-2">
                  <Quote className="h-4 w-4" />
                  <span className="hidden sm:inline">Depoimentos</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Estilo</span>
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">SEO</span>
                </TabsTrigger>
                <TabsTrigger value="domain" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Domínio</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Métricas</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pages">
                <WebsitePagesManager 
                  config={website} 
                  onEditPage={(page) => setEditingPage(page)}
                />
              </TabsContent>

              <TabsContent value="themes" className="space-y-6">
                <WebsiteThemeSelector config={website} />
                <WebsiteThemeImportExport config={website} />
              </TabsContent>

              <TabsContent value="general">
                <WebsiteEditorGeneral config={website} />
              </TabsContent>

              <TabsContent value="content">
                <WebsiteEditorContent config={website} />
              </TabsContent>

              <TabsContent value="gallery">
                <WebsiteEditorGallery config={website} />
              </TabsContent>

              <TabsContent value="testimonials">
                <WebsiteEditorTestimonials config={website} />
              </TabsContent>

              <TabsContent value="style">
                <WebsiteEditorStyle config={website} />
              </TabsContent>

              <TabsContent value="seo">
                <WebsiteEditorSEO config={website} />
              </TabsContent>

              <TabsContent value="domain">
                <WebsiteDomainManager config={website} />
              </TabsContent>

              <TabsContent value="analytics">
                <WebsiteAnalyticsCard tenantId={website.tenant_id} />
              </TabsContent>

              <TabsContent value="preview">
                <WebsitePreview config={website} slug={website.slug || ""} />
              </TabsContent>
            </Tabs>
          </div>
        </PremiumGate>
      </div>
    </DashboardLayout>
  );
}
