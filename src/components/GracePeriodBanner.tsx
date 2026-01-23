import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStatus } from "@/hooks/useTenant";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function GracePeriodBanner() {
  const subscriptionStatus = useSubscriptionStatus();
  const [dismissed, setDismissed] = useState(false);

  // Only show for past_due status with grace period
  if (!subscriptionStatus?.isPastDue || !subscriptionStatus.gracePeriodEndsAt || dismissed) {
    return null;
  }

  const now = new Date();
  const daysLeft = Math.ceil(
    (subscriptionStatus.gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-amber-500 text-white px-4 py-3"
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              <strong>Pagamento pendente:</strong> Você tem{" "}
              <span className="font-bold">{daysLeft} {daysLeft === 1 ? "dia" : "dias"}</span>{" "}
              para regularizar sua assinatura (até {formatDate(subscriptionStatus.gracePeriodEndsAt)}).
              Após esse período, o acesso será suspenso.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              className="bg-white text-amber-700 hover:bg-amber-50"
            >
              Regularizar
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-amber-600"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
