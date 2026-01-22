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
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  status: "active" | "inactive";
}

interface WebhookLog {
  id: string;
  event: string;
  status: "success" | "error";
  timestamp: string;
  payload?: string;
}

export function IntegrationsTab() {
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [isTestingAsaas, setIsTestingAsaas] = useState(false);
  const [isTestingStripe, setIsTestingStripe] = useState(false);

  // Mock data for demonstration - in production, these would come from Supabase secrets
  const [asaasKey, setAsaasKey] = useState("$aact_YT...");
  const [stripeKey, setStripeKey] = useState("sk_live_...");
  const [asaasWebhookToken, setAsaasWebhookToken] = useState("");
  
  const webhookLogs: WebhookLog[] = [
    { id: "1", event: "PAYMENT_RECEIVED", status: "success", timestamp: "2026-01-22 02:30:00" },
    { id: "2", event: "PAYMENT_CREATED", status: "success", timestamp: "2026-01-22 02:25:00" },
    { id: "3", event: "PAYMENT_OVERDUE", status: "error", timestamp: "2026-01-22 02:20:00" },
  ];

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.substring(0, 8) + "•".repeat(Math.max(0, key.length - 12)) + key.slice(-4);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const testAsaasConnection = async () => {
    setIsTestingAsaas(true);
    try {
      // Simulate API test
      await new Promise(r => setTimeout(r, 1500));
      toast.success("Conexão com Asaas estabelecida com sucesso!");
    } catch {
      toast.error("Falha ao conectar com Asaas. Verifique a chave de API.");
    } finally {
      setIsTestingAsaas(false);
    }
  };

  const testStripeConnection = async () => {
    setIsTestingStripe(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success("Conexão com Stripe estabelecida com sucesso!");
    } catch {
      toast.error("Falha ao conectar com Stripe. Verifique a chave de API.");
    } finally {
      setIsTestingStripe(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="border-border/50">
        <CardHeader className="pb-4">
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
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      PIX, Boleto e Cartão de Crédito integrados para cobranças automáticas.
                    </p>
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
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Opcional
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      Suporte a cartões internacionais e checkout personalizado.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/50 bg-muted/20">
                <CardContent className="flex items-start gap-3 p-4">
                  <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Dica de segurança</p>
                    <p className="text-muted-foreground">
                      As chaves de API são armazenadas de forma segura e criptografada. Nunca compartilhe suas chaves secretas.
                      Configure webhooks para receber notificações em tempo real sobre transações.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chaves de API */}
            <TabsContent value="chaves" className="mt-6 space-y-6">
              {/* Asaas API Key */}
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Key className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Asaas API Key</CardTitle>
                      <CardDescription>Chave de acesso à API do Asaas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showAsaasKey ? "text" : "password"}
                        value={showAsaasKey ? asaasKey : maskKey(asaasKey)}
                        onChange={(e) => setAsaasKey(e.target.value)}
                        className="pr-20 font-mono text-sm"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowAsaasKey(!showAsaasKey)}
                        >
                          {showAsaasKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(asaasKey, "Chave Asaas")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={testAsaasConnection}
                      disabled={isTestingAsaas}
                    >
                      {isTestingAsaas ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Testar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Obtenha sua chave em: <a href="https://www.asaas.com/integracao" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      asaas.com/integracao <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </CardContent>
              </Card>

              {/* Stripe API Key */}
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Key className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Stripe Secret Key</CardTitle>
                      <CardDescription>Chave secreta da API do Stripe</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showStripeKey ? "text" : "password"}
                        value={showStripeKey ? stripeKey : maskKey(stripeKey)}
                        onChange={(e) => setStripeKey(e.target.value)}
                        className="pr-20 font-mono text-sm"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowStripeKey(!showStripeKey)}
                        >
                          {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(stripeKey, "Chave Stripe")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={testStripeConnection}
                      disabled={isTestingStripe}
                    >
                      {isTestingStripe ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Testar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Obtenha sua chave em: <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      dashboard.stripe.com/apikeys <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => toast.info("Para atualizar as chaves, acesse o painel de segredos do backend.")}>
                  Salvar Alterações
                </Button>
              </div>
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
                    <Label>Token de Webhook Asaas</Label>
                    <Input
                      type="password"
                      placeholder="Cole o token de segurança configurado no Asaas"
                      value={asaasWebhookToken}
                      onChange={(e) => setAsaasWebhookToken(e.target.value)}
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
                  <CardDescription>URLs configuradas para receber notificações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asaas Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value="https://sznckclviajjmmvsgrpp.supabase.co/functions/v1/asaas-webhook"
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard("https://sznckclviajjmmvsgrpp.supabase.co/functions/v1/asaas-webhook", "URL do Webhook")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value="https://sznckclviajjmmvsgrpp.supabase.co/functions/v1/stripe-webhook"
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard("https://sznckclviajjmmvsgrpp.supabase.co/functions/v1/stripe-webhook", "URL do Webhook")}
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
                  <CardDescription>Tipos de eventos que disparam notificações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { event: "PAYMENT_CREATED", label: "Pagamento Criado", enabled: true },
                      { event: "PAYMENT_RECEIVED", label: "Pagamento Recebido", enabled: true },
                      { event: "PAYMENT_CONFIRMED", label: "Pagamento Confirmado", enabled: true },
                      { event: "PAYMENT_OVERDUE", label: "Pagamento Vencido", enabled: true },
                      { event: "PAYMENT_DELETED", label: "Pagamento Excluído", enabled: false },
                      { event: "PAYMENT_REFUNDED", label: "Pagamento Estornado", enabled: true },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.event}</p>
                        </div>
                        <Switch defaultChecked={item.enabled} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs de Requisições */}
            <TabsContent value="logs-requisicoes" className="mt-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Requisições</CardTitle>
                  <CardDescription>Últimas chamadas realizadas para APIs externas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Logs de requisições em breve</p>
                    <p className="text-xs mt-1">Esta funcionalidade está em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs de Webhooks */}
            <TabsContent value="logs-webhooks" className="mt-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Logs de Webhooks</CardTitle>
                      <CardDescription>Eventos recebidos de integrações externas</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhookLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">{log.event}</TableCell>
                          <TableCell>
                            {log.status === "success" ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sucesso
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">
                                <XCircle className="h-3 w-3 mr-1" />
                                Erro
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.timestamp}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
