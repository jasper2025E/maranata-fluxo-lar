import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Server, 
  Info, 
  ChevronDown, 
  Shield,
  Zap,
  Link2,
  AlertTriangle
} from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useTenant } from "@/hooks/useTenant";
import { useEscola } from "@/hooks/useEscola";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WebsiteDomainManagerProps {
  config: SchoolWebsiteConfig;
}

type DomainStatus = "not_configured" | "pending" | "verifying" | "active" | "error";

// Get the system domain - uses custom URL from settings or falls back to published URL
const getSystemDomain = (customUrl?: string) => {
  if (customUrl) {
    return customUrl.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");
  }
  return window.location.host;
};

// DNS Record Row Component
function DNSRecordRow({ 
  type, 
  name, 
  value, 
  description,
  priority 
}: { 
  type: string; 
  name: string; 
  value: string; 
  description?: string;
  priority?: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={cn(
      "grid grid-cols-12 gap-3 items-center py-3 border-b border-border/50 last:border-0",
      priority && "bg-primary/5 -mx-4 px-4 rounded-lg"
    )}>
      <div className="col-span-2">
        <Badge variant={priority ? "default" : "secondary"} className="font-mono text-xs">
          {type}
        </Badge>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-1.5">
          <code className="text-sm font-medium text-foreground">{name}</code>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-50 hover:opacity-100"
            onClick={() => copyToClipboard(name, "Nome")}
          >
            {copied === "Nome" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="col-span-7 flex items-center gap-1.5">
        <code className="text-sm font-medium text-primary break-all">{value}</code>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-50 hover:opacity-100 flex-shrink-0"
          onClick={() => copyToClipboard(value, "Valor")}
        >
          {copied === "Valor" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

// Nameserver Row Component
function NameserverRow({ 
  number, 
  value 
}: { 
  number: number; 
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Nameserver copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-primary">{number}</span>
      </div>
      <code className="flex-1 text-sm font-medium">{value}</code>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 opacity-60 hover:opacity-100"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Status Indicator Component
function StatusIndicator({ 
  label, 
  isActive, 
  isPending,
  isError 
}: { 
  label: string; 
  isActive: boolean; 
  isPending: boolean;
  isError?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-3 rounded-lg border",
      isActive && "bg-green-500/5 border-green-500/20",
      isPending && "bg-yellow-500/5 border-yellow-500/20",
      isError && "bg-red-500/5 border-red-500/20",
      !isActive && !isPending && !isError && "bg-muted/50 border-border"
    )}>
      <div className={cn(
        "h-2.5 w-2.5 rounded-full",
        isActive ? "bg-green-500" : isPending ? "bg-yellow-500 animate-pulse" : isError ? "bg-red-500" : "bg-muted-foreground/30"
      )} />
      <span className="text-sm font-medium flex-1">{label}</span>
      {isActive && <CheckCircle className="h-4 w-4 text-green-500" />}
      {isPending && <Clock className="h-4 w-4 text-yellow-500" />}
      {isError && <AlertCircle className="h-4 w-4 text-red-500" />}
    </div>
  );
}

export function WebsiteDomainManager({ config }: WebsiteDomainManagerProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const { data: platformSettings, isLoading: isLoadingSettings } = usePlatformSettings();
  const { data: tenant } = useTenant();
  const { data: escola } = useEscola();
  const [customDomain, setCustomDomain] = useState(config.custom_domain || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get dynamic system branding from platform settings
  const systemName = platformSettings?.platform_slug || "sistema";
  const systemDomain = platformSettings?.system_domain 
    ? getSystemDomain(platformSettings.system_domain) 
    : getSystemDomain(platformSettings?.platform_url);
  
  // Derive status from config
  const getStatus = (): DomainStatus => {
    if (!config.custom_domain) return "not_configured";
    if ((config as unknown as Record<string, unknown>).custom_domain_verified) return "active";
    if ((config as unknown as Record<string, unknown>).custom_domain_ssl_status === "error") return "error";
    if ((config as unknown as Record<string, unknown>).custom_domain_ssl_status === "pending") return "verifying";
    return "pending";
  };
  
  const status: DomainStatus = getStatus();
  
  // Use system domain dynamically for subdomain URLs
  const hasSystemDomain = platformSettings?.system_domain && platformSettings.system_domain.trim() !== "";
  const defaultSubdomain = config.slug 
    ? hasSystemDomain 
      ? `https://${config.slug}.${systemDomain}` 
      : `${window.location.origin}/escola/${config.slug}` 
    : null;
  
  // Server IP for A records
  const serverIP = "185.158.133.1";
  
  // Custom nameservers
  const nameservers = [
    "ns1.lovablehost.com",
    "ns2.lovablehost.com",
  ];
  
  const handleSaveDomain = () => {
    if (!customDomain) {
      toast.error("Digite um domínio válido");
      return;
    }
    
    // Clean domain input
    let cleanDomain = customDomain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    
    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(cleanDomain)) {
      toast.error("Formato de domínio inválido. Exemplo: minhaescola.com.br");
      return;
    }
    
    setCustomDomain(cleanDomain);
    
    updateWebsite.mutate({ 
      custom_domain: cleanDomain,
      custom_domain_verified: false,
      custom_domain_ssl_status: "pending",
    } as Partial<SchoolWebsiteConfig>);
  };
  
  const handleRemoveDomain = () => {
    updateWebsite.mutate({ 
      custom_domain: null,
      custom_domain_verified: false,
      custom_domain_ssl_status: null,
    } as Partial<SchoolWebsiteConfig>);
    setCustomDomain("");
    toast.success("Domínio removido");
  };
  
  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    
    // Simulate verification check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.info("Verificação automática em desenvolvimento. Aguarde a propagação DNS.");
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
      bgColor: "bg-muted/50",
    },
    pending: {
      icon: Clock,
      label: "Aguardando DNS",
      color: "secondary" as const,
      bgColor: "bg-yellow-500/10",
    },
    verifying: {
      icon: RefreshCw,
      label: "Verificando",
      color: "secondary" as const,
      bgColor: "bg-blue-500/10",
    },
    active: {
      icon: CheckCircle,
      label: "Ativo",
      color: "default" as const,
      bgColor: "bg-green-500/10",
    },
    error: {
      icon: AlertCircle,
      label: "Erro",
      color: "destructive" as const,
      bgColor: "bg-red-500/10",
    },
  };
  
  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  
  const schoolName = escola?.nome || tenant?.nome || "Sua Escola";
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className={cn("h-1", currentStatus.bgColor)} />
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                status === "active" ? "bg-green-500/10" : "bg-primary/10"
              )}>
                <Globe className={cn(
                  "h-6 w-6",
                  status === "active" ? "text-green-600" : "text-primary"
                )} />
              </div>
              <div>
                <CardTitle className="text-xl">Domínio Personalizado</CardTitle>
                <CardDescription className="mt-1">
                  Configure um domínio próprio para o site de {schoolName}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={currentStatus.color} 
              className={cn(
                "px-3 py-1.5",
                status === "active" && "bg-green-500/10 text-green-700 border-green-500/20",
                status === "pending" && "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
                status === "verifying" && "bg-blue-500/10 text-blue-700 border-blue-500/20"
              )}
            >
              <StatusIcon className={cn(
                "h-3.5 w-3.5 mr-1.5",
                status === "verifying" && "animate-spin"
              )} />
              {currentStatus.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Default Subdomain */}
          <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Subdomínio Automático</Label>
              <Badge variant="outline" className="text-xs">Sempre ativo</Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-sm bg-background px-4 py-2.5 rounded-lg border font-medium">
                {defaultSubdomain || "Configure o slug primeiro"}
              </code>
              {defaultSubdomain && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleCopy(defaultSubdomain)}
                    className="h-10 w-10"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10" asChild>
                    <a href={defaultSubdomain} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Este endereço está sempre disponível, mesmo com domínio personalizado configurado.
            </p>
          </div>
          
          {/* Custom Domain Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-domain" className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Domínio Personalizado
              </Label>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    https://
                  </span>
                  <Input
                    id="custom-domain"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="www.minhaescola.com.br"
                    className="pl-16 h-11"
                  />
                </div>
                <Button 
                  onClick={handleSaveDomain}
                  disabled={updateWebsite.isPending || !customDomain}
                  className="min-w-[120px] h-11"
                >
                  {updateWebsite.isPending ? "Salvando..." : "Conectar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Digite seu domínio sem "https://" ou "www." — Exemplo: minhaescola.com.br
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* DNS Configuration */}
      {config.custom_domain && status !== "active" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Configuração DNS</CardTitle>
                <CardDescription>
                  Configure os registros DNS no painel do seu registrador de domínio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* DNS Records - Primary Method */}
            <div className="space-y-4">
              <Alert className="bg-blue-500/5 border-blue-500/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Configure os registros abaixo no painel DNS do seu registrador 
                  (GoDaddy, Registro.br, HostGator, Cloudflare, etc.)
                </AlertDescription>
              </Alert>
              
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-3">Nome / Host</div>
                  <div className="col-span-7">Valor / Aponta para</div>
                </div>
                
                <div className="px-4 divide-y divide-border/50">
                  <DNSRecordRow
                    type="A"
                    name="@"
                    value={serverIP}
                    description="Domínio raiz (obrigatório)"
                    priority
                  />
                  
                  <DNSRecordRow
                    type="A"
                    name="www"
                    value={serverIP}
                    description="Subdomínio www (recomendado)"
                  />
                  
                  <DNSRecordRow
                    type="TXT"
                    name={`_${systemName}`}
                    value={`${systemName}_verify=${config.slug}`}
                    description="Verificação de propriedade"
                  />
                </div>
              </div>
              
              <Collapsible className="rounded-xl border bg-muted/20">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/30 transition-colors rounded-xl">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Como configurar no seu registrador</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">GoDaddy:</strong> Domínios → Gerenciar DNS → Adicionar Registro</p>
                    <p><strong className="text-foreground">Registro.br:</strong> Domínio → Editar zona → Adicionar registro</p>
                    <p><strong className="text-foreground">HostGator:</strong> Meus Domínios → Gerenciar DNS → Adicionar</p>
                    <p><strong className="text-foreground">Cloudflare:</strong> DNS → Registros → Adicionar registro (desative proxy laranja)</p>
                    <p><strong className="text-foreground">Locaweb:</strong> Painel → Domínios → Zona DNS → Adicionar</p>
                  </div>
                  
                  <Alert className="bg-amber-500/5 border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm">
                      <strong>Importante:</strong> Remova registros A ou CNAME existentes 
                      para @ e www antes de adicionar os novos, para evitar conflitos.
                    </AlertDescription>
                  </Alert>
                </CollapsibleContent>
              </Collapsible>
              
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Dica:</strong> Se estiver usando Cloudflare, desative o proxy (ícone laranja) 
                  para os registros A apontarem diretamente para nosso servidor.
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <StatusIndicator 
                label="Propagação DNS" 
                isActive={false} 
                isPending={status === "pending" || status === "verifying"}
                isError={status === "error"}
              />
              <StatusIndicator 
                label="Certificado SSL" 
                isActive={false} 
                isPending={status === "verifying"}
                isError={status === "error"}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleVerifyDomain}
                  disabled={isVerifying}
                  className="gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", isVerifying && "animate-spin")} />
                  {isVerifying ? "Verificando..." : "Verificar Status"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleRemoveDomain}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remover domínio
                </Button>
              </div>
              
              <a 
                href={`https://dnschecker.org/#A/${config.custom_domain}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1.5"
              >
                Verificar propagação global
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            
            {/* Info Alert */}
            <Alert className="bg-muted/50 border-border">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tempo de propagação:</strong> Alterações DNS podem levar de 
                15 minutos a 48 horas. O certificado SSL será emitido automaticamente após a verificação.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
      
      {/* Active Domain Status */}
      {status === "active" && (
        <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700">Domínio Ativo e Seguro</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1.5 mr-3">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    SSL Ativo
                  </span>
                  <span className="inline-flex items-center gap-1.5 mr-3">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    HTTPS
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    Verificado
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://${config.custom_domain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visitar
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRemoveDomain}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remover
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
