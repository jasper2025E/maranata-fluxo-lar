import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Building2, 
  Save, 
  CreditCard,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Users,
  GraduationCap,
  DollarSign,
  History,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Tables } from "@/integrations/supabase/types";

type Tenant = Tables<"tenants">;
type SubscriptionHistory = Tables<"subscription_history">;
type AuditLog = Tables<"audit_logs">;

interface TenantFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  plano: string;
  status: string;
  limite_alunos: number;
  limite_usuarios: number;
  monthly_price: number;
  subscription_status: string;
  // Subscription dates
  subscription_started_at: string;
  subscription_ends_at: string;
  trial_ends_at: string;
  grace_period_ends_at: string;
  next_billing_date: string;
  billing_day: number;
}

export default function TenantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [form, setForm] = useState<TenantFormData>({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    plano: "basic",
    status: "ativo",
    limite_alunos: 100,
    limite_usuarios: 5,
    monthly_price: 0,
    subscription_status: "trial",
    subscription_started_at: "",
    subscription_ends_at: "",
    trial_ends_at: "",
    grace_period_ends_at: "",
    next_billing_date: "",
    billing_day: 1,
  });

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    if (id) {
      fetchTenantData();
    }
  }, [isPlatformAdmin, navigate, id]);

  const fetchTenantData = async () => {
    setLoading(true);
    try {
      // Fetch tenant, subscription history and audit logs in parallel
      const [tenantRes, historyRes, logsRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", id).single(),
        supabase.from("subscription_history").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("audit_logs").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(50),
      ]);

      if (tenantRes.error) throw tenantRes.error;

      const tenantData = tenantRes.data;
      setTenant(tenantData);
      setForm({
        nome: tenantData.nome,
        cnpj: tenantData.cnpj || "",
        email: tenantData.email || "",
        telefone: tenantData.telefone || "",
        endereco: tenantData.endereco || "",
        plano: tenantData.plano || "basic",
        status: tenantData.status || "ativo",
        limite_alunos: tenantData.limite_alunos || 100,
        limite_usuarios: tenantData.limite_usuarios || 5,
        monthly_price: tenantData.monthly_price || 0,
        subscription_status: tenantData.subscription_status || "trial",
        subscription_started_at: tenantData.subscription_started_at || "",
        subscription_ends_at: tenantData.subscription_ends_at || "",
        trial_ends_at: tenantData.trial_ends_at || "",
        grace_period_ends_at: tenantData.grace_period_ends_at || "",
        next_billing_date: tenantData.next_billing_date || "",
        billing_day: tenantData.billing_day || 1,
      });

      setSubscriptionHistory(historyRes.data || []);
      setAuditLogs(logsRes.data || []);
    } catch (error) {
      console.error("Error fetching tenant data:", error);
      toast.error("Erro ao carregar dados da escola");
      navigate("/platform/tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          nome: form.nome,
          cnpj: form.cnpj || null,
          email: form.email || null,
          telefone: form.telefone || null,
          endereco: form.endereco || null,
          plano: form.plano,
          status: form.status,
          limite_alunos: form.limite_alunos,
          limite_usuarios: form.limite_usuarios,
          monthly_price: form.monthly_price,
          subscription_status: form.subscription_status as any,
          subscription_started_at: form.subscription_started_at || null,
          subscription_ends_at: form.subscription_ends_at || null,
          trial_ends_at: form.trial_ends_at || null,
          grace_period_ends_at: form.grace_period_ends_at || null,
          next_billing_date: form.next_billing_date || null,
          billing_day: form.billing_day || null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Escola atualizada com sucesso");
      fetchTenantData();
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("Erro ao salvar escola");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncStripe = async () => {
    if (!id) {
      toast.error("ID do tenant não encontrado");
      return;
    }

    setSyncing(true);
    try {
      // First save local changes
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);

      // Then sync with Stripe
      const { data, error } = await supabase.functions.invoke("sync-tenant-subscription", {
        body: {
          tenantId: id,
          action: form.subscription_status === "cancelled" ? "cancel" : "update_plan",
        },
      });

      if (error) throw error;

      if (data?.actions?.length > 0) {
        data.actions.forEach((action: { type: string; message: string }) => {
          if (action.type === "success") {
            toast.success(action.message);
          } else if (action.type === "warning") {
            toast.warning(action.message);
          } else {
            toast.info(action.message);
          }
        });
      } else {
        toast.info("Nenhuma ação necessária - tenant não possui assinatura Stripe ativa");
      }

      // Reload data
      await fetchTenantData();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao sincronizar com Stripe");
    } finally {
      setSyncing(false);
    }
  };

  const getSubscriptionStatusBadge = (status: string | null) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      trial: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: "Período de teste" },
      active: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, label: "Ativa" },
      past_due: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, label: "Atrasada" },
      cancelled: { variant: "outline", icon: <XCircle className="h-3 w-3" />, label: "Cancelada" },
      suspended: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, label: "Suspensa" },
    };
    const config = variants[status || "trial"] || variants.trial;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      created: "Criação",
      activated: "Ativação",
      trial_started: "Início do teste",
      trial_ended: "Fim do teste",
      payment_received: "Pagamento recebido",
      payment_failed: "Pagamento falhou",
      subscription_updated: "Assinatura atualizada",
      subscription_cancelled: "Assinatura cancelada",
      suspended: "Suspensa",
      reactivated: "Reativada",
    };
    return labels[eventType] || eventType;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      INSERT: { label: "Criação", color: "text-green-600" },
      UPDATE: { label: "Atualização", color: "text-blue-600" },
      DELETE: { label: "Exclusão", color: "text-red-600" },
    };
    return labels[action] || { label: action, color: "text-muted-foreground" };
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </PlatformLayout>
    );
  }

  if (!tenant) {
    return (
      <PlatformLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Escola não encontrada</h2>
          <p className="text-muted-foreground mt-2">A escola solicitada não existe ou foi removida.</p>
          <Button onClick={() => navigate("/platform/tenants")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/platform/tenants")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{tenant.nome}</h1>
                <p className="text-muted-foreground text-sm">
                  {tenant.cnpj || "CNPJ não informado"} • Criado em {format(new Date(tenant.created_at || ""), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSubscriptionStatusBadge(tenant.subscription_status)}
            <Button variant="outline" size="sm" onClick={fetchTenantData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="bg-card border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mensalidade</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {(tenant.monthly_price || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Limite de alunos</p>
                                <p className="text-xl font-bold text-foreground">{tenant.limite_alunos}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Limite de usuários</p>
                                <p className="text-xl font-bold text-foreground">{tenant.limite_usuarios}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card border">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Plano</p>
                                <p className="text-xl font-bold text-foreground capitalize">{tenant.plano}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dados da Escola
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Assinatura
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Atividade
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="details" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <form onSubmit={handleSubmit}>
                    <Card className="bg-card border">
                      <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Informações da Escola
                        </CardTitle>
                        <CardDescription>
                          Atualize os dados cadastrais da escola
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Nome *</Label>
                            <Input
                              value={form.nome}
                              onChange={(e) => setForm({ ...form, nome: e.target.value })}
                              placeholder="Nome da escola"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CNPJ</Label>
                            <Input
                              value={form.cnpj}
                              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                              placeholder="00.000.000/0000-00"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                              placeholder="email@escola.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input
                              value={form.telefone}
                              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Endereço</Label>
                          <Input
                            value={form.endereco}
                            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                            placeholder="Endereço completo"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Plano</Label>
                            <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                                <SelectItem value="suspenso">Suspenso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Limite de Alunos</Label>
                            <Input
                              type="number"
                              value={form.limite_alunos}
                              onChange={(e) => setForm({ ...form, limite_alunos: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Limite de Usuários</Label>
                            <Input
                              type="number"
                              value={form.limite_usuarios}
                              onChange={(e) => setForm({ ...form, limite_usuarios: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Mensalidade (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={form.monthly_price}
                              onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/platform/tenants")}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Salvando..." : "Salvar alterações"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </form>
                </motion.div>
              </TabsContent>

              <TabsContent value="subscription" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Subscription Status Card */}
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Configuração da Assinatura
                      </CardTitle>
                      <CardDescription>
                        Edite plano, datas e status da assinatura
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Status & Plano */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Status da assinatura</Label>
                          <Select 
                            value={form.subscription_status} 
                            onValueChange={(v) => setForm({ ...form, subscription_status: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trial">Período de teste</SelectItem>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="past_due">Atrasada</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                              <SelectItem value="suspended">Suspensa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Plano</Label>
                          <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Mensalidade (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.monthly_price}
                            onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      {/* Datas de Assinatura */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-foreground mb-4">Datas da Assinatura</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Início da assinatura</Label>
                            <Input
                              type="date"
                              value={form.subscription_started_at ? form.subscription_started_at.split('T')[0] : ""}
                              onChange={(e) => setForm({ ...form, subscription_started_at: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Término da assinatura</Label>
                            <Input
                              type="date"
                              value={form.subscription_ends_at ? form.subscription_ends_at.split('T')[0] : ""}
                              onChange={(e) => setForm({ ...form, subscription_ends_at: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fim do período de teste</Label>
                            <Input
                              type="date"
                              value={form.trial_ends_at ? form.trial_ends_at.split('T')[0] : ""}
                              onChange={(e) => setForm({ ...form, trial_ends_at: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fim do período de carência</Label>
                            <Input
                              type="date"
                              value={form.grace_period_ends_at ? form.grace_period_ends_at.split('T')[0] : ""}
                              onChange={(e) => setForm({ ...form, grace_period_ends_at: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Faturamento */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-foreground mb-4">Configuração de Faturamento</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Próxima data de cobrança</Label>
                            <Input
                              type="date"
                              value={form.next_billing_date ? form.next_billing_date.split('T')[0] : ""}
                              onChange={(e) => setForm({ ...form, next_billing_date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dia de faturamento (1-28)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={28}
                              value={form.billing_day}
                              onChange={(e) => setForm({ ...form, billing_day: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Info adicional (read-only) */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-foreground mb-4">Informações do Stripe</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                            <span className="text-sm text-muted-foreground">Stripe Customer ID</span>
                            <span className="font-mono text-sm">
                              {tenant.stripe_customer_id || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                            <span className="text-sm text-muted-foreground">Stripe Subscription ID</span>
                            <span className="font-mono text-sm">
                              {tenant.stripe_subscription_id || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSyncStripe}
                          disabled={syncing}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                          {syncing ? "Sincronizando..." : "Sincronizar com Stripe"}
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription History */}
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Assinatura
                      </CardTitle>
                      <CardDescription>
                        Eventos e alterações na assinatura
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscriptionHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p>Nenhum evento registrado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {subscriptionHistory.map((event, index) => (
                            <motion.div
                              key={`${event.id}-${index}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30"
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">
                                  {getEventTypeLabel(event.event_type)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(event.created_at || ""), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {event.old_status && event.new_status && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.old_status} → {event.new_status}
                                  </p>
                                )}
                                {event.amount && (
                                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                                    R$ {event.amount.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Logs de Atividade
                      </CardTitle>
                      <CardDescription>
                        Histórico de alterações e ações nesta escola
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {auditLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p>Nenhuma atividade registrada</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {auditLogs.map((log, index) => {
                            const actionInfo = getActionLabel(log.acao);
                            return (
                              <motion.div
                                key={`${log.id}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${actionInfo.color}`}>
                                      {actionInfo.label}
                                    </span>
                                    <span className="text-muted-foreground">em</span>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {log.tabela}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {format(new Date(log.created_at || ""), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
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
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}