import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
  Filter,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: escola } = useEscola();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

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
        setTenantId(profile?.tenant_id ?? null);
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
      // Fetch tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, nome, plano, email, cnpj, subscription_status, monthly_price, subscription_started_at")
        .eq("id", tenantId)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // Fetch all subscription events
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

  const filteredEvents = filterType === "all" 
    ? events 
    : filterType === "payments"
    ? paymentEvents
    : events.filter(e => e.event_type === filterType);

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
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
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
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Faturas da Assinatura
            </h2>
            <p className="text-muted-foreground mt-1">
              Histórico de pagamentos e recibos do seu plano
            </p>
          </div>
          <Button onClick={handleDownloadHistory} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Histórico
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {planLabels[tenant.plano] || tenant.plano}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(tenant.monthly_price || 0)}/mês
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalPago)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {paymentEvents.length} pagamentos
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assinante Desde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {tenant.subscription_started_at 
                    ? format(new Date(tenant.subscription_started_at), "MMM yyyy", { locale: ptBR })
                    : "-"
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {tenant.subscription_started_at 
                    ? formatDistanceToNow(new Date(tenant.subscription_started_at), { addSuffix: true, locale: ptBR })
                    : "Não iniciada"
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="payments" className="gap-2">
                <Receipt className="h-4 w-4" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <FileText className="h-4 w-4" />
                Histórico Completo
              </TabsTrigger>
            </TabsList>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                <SelectItem value="payments">Apenas pagamentos</SelectItem>
                <SelectItem value="activated">Ativações</SelectItem>
                <SelectItem value="subscription_updated">Atualizações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Pagamentos Recebidos
                </CardTitle>
                <CardDescription>
                  Histórico de pagamentos da sua assinatura com opção de download
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentEvents.map((event, index) => {
                        const config = eventConfig[event.event_type] || eventConfig.payment_received;
                        return (
                          <motion.tr
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group"
                          >
                            <TableCell className="font-medium">
                              {format(new Date(event.created_at), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={config.color}>{config.icon}</span>
                                {config.label}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(event.amount || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Pago
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadInvoice(event)}
                                disabled={downloadingId === event.id}
                                className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Download className="h-4 w-4" />
                                PDF
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Histórico Completo
                </CardTitle>
                <CardDescription>
                  Todos os eventos relacionados à sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum evento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((event, index) => {
                      const config = eventConfig[event.event_type] || {
                        label: event.event_type,
                        icon: <ChevronRight className="h-4 w-4" />,
                        color: "text-muted-foreground"
                      };

                      return (
                        <motion.div
                          key={`${event.id}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className={`p-2 bg-background rounded-lg shadow-sm ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{config.label}</p>
                            {event.amount && event.amount > 0 && (
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(event.amount)}
                              </p>
                            )}
                            {event.metadata && typeof event.metadata === 'object' && 'message' in event.metadata && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {String(event.metadata.message)}
                              </p>
                            )}
                            {event.new_status && (
                              <Badge variant="outline" className="mt-2">
                                Status: {event.new_status}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.created_at), "dd/MM/yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {format(new Date(event.created_at), "HH:mm")}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
