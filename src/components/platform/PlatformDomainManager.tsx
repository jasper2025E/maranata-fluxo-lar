import { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, Clock, Copy, ExternalLink, RefreshCw, Shield, Server, Lock, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type DomainStatus = "not_configured" | "pending" | "verifying" | "active" | "error";
type SSLStatus = "pending" | "active" | "error";

interface DomainConfig {
  system_domain: string;
  system_domain_verified: boolean;
  system_domain_ssl_status: SSLStatus;
}

interface PlatformDomainManagerProps {
  platformSlug: string;
  onSave?: () => void;
}

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
  priority?: string;
}) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-center py-3 border-b border-border/50 last:border-0">
      <div className="col-span-2">
        <Badge variant="secondary" className="font-mono text-xs">
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
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {priority && (
        <div className="col-span-1">
          <span className="text-sm text-muted-foreground">{priority}</span>
        </div>
      )}
      <div className={cn("flex items-center gap-1.5", priority ? "col-span-6" : "col-span-7")}>
        <code className="text-sm font-medium text-primary break-all">{value}</code>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-50 hover:opacity-100 flex-shrink-0"
          onClick={() => copyToClipboard(value, "Valor")}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Status Indicator Component
function StatusIndicator({ 
  label, 
  isActive, 
  isPending 
}: { 
  label: string; 
  isActive: boolean; 
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
      <div className={cn(
        "h-2 w-2 rounded-full",
        isActive ? "bg-green-500" : isPending ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground/30"
      )} />
      <span className="text-sm text-muted-foreground">{label}</span>
      {isActive ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto" />
      ) : isPending ? (
        <Clock className="h-3.5 w-3.5 text-yellow-500 ml-auto" />
      ) : null}
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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nameserver copiado!");
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
        onClick={() => copyToClipboard(value)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlatformDomainManager({ platformSlug, onSave }: PlatformDomainManagerProps) {
  const [domain, setDomain] = useState("");
  const [originalDomain, setOriginalDomain] = useState("");
  const [status, setStatus] = useState<DomainStatus>("not_configured");
  const [sslStatus, setSSLStatus] = useState<SSLStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDomainConfig();
  }, []);

  const fetchDomainConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["system_domain", "system_domain_verified", "system_domain_ssl_status"]);

      if (error) throw error;

      const config: Partial<DomainConfig> = {};
      data?.forEach((item) => {
        const value = typeof item.value === "object" && item.value !== null 
          ? (item.value as { value: unknown }).value 
          : item.value;
        
        if (item.key === "system_domain") config.system_domain = String(value || "");
        if (item.key === "system_domain_verified") config.system_domain_verified = Boolean(value);
        if (item.key === "system_domain_ssl_status") config.system_domain_ssl_status = (value as SSLStatus) || "pending";
      });

      setDomain(config.system_domain || "");
      setOriginalDomain(config.system_domain || "");
      setSSLStatus(config.system_domain_ssl_status || "pending");

      if (!config.system_domain) {
        setStatus("not_configured");
      } else if (config.system_domain_verified && config.system_domain_ssl_status === "active") {
        setStatus("active");
      } else if (config.system_domain_verified) {
        setStatus("verifying");
      } else {
        setStatus("pending");
      }
    } catch (error) {
      console.error("Error fetching domain config:", error);
      toast.error("Erro ao carregar configurações de domínio");
    } finally {
      setLoading(false);
    }
  };

  const saveDomain = async () => {
    if (!domain.trim()) {
      toast.error("Digite um domínio válido");
      return;
    }

    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");

    setSaving(true);
    try {
      const updates = [
        { key: "system_domain", value: { value: cleanDomain } },
        { key: "system_domain_verified", value: { value: false } },
        { key: "system_domain_ssl_status", value: { value: "pending" } },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: update.value })
          .eq("key", update.key);

        if (error) throw error;
      }

      setOriginalDomain(cleanDomain);
      setDomain(cleanDomain);
      setStatus("pending");
      setSSLStatus("pending");
      toast.success("Domínio salvo! Configure os registros DNS abaixo.");
      onSave?.();
    } catch (error) {
      console.error("Error saving domain:", error);
      toast.error("Erro ao salvar domínio");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case "verifying":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Verificando</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" /> Aguardando DNS</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Não configurado</Badge>;
    }
  };

  // Lovable's IP for A records
  const serverIP = "185.158.133.1";
  
  // Custom nameservers (example - these would be configurable)
  const nameservers = [
    "ns1.lovablehost.com",
    "ns2.lovablehost.com",
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-xl border bg-card animate-pulse" />
        <div className="h-96 rounded-xl border bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Configuration Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Domínio do Sistema</CardTitle>
                <CardDescription className="mt-0.5">
                  Configure o domínio principal para sua plataforma
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Domínio Principal</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  https://
                </span>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="seudominio.com.br"
                  className="pl-16"
                />
              </div>
              <Button 
                onClick={saveDomain} 
                disabled={saving || domain === originalDomain}
                className="min-w-[100px]"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          {domain && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Subdomínios automáticos:</span>{" "}
                Cada escola receberá um endereço gratuito no formato{" "}
                <code className="px-1.5 py-0.5 rounded bg-background text-primary text-xs">
                  escola.{domain || "seudominio.com.br"}
                </code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Configuration Card */}
      {originalDomain && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Configuração DNS</CardTitle>
                <CardDescription className="mt-0.5">
                  Escolha o método de configuração no seu provedor de domínio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="records" className="gap-2">
                  <Server className="h-4 w-4" />
                  Registros DNS
                </TabsTrigger>
                <TabsTrigger value="nameservers" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Nameservers
                </TabsTrigger>
              </TabsList>
              
              {/* DNS Records Tab */}
              <TabsContent value="records" className="space-y-4 mt-0">
                <Alert className="bg-muted/50 border-border">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Recomendado</strong> se você deseja manter outros serviços (email, etc.) no mesmo domínio.
                  </AlertDescription>
                </Alert>
                
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-3">Nome / Host</div>
                    <div className="col-span-7">Valor / Aponta para</div>
                  </div>
                  
                  <div className="px-4 divide-y divide-border/50">
                    <DNSRecordRow
                      type="A"
                      name="@"
                      value={serverIP}
                      description="Domínio raiz"
                    />
                    
                    <DNSRecordRow
                      type="A"
                      name="*"
                      value={serverIP}
                      description="Subdomínios (escolas)"
                    />

                    <DNSRecordRow
                      type="CNAME"
                      name="www"
                      value={originalDomain}
                      description="Redirecionamento www"
                    />
                    
                    <DNSRecordRow
                      type="TXT"
                      name={`_${platformSlug}`}
                      value={`${platformSlug}_verify=system`}
                      description="Verificação de propriedade"
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Nameservers Tab */}
              <TabsContent value="nameservers" className="space-y-4 mt-0">
                <Alert className="bg-muted/50 border-border">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Configuração avançada:</strong> Use esta opção para delegar o controle total do DNS para nossa plataforma.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Servidores de Nomes Personalizados</Label>
                  <p className="text-sm text-muted-foreground">
                    No painel do seu registrador (GoDaddy, Registro.br, HostGator, etc.), selecione a opção 
                    <strong> "Usar meus próprios servidores de nomes"</strong> e adicione os seguintes nameservers:
                  </p>
                  
                  <div className="space-y-2 mt-4">
                    {nameservers.map((ns, index) => (
                      <NameserverRow key={ns} number={index + 1} value={ns} />
                    ))}
                  </div>
                </div>
                
                <Collapsible className="rounded-lg border bg-muted/30">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Como configurar no seu registrador</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 space-y-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong className="text-foreground">GoDaddy:</strong> Domínios → Seu Domínio → Gerenciar DNS → Nameservers → Alterar</p>
                      <p><strong className="text-foreground">Registro.br:</strong> Domínio → Alterar Servidores DNS</p>
                      <p><strong className="text-foreground">HostGator:</strong> Meus Domínios → Gerenciar → Servidores de Nome</p>
                      <p><strong className="text-foreground">Cloudflare:</strong> Não recomendado usar nameservers externos se já está no Cloudflare</p>
                    </div>
                    
                    <Alert className="bg-yellow-500/5 border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Atenção:</strong> Ao usar nameservers personalizados, 
                        todo o controle DNS será transferido. Registros de email e outros serviços precisarão 
                        ser reconfigurados em nossa plataforma.
                      </AlertDescription>
                    </Alert>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
            </Tabs>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <StatusIndicator 
                label="Propagação DNS" 
                isActive={status === "active" || status === "verifying"} 
                isPending={status === "pending"}
              />
              <StatusIndicator 
                label="Certificado SSL" 
                isActive={sslStatus === "active"} 
                isPending={status === "verifying" || (status === "pending" && sslStatus === "pending")}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDomainConfig}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Verificar Status
              </Button>
              
              <a 
                href={`https://dnschecker.org/#A/${originalDomain}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                Verificar propagação
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Info Alert */}
            <Alert className="bg-primary/5 border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-foreground">Propagação DNS:</strong> Alterações podem levar até 48 horas. 
                O certificado SSL será provisionado automaticamente após a verificação.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      {originalDomain && status === "active" && (
        <Card className="border-0 shadow-sm bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">Domínio Seguro</p>
                <p className="text-sm text-muted-foreground">
                  SSL ativo • HTTPS habilitado • Subdomínios protegidos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
