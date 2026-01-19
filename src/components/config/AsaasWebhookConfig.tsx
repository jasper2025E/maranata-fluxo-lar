import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Webhook, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  AlertCircle,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const SUPABASE_PROJECT_ID = "sznckclviajjmmvsgrpp";

export function AsaasWebhookConfig() {
  const [copied, setCopied] = useState<string | null>(null);

  const webhookUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/asaas-webhook`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const eventosSuportados = [
    { evento: "PAYMENT_RECEIVED", descricao: "Pagamento recebido" },
    { evento: "PAYMENT_CONFIRMED", descricao: "Pagamento confirmado" },
    { evento: "PAYMENT_OVERDUE", descricao: "Pagamento vencido" },
    { evento: "PAYMENT_REFUNDED", descricao: "Pagamento estornado" },
    { evento: "PAYMENT_DELETED", descricao: "Pagamento excluído" },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          Configuração do Webhook Asaas
        </CardTitle>
        <CardDescription>
          Configure o webhook no painel do Asaas para receber notificações automáticas de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL do Webhook */}
        <div className="space-y-2">
          <Label className="font-medium">URL do Webhook</Label>
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              readOnly
              className="bg-muted/50 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(webhookUrl, "url")}
            >
              {copied === "url" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Copie esta URL e adicione no painel do Asaas em Integrações → Webhooks
          </p>
        </div>

        <Separator />

        {/* Instruções */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Como Configurar no Asaas
          </h4>
          
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs">1</span>
              <span>Acesse o painel do Asaas em <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">asaas.com <ExternalLink className="h-3 w-3" /></a></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs">2</span>
              <span>Vá em <strong>Configurações → Integrações → Webhooks</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs">3</span>
              <span>Clique em <strong>"Adicionar webhook"</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs">4</span>
              <span>Cole a URL acima no campo "URL do webhook"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs">5</span>
              <span>Selecione os eventos de <strong>Pagamento</strong> que deseja receber</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs">6</span>
              <span>Salve a configuração</span>
            </li>
          </ol>
        </div>

        <Separator />

        {/* Eventos Suportados */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Eventos Suportados
          </h4>
          <div className="grid gap-2">
            {eventosSuportados.map((item) => (
              <div 
                key={item.evento}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30 border"
              >
                <code className="text-xs font-mono text-muted-foreground">{item.evento}</code>
                <span className="text-sm">{item.descricao}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Segurança */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Token de Segurança (Opcional)</p>
              <p className="text-xs text-muted-foreground">
                Para maior segurança, você pode configurar um token de autenticação no Asaas. 
                O token <code className="bg-muted px-1 rounded">ASAAS_WEBHOOK_TOKEN</code> já está 
                configurado no sistema e será validado automaticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <div>
              <p className="font-medium text-sm">Webhook Ativo</p>
              <p className="text-xs text-muted-foreground">Pronto para receber notificações do Asaas</p>
            </div>
          </div>
          <Badge variant="outline" className="text-success border-success/30">
            Online
          </Badge>
        </div>

        {/* Aviso */}
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Importante</p>
              <p className="text-xs text-muted-foreground">
                Após configurar o webhook no Asaas, faça um teste de pagamento para verificar 
                se as notificações estão sendo recebidas corretamente. O status da fatura 
                será atualizado automaticamente quando o pagamento for confirmado.
              </p>
            </div>
          </div>
        </div>

        {/* Link para Asaas */}
        <div className="flex justify-end">
          <Button variant="outline" asChild className="gap-2">
            <a href="https://www.asaas.com/config/index#webhooks" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir Painel do Asaas
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
