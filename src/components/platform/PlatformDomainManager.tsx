import { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, Clock, Copy, ExternalLink, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

      // Determine status
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

    // Clean domain
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    setSaving(true);
    try {
      // Update all domain-related settings
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case "verifying":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Verificando SSL</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Aguardando DNS</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline">Não configurado</Badge>;
    }
  };

  // Server IP for A records (Lovable's IP)
  const serverIP = "185.158.133.1";

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando configurações de domínio...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Input Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Domínio do Sistema</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Configure o domínio principal do sistema. Todas as escolas receberão automaticamente
            um subdomínio gratuito (ex: escola.{domain || "seudominio.com.br"})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domínio Principal</Label>
            <div className="flex gap-2">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Ex: wivessistem.com.br"
                className="flex-1"
              />
              <Button 
                onClick={saveDomain} 
                disabled={saving || domain === originalDomain}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Digite apenas o domínio, sem "https://" ou "www"
            </p>
          </div>

          {domain && (
            <div className="pt-2">
              <p className="text-sm">
                <strong>Exemplo de subdomínio:</strong>{" "}
                <code className="px-2 py-1 bg-muted rounded text-primary">
                  escola-exemplo.{domain}
                </code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Configuration Card - Only show if domain is set */}
      {originalDomain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuração DNS
            </CardTitle>
            <CardDescription>
              Configure os seguintes registros DNS no seu provedor de domínio para ativar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* A Record for root domain */}
            <div className="space-y-3">
              <h4 className="font-medium">1. Registro A (Domínio Principal)</h4>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <code className="text-sm font-medium">A</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nome/Host</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">@</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard("@", "Host")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor/Aponta para</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">{serverIP}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(serverIP, "IP")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Wildcard A Record */}
            <div className="space-y-3">
              <h4 className="font-medium">2. Registro A Wildcard (Subdomínios)</h4>
              <p className="text-sm text-muted-foreground">
                Este registro permite que todas as escolas acessem seus subdomínios automaticamente
              </p>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <code className="text-sm font-medium">A</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nome/Host</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">*</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard("*", "Host wildcard")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor/Aponta para</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">{serverIP}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(serverIP, "IP")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* TXT Record for verification */}
            <div className="space-y-3">
              <h4 className="font-medium">3. Registro TXT (Verificação)</h4>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <code className="text-sm font-medium">TXT</code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nome/Host</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">_{platformSlug}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`_${platformSlug}`, "Host TXT")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">{platformSlug}_verify=system</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`${platformSlug}_verify=system`, "Valor TXT")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Refresh */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">DNS:</span>
                  {status === "active" || status === "verifying" ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" /> Pendente
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">SSL:</span>
                  {sslStatus === "active" ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" /> Pendente
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDomainConfig}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
            </div>

            {/* Help Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Propagação DNS</AlertTitle>
              <AlertDescription>
                As alterações de DNS podem levar até 48 horas para propagar completamente. 
                Use ferramentas como{" "}
                <a 
                  href="https://dnschecker.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  DNSChecker.org <ExternalLink className="h-3 w-3" />
                </a>{" "}
                para verificar o status da propagação.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
