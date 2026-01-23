import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Sparkles,
  Zap,
  Crown,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    price: 99,
    color: "from-gray-500 to-gray-600",
    icon: <Zap className="h-5 w-5" />,
    features: [
      "Até 50 alunos",
      "Gestão de faturas",
      "Relatórios básicos",
      "Suporte por email",
    ],
  },
  {
    id: "pro",
    name: "Profissional",
    price: 199,
    color: "from-primary to-primary/80",
    icon: <Sparkles className="h-5 w-5" />,
    popular: true,
    features: [
      "Até 200 alunos",
      "Integração Asaas/PIX",
      "Relatórios avançados",
      "Suporte prioritário",
      "Gestão de RH",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    color: "from-violet-500 to-purple-600",
    icon: <Crown className="h-5 w-5" />,
    features: [
      "Alunos ilimitados",
      "Todas as integrações",
      "API personalizada",
      "Suporte dedicado 24/7",
      "Treinamento incluso",
    ],
  },
];

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function UpgradePlanDialog({
  open,
  onOpenChange,
  currentPlan,
  tenantId,
  onSuccess,
}: UpgradePlanDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) {
      toast.info("Você já possui este plano");
      return;
    }

    setLoading(planId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await supabase.functions.invoke("create-subscription-checkout", {
        body: {
          tenantId,
          planId,
          successUrl: `${window.location.origin}/assinatura?success=true`,
          cancelUrl: `${window.location.origin}/assinatura?canceled=true`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar checkout");
      }

      const { url } = response.data;

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar upgrade");
    } finally {
      setLoading(null);
    }
  };

  const getPlanOrder = (planId: string) => {
    const order = { basic: 0, pro: 1, enterprise: 2 };
    return order[planId as keyof typeof order] ?? 0;
  };

  const currentPlanOrder = getPlanOrder(currentPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Alterar Plano</DialogTitle>
          <DialogDescription>
            Escolha o plano que melhor atende às necessidades da sua escola
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          {plans.map((plan, index) => {
            const planOrder = getPlanOrder(plan.id);
            const isCurrentPlan = plan.id === currentPlan;
            const isUpgrade = planOrder > currentPlanOrder;
            const isDowngrade = planOrder < currentPlanOrder;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl border-2 p-5 transition-all ${
                  isCurrentPlan
                    ? "border-primary bg-primary/5"
                    : plan.popular
                    ? "border-primary/50 hover:border-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {plan.popular && !isCurrentPlan && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}

                {isCurrentPlan && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">
                    Plano Atual
                  </Badge>
                )}

                <div className="text-center mb-4">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-3`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "secondary" : isUpgrade ? "default" : "outline"}
                  disabled={isCurrentPlan || loading !== null}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : isCurrentPlan ? (
                    "Plano Atual"
                  ) : isUpgrade ? (
                    "Fazer Upgrade"
                  ) : (
                    "Fazer Downgrade"
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💳 Pagamento seguro via Stripe. Você pode cancelar a qualquer momento.
            <br />
            A cobrança será proporcional ao tempo restante do seu plano atual.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
