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
  Sparkles,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        throw new Error(confirmError.message);
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
          >
            <CreditCard className="h-6 w-6 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isReplacing ? t("subscription.replaceCard") : t("subscription.addCreditCard")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isReplacing 
                ? t("subscription.enterNewCardData")
                : t("subscription.addCardDescription")}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Card Input - Premium Style */}
        <div className="relative">
          <motion.div 
            animate={{ 
              boxShadow: focused 
                ? "0 0 0 3px hsl(var(--primary) / 0.1)" 
                : "0 0 0 0px transparent"
            }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-muted/20",
              error 
                ? "border-destructive/50 bg-destructive/5" 
                : cardComplete 
                  ? "border-primary/50 bg-primary/5" 
                  : "border-border hover:border-muted-foreground/30"
            )}
          >
            {/* Card Icon */}
            <div className="h-12 w-16 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]" />
              <CreditCard className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </div>
            
            <div className="flex-1">
              <CardElement
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => setCardComplete(e.complete)}
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontWeight: "500",
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

            {/* Status indicator */}
            <AnimatePresence mode="wait">
              {cardComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
            >
              <Alert variant="destructive" className="py-3 rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button - Premium Dark Style */}
        <div className="flex gap-3">
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={!stripe || processing || !cardComplete}
              className={cn(
                "w-full h-12 text-sm font-semibold rounded-xl transition-all",
                "bg-foreground text-background hover:bg-foreground/90",
                "disabled:bg-muted disabled:text-muted-foreground",
                "shadow-lg shadow-foreground/10"
              )}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("subscription.saving")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t("subscription.saveCard")}
                </span>
              )}
            </Button>
          </motion.div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="h-12 w-12 p-0 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Security Notice - Enhanced */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl py-3 px-4"
        >
          <Shield className="h-4 w-4 text-emerald-500" />
          <span>{t("subscription.securityNotice")}</span>
        </motion.div>
      </form>
    </motion.div>
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

      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Premium Payment Method Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{t("subscription.paymentMethod")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("subscription.paymentMethodDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="px-6 pb-6">
          {/* Credit Card Option */}
          <motion.div 
            whileHover={{ scale: 1.005 }}
            className="border border-border rounded-xl overflow-hidden bg-muted/20"
          >
            {/* Main Option Row */}
            <div className="flex items-center gap-4 p-4">
              <motion.div 
                animate={{ scale: paymentMethod ? 1 : 0.95 }}
                className="flex items-center justify-center w-6 h-6"
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  paymentMethod ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                )}>
                  {paymentMethod && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-primary" 
                    />
                  )}
                </div>
              </motion.div>
              <span className="text-sm font-medium text-foreground flex-1">
                {t("subscription.creditOrDebitCard")}
              </span>
              {paymentMethod && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-2.5 py-1 bg-primary/10 text-primary font-semibold"
                >
                  {t("subscription.primary")}
                </Badge>
              )}
            </div>

            {/* Card Details / Add Card Section */}
            <AnimatePresence mode="wait">
              {paymentMethod ? (
                <motion.div 
                  key="card-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-4 border-t border-border bg-background"
                >
                  <div className="flex items-center gap-3 pl-10">
                    {/* Card Brand Badge */}
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg bg-gradient-to-r text-[10px] font-bold tracking-wider shadow-sm",
                        brandConfig?.gradient,
                        brandConfig?.textColor
                      )}
                    >
                      {brandConfig?.label}
                    </motion.div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        •••• •••• •••• {paymentMethod.card_last_four}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("subscription.expires")} {String(paymentMethod.card_exp_month).padStart(2, '0')}/{paymentMethod.card_exp_year}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pl-10 mt-3 flex items-center gap-4">
                    <motion.button 
                      whileHover={{ x: 2 }}
                      onClick={handleAddCard}
                      disabled={preparingSetup}
                      className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
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
                    </motion.button>
                    <motion.button 
                      whileHover={{ x: 2 }}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-sm text-destructive hover:text-destructive/80 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("subscription.deleteCard")}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="add-card"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-4 border-t border-border bg-background"
                >
                  <div className="flex items-center justify-between pl-10">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t("subscription.noCardRegistered")}
                      </span>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleAddCard}
                        disabled={preparingSetup}
                        size="sm"
                        className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-9 px-4 font-medium shadow-sm"
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
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Success Message - Enhanced */}
          <AnimatePresence>
            {paymentMethod && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {t("subscription.autoBillingActive")}
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                    {t("subscription.autoBillingDescription")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Add Card Dialog - Premium Style */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-lg p-6 gap-0 rounded-2xl">
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
