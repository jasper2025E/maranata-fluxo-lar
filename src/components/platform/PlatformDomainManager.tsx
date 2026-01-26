import { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, Clock, Copy, ExternalLink, RefreshCw, Shield, Server, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        isActive ? "bg-emerald-500" : isPending ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/30"
      )} />
      <span className="text-sm text-muted-foreground">{label}</span>
      {isActive ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
      ) : isPending ? (
        <Clock className="h-3.5 w-3.5 text-amber-500 ml-auto" />
      ) : null}
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
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case "verifying":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" /> Verificando</Badge>;
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
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Configuração DNS</CardTitle>
                <CardDescription className="mt-0.5">
                  Adicione estes registros no seu provedor de domínio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DNS Records Table Header */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2">Tipo</div>
                <div className="col-span-3">Nome / Host</div>
                <div className="col-span-7">Valor / Aponta para</div>
              </div>
              
              <div className="px-4 divide-y divide-border/50">
                {/* A Record - Root */}
                <DNSRecordRow
                  type="A"
                  name="@"
                  value={serverIP}
                  description="Domínio raiz"
                />
                
                {/* A Record - Wildcard */}
                <DNSRecordRow
                  type="A"
                  name="*"
                  value={serverIP}
                  description="Subdomínios (escolas)"
                />

                {/* CNAME Record - WWW */}
                <DNSRecordRow
                  type="CNAME"
                  name="www"
                  value={originalDomain}
                  description="Redirecionamento www"
                />
                
                {/* TXT Record - Verification */}
                <DNSRecordRow
                  type="TXT"
                  name={`_${platformSlug}`}
                  value={`${platformSlug}_verify=system`}
                  description="Verificação de propriedade"
                />
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3">
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
            <Alert className="bg-blue-500/5 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-600" />
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
        <Card className="border-0 shadow-sm bg-emerald-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-700">Domínio Seguro</p>
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
