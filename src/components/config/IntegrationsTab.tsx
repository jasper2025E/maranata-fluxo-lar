import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSecrets } from "@/hooks/useSecrets";
import { useIntegrationSettings, WebhookEvents, SecuritySettings } from "@/hooks/useIntegrationSettings";
import { useWebhookLogs, useApiRequestLogs } from "@/hooks/useLogs";
import { 
  RefreshCw,
  Home,
  Key,
  Shield,
  Webhook,
  FileText,
  Activity,
  Info,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IntegrationStatusCard,
  ApiKeyCard,
  SecuritySettingsCard,
  WebhookConfigCard,
  ApiLogsTable,
  WebhookLogsTable,
} from "./integrations";

export function IntegrationsTab() {
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

  const { 
    getWebhookEvents, 
    getSecuritySettings, 
    updateWebhookEvents, 
    updateSecuritySettings, 
    isSaving,
    isLoading: settingsLoading 
  } = useIntegrationSettings();

  const webhookEvents = getWebhookEvents();
  const securitySettings = getSecuritySettings();

  const handleWebhookEventToggle = async (eventKey: string, value: boolean) => {
    const newEvents = { ...webhookEvents, [eventKey]: value };
    await updateWebhookEvents(newEvents as WebhookEvents);
  };

  const handleSecurityToggle = async (settingKey: string, value: boolean) => {
    const newSettings = { ...securitySettings, [settingKey]: value };
    await updateSecuritySettings(newSettings as SecuritySettings);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao testar conexão";
      toast.error(`${displayName}: ${message}`);
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

  // Prepare security settings for the card
  const securitySettingsList = [
    {
      key: "validate_webhook_token",
      label: "Validação de Webhook Token",
      description: "Verifica o token de autenticação em webhooks recebidos",
      enabled: securitySettings.validate_webhook_token,
    },
    {
      key: "rate_limiting",
      label: "Rate Limiting",
      description: "Limita requisições por minuto para evitar abusos",
      enabled: securitySettings.rate_limiting,
    },
    {
      key: "audit_logs",
      label: "Logs de Auditoria",
      description: "Registra todas as operações de API para auditoria",
      enabled: securitySettings.audit_logs,
    },
  ];

  // Prepare webhook events for the card
  const webhookEventsList = [
    { key: "PAYMENT_CREATED", label: "Pagamento criado", code: "PAYMENT_CREATED", enabled: webhookEvents.PAYMENT_CREATED },
    { key: "PAYMENT_RECEIVED", label: "Pagamento recebido", code: "PAYMENT_RECEIVED", enabled: webhookEvents.PAYMENT_RECEIVED },
    { key: "PAYMENT_CONFIRMED", label: "Pagamento confirmado", code: "PAYMENT_CONFIRMED", enabled: webhookEvents.PAYMENT_CONFIRMED },
    { key: "PAYMENT_OVERDUE", label: "Pagamento vencido", code: "PAYMENT_OVERDUE", enabled: webhookEvents.PAYMENT_OVERDUE },
    { key: "PAYMENT_REFUNDED", label: "Pagamento estornado", code: "PAYMENT_REFUNDED", enabled: webhookEvents.PAYMENT_REFUNDED },
    { key: "PAYMENT_DELETED", label: "Pagamento excluído", code: "PAYMENT_DELETED", enabled: webhookEvents.PAYMENT_DELETED },
  ];

  const webhookUrls = {
    asaas: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`,
    stripe: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Integrações</h2>
            <p className="text-sm text-muted-foreground">
              Configure as integrações com serviços externos
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inicio" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap gap-1 rounded-xl">
          <TabsTrigger value="inicio" className="gap-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Home className="h-4 w-4" />
            Início
          </TabsTrigger>
          <TabsTrigger value="chaves" className="gap-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Key className="h-4 w-4" />
            Chaves de API
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs-requisicoes" className="gap-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            Logs API
          </TabsTrigger>
          <TabsTrigger value="logs-webhooks" className="gap-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4" />
            Logs Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Início */}
        <TabsContent value="inicio" className="mt-6 space-y-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/30"
            >
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">Erro ao carregar status das integrações</p>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <IntegrationStatusCard
                name="Asaas"
                description="Gateway de pagamentos"
                icon={<img src="https://www.asaas.com/favicon.ico" alt="Asaas" className="h-6 w-6" />}
                iconBgClass="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
                isConfigured={asaasStatus.configured}
                prefix={asaasStatus.prefix}
                index={0}
              />
              <IntegrationStatusCard
                name="Stripe"
                description="Pagamentos internacionais"
                icon={<img src="https://stripe.com/favicon.ico" alt="Stripe" className="h-6 w-6" />}
                iconBgClass="bg-gradient-to-br from-violet-500/20 to-violet-500/5"
                isConfigured={stripeStatus.configured}
                isOptional
                prefix={stripeStatus.prefix}
                index={1}
              />
              <IntegrationStatusCard
                name="Resend"
                description="Envio de e-mails"
                icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                iconBgClass="bg-gradient-to-br from-blue-500/20 to-blue-500/5"
                isConfigured={resendStatus.configured}
                isOptional
                index={2}
              />
            </div>
          )}

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Dica de segurança</p>
              <p className="text-muted-foreground">
                As chaves de API são armazenadas de forma segura e criptografada. 
                Para atualizar uma chave, use a aba "Chaves de API".
              </p>
            </div>
          </motion.div>
        </TabsContent>

        {/* Chaves de API */}
        <TabsContent value="chaves" className="mt-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : (
            <>
              <ApiKeyCard
                name="Asaas API Key"
                description="Chave de acesso à API do Asaas"
                isConfigured={asaasStatus.configured}
                maskedValue={asaasStatus.maskedValue}
                prefix={asaasStatus.prefix}
                iconBgClass="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
                externalLink={{
                  url: "https://www.asaas.com/integracao",
                  label: "asaas.com/integracao",
                }}
                onTest={() => handleTestConnection("ASAAS_API_KEY", "Asaas")}
                isTesting={testingSecret === "ASAAS_API_KEY"}
                index={0}
              />
              <ApiKeyCard
                name="Stripe Secret Key"
                description="Chave secreta da API do Stripe"
                isConfigured={stripeStatus.configured}
                isOptional
                maskedValue={stripeStatus.maskedValue}
                prefix={stripeStatus.prefix}
                iconBgClass="bg-gradient-to-br from-violet-500/20 to-violet-500/5"
                externalLink={{
                  url: "https://dashboard.stripe.com/apikeys",
                  label: "dashboard.stripe.com/apikeys",
                }}
                onTest={() => handleTestConnection("STRIPE_SECRET_KEY", "Stripe")}
                isTesting={testingSecret === "STRIPE_SECRET_KEY"}
                index={1}
              />
              <ApiKeyCard
                name="Resend API Key"
                description="Chave para envio de e-mails transacionais"
                isConfigured={resendStatus.configured}
                isOptional
                maskedValue={resendStatus.maskedValue}
                prefix={resendStatus.prefix}
                iconBgClass="bg-gradient-to-br from-blue-500/20 to-blue-500/5"
                externalLink={{
                  url: "https://resend.com/api-keys",
                  label: "resend.com/api-keys",
                }}
                index={2}
              />
            </>
          )}
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca" className="mt-6">
          <SecuritySettingsCard
            settings={securitySettingsList}
            onToggle={handleSecurityToggle}
            isSaving={isSaving}
            webhookToken={{
              configured: asaasWebhookStatus.configured,
              maskedValue: asaasWebhookStatus.maskedValue,
            }}
          />
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="mt-6">
          <WebhookConfigCard
            webhookUrls={webhookUrls}
            events={webhookEventsList}
            onEventToggle={handleWebhookEventToggle}
            isSaving={isSaving || settingsLoading}
          />
        </TabsContent>

        {/* Logs de Requisições */}
        <TabsContent value="logs-requisicoes" className="mt-6">
          <ApiLogsTable
            logs={apiLogs}
            isLoading={apiLogsLoading}
            search={apiSearch}
            onSearchChange={setApiSearch}
            onRefresh={() => refetchApiLogs()}
          />
        </TabsContent>

        {/* Logs de Webhooks */}
        <TabsContent value="logs-webhooks" className="mt-6">
          <WebhookLogsTable
            logs={webhookLogs}
            isLoading={webhooksLoading}
            search={webhookSearch}
            onSearchChange={setWebhookSearch}
            sourceFilter={webhookSourceFilter}
            onSourceFilterChange={setWebhookSourceFilter}
            statusFilter={webhookStatusFilter}
            onStatusFilterChange={setWebhookStatusFilter}
            onRefresh={() => refetchWebhooks()}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
