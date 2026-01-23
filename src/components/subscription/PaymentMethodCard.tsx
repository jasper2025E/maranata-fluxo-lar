import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Check,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Card brand icons/colors - Shopify style
const cardBrandConfig: Record<string, { label: string; bgColor: string }> = {
  visa: { label: "VISA", bgColor: "bg-[#1a1f71]" },
  mastercard: { label: "MC", bgColor: "bg-[#eb001b]" },
  amex: { label: "AMEX", bgColor: "bg-[#006fcf]" },
  elo: { label: "ELO", bgColor: "bg-[#ffcb05]" },
  hipercard: { label: "HIPER", bgColor: "bg-[#b52b2b]" },
  discover: { label: "DISC", bgColor: "bg-[#ff6000]" },
  diners: { label: "DINERS", bgColor: "bg-[#0079be]" },
  jcb: { label: "JCB", bgColor: "bg-[#0b4ea2]" },
  unionpay: { label: "UP", bgColor: "bg-[#d71e28]" },
};

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last_four: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface PaymentMethodCardProps {
  tenantId: string;
  onUpdate?: () => void;
}

// Card form component inside Stripe Elements
function CardForm({ 
  tenantId, 
  clientSecret,
  onSuccess, 
  onCancel 
}: { 
  tenantId: string;
  clientSecret: string;
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error("Elemento de cartão não encontrado");
      }

      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent?.status !== "succeeded") {
        throw new Error("Não foi possível confirmar o cartão");
      }

      const { error: saveError } = await supabase.functions.invoke("stripe-save-payment-method", {
        body: {
          tenantId,
          setupIntentId: setupIntent.id,
          paymentMethodId: setupIntent.payment_method,
        },
      });

      if (saveError) {
        throw new Error(saveError.message || "Erro ao salvar cartão");
      }

      toast.success("Cartão salvo com sucesso! A cobrança automática foi ativada.");
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar cartão";
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-border rounded-lg bg-background">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "hsl(var(--foreground))",
                "::placeholder": {
                  color: "hsl(var(--muted-foreground))",
                },
              },
              invalid: {
                color: "hsl(var(--destructive))",
              },
            },
            hidePostalCode: true,
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-foreground text-background hover:bg-foreground/90"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Salvar Cartão
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Seus dados são criptografados e processados de forma segura pelo Stripe.
      </p>
    </form>
  );
}

// Main component - Shopify-style layout
export function PaymentMethodCard({ tenantId, onUpdate }: PaymentMethodCardProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [setupData, setSetupData] = useState<{
    clientSecret: string;
    stripePromise: ReturnType<typeof loadStripe>;
  } | null>(null);
  const [preparingSetup, setPreparingSetup] = useState(false);

  const fetchPaymentMethod = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_payment_methods")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_default", true)
        .maybeSingle();

      if (error) throw error;
      setPaymentMethod(data);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchPaymentMethod();
    }
  }, [tenantId]);

  const handleAddCard = async () => {
    setPreparingSetup(true);

    try {
      const { data, error } = await supabase.functions.invoke("stripe-setup-intent", {
        body: { tenantId },
      });

      if (error) throw new Error(error.message);

      if (!data?.clientSecret) {
        throw new Error("Não foi possível iniciar configuração de pagamento");
      }

      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripeKey) {
        throw new Error("Stripe não está configurado");
      }

      const stripePromise = loadStripe(stripeKey);

      setSetupData({
        clientSecret: data.clientSecret,
        stripePromise,
      });
      setShowAddCard(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar";
      toast.error(message);
    } finally {
      setPreparingSetup(false);
    }
  };

  const handleSuccess = () => {
    setShowAddCard(false);
    setSetupData(null);
    fetchPaymentMethod();
    onUpdate?.();
  };

  const brandConfig = paymentMethod 
    ? cardBrandConfig[paymentMethod.card_brand?.toLowerCase()] || { label: paymentMethod.card_brand?.toUpperCase() || "CARD", bgColor: "bg-muted-foreground" }
    : null;

  if (loading) {
    return (
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Shopify-style Payment Method Card */}
      <div className="bg-background rounded-lg border border-border">
        {/* Header */}
        <div className="p-5 pb-4">
          <h3 className="text-sm font-semibold text-foreground">Forma de pagamento</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha como você gostaria de pagar sua assinatura.
          </p>
        </div>

        {/* Payment Options */}
        <div className="px-5 pb-5">
          {/* Credit Card Option */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Main Option Row */}
            <div className="flex items-center gap-3 p-4 bg-background">
              <div className="flex items-center justify-center w-5 h-5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod ? 'border-foreground' : 'border-muted-foreground'}`}>
                  {paymentMethod && (
                    <div className="w-2 h-2 rounded-full bg-foreground" />
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                Cartão de crédito ou débito
              </span>
              {paymentMethod && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground font-medium"
                >
                  Principal
                </Badge>
              )}
            </div>

            {/* Card Details / Add Card Section */}
            {paymentMethod ? (
              <div className="px-4 py-3 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 pl-8">
                  <span 
                    className={`px-1.5 py-0.5 ${brandConfig?.bgColor} text-white text-[10px] font-bold tracking-wider rounded`}
                  >
                    {brandConfig?.label}
                  </span>
                  <span className="text-sm text-foreground">
                    {paymentMethod.card_brand?.charAt(0).toUpperCase()}{paymentMethod.card_brand?.slice(1)} com final {paymentMethod.card_last_four}
                  </span>
                </div>
                <div className="pl-8 mt-2">
                  <button 
                    onClick={handleAddCard}
                    disabled={preparingSetup}
                    className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                  >
                    {preparingSetup ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Preparando...
                      </span>
                    ) : (
                      "Substituir cartão de crédito"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-4 border-t border-border bg-muted/30">
                <div className="flex items-center justify-between pl-8">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Nenhum cartão cadastrado
                    </span>
                  </div>
                  <Button 
                    onClick={handleAddCard}
                    disabled={preparingSetup}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {preparingSetup ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Preparando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Cartão
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Success Message */}
          {paymentMethod && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                <strong>Cobrança automática ativa.</strong> Sua assinatura será renovada automaticamente 
                no dia do vencimento usando este cartão.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentMethod ? "Substituir cartão" : "Adicionar cartão de crédito"}
            </DialogTitle>
            <DialogDescription>
              {paymentMethod 
                ? "Insira os dados do novo cartão. O cartão anterior será substituído."
                : "Adicione um cartão para habilitar a cobrança automática mensal."}
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <Elements 
              stripe={setupData.stripePromise} 
              options={{ 
                clientSecret: setupData.clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <CardForm
                tenantId={tenantId}
                clientSecret={setupData.clientSecret}
                onSuccess={handleSuccess}
                onCancel={() => setShowAddCard(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}