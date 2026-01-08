import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Link2, Plus, Trash2, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

interface UTMLink {
  id: string;
  name: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

const COMMON_SOURCES = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "linkedin", label: "LinkedIn" },
];

const COMMON_MEDIUMS = [
  { value: "cpc", label: "CPC (Pago por clique)" },
  { value: "cpm", label: "CPM (Pago por impressão)" },
  { value: "social", label: "Social (Orgânico)" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Referral" },
  { value: "display", label: "Display" },
  { value: "affiliate", label: "Afiliado" },
];

export function UTMBuilder() {
  const [links, setLinks] = useState<UTMLink[]>([]);
  const [currentLink, setCurrentLink] = useState<Partial<UTMLink>>({
    baseUrl: `${window.location.origin}/inscricao`,
    source: "",
    medium: "",
    campaign: "",
    term: "",
    content: "",
    name: "",
  });
  const [copied, setCopied] = useState<string | null>(null);

  const buildUrl = (link: Partial<UTMLink>) => {
    const params = new URLSearchParams();
    if (link.source) params.set("utm_source", link.source);
    if (link.medium) params.set("utm_medium", link.medium);
    if (link.campaign) params.set("utm_campaign", link.campaign);
    if (link.term) params.set("utm_term", link.term);
    if (link.content) params.set("utm_content", link.content);
    
    const queryString = params.toString();
    return queryString ? `${link.baseUrl}?${queryString}` : link.baseUrl || "";
  };

  const handleAddLink = () => {
    if (!currentLink.source || !currentLink.medium || !currentLink.campaign) {
      toast.error("Preencha source, medium e campaign");
      return;
    }

    const newLink: UTMLink = {
      id: crypto.randomUUID(),
      name: currentLink.name || `${currentLink.source} - ${currentLink.campaign}`,
      baseUrl: currentLink.baseUrl || `${window.location.origin}/inscricao`,
      source: currentLink.source,
      medium: currentLink.medium,
      campaign: currentLink.campaign,
      term: currentLink.term,
      content: currentLink.content,
    };

    setLinks([...links, newLink]);
    setCurrentLink({
      baseUrl: `${window.location.origin}/inscricao`,
      source: "",
      medium: "",
      campaign: "",
      term: "",
      content: "",
      name: "",
    });
    toast.success("Link adicionado!");
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const generatedUrl = buildUrl(currentLink);

  return (
    <div className="space-y-6">
      {/* URL Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Gerador de Links UTM
          </CardTitle>
          <CardDescription>
            Crie links rastreáveis para suas campanhas de marketing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do Link (opcional)</Label>
              <Input
                placeholder="Ex: Campanha Black Friday FB"
                value={currentLink.name || ""}
                onChange={(e) => setCurrentLink({ ...currentLink, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL Base</Label>
              <Input
                placeholder="https://seusite.com/inscricao"
                value={currentLink.baseUrl || ""}
                onChange={(e) => setCurrentLink({ ...currentLink, baseUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>
                utm_source <span className="text-destructive">*</span>
              </Label>
              <Select
                value={currentLink.source}
                onValueChange={(value) => setCurrentLink({ ...currentLink, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                De onde vem o tráfego
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                utm_medium <span className="text-destructive">*</span>
              </Label>
              <Select
                value={currentLink.medium}
                onValueChange={(value) => setCurrentLink({ ...currentLink, medium: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o meio" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_MEDIUMS.map((medium) => (
                    <SelectItem key={medium.value} value={medium.value}>
                      {medium.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tipo de marketing
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                utm_campaign <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="ex: matriculas_2024"
                value={currentLink.campaign || ""}
                onChange={(e) => setCurrentLink({ ...currentLink, campaign: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              />
              <p className="text-xs text-muted-foreground">
                Nome da campanha
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>utm_term (opcional)</Label>
              <Input
                placeholder="ex: ensino_fundamental"
                value={currentLink.term || ""}
                onChange={(e) => setCurrentLink({ ...currentLink, term: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Palavras-chave do anúncio
              </p>
            </div>

            <div className="space-y-2">
              <Label>utm_content (opcional)</Label>
              <Input
                placeholder="ex: banner_principal"
                value={currentLink.content || ""}
                onChange={(e) => setCurrentLink({ ...currentLink, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Variação do anúncio (A/B test)
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Link Gerado</Label>
            <div className="flex gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleCopy(generatedUrl, 'preview')}
              >
                {copied === 'preview' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                asChild
              >
                <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <Button onClick={handleAddLink} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Salvar Link
          </Button>
        </CardContent>
      </Card>

      {/* Saved Links */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Links Salvos</CardTitle>
            <CardDescription>
              Seus links UTM gerados nesta sessão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {links.map((link) => {
                const url = buildUrl(link);
                return (
                  <div 
                    key={link.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{link.name}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {url}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {link.source}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {link.medium}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {link.campaign}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleCopy(url, link.id)}
                      >
                        {copied === link.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Dicas para Links UTM</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Use nomes consistentes em todas as suas campanhas</p>
          <p>• Evite espaços e caracteres especiais (use underline _)</p>
          <p>• Source = plataforma (facebook, google)</p>
          <p>• Medium = tipo (cpc, email, social)</p>
          <p>• Campaign = nome específico da campanha</p>
        </CardContent>
      </Card>
    </div>
  );
}
