import { Globe, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useTenant } from "@/hooks/useTenant";

export function SubdomainInfoCard() {
  const { data: platformSettings } = usePlatformSettings();
  const { data: tenant } = useTenant();

  // Get system domain and school slug
  const systemDomain = platformSettings?.system_domain || platformSettings?.platform_url || "";
  const schoolSlug = tenant?.nome 
    ? tenant.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
    : "";
  
  // Clean domain for display
  const cleanDomain = systemDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  
  // Build full subdomain URL
  const subdomainUrl = schoolSlug && cleanDomain 
    ? `${schoolSlug}.${cleanDomain}` 
    : null;
  
  const fullUrl = subdomainUrl ? `https://${subdomainUrl}` : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada!");
  };

  // If no system domain configured or no slug, show minimal info
  if (!cleanDomain || !schoolSlug) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Subdomínio Gratuito</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {!cleanDomain 
              ? "O domínio do sistema ainda não foi configurado pelo administrador."
              : "O slug da sua escola ainda não foi definido."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Subdomínio Gratuito</CardTitle>
          </div>
          <Badge variant="secondary" className="text-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        </div>
        <CardDescription>
          Sua escola possui um endereço gratuito incluso no plano
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <code className="flex-1 text-sm font-medium text-primary">
            {subdomainUrl}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => copyToClipboard(fullUrl!)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(fullUrl!, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Este subdomínio é gerado automaticamente e está sempre ativo.
          Para usar um domínio próprio (ex: www.suaescola.com.br), configure abaixo.
        </p>
      </CardContent>
    </Card>
  );
}
