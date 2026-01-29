import { useState } from "react";
import { 
  Globe, 
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Eye,
  Users,
  FileSearch,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Palette,
  Link2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantInfo } from "@/hooks/useTenantInfo";
import { toast } from "sonner";

export default function SiteEscolar() {
  const { data: tenant, isLoading, error } = useTenantInfo();
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const publicUrl = tenant?.slug ? `${baseUrl}/escola/${tenant.slug}` : null;
  const portalUrl = tenant?.slug ? `${baseUrl}/escola/${tenant.slug}/portal` : null;
  const matriculaUrl = tenant?.slug ? `${baseUrl}/escola/${tenant.slug}/matricula` : null;

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <PageHeader
            title="Site Escolar"
            description="Portal público da escola para pais e responsáveis"
          />
          <div className="space-y-6 mt-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tenant) {
    return (
      <DashboardLayout>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <PageHeader
            title="Site Escolar"
            description="Portal público da escola para pais e responsáveis"
          />
          <Card className="mt-6">
            <CardContent className="pt-6 text-center">
              <div className="p-6 rounded-full bg-destructive/10 mx-auto w-fit mb-4">
                <Globe className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-muted-foreground">
                Não foi possível carregar as informações da escola.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <PageHeader
          title="Site Escolar"
          description="Portal público da escola para pais e responsáveis"
        />

        <div className="space-y-6 mt-6">
          {/* Status Card */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{tenant.nome}</h3>
                      <Badge className="bg-success/20 text-success border-0">
                        <Eye className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      Seu site público está ativo e pronto para receber visitantes
                    </p>
                  </div>
                </div>
                {publicUrl && (
                  <Button asChild>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir Site
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Links Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Landing Page */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Landing Page</CardTitle>
                    <CardDescription className="text-xs">Página principal do site</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Apresentação institucional da escola com informações, diferenciais e contato.
                </p>
                {publicUrl && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopyUrl(publicUrl)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portal do Responsável */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileSearch className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Portal do Responsável</CardTitle>
                    <CardDescription className="text-xs">Consulta por CPF</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Área onde pais consultam boletos e faturas usando apenas o CPF, sem precisar de login.
                </p>
                {portalUrl && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopyUrl(portalUrl)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Matrícula Online */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <UserPlus className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Matrícula Online</CardTitle>
                    <CardDescription className="text-xs">Cadastro de novos alunos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Formulário para pais interessados fazerem pré-matrícula de novos alunos.
                </p>
                {matriculaUrl && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopyUrl(matriculaUrl)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <a href={matriculaUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Branding Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Identidade Visual</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {tenant.logo_url ? (
                    <img 
                      src={tenant.logo_url} 
                      alt={tenant.nome} 
                      className="h-16 w-16 object-contain rounded-lg border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      <Globe className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{tenant.nome}</p>
                    <div className="flex gap-2 mt-2">
                      <div 
                        className="w-8 h-8 rounded-lg border shadow-sm"
                        style={{ backgroundColor: tenant.primary_color || "#7C3AED" }}
                        title="Cor primária"
                      />
                      <div 
                        className="w-8 h-8 rounded-lg border shadow-sm"
                        style={{ backgroundColor: tenant.secondary_color || "#EC4899" }}
                        title="Cor secundária"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  As cores e logo são configuradas em <strong>Escola → Dados</strong>
                </p>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Informações de Contato</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenant.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tenant.telefone}</span>
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tenant.email}</span>
                  </div>
                )}
                {tenant.endereco && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tenant.endereco}</span>
                  </div>
                )}
                {!tenant.telefone && !tenant.email && !tenant.endereco && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma informação de contato cadastrada.
                  </p>
                )}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Essas informações aparecem no rodapé do site público.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <Card className="bg-muted/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Funcionalidades do Portal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Globe, title: "Landing Page", desc: "Apresentação institucional automática" },
                  { icon: FileSearch, title: "Consulta CPF", desc: "Pais acessam boletos sem login" },
                  { icon: UserPlus, title: "Pré-Matrícula", desc: "Captação de novos alunos" },
                  { icon: Link2, title: "PIX & Boleto", desc: "Código PIX e PDF do boleto" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                    <feature.icon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
