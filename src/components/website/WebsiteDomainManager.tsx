import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, AlertCircle, Clock, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { toast } from "sonner";

interface WebsiteDomainManagerProps {
  config: SchoolWebsiteConfig;
}

type DomainStatus = "not_configured" | "pending" | "verifying" | "active" | "error";

// Get the published URL from environment or use current origin as fallback
const getPublishedDomain = () => {
  // Use the published URL from the project
  const publishedUrl = import.meta.env.VITE_PUBLISHED_URL || window.location.origin;
  try {
    const url = new URL(publishedUrl);
    return url.host;
  } catch {
    return window.location.host;
  }
};

export function WebsiteDomainManager({ config }: WebsiteDomainManagerProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const { data: platformSettings, isLoading: isLoadingSettings } = usePlatformSettings();
  const [customDomain, setCustomDomain] = useState(config.custom_domain || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get dynamic system branding from platform settings
  const systemName = platformSettings?.platform_slug || "sistema";
  const systemDomain = getPublishedDomain();
  
  // Derive status from config
  const getStatus = (): DomainStatus => {
    if (!config.custom_domain) return "not_configured";
    if ((config as unknown as Record<string, unknown>).custom_domain_verified) return "active";
    if ((config as unknown as Record<string, unknown>).custom_domain_ssl_status === "pending") return "verifying";
    return "pending";
  };
  
  const status = getStatus();
  
  // Use system domain dynamically
  const defaultSubdomain = config.slug ? `https://${systemDomain}/escola/${config.slug}` : null;
  
  const handleSaveDomain = () => {
    if (!customDomain) {
      toast.error("Digite um domínio válido");
      return;
    }
    
    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(customDomain)) {
      toast.error("Formato de domínio inválido");
      return;
    }
    
    updateWebsite.mutate({ 
      custom_domain: customDomain.toLowerCase(),
    });
  };
  
  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    
    // Simulate verification check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.info("Verificação de domínio ainda não configurada no servidor");
    setIsVerifying(false);
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado!");
  };
  
  const statusConfig = {
    not_configured: {
      icon: Globe,
      label: "Não configurado",
      color: "secondary" as const,
      description: "Configure um domínio personalizado",
    },
    pending: {
      icon: Clock,
      label: "Aguardando DNS",
      color: "secondary" as const,
      description: "Configure os registros DNS apontando para nosso servidor",
    },
    verifying: {
      icon: RefreshCw,
      label: "Verificando",
      color: "secondary" as const,
      description: "Aguarde enquanto verificamos seu domínio",
    },
    active: {
      icon: CheckCircle,
      label: "Ativo",
      color: "default" as const,
      description: "Seu domínio está funcionando corretamente",
    },
    error: {
      icon: AlertCircle,
      label: "Erro",
      color: "destructive" as const,
      description: "Houve um problema com seu domínio",
    },
  };
  
  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domínio Personalizado
            </CardTitle>
            <CardDescription>
              Configure um domínio próprio para o site da sua escola
            </CardDescription>
          </div>
          <Badge variant={currentStatus.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Subdomain */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <Label className="text-xs text-muted-foreground">Subdomínio padrão (sempre ativo)</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-sm bg-background px-3 py-2 rounded border">
              {defaultSubdomain || "Configure o slug primeiro"}
            </code>
            {defaultSubdomain && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopy(defaultSubdomain)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={defaultSubdomain} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Custom Domain Input */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="custom-domain">Domínio personalizado</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="www.minhaescola.com.br"
              />
              <Button 
                onClick={handleSaveDomain}
                disabled={updateWebsite.isPending}
              >
                {updateWebsite.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
          
          {config.custom_domain && status !== "active" && (
            <div className="space-y-4">
              {/* DNS Instructions */}
              <div className="p-4 rounded-lg border bg-background">
                <h4 className="font-medium text-sm mb-3">Configure os registros DNS:</h4>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted rounded">
                    <span className="font-medium">Tipo</span>
                    <span className="font-medium">Nome</span>
                    <span className="font-medium">Valor</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <span>A</span>
                    <span>@</span>
                    <span className="font-mono text-xs">185.158.133.1</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <span>A</span>
                    <span>www</span>
                    <span className="font-mono text-xs">185.158.133.1</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <span>TXT</span>
                    <span>_{systemName}</span>
                    <span className="font-mono text-xs break-all">{systemName}_verify={config.slug}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleVerifyDomain}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar configuração DNS
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Após configurar os registros DNS, aguarde até 48 horas para propagação completa.
              </p>
            </div>
          )}
          
          {status === "active" && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              <span>Seu domínio está configurado e funcionando com SSL!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
