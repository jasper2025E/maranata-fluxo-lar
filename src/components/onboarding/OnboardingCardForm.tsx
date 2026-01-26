import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  AlertTriangle,
  Loader2,
  Shield,
  Lock,
  CheckCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CardFormContentProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  schoolName: string;
  adminEmail: string;
  paymentIntentClientSecret: string;
  tenantId: string;
}

// Card form component inside Stripe Elements
function CardFormContent({
  onSuccess,
  onError,
  schoolName,
  adminEmail,
  paymentIntentClientSecret,
  tenantId,
}: CardFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [focused, setFocused] = useState(false);

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
        throw new Error("Elemento do cartão não encontrado");
      }

      // Use confirmCardPayment - this charges R$1.00 and saves the card
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        paymentIntentClientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: schoolName,
              email: adminEmail,
            },
          },
        }
      );

      if (confirmError) {
        // Translate Stripe errors to Portuguese
        let errorMessage = confirmError.message || "Erro ao processar pagamento";
        
        if (confirmError.code === "card_declined") {
          errorMessage = "Cartão recusado. Verifique os dados ou use outro cartão.";
        } else if (confirmError.code === "expired_card") {
          errorMessage = "Cartão expirado. Use outro cartão.";
        } else if (confirmError.code === "incorrect_cvc") {
          errorMessage = "Código de segurança incorreto.";
        } else if (confirmError.code === "incorrect_number") {
          errorMessage = "Número do cartão incorreto.";
        } else if (confirmError.code === "invalid_expiry_month" || confirmError.code === "invalid_expiry_year") {
          errorMessage = "Data de validade inválida.";
        } else if (confirmError.code === "incomplete_number") {
          errorMessage = "Número do cartão incompleto.";
        } else if (confirmError.code === "incomplete_cvc") {
          errorMessage = "Código de segurança incompleto.";
        } else if (confirmError.code === "incomplete_expiry") {
          errorMessage = "Data de validade incompleta.";
        } else if (confirmError.code === "insufficient_funds") {
          errorMessage = "Saldo insuficiente. Use outro cartão.";
        }
        
        throw new Error(errorMessage);
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error("Pagamento não foi processado. Tente novamente.");
      }

      // Complete the setup on the backend
      const { data, error: completeError } = await supabase.functions.invoke(
        "complete-card-setup",
        {
          body: {
            tenant_id: tenantId,
            payment_intent_id: paymentIntent.id,
          },
        }
      );

      if (completeError || data?.error) {
        throw new Error(data?.error || "Erro ao finalizar cadastro");
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      setError(message);
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Dados do cartão
        </label>
        <div
          className={cn(
            "relative p-4 rounded-lg border-2 transition-all bg-white",
            error
              ? "border-red-400"
              : focused
                ? "border-slate-900 shadow-sm"
                : "border-slate-200 hover:border-slate-300"
          )}
        >
          <CardElement
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) {
                setError(e.error.message);
              } else {
                setError(null);
              }
            }}
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: "400",
                  color: "#1a1a1a",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#dc2626",
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
        >
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-xs text-slate-600">14 dias grátis</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs text-slate-600">Cancele quando quiser</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || processing || !cardComplete}
        className="w-full h-12 text-base font-medium"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processando R$ 1,00...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Pagar R$ 1,00 e criar conta
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="h-3.5 w-3.5" />
        <span>Seus dados estão protegidos com criptografia SSL</span>
      </div>

      {/* R$1.00 verification charge notice */}
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-center text-sm text-amber-800">
          <strong>Taxa de verificação: R$ 1,00</strong>
          <br />
          <span className="text-xs">Será cobrado R$ 1,00 para verificar seu cartão. Após 14 dias de teste, a mensalidade do plano será cobrada automaticamente.</span>
        </p>
      </div>
    </form>
  );
}

interface OnboardingCardFormProps {
  schoolName: string;
  adminEmail: string;
  paymentIntentClientSecret: string;
  tenantId: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function OnboardingCardForm({
  schoolName,
  adminEmail,
  paymentIntentClientSecret,
  tenantId,
  onSuccess,
  onBack,
}: OnboardingCardFormProps) {
  const [stripePromise] = useState(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("Stripe publishable key not found");
      return null;
    }
    return loadStripe(key);
  });

  const handleError = (message: string) => {
    toast.error(message);
  };

  if (!stripePromise) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Configuração pendente
            </p>
            <p className="text-xs text-amber-700">
              O sistema de pagamentos não está configurado. Entre em contato com o suporte.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack} className="w-full mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Verificar cartão</h3>
          <p className="text-sm text-slate-500">Taxa de R$ 1,00 para ativação</p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <CardFormContent
          onSuccess={onSuccess}
          onError={handleError}
          schoolName={schoolName}
          adminEmail={adminEmail}
          paymentIntentClientSecret={paymentIntentClientSecret}
          tenantId={tenantId}
        />
      </Elements>

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        ← Voltar e editar dados
      </button>
    </div>
  );
}
