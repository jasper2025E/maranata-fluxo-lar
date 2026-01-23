import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Receipt,
  TrendingUp,
  ChevronRight,
  Loader2,
  Info,
} from "lucide-react";
import { PaymentMethodCard } from "@/components/subscription/PaymentMethodCard";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePlanDialog } from "@/components/subscription/UpgradePlanDialog";
import { toast } from "sonner";
import { useSubscriptionPlans, getPlanPriceFormatted } from "@/hooks/useSubscriptionPlans";

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

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last_four: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: "Ativa",
    className: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  trial: {
    label: "Período de Teste",
    className: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  past_due: {
    label: "Pagamento Pendente",
    className: "bg-amber-100 text-amber-700",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  suspended: {
    label: "Suspensa",
    className: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-gray-100 text-gray-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const planLabels: Record<string, string> = {
  basic: "Plano Básico",
  pro: "Plano Profissional",
  enterprise: "Plano Enterprise",
};

const eventTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  created: { label: "Conta criada", icon: <CheckCircle className="h-4 w-4 text-blue-500" /> },
  activated: { label: "Assinatura ativada", icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  payment_received: { label: "Pagamento recebido", icon: <Receipt className="h-4 w-4 text-emerald-500" /> },
  payment_failed: { label: "Falha no pagamento", icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
  suspended: { label: "Assinatura suspensa", icon: <XCircle className="h-4 w-4 text-red-500" /> },
  reactivated: { label: "Assinatura reativada", icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  subscription_updated: { label: "Plano atualizado", icon: <TrendingUp className="h-4 w-4 text-primary" /> },
  trial_started: { label: "Período de teste iniciado", icon: <Clock className="h-4 w-4 text-blue-500" /> },
};

export default function MinhaAssinatura() {
  const { data: subscriptionPlans = [] } = useSubscriptionPlans();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isPlatformAdmin } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [history, setHistory] = useState<SubscriptionEvent[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (isPlatformAdmin()) {
      navigate("/platform");
    }
  }, [isPlatformAdmin, navigate]);

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
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, nome, plano, subscription_status, monthly_price, subscription_started_at, grace_period_ends_at")
        .eq("id", tenantId)
        .single();

      if (tenantError) throw tenantError;
      setSubscription(tenantData as SubscriptionData);

      const { data: historyData, error: historyError } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (historyError) throw historyError;
      setHistory((historyData || []) as SubscriptionEvent[]);

      // Fetch payment method
      const { data: paymentData } = await supabase
        .from("tenant_payment_methods")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_default", true)
        .maybeSingle();

      setPaymentMethod(paymentData as PaymentMethod | null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
  const planLabel = planLabels[subscription.plano] || "Plano Básico";
  const monthlyPrice = subscription.monthly_price || 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <span className="text-muted-foreground">Conta</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Minha Assinatura</span>
        </div>

        {/* Alert Banner - Past Due */}
        {subscription.subscription_status === "past_due" && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#ebf5fa] border border-[#b8dff5] mb-6">
            <Info className="h-5 w-5 text-[#0077b3] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#003c5a] leading-relaxed">
                Sua assinatura possui um pagamento pendente.
                {subscription.grace_period_ends_at && (
                  <> Você tem até <strong>{format(new Date(subscription.grace_period_ends_at), "d 'de' MMM. 'de' yyyy", { locale: ptBR })}</strong> para regularizar.</>
                )}
              </p>
            </div>
            <Button 
              size="sm"
              onClick={() => navigate("/pagar-fatura")}
              className="bg-[#1a1a1a] hover:bg-[#333] text-white shrink-0"
            >
              Pagar fatura
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Current Plan Card */}
            <div className="bg-background rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium text-foreground">Plano atual</span>
                  <Badge className={`${status.className} flex items-center gap-1 text-xs font-medium`}>
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{planLabel}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getPlanPriceFormatted(monthlyPrice * 100)} + tributo, a cada 30 dias
                    </p>
                    {subscription.subscription_started_at && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Assinante desde {format(new Date(subscription.subscription_started_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                    className="text-sm font-medium"
                  >
                    Alterar plano
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Method Card - Component with full functionality */}
            <PaymentMethodCard 
              tenantId={tenantId} 
              onUpdate={fetchSubscriptionData}
            />

            {/* Invoice History */}
            <div className="bg-background rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Histórico da assinatura</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Acompanhe todas as atividades e pagamentos
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/assinatura/faturas")}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Ver todas as faturas
                </Button>
              </div>

              <div className="divide-y divide-border">
                {history.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
                  </div>
                ) : (
                  history.slice(0, 5).map((event, index) => {
                    const config = eventTypeLabels[event.event_type] || {
                      label: event.event_type,
                      icon: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
                    };
                    return (
                      <div 
                        key={`${event.id}-${index}`}
                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="p-2 bg-muted/50 rounded-lg">
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{config.label}</p>
                          {event.amount && (
                            <p className="text-sm text-emerald-600 font-medium">
                              {getPlanPriceFormatted(event.amount * 100)}
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
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-xl border border-border shadow-sm sticky top-6">
              <div className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-5">Resumo</h2>

                {/* School Info */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-foreground mb-1">Escola</p>
                  <p className="text-sm text-muted-foreground">{subscription.nome}</p>
                </div>

                {/* Plan Info */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-foreground mb-1">Plano e ciclo de faturamento</p>
                  <p className="text-sm text-muted-foreground">{planLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {getPlanPriceFormatted(monthlyPrice * 100)} + tributo, a cada 30 dias
                  </p>
                </div>

                {/* Billing Info */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-foreground mb-1">Próxima cobrança</p>
                  <p className="text-sm text-muted-foreground">
                    Ciclo de faturamento mensal
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-5" />

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-semibold text-foreground">Total mensal</span>
                  <span className="text-sm font-semibold text-foreground">
                    {getPlanPriceFormatted(monthlyPrice * 100)}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => setUpgradeDialogOpen(true)} 
                    className="w-full h-11 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium rounded-lg transition-colors"
                  >
                    Alterar plano
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/assinatura/faturas")}
                    className="w-full h-11 font-medium rounded-lg"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Ver faturas
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
