import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Receipt,
  TrendingUp,
  Shield,
  Sparkles,
  ChevronRight,
  Download,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePlanDialog } from "@/components/subscription/UpgradePlanDialog";
import { toast } from "sonner";

interface SubscriptionData {
  id: string;
  nome: string;
  plano: string;
  subscription_status: string;
  monthly_price: number | null;
  subscription_started_at: string | null;
  grace_period_ends_at: string | null;
}

interface SubscriptionEvent {
  id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  amount: number | null;
  metadata: unknown;
  created_at: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: "Ativa",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  trial: {
    label: "Período de Teste",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <Clock className="h-4 w-4" />,
  },
  past_due: {
    label: "Pagamento Pendente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  suspended: {
    label: "Suspensa",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const planConfig: Record<string, { label: string; features: string[]; color: string }> = {
  basic: {
    label: "Básico",
    color: "from-gray-500 to-gray-600",
    features: [
      "Até 50 alunos",
      "Gestão de faturas",
      "Relatórios básicos",
      "Suporte por email",
    ],
  },
  pro: {
    label: "Profissional",
    color: "from-primary to-primary/80",
    features: [
      "Até 200 alunos",
      "Integração Asaas/PIX",
      "Relatórios avançados",
      "Suporte prioritário",
      "Gestão de RH",
    ],
  },
  enterprise: {
    label: "Enterprise",
    color: "from-violet-500 to-purple-600",
    features: [
      "Alunos ilimitados",
      "Todas as integrações",
      "API personalizada",
      "Suporte dedicado 24/7",
      "Treinamento incluso",
    ],
  },
};

const eventTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  created: { label: "Conta criada", icon: <Sparkles className="h-4 w-4 text-blue-500" /> },
  activated: { label: "Assinatura ativada", icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  payment_received: { label: "Pagamento recebido", icon: <Receipt className="h-4 w-4 text-emerald-500" /> },
  payment_failed: { label: "Falha no pagamento", icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
  suspended: { label: "Assinatura suspensa", icon: <XCircle className="h-4 w-4 text-red-500" /> },
  reactivated: { label: "Assinatura reativada", icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  subscription_updated: { label: "Plano atualizado", icon: <TrendingUp className="h-4 w-4 text-primary" /> },
  trial_started: { label: "Período de teste iniciado", icon: <Clock className="h-4 w-4 text-blue-500" /> },
};

export default function MinhaAssinatura() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isPlatformAdmin } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [history, setHistory] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Platform admins should not access this page - redirect them
  useEffect(() => {
    if (isPlatformAdmin()) {
      navigate("/platform");
    }
  }, [isPlatformAdmin, navigate]);

  // Fetch tenant_id from user's profile
  useEffect(() => {
    const fetchTenantId = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        
        const fetchedTenantId = profile?.tenant_id ?? null;
        setTenantId(fetchedTenantId);
        
        // If no tenant_id, stop loading here
        if (!fetchedTenantId) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setTenantId(null);
        setLoading(false);
      }
    };

    fetchTenantId();
  }, [user?.id]);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success("Assinatura ativada com sucesso! Seu plano foi atualizado.");
      setSearchParams({});
      fetchSubscriptionData();
    } else if (canceled === "true") {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.");
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    if (tenantId) {
      fetchSubscriptionData();
    }
  }, [tenantId]);

  const fetchSubscriptionData = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch tenant/subscription data
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, nome, plano, subscription_status, monthly_price, subscription_started_at, grace_period_ends_at")
        .eq("id", tenantId)
        .single();

      if (tenantError) throw tenantError;
      setSubscription(tenantData as SubscriptionData);

      // Fetch subscription history
      const { data: historyData, error: historyError } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (historyError) throw historyError;
      setHistory((historyData || []) as SubscriptionEvent[]);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!subscription || !tenantId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <CreditCard className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Informações não disponíveis</h2>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            {isPlatformAdmin() 
              ? "Como administrador da plataforma, você gerencia assinaturas através do módulo Plataforma > Escolas."
              : "Não foi possível carregar os dados da assinatura. Verifique se sua conta está vinculada a uma escola."
            }
          </p>
          {isPlatformAdmin() && (
            <Button 
              className="mt-4" 
              onClick={() => navigate("/platform/escolas")}
            >
              Ir para Gestão de Escolas
            </Button>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[subscription.subscription_status] || statusConfig.active;
  const plan = planConfig[subscription.plano] || planConfig.basic;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Minha Assinatura
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seu plano e acompanhe o histórico de pagamentos
          </p>
        </motion.div>

        {/* Alerta de Pagamento Pendente */}
        {subscription.subscription_status === "past_due" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Pagamento pendente
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Sua assinatura possui um pagamento pendente. 
                {subscription.grace_period_ends_at && (
                  <> Você tem até <strong>{format(new Date(subscription.grace_period_ends_at), "dd/MM/yyyy", { locale: ptBR })}</strong> para regularizar.</>
                )}
              </p>
              <Button size="sm" className="mt-3" variant="default">
                <CreditCard className="h-4 w-4 mr-2" />
                Regularizar Pagamento
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Subscription Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Plano {plan.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {subscription.nome}
                    </CardDescription>
                  </div>
                  <Badge className={`${status.className} flex items-center gap-1.5`}>
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {formatCurrency(subscription.monthly_price || 0)}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {subscription.subscription_started_at && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Assinante desde</p>
                        <p className="font-medium text-foreground">
                          {format(new Date(subscription.subscription_started_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Recursos inclusos</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="default" 
                    className="gap-2"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Alterar Plano
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => navigate("/assinatura/faturas")}
                  >
                    <Receipt className="h-4 w-4" />
                    Ver Faturas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Backup automático</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SSL/TLS</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">LGPD Compliance</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Precisa de ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Nossa equipe está disponível para ajudar com qualquer dúvida sobre sua assinatura.
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Falar com Suporte
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Histórico da Assinatura
              </CardTitle>
              <CardDescription>
                Acompanhe todas as atividades e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum histórico disponível</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((event, index) => {
                    const config = eventTypeLabels[event.event_type] || {
                      label: event.event_type,
                      icon: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
                    };
                    return (
                      <motion.div
                        key={`${event.id}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 bg-background rounded-lg shadow-sm">
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{config.label}</p>
                          {event.amount && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              {formatCurrency(event.amount)}
                            </p>
                          )}
                          {event.metadata && typeof event.metadata === 'object' && 'message' in event.metadata && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {String(event.metadata.message)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upgrade Dialog */}
        <UpgradePlanDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          currentPlan={subscription.plano}
          tenantId={subscription.id}
          onSuccess={() => {
            fetchSubscriptionData();
            setUpgradeDialogOpen(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
