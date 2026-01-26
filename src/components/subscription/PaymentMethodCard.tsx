import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Check,
  AlertTriangle,
  Loader2,
  X,
  Shield,
  RefreshCw,
  Trash2,
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { translateStripeError } from "@/lib/stripeErrors";

// Card brand icons/colors - Premium Fintech style
const cardBrandConfig: Record<string, { label: string; gradient: string; textColor: string }> = {
  visa: { label: "VISA", gradient: "from-[#1a1f71] to-[#0d47a1]", textColor: "text-white" },
  mastercard: { label: "MC", gradient: "from-[#eb001b] to-[#f79e1b]", textColor: "text-white" },
  amex: { label: "AMEX", gradient: "from-[#006fcf] to-[#00aeef]", textColor: "text-white" },
  elo: { label: "ELO", gradient: "from-[#ffcb05] to-[#ef4135]", textColor: "text-black" },
  hipercard: { label: "HIPER", gradient: "from-[#b52b2b] to-[#8b0000]", textColor: "text-white" },
  discover: { label: "DISC", gradient: "from-[#ff6000] to-[#ff8c00]", textColor: "text-white" },
  diners: { label: "DINERS", gradient: "from-[#0079be] to-[#004b87]", textColor: "text-white" },
  jcb: { label: "JCB", gradient: "from-[#0b4ea2] to-[#00a1e4]", textColor: "text-white" },
  unionpay: { label: "UP", gradient: "from-[#d71e28] to-[#01447c]", textColor: "text-white" },
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

// Card form component inside Stripe Elements - Premium Style
function CardForm({ 
  tenantId, 
  clientSecret,
  onSuccess, 
  onCancel,
  isReplacing,
}: { 
  tenantId: string;
  clientSecret: string;
  onSuccess: () => void; 
  onCancel: () => void;
  isReplacing?: boolean;
}) {
  const { t } = useTranslation();
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
        throw new Error(t("subscription.cardElementNotFound"));
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
        // Helpful debug signal (kept in console only)
        console.error("[Stripe] confirmCardSetup error", {
          code: (confirmError as any).code,
          decline_code: (confirmError as any).decline_code,
          type: (confirmError as any).type,
          message: (confirmError as any).message,
        });
        throw new Error(translateStripeError(confirmError));
      }

      if (setupIntent?.status !== "succeeded") {
        throw new Error(t("subscription.cardConfirmError"));
      }

      const { error: saveError } = await supabase.functions.invoke("stripe-save-payment-method", {
        body: {
          tenantId,
          setupIntentId: setupIntent.id,
          paymentMethodId: setupIntent.payment_method,
        },
      });

      if (saveError) {
        throw new Error(saveError.message || t("subscription.saveCardError"));
      }

      toast.success(t("subscription.cardSavedSuccess"));
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("subscription.processCardError");
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header - Clean Professional */}
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {isReplacing ? t("subscription.replaceCard") : t("subscription.addCreditCard")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isReplacing 
              ? t("subscription.enterNewCardData")
              : t("subscription.addCardDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Input - Stripe-like Clean Style */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Dados do cartão
          </label>
          <div 
            className={cn(
              "relative p-3 rounded-md border transition-all bg-background",
              error 
                ? "border-destructive" 
                : focused 
                  ? "border-foreground ring-1 ring-foreground" 
                  : "border-input hover:border-muted-foreground/50"
            )}
          >
            <CardElement
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setError(translateStripeError(e.error));
                } else {
                  setError(null);
                }
              }}
              options={{
                style: {
                  base: {
                    fontSize: "14px",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: "400",
                    color: "#1a1a1a",
                    "::placeholder": {
                      color: "#6b7280",
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
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Actions - Clean Layout */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={!stripe || processing || !cardComplete}
            className="flex-1 h-10 bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("subscription.saving")}
              </>
            ) : (
              t("subscription.saveCard")
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="h-10 px-4"
          >
            {t("common.cancel")}
          </Button>
        </div>

        {/* Security Notice - Subtle */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Shield className="h-3.5 w-3.5" />
          <span>{t("subscription.securityNotice")}</span>
        </div>
      </form>
    </div>
  );
}

// Main component - Premium Fintech layout
export function PaymentMethodCard({ tenantId, onUpdate }: PaymentMethodCardProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        throw new Error(t("subscription.setupError"));
      }

      // Prefer backend-provided publishable key
      const stripeKey = (data?.publishableKey as string | undefined) ?? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripeKey) {
        throw new Error(t("subscription.stripeNotConfigured"));
      }

      const stripePromise = loadStripe(stripeKey);

      setSetupData({
        clientSecret: data.clientSecret,
        stripePromise,
      });
      setShowAddCard(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("subscription.initError");
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

  const handleDeleteCard = async () => {
    if (!paymentMethod) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("tenant_payment_methods")
        .delete()
        .eq("id", paymentMethod.id);

      if (error) throw error;

      // Also disable auto billing on tenant
      await supabase
        .from("tenants")
        .update({ auto_billing_enabled: false })
        .eq("id", tenantId);

      setPaymentMethod(null);
      setShowDeleteConfirm(false);
      toast.success(t("subscription.cardDeletedSuccess"));
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error(t("subscription.cardDeleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const brandConfig = paymentMethod 
    ? cardBrandConfig[paymentMethod.card_brand?.toLowerCase()] || { 
        label: paymentMethod.card_brand?.toUpperCase() || "CARD", 
        gradient: "from-slate-500 to-slate-600",
        textColor: "text-white"
      }
    : null;

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-3">
          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Payment Method Card - Professional Clean Design */}
      <div className="bg-card rounded-lg border border-border">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{t("subscription.paymentMethod")}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("subscription.paymentMethodDescription")}
          </p>
        </div>

        {/* Content */}
        <div className="p-5">
          {paymentMethod ? (
            /* Card Registered State */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {/* Card Brand Badge */}
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold tracking-wider",
                  brandConfig?.gradient ? `bg-gradient-to-r ${brandConfig.gradient}` : "bg-muted",
                  brandConfig?.textColor || "text-foreground"
                )}>
                  {brandConfig?.label}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    •••• •••• •••• {paymentMethod.card_last_four}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("subscription.expires")} {String(paymentMethod.card_exp_month).padStart(2, '0')}/{paymentMethod.card_exp_year}
                  </p>
                </div>

                <Badge variant="secondary" className="text-[10px] bg-muted">
                  {t("subscription.primary")}
                </Badge>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <button 
                  onClick={handleAddCard}
                  disabled={preparingSetup}
                  className="text-sm text-primary hover:underline font-medium disabled:opacity-50 flex items-center gap-1.5"
                >
                  {preparingSetup ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("subscription.preparing")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t("subscription.replaceCard")}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-destructive hover:underline font-medium flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("subscription.deleteCard")}
                </button>
              </div>

              {/* Auto-billing notice */}
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("subscription.autoBillingActive")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("subscription.autoBillingDescription")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* No Card State */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 rounded border border-border bg-muted/50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {t("subscription.noCardRegistered")}
                </span>
              </div>
              <Button 
                onClick={handleAddCard}
                disabled={preparingSetup}
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 h-9"
              >
                {preparingSetup ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {t("subscription.preparing")}
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {t("subscription.addCard")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Card Dialog - Clean Professional Style */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-md p-5 gap-0">
          {setupData && (
            <Elements 
              stripe={setupData.stripePromise} 
              options={{ 
                clientSecret: setupData.clientSecret,
                locale: "pt-BR",
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
                isReplacing={!!paymentMethod}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Card Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("subscription.deleteCardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("subscription.deleteCardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("subscription.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("common.delete")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
