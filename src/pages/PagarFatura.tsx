import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  ChevronRight,
  Info,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) {
        toast.error("Dados da conta não encontrados");
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, nome, plano, monthly_price, subscription_status, stripe_customer_id")
        .eq("id", profile.tenant_id)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      const { data: cycles, error: cyclesError } = await supabase
        .from("subscription_history")
        .select("id, created_at, amount, event_type")
        .eq("tenant_id", profile.tenant_id)
        .in("event_type", ["payment_failed", "checkout_started"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (cyclesError) throw cyclesError;
      
      const pending = cycles?.filter(c => c.event_type === "payment_failed" && c.amount) || [];
      setPendingCycles(pending);

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
      <div className="min-h-screen bg-[#f6f6f7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentMonthPrice = tenant?.monthly_price || 0;
  const planLabel = planLabels[tenant?.plano || "basic"] || "Plano Básico";
  const billingDate = pendingCycles.length > 0 
    ? format(new Date(pendingCycles[0].created_at), "d 'de' MMM. 'de' yyyy", { locale: ptBR })
    : format(new Date(), "d 'de' MMM. 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Pagar fatura</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[#ebf5fa] border border-[#b8dff5] mb-8">
          <Info className="h-5 w-5 text-[#0077b3] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#003c5a] leading-relaxed">
            O total do seu novo ciclo de faturamento ({billingDate}) não inclui os tributos nem os créditos aplicáveis. 
            Você poderá transferir a fatura final após reabrir sua loja.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Billing Cycle Card */}
            <div className="bg-background rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between p-5">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-medium text-foreground">Ciclo de faturamento</span>
                    <span className="text-sm text-muted-foreground">
                      Gerado em {billingDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(pendingCycles[0]?.amount || currentMonthPrice)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-background rounded-xl border border-border shadow-sm">
              <div className="p-5 pb-3">
                <h2 className="text-base font-semibold text-foreground">Forma de pagamento</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha como você gostaria de pagar no Maranata.
                </p>
              </div>

              <div className="px-5 pb-5">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-0">
                  {/* Credit Card Option */}
                  <div className="border border-border rounded-lg">
                    <div className={`flex items-center gap-3 p-4 cursor-pointer transition-colors rounded-t-lg ${
                      paymentMethod === "card" ? "bg-muted/50" : "hover:bg-muted/30"
                    }`}>
                      <RadioGroupItem value="card" id="card" className="border-2" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <span className="text-sm font-medium text-foreground">Cartão de crédito ou débito</span>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground font-medium rounded"
                        >
                          Principal
                        </Badge>
                      </Label>
                    </div>

                    {/* Card Details */}
                    <div className="px-4 py-3 border-t border-border bg-muted/20">
                      <div className="flex items-center gap-2 pl-7">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1f71] text-white rounded text-[10px] font-bold tracking-wider">
                          VISA
                        </div>
                        <span className="text-sm text-muted-foreground">Visa com final 4513</span>
                      </div>
                      <div className="pl-7 mt-2">
                        <button className="text-sm text-primary hover:underline font-medium">
                          Substituir cartão de crédito
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PIX Option */}
                  <div className="border border-border rounded-lg mt-3">
                    <div className={`flex items-center gap-3 p-4 cursor-not-allowed transition-colors rounded-lg opacity-60 ${
                      paymentMethod === "pix" ? "bg-muted/50" : ""
                    }`}>
                      <RadioGroupItem value="pix" id="pix" disabled className="border-2" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-not-allowed flex-1">
                        <span className="text-sm font-medium text-muted-foreground">PIX</span>
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-2 py-0.5 font-medium rounded border-muted-foreground/30 text-muted-foreground"
                        >
                          Em breve
                        </Badge>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-xl border border-border shadow-sm sticky top-6">
              <div className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-5">Resumo</h2>

                {/* Plan Info */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-foreground mb-1">Plano e ciclo de faturamento</p>
                  <p className="text-sm text-muted-foreground">{planLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(currentMonthPrice)} + tributo, a cada 30 dias
                  </p>
                </div>

                {/* Charges */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-foreground mb-1">Cobranças</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Cada fatura será cobrada separadamente de acordo com sua forma de pagamento.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ciclo de faturamento</span>
                      <span className="text-sm text-foreground">{formatCurrency(currentMonthPrice)}</span>
                    </div>
                    
                    {pendingCycles.length > 0 && (
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-muted-foreground">
                          <span>Ciclo de faturamento: {format(new Date(pendingCycles[0].created_at), "d", { locale: ptBR })}</span>
                          <br />
                          <span>de {format(new Date(pendingCycles[0].created_at), "MMM. 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                        <span className="text-sm text-foreground">
                          {formatCurrency(pendingCycles[0].amount || 0)} + tributo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-5" />

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-semibold text-foreground">Totalmente</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(totalDue)}</span>
                </div>

                {/* Pay Button */}
                <Button 
                  onClick={handlePayInvoice} 
                  className="w-full h-11 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium rounded-lg transition-colors"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
