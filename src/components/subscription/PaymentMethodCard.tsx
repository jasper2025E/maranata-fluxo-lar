import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Check,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
} from "lucide-react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Card brand icons/colors
const cardBrandConfig: Record<string, { label: string; color: string }> = {
  visa: { label: "Visa", color: "bg-blue-600" },
  mastercard: { label: "Mastercard", color: "bg-orange-500" },
  amex: { label: "American Express", color: "bg-blue-500" },
  elo: { label: "Elo", color: "bg-yellow-500" },
  hipercard: { label: "Hipercard", color: "bg-red-600" },
  discover: { label: "Discover", color: "bg-orange-600" },
  diners: { label: "Diners Club", color: "bg-gray-600" },
  jcb: { label: "JCB", color: "bg-green-600" },
  unionpay: { label: "UnionPay", color: "bg-red-500" },
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

      // Confirm SetupIntent with card details
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

      // Save payment method to backend
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

      toast.success("Cartão salvo com sucesso!");
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
      <div className="p-4 border rounded-lg bg-background">
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
          className="flex-1"
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

// Main component
export function PaymentMethodCard({ tenantId, onUpdate }: PaymentMethodCardProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [setupData, setSetupData] = useState<{
    clientSecret: string;
    stripePromise: ReturnType<typeof loadStripe>;
  } | null>(null);
  const [preparingSetup, setPreparingSetup] = useState(false);

  // Fetch saved payment method
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
      // Create SetupIntent
      const { data, error } = await supabase.functions.invoke("stripe-setup-intent", {
        body: { tenantId },
      });

      if (error) throw new Error(error.message);

      if (!data?.clientSecret) {
        throw new Error("Não foi possível iniciar configuração de pagamento");
      }

      // Get Stripe publishable key
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
    ? cardBrandConfig[paymentMethod.card_brand] || { label: paymentMethod.card_brand, color: "bg-gray-500" }
    : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Forma de pagamento
          </CardTitle>
          <CardDescription>
            Escolha como você gostaria de pagar sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethod ? (
            // Show saved card
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-primary rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="radio"
                        checked
                        readOnly
                        className="h-4 w-4 text-primary"
                      />
                    </div>
                    <span className="font-medium text-foreground">
                      Cartão de crédito ou débito
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 ml-6 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-bold text-white uppercase ${brandConfig?.color}`}>
                    {brandConfig?.label}
                  </div>
                  <span className="text-foreground">
                    {brandConfig?.label} com final {paymentMethod.card_last_four}
                  </span>
                </div>
                <button
                  onClick={handleAddCard}
                  disabled={preparingSetup}
                  className="mt-2 text-sm text-primary hover:underline disabled:opacity-50"
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

              <p className="mt-3 ml-6 text-xs text-muted-foreground">
                Expira em {paymentMethod.card_exp_month.toString().padStart(2, "0")}/{paymentMethod.card_exp_year}
              </p>
            </motion.div>
          ) : (
            // No card saved
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center"
            >
              <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Nenhum cartão cadastrado para cobrança automática
              </p>
              <Button onClick={handleAddCard} disabled={preparingSetup}>
                {preparingSetup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cartão
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {paymentMethod && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
              <Check className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                <strong>Cobrança automática ativa.</strong> Sua assinatura será renovada automaticamente 
                usando este cartão.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentMethod ? "Substituir cartão" : "Adicionar cartão"}
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
