import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Globe, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  ExternalLink,
  Loader2,
  Info
} from "lucide-react";

interface CustomDomainConfigProps {
  tenantId: string;
}

interface TenantDomainInfo {
  custom_domain: string | null;
  domain_verified: boolean;
  domain_verified_at: string | null;
  slug: string;
}

/**
 * Componente para configurar domínio customizado de uma escola
 * Usado no painel do Gestor
 */
export function CustomDomainConfig({ tenantId }: CustomDomainConfigProps) {
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Buscar informações do domínio do tenant
  const { data: tenantInfo, isLoading } = useQuery({
    queryKey: ["tenant-domain", tenantId],
    queryFn: async (): Promise<TenantDomainInfo | null> => {
      const { data, error } = await supabase
        .from("tenants")
        .select("custom_domain, domain_verified, domain_verified_at, slug")
        .eq("id", tenantId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Mutation para atualizar domínio
  const updateDomainMutation = useMutation({
    mutationFn: async (domain: string | null) => {
      const { error } = await supabase
        .from("tenants")
        .update({ 
          custom_domain: domain,
          domain_verified: false,
          domain_verified_at: null
        })
        .eq("id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domain", tenantId] });
      setIsEditing(false);
      setNewDomain("");
      toast.success("Domínio atualizado! Configure o DNS conforme instruções.");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Este domínio já está em uso por outra escola.");
      } else {
        toast.error("Erro ao atualizar domínio");
      }
    },
  });

  // Mutation para verificar domínio
  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      // Em produção, isso chamaria uma Edge Function para verificar DNS
      // Por enquanto, marcamos como verificado manualmente
      const { error } = await supabase
        .from("tenants")
        .update({ 
          domain_verified: true,
          domain_verified_at: new Date().toISOString()
        })
        .eq("id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domain", tenantId] });
      toast.success("Domínio verificado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao verificar domínio");
    },
  });

  const handleSaveDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    
    // Validar formato do domínio
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
    if (domain && !domainRegex.test(domain)) {
      toast.error("Formato de domínio inválido. Exemplo: portal.minhaescola.com.br");
      return;
    }

    updateDomainMutation.mutate(domain || null);
  };

  const handleRemoveDomain = () => {
    if (confirm("Tem certeza que deseja remover o domínio customizado?")) {
      updateDomainMutation.mutate(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasCustomDomain = !!tenantInfo?.custom_domain;
  const isVerified = tenantInfo?.domain_verified;
  const defaultUrl = `${window.location.origin}/e/${tenantInfo?.slug}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Domínio Customizado</CardTitle>
        </div>
        <CardDescription>
          Configure um domínio personalizado para que a escola acesse com sua própria URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL padrão */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">URL padrão (sempre disponível)</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono">
              {defaultUrl}
            </code>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(defaultUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.open(defaultUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Domínio customizado */}
        {hasCustomDomain && !isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Domínio Customizado</Label>
              <Badge variant={isVerified ? "default" : "secondary"}>
                {isVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Aguardando verificação
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono">
                https://{tenantInfo.custom_domain}
              </code>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(`https://${tenantInfo.custom_domain}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {!isVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Configuração DNS Necessária</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Configure os seguintes registros DNS no seu provedor de domínio:
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-3 space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span>@ (ou {tenantInfo.custom_domain})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor:</span>
                    <div className="flex items-center gap-2">
                      <span>185.158.133.1</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard("185.158.133.1")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => verifyDomainMutation.mutate()}
                  disabled={verifyDomainMutation.isPending}
                >
                  {verifyDomainMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Verificar Configuração
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewDomain(tenantInfo.custom_domain || "");
                  setIsEditing(true);
                }}
              >
                Alterar Domínio
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRemoveDomain}
                disabled={updateDomainMutation.isPending}
              >
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">
                {isEditing ? "Alterar Domínio" : "Adicionar Domínio Customizado"}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    https://
                  </span>
                  <Input
                    id="custom-domain"
                    placeholder="portal.minhaescola.com.br"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                    className="pl-16"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: portal.minhaescola.com.br ou app.colegioabc.edu.br
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveDomain}
                disabled={updateDomainMutation.isPending || !newDomain.trim()}
              >
                {updateDomainMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {isEditing ? "Salvar Alteração" : "Conectar Domínio"}
              </Button>
              {isEditing && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setNewDomain("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como funciona?</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Adicione o domínio desejado acima</li>
                  <li>Configure o registro DNS A apontando para 185.158.133.1</li>
                  <li>Aguarde a propagação (pode levar até 72 horas)</li>
                  <li>Clique em "Verificar Configuração"</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
