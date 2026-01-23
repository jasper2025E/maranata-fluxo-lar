import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useEscola } from "@/hooks/useEscola";
import { 
  generateSubscriptionInvoicePDF, 
  generateSubscriptionHistoryPDF 
} from "@/lib/subscriptionPdfGenerator";
import { toast } from "sonner";

interface SubscriptionEvent {
  id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  amount: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  stripe_event_id: string | null;
}

interface TenantData {
  id: string;
  nome: string;
  plano: string;
  email: string | null;
  cnpj: string | null;
  subscription_status: string;
  monthly_price: number | null;
  subscription_started_at: string | null;
}

const eventConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { 
    label: "Conta Criada", 
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-blue-500"
  },
  activated: { 
    label: "Assinatura Ativada", 
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-emerald-500"
  },
  payment_received: { 
    label: "Pagamento Recebido", 
    icon: <Receipt className="h-4 w-4" />,
    color: "text-emerald-500"
  },
  payment_failed: { 
    label: "Falha no Pagamento", 
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-amber-500"
  },
  subscription_updated: { 
    label: "Plano Atualizado", 
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-primary"
  },
  subscription_cancelled: { 
    label: "Assinatura Cancelada", 
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-500"
  },
  suspended: { 
    label: "Assinatura Suspensa", 
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-500"
  },
  reactivated: { 
    label: "Assinatura Reativada", 
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-emerald-500"
  },
  checkout_started: { 
    label: "Checkout Iniciado", 
    icon: <Clock className="h-4 w-4" />,
    color: "text-muted-foreground"
  },
  trial_started: { 
    label: "Período de Teste", 
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-500"
  },
};

const planLabels: Record<string, string> = {
  basic: "Básico",
  pro: "Profissional",
  enterprise: "Enterprise",
};

export default function FaturasAssinatura() {
  const { user, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: escola } = useEscola();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportingHistory, setExportingHistory] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (isPlatformAdmin()) {
      navigate("/platform/subscriptions");
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
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    if (!tenantId) return;

    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, nome, plano, email, cnpj, subscription_status, monthly_price, subscription_started_at")
        .eq("id", tenantId)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;
      setEvents((eventsData || []) as SubscriptionEvent[]);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const paymentEvents = events.filter(
    e => e.event_type === "payment_received" || e.event_type === "activated"
  );

  const totalPago = paymentEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleDownloadInvoice = async (event: SubscriptionEvent) => {
    if (!tenant) return;
    
    setDownloadingId(event.id);
    try {
      await generateSubscriptionInvoicePDF(
        {
          id: event.id,
          event_type: event.event_type,
          amount: event.amount,
          created_at: event.created_at,
          metadata: event.metadata,
          new_status: event.new_status,
        },
        {
          nome: tenant.nome,
          plano: tenant.plano,
          email: tenant.email || undefined,
          cnpj: tenant.cnpj || undefined,
        },
        escola ? {
          nome: escola.nome || tenant.nome,
          cnpj: escola.cnpj || undefined,
          endereco: escola.endereco || undefined,
          telefone: escola.telefone || undefined,
          email: escola.email || undefined,
        } : undefined
      );
      toast.success("Recibo baixado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadHistory = async () => {
    if (!tenant) return;

    setExportingHistory(true);
    try {
      await generateSubscriptionHistoryPDF(
        events.map(e => ({
          id: e.id,
          event_type: e.event_type,
          amount: e.amount,
          created_at: e.created_at,
          metadata: e.metadata,
          new_status: e.new_status,
        })),
        {
          nome: tenant.nome,
          plano: tenant.plano,
          email: tenant.email || undefined,
          cnpj: tenant.cnpj || undefined,
        },
        escola ? {
          nome: escola.nome || tenant.nome,
          cnpj: escola.cnpj || undefined,
          endereco: escola.endereco || undefined,
          telefone: escola.telefone || undefined,
          email: escola.email || undefined,
        } : undefined
      );
      toast.success("Histórico exportado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExportingHistory(false);
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

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Dados não disponíveis</h2>
          <p className="text-muted-foreground mt-2">
            Não foi possível carregar os dados da assinatura.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Shopify-style layout */}
      <div className="min-h-screen bg-[#f6f6f7]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <button 
              onClick={() => navigate("/assinatura")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-muted-foreground">Assinatura</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground font-medium">Faturas</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-foreground">Faturas da Assinatura</h1>
            <button
              onClick={handleDownloadHistory}
              disabled={exportingHistory}
              className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
            >
              {exportingHistory ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Exportando...
                </span>
              ) : (
                "Exportar histórico"
              )}
            </button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Payments Card */}
              <div className="bg-background rounded-lg border border-border">
                <div className="p-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Pagamentos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Histórico de pagamentos da sua assinatura
                  </p>
                </div>

                {paymentEvents.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {paymentEvents.map((event) => {
                      const config = eventConfig[event.event_type] || eventConfig.payment_received;
                      return (
                        <div 
                          key={event.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-muted/50 rounded-lg ${config.color}`}>
                              {config.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{config.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(event.amount || 0)}
                              </p>
                              <Badge 
                                variant="secondary" 
                                className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              >
                                Pago
                              </Badge>
                            </div>
                            <button
                              onClick={() => handleDownloadInvoice(event)}
                              disabled={downloadingId === event.id}
                              className="text-sm text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                              {downloadingId === event.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Events Card */}
              <div className="bg-background rounded-lg border border-border">
                <div className="p-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Histórico completo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os eventos da sua assinatura
                  </p>
                </div>

                {events.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events.map((event) => {
                      const config = eventConfig[event.event_type] || {
                        label: event.event_type,
                        icon: <ChevronRight className="h-4 w-4" />,
                        color: "text-muted-foreground"
                      };

                      return (
                        <div 
                          key={event.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-muted/50 rounded-lg ${config.color}`}>
                              {config.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{config.label}</p>
                              {event.new_status && (
                                <Badge variant="outline" className="text-[10px] mt-1">
                                  {event.new_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {event.amount && event.amount > 0 && (
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(event.amount)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-background rounded-lg border border-border sticky top-6">
                <div className="p-5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Resumo</h3>
                </div>

                <div className="p-5 space-y-4">
                  {/* Plan */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Plano atual</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {planLabels[tenant.plano] || tenant.plano}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(tenant.monthly_price || 0)}/mês
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total pago</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatCurrency(totalPago)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paymentEvents.length} pagamento{paymentEvents.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {tenant.subscription_started_at && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Assinante desde</p>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {format(new Date(tenant.subscription_started_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tenant.subscription_started_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-border">
                  <Button 
                    onClick={() => navigate("/assinatura")}
                    className="w-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    Voltar para Assinatura
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}