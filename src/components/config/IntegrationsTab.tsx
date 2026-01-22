import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSecrets } from "@/hooks/useSecrets";
import { useWebhookLogs, useApiRequestLogs } from "@/hooks/useLogs";
import { 
  Key, 
  Shield, 
  Webhook, 
  FileText, 
  Activity,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Home,
  AlertTriangle,
  Info,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function IntegrationsTab() {
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [testingSecret, setTestingSecret] = useState<string | null>(null);
  const [webhookSearch, setWebhookSearch] = useState("");
  const [webhookSourceFilter, setWebhookSourceFilter] = useState<string>("all");
  const [webhookStatusFilter, setWebhookStatusFilter] = useState<string>("all");
  const [apiSearch, setApiSearch] = useState("");

  const { secrets, isLoading, error, refetch, testConnection } = useSecrets();
  
  const { data: webhookLogs, isLoading: webhooksLoading, refetch: refetchWebhooks } = useWebhookLogs({
    search: webhookSearch || undefined,
    source: webhookSourceFilter !== "all" ? webhookSourceFilter : undefined,
    status: webhookStatusFilter !== "all" ? webhookStatusFilter : undefined,
    limit: 50,
  });
  
  const { data: apiLogs, isLoading: apiLogsLoading, refetch: refetchApiLogs } = useApiRequestLogs({
    search: apiSearch || undefined,
    limit: 50,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const handleTestConnection = async (secretName: string, displayName: string) => {
    setTestingSecret(secretName);
    try {
      const result = await testConnection(secretName);
      if (result.success) {
        toast.success(
          <div>
            <p className="font-medium">{displayName}: Conexão OK!</p>
            <p className="text-sm text-muted-foreground">
              Ambiente: {result.environment === "production" ? "Produção" : "Sandbox/Teste"}
              {result.balance !== undefined && ` | Saldo: R$ ${result.balance.toFixed(2)}`}
              {result.currency && ` | Moeda: ${result.currency}`}
            </p>
          </div>
        );
      } else {
        toast.error(`${displayName}: ${result.error || "Falha na conexão"}`);
      }
    } catch (err: any) {
      toast.error(`${displayName}: ${err.message || "Erro ao testar conexão"}`);
    } finally {
      setTestingSecret(null);
    }
  };

  const getSecretStatus = (secretName: keyof typeof secrets) => {
    if (!secrets) return { configured: false, maskedValue: "••••••••", prefix: "" };
    return secrets[secretName] || { configured: false, maskedValue: "••••••••", prefix: "" };
  };

  const asaasStatus = getSecretStatus("ASAAS_API_KEY");
  const stripeStatus = getSecretStatus("STRIPE_SECRET_KEY");
  const asaasWebhookStatus = getSecretStatus("ASAAS_WEBHOOK_TOKEN");
  const resendStatus = getSecretStatus("RESEND_API_KEY");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Integrações</CardTitle>
                <CardDescription>
                  Configure as integrações com serviços externos de pagamento e automação
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="inicio" className="w-full">
            <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="inicio" className="gap-2 text-sm">
                <Home className="h-4 w-4" />
                Início
              </TabsTrigger>
              <TabsTrigger value="chaves" className="gap-2 text-sm">
                <Key className="h-4 w-4" />
                Chaves de API
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Mecanismos de Segurança
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-2 text-sm">
                <Webhook className="h-4 w-4" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="logs-requisicoes" className="gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Logs de Requisições
              </TabsTrigger>
              <TabsTrigger value="logs-webhooks" className="gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Logs de Webhooks
              </TabsTrigger>
            </TabsList>

            {/* Início */}
            <TabsContent value="inicio" className="mt-6 space-y-6">
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : error ? (
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardContent className="flex items-center gap-3 p-4">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">Erro ao carregar status das integrações</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <img src="https://www.asaas.com/favicon.ico" alt="Asaas" className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Asaas</CardTitle>
                            <CardDescription className="text-xs">Gateway de pagamentos</CardDescription>
                          </div>
                        </div>
                        {asaasStatus.configured ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Não configurado
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        PIX, Boleto e Cartão de Crédito integrados para cobranças automáticas.
                      </p>
                      {asaasStatus.configured && asaasStatus.prefix && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          Chave: {asaasStatus.prefix}...
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <img src="https://stripe.com/favicon.ico" alt="Stripe" className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Stripe</CardTitle>
                            <CardDescription className="text-xs">Pagamentos internacionais</CardDescription>
                          </div>
                        </div>
                        {stripeStatus.configured ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Opcional
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Suporte a cartões internacionais e checkout personalizado.
                      </p>
                      {stripeStatus.configured && stripeStatus.prefix && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          Chave: {stripeStatus.prefix}...
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Resend</CardTitle>
                            <CardDescription className="text-xs">Envio de e-mails</CardDescription>
                          </div>
                        </div>
                        {resendStatus.configured ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Opcional
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Envio de recibos e notificações por e-mail.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card className="border-border/50 bg-muted/20">
                <CardContent className="flex items-start gap-3 p-4">
                  <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Dica de segurança</p>
                    <p className="text-muted-foreground">
                      As chaves de API são armazenadas de forma segura e criptografada no backend. 
                      Para atualizar uma chave, use a aba "Chaves de API" e clique em "Atualizar Chave".
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chaves de API */}
            <TabsContent value="chaves" className="mt-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              ) : (
                <>
                  {/* Asaas API Key */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Key className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Asaas API Key</CardTitle>
                            <CardDescription>Chave de acesso à API do Asaas</CardDescription>
                          </div>
                        </div>
                        {asaasStatus.configured ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configurada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Não configurada
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            type={showAsaasKey ? "text" : "password"}
                            value={showAsaasKey ? (asaasStatus.prefix + "..." + asaasStatus.maskedValue.slice(-8)) : asaasStatus.maskedValue}
                            readOnly
                            className="pr-12 font-mono text-sm bg-muted/50"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setShowAsaasKey(!showAsaasKey)}
                              disabled={!asaasStatus.configured}
                            >
                              {showAsaasKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection("ASAAS_API_KEY", "Asaas")}
                          disabled={!asaasStatus.configured || testingSecret === "ASAAS_API_KEY"}
                        >
                          {testingSecret === "ASAAS_API_KEY" ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Testar
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Obtenha sua chave em: <a href="https://www.asaas.com/integracao" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            asaas.com/integracao <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toast.info("Para atualizar a chave Asaas, solicite ao administrador do sistema.")}
                        >
                          Atualizar Chave
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stripe API Key */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <Key className="h-4 w-4 text-violet-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Stripe Secret Key</CardTitle>
                            <CardDescription>Chave secreta da API do Stripe</CardDescription>
                          </div>
                        </div>
                        {stripeStatus.configured ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configurada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Opcional
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            type={showStripeKey ? "text" : "password"}
                            value={showStripeKey ? (stripeStatus.prefix + "..." + stripeStatus.maskedValue.slice(-8)) : stripeStatus.maskedValue}
                            readOnly
                            className="pr-12 font-mono text-sm bg-muted/50"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setShowStripeKey(!showStripeKey)}
                              disabled={!stripeStatus.configured}
                            >
                              {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection("STRIPE_SECRET_KEY", "Stripe")}
                          disabled={!stripeStatus.configured || testingSecret === "STRIPE_SECRET_KEY"}
                        >
                          {testingSecret === "STRIPE_SECRET_KEY" ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Testar
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Obtenha sua chave em: <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            dashboard.stripe.com/apikeys <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toast.info("Para atualizar a chave Stripe, solicite ao administrador do sistema.")}
                        >
                          Atualizar Chave
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resend API Key */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Key className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Resend API Key</CardTitle>
                            <CardDescription>Chave para envio de e-mails transacionais</CardDescription>
                          </div>
                        </div>
                        {resendStatus.configured ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configurada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Opcional
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            type="password"
                            value={resendStatus.maskedValue}
                            readOnly
                            className="font-mono text-sm bg-muted/50"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Obtenha sua chave em: <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            resend.com/api-keys <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toast.info("Para atualizar a chave Resend, solicite ao administrador do sistema.")}
                        >
                          Atualizar Chave
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Mecanismos de Segurança */}
            <TabsContent value="seguranca" className="mt-6 space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Configurações de Segurança</CardTitle>
                  <CardDescription>Controle os mecanismos de proteção das integrações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Validação de Webhook Token</Label>
                      <p className="text-sm text-muted-foreground">
                        Verifica o token de autenticação em webhooks recebidos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Rate Limiting</Label>
                      <p className="text-sm text-muted-foreground">
                        Limita requisições por minuto para evitar abusos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Logs de Auditoria</Label>
                      <p className="text-sm text-muted-foreground">
                        Registra todas as operações de API para auditoria
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Token de Webhook Asaas</Label>
                      {asaasWebhookStatus.configured ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                          Configurado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                          Não configurado
                        </Badge>
                      )}
                    </div>
                    <Input
                      type="password"
                      value={asaasWebhookStatus.maskedValue}
                      readOnly
                      className="font-mono text-sm bg-muted/50"
                      placeholder="Token não configurado"
                    />
                    <p className="text-xs text-muted-foreground">
                      Configure este token no painel Asaas para autenticar webhooks recebidos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks */}
            <TabsContent value="webhooks" className="mt-6 space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Endpoints de Webhook</CardTitle>
                  <CardDescription>Configure estes endpoints nos painéis dos serviços</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asaas Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`, "URL do Webhook Asaas")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`, "URL do Webhook Stripe")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Eventos Monitorados</CardTitle>
                  <CardDescription>Eventos que disparam ações automáticas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { event: "PAYMENT_CREATED", label: "Pagamento criado", active: true },
                      { event: "PAYMENT_RECEIVED", label: "Pagamento recebido", active: true },
                      { event: "PAYMENT_CONFIRMED", label: "Pagamento confirmado", active: true },
                      { event: "PAYMENT_OVERDUE", label: "Pagamento vencido", active: true },
                      { event: "PAYMENT_REFUNDED", label: "Pagamento estornado", active: false },
                      { event: "PAYMENT_DELETED", label: "Pagamento excluído", active: false },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.event}</p>
                        </div>
                        <Switch defaultChecked={item.active} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs de Requisições */}
            <TabsContent value="logs-requisicoes" className="mt-6 space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Histórico de Requisições</CardTitle>
                      <CardDescription>Últimas requisições feitas às APIs externas</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchApiLogs()} disabled={apiLogsLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${apiLogsLoading ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por endpoint ou método..."
                        value={apiSearch}
                        onChange={(e) => setApiSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  {apiLogsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !apiLogs || apiLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma requisição registrada ainda.</p>
                      <p className="text-sm">As requisições às APIs externas aparecerão aqui.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Método</TableHead>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tempo</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline" className={
                                log.method === "GET" ? "bg-blue-500/10 text-blue-600" :
                                log.method === "POST" ? "bg-emerald-500/10 text-emerald-600" :
                                log.method === "PUT" ? "bg-amber-500/10 text-amber-600" :
                                "bg-red-500/10 text-red-600"
                              }>
                                {log.method}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate">
                              {log.endpoint}
                            </TableCell>
                            <TableCell>
                              {log.status_code && log.status_code >= 200 && log.status_code < 300 ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {log.status_code}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {log.status_code || "Erro"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs de Webhooks */}
            <TabsContent value="logs-webhooks" className="mt-6 space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Webhooks Recebidos</CardTitle>
                      <CardDescription>Eventos recebidos dos serviços externos</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchWebhooks()} disabled={webhooksLoading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${webhooksLoading ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por evento..."
                        value={webhookSearch}
                        onChange={(e) => setWebhookSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={webhookSourceFilter} onValueChange={setWebhookSourceFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas fontes</SelectItem>
                        <SelectItem value="asaas">Asaas</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={webhookStatusFilter} onValueChange={setWebhookStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos status</SelectItem>
                        <SelectItem value="processed">Processado</SelectItem>
                        <SelectItem value="received">Recebido</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {webhooksLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !webhookLogs || webhookLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum webhook recebido ainda.</p>
                      <p className="text-sm">Os eventos dos gateways de pagamento aparecerão aqui.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fonte</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tempo</TableHead>
                          <TableHead>Data/Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {webhookLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline" className={
                                log.source === "asaas" ? "bg-emerald-500/10 text-emerald-600" :
                                log.source === "stripe" ? "bg-violet-500/10 text-violet-600" :
                                "bg-blue-500/10 text-blue-600"
                              }>
                                {log.source.charAt(0).toUpperCase() + log.source.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {log.event_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.status === "processed" ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Processado
                                </Badge>
                              ) : log.status === "received" ? (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Recebido
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Falhou
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.processing_time_ms ? `${log.processing_time_ms}ms` : "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
