import { Globe, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEscola } from "@/hooks/useEscola";

export function SubdomainInfoCard() {
  const { data: escola } = useEscola();

  // Build slug from school name
  const schoolSlug = escola?.nome 
    ? escola.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
    : "";
  
  // For single-tenant, we don't have system domain - show simplified info
  const subdomainUrl = schoolSlug ? `escola-maranata.lovable.app` : null;
  const fullUrl = subdomainUrl ? `https://${subdomainUrl}` : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada!");
  };

  if (!schoolSlug) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Domínio</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure os dados da escola para ativar o domínio.
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
            <CardTitle className="text-base">Domínio do Sistema</CardTitle>
          </div>
          <Badge variant="secondary" className="text-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        </div>
        <CardDescription>
          Endereço do sistema de gestão
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
          Este é o endereço principal do sistema de gestão da Escola Maranata.
        </p>
      </CardContent>
    </Card>
  );
}
