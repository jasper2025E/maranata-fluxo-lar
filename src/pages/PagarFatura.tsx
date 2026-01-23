import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  ChevronRight,
  Info,
  Check,
  Loader2,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface BillingCycle {
  id: string;
  created_at: string;
  amount: number;
  event_type: string;
}

interface TenantData {
  id: string;
  nome: string;
  plano: string;
  monthly_price: number | null;
  subscription_status: string;
  stripe_customer_id: string | null;
}

const planLabels: Record<string, string> = {
  basic: "Plano Básico",
  pro: "Plano Profissional",
  enterprise: "Plano Enterprise",
};

export default function PagarFatura() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [pendingCycles, setPendingCycles] = useState<BillingCycle[]>([]);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;

    try {
      // Get user's tenant
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) {
        toast.error("Dados da conta não encontrados");
        return;
      }

      // Get tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, nome, plano, monthly_price, subscription_status, stripe_customer_id")
        .eq("id", profile.tenant_id)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // Get pending billing cycles from subscription_history
      const { data: cycles, error: cyclesError } = await supabase
        .from("subscription_history")
        .select("id, created_at, amount, event_type")
        .eq("tenant_id", profile.tenant_id)
        .in("event_type", ["payment_failed", "checkout_started"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (cyclesError) throw cyclesError;
      
      // Filter only failed payments that haven't been resolved
      const pending = cycles?.filter(c => c.event_type === "payment_failed" && c.amount) || [];
      setPendingCycles(pending);

      // Calculate total due (current month + any pending)
      const monthlyPrice = tenantData?.monthly_price || 0;
      const pendingTotal = pending.reduce((sum, c) => sum + (c.amount || 0), 0);
      setTotalDue(monthlyPrice + pendingTotal);

    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast.error("Erro ao carregar dados de faturamento");
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!tenant) return;

    setProcessing(true);
    try {
      // Create checkout session for reactivation
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: {
          tenantId: tenant.id,
          planId: tenant.plano || "basic",
          successUrl: `${window.location.origin}/minha-assinatura?success=true`,
          cancelUrl: `${window.location.origin}/pagar-fatura?canceled=true`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não gerada");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentMonthPrice = tenant?.monthly_price || 0;
  const planLabel = planLabels[tenant?.plano || "basic"] || "Plano Básico";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Faturamento</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Pagar fatura</span>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            O total do seu novo ciclo de faturamento não inclui os tributos nem os créditos aplicáveis. 
            Você poderá transferir a fatura final após reabrir sua conta.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Cycle */}
            {pendingCycles.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ciclo de faturamento</p>
                      <p className="text-sm">
                        Gerado em {format(new Date(pendingCycles[0].created_at), "d 'de' MMM. 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(pendingCycles[0].amount || 0)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forma de pagamento</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escolha como você gostaria de pagar
                </p>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === "card" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/30"
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer">
                        <span>Cartão de crédito ou débito</span>
                        <Badge variant="secondary" className="text-xs">Principal</Badge>
                      </Label>
                    </div>
                  </div>

                  <div className="pl-10 py-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-medium">
                        <CreditCard className="h-3 w-3" />
                        VISA
                      </div>
                      <span>Será redirecionado para checkout seguro</span>
                    </div>
                  </div>

                  <Separator />

                  <div className={`flex items-center p-4 rounded-lg border-2 transition-colors opacity-50 ${
                    paymentMethod === "pix" 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  }`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="pix" id="pix" disabled />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-not-allowed">
                        <span className="text-muted-foreground">PIX</span>
                        <Badge variant="outline" className="text-xs">Em breve</Badge>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Plano e ciclo de faturamento</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {planLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(currentMonthPrice)} + tributo, a cada 30 dias
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-foreground">Cobranças</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cada fatura será cobrada separadamente de acordo com sua forma de pagamento.
                  </p>

                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ciclo de faturamento</span>
                      <span>{formatCurrency(currentMonthPrice)}</span>
                    </div>
                    
                    {pendingCycles.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Ciclo de faturamento: {format(new Date(pendingCycles[0].created_at), "d 'de' MMM. 'de' yyyy", { locale: ptBR })}
                        </span>
                        <span>{formatCurrency(pendingCycles[0].amount || 0)} + tributo</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Totalmente</span>
                  <span>{formatCurrency(totalDue)}</span>
                </div>

                <Button 
                  onClick={handlePayInvoice} 
                  className="w-full mt-4"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Pagar fatura"
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
                  <Shield className="h-3 w-3" />
                  <span>Pagamento seguro via Stripe</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
