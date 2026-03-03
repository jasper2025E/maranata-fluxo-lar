import { useState } from "react";
import { 
  Globe, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  Users,
  FileSearch,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Palette,
  QrCode,
  TrendingUp,
  MousePointerClick,
  Calendar,
  Share2,
  Smartphone,
  Monitor,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenantInfo } from "@/hooks/useTenantInfo";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface LinkCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  url: string | null;
  onCopy: (url: string) => void;
  copied: boolean;
  badge?: string;
}

function LinkCard({ title, description, icon: Icon, iconColor, url, onCopy, copied, badge }: LinkCardProps) {
  return (
    <motion.div variants={fadeIn}>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: iconColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{title}</CardTitle>
                  {badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {url && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs" 
                onClick={() => onCopy(url)}
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copiar Link
              </Button>
              <Button size="sm" className="flex-1 text-xs" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ label, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trendUp ? 'text-green-600' : 'text-muted-foreground'}`}>
                {trendUp && <TrendingUp className="h-3 w-3 inline mr-1" />}
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SiteEscolar() {
  const { data: tenant, isLoading, error } = useTenantInfo();
  const [copied, setCopied] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = tenant?.slug ? `${baseUrl}/escola/${tenant.slug}` : null;
  const portalUrl = tenant?.slug ? `${baseUrl}/escola/${tenant.slug}/portal` : null;
  const matriculaUrl = tenant?.slug ? `${baseUrl}/escola/${tenant.slug}/matricula` : null;

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        handleCopyUrl(url);
      }
    } else {
      handleCopyUrl(url);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
          <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader
            title="Site Escolar"
            description="Portal público da escola"
          />
          <div className="space-y-6 mt-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tenant) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader title="Site Escolar" description="Portal público da escola" />
          <Card className="mt-6">
            <CardContent className="pt-6 text-center py-12">
              <div className="p-4 rounded-full bg-destructive/10 mx-auto w-fit mb-4">
                <Globe className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-muted-foreground text-sm">
                Não foi possível carregar as informações da escola.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const primaryColor = tenant.primary_color || "#7C3AED";
  const secondaryColor = tenant.secondary_color || "#EC4899";

  return (
    <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Site Escolar"
          description="Gerencie seu portal público e compartilhe com responsáveis"
        />

        <motion.div 
          className="space-y-6 mt-6"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Status Banner */}
          <motion.div variants={fadeIn}>
            <Card className="overflow-hidden border-0 shadow-lg" style={{ 
              background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}08 100%)`,
              borderLeft: `4px solid ${primaryColor}`
            }}>
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {tenant.logo_url ? (
                        <img 
                          src={tenant.logo_url} 
                          alt={tenant.nome}
                          className="h-14 w-14 rounded-xl object-cover shadow-md"
                        />
                      ) : (
                        <div 
                          className="h-14 w-14 rounded-xl flex items-center justify-center shadow-md"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Globe className="h-7 w-7 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{tenant.nome}</h3>
                        <Badge className="bg-green-500/15 text-green-600 border-0 text-[10px]">
                          <Eye className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {publicUrl?.replace('https://', '').replace('http://', '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {publicUrl && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleShare(publicUrl, tenant.nome)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Button size="sm" asChild style={{ backgroundColor: primaryColor }}>
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visitar Site
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="links" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="links" className="text-xs">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Links
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="branding" className="text-xs">
                <Palette className="h-3.5 w-3.5 mr-1.5" />
                Identidade
              </TabsTrigger>
            </TabsList>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-6">
              {/* Quick Stats */}
              <motion.div 
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={fadeIn}>
                  <StatCard 
                    label="Páginas Ativas" 
                    value="3" 
                    icon={Globe}
                  />
                </motion.div>
                <motion.div variants={fadeIn}>
                  <StatCard 
                    label="Links Copiados" 
                    value="—" 
                    icon={MousePointerClick}
                  />
                </motion.div>
                <motion.div variants={fadeIn}>
                  <StatCard 
                    label="QR Codes Gerados" 
                    value="3" 
                    icon={QrCode}
                  />
                </motion.div>
                <motion.div variants={fadeIn}>
                  <StatCard 
                    label="Último Acesso" 
                    value="Hoje" 
                    icon={Calendar}
                  />
                </motion.div>
              </motion.div>

              {/* Links Grid */}
              <motion.div 
                className="grid gap-4 md:grid-cols-3"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <LinkCard
                  title="Landing Page"
                  description="Página institucional da escola"
                  icon={Globe}
                  iconColor={primaryColor}
                  url={publicUrl}
                  onCopy={handleCopyUrl}
                  copied={copied === publicUrl}
                  badge="Principal"
                />
                <LinkCard
                  title="Portal do Responsável"
                  description="Consulta de boletos por CPF"
                  icon={FileSearch}
                  iconColor="#3B82F6"
                  url={portalUrl}
                  onCopy={handleCopyUrl}
                  copied={copied === portalUrl}
                />
                <LinkCard
                  title="Matrícula Online"
                  description="Formulário de pré-matrícula"
                  icon={UserPlus}
                  iconColor="#10B981"
                  url={matriculaUrl}
                  onCopy={handleCopyUrl}
                  copied={copied === matriculaUrl}
                />
              </motion.div>

              {/* QR Codes Section */}
              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          QR Codes para Impressão
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Imprima e cole em murais, cartazes ou material de divulgação
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 sm:grid-cols-3">
                      {[
                        { label: "Site Principal", url: publicUrl, color: primaryColor },
                        { label: "Portal Boletos", url: portalUrl, color: "#3B82F6" },
                        { label: "Matrícula", url: matriculaUrl, color: "#10B981" },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="p-4 bg-white rounded-xl border inline-block">
                            {item.url && (
                              <QRCodeSVG 
                                value={item.url} 
                                size={120}
                                fgColor={item.color}
                                level="M"
                              />
                            )}
                          </div>
                          <p className="text-xs font-medium mt-3">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[150px] mx-auto">
                            {item.url?.replace('https://', '').replace('http://', '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <motion.div variants={fadeIn}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Preview do Site</CardTitle>
                        <CardDescription className="text-xs">
                          Visualize como seu site aparece para os visitantes
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-muted rounded-lg p-1">
                          <Button 
                            variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} 
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setPreviewDevice('desktop')}
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} 
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => setPreviewDevice('mobile')}
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-muted/30 p-4 flex items-center justify-center min-h-[500px]">
                      <div 
                        className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
                          previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'
                        }`}
                        style={{ height: previewDevice === 'mobile' ? '667px' : '500px' }}
                      >
                        {publicUrl ? (
                          <iframe 
                            src={publicUrl}
                            className="w-full h-full border-0"
                            title="Preview do Site"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p className="text-sm">Nenhum site configurado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <motion.div variants={fadeIn}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cores da Marca
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configuradas em Escola → Dados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        {tenant.logo_url ? (
                          <img 
                            src={tenant.logo_url} 
                            alt={tenant.nome}
                            className="h-20 w-20 rounded-xl object-cover border shadow-sm"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center border">
                            <Globe className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="font-semibold">{tenant.nome}</p>
                          <div className="flex gap-2">
                            <div className="space-y-1">
                              <div 
                                className="w-10 h-10 rounded-lg shadow-sm border"
                                style={{ backgroundColor: primaryColor }}
                              />
                              <p className="text-[10px] text-muted-foreground text-center">Primária</p>
                            </div>
                            <div className="space-y-1">
                              <div 
                                className="w-10 h-10 rounded-lg shadow-sm border"
                                style={{ backgroundColor: secondaryColor }}
                              />
                              <p className="text-[10px] text-muted-foreground text-center">Secundária</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Para alterar cores e logo, acesse <strong>Escola → Dados</strong>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeIn}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Contato Público
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Exibido no rodapé do site
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {tenant.telefone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-muted">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>{tenant.telefone}</span>
                        </div>
                      )}
                      {tenant.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-muted">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="truncate">{tenant.email}</span>
                        </div>
                      )}
                      {tenant.endereco && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-muted">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm">{tenant.endereco}</span>
                        </div>
                      )}
                      {!tenant.telefone && !tenant.email && !tenant.endereco && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Nenhuma informação de contato cadastrada.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
