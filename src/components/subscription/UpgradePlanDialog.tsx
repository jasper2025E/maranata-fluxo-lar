import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Sparkles,
  Zap,
  Crown,
  Loader2,
  AlertTriangle,
  Mail,
  Building2,
  ExternalLink,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubscriptionPlans, getPlanPriceFormatted, SubscriptionPlan } from "@/hooks/useSubscriptionPlans";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Crown: <Crown className="h-5 w-5" />,
};

interface TenantValidation {
  isValid: boolean;
  missingFields: string[];
  email: string | null;
  cnpj: string | null;
  nome: string | null;
}

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
  const navigate = useNavigate();
  const { data: plans = [], isLoading: loadingPlans } = useSubscriptionPlans();
  const [loading, setLoading] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [validation, setValidation] = useState<TenantValidation>({
    isValid: false,
    missingFields: [],
    email: null,
    cnpj: null,
    nome: null,
  });

  // Validate tenant data when dialog opens
  useEffect(() => {
    if (open && tenantId) {
      validateTenantData();
    }
  }, [open, tenantId]);

  const validateTenantData = async () => {
    setValidating(true);
    try {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("nome, email, cnpj")
        .eq("id", tenantId)
        .single();

      if (error) {
        console.error("Erro ao validar tenant:", error);
        setValidation({
          isValid: false,
          missingFields: ["Erro ao carregar dados"],
          email: null,
          cnpj: null,
          nome: null,
        });
        return;
      }

      const missingFields: string[] = [];

      if (!tenant?.email || tenant.email.trim() === "") {
        missingFields.push("Email da escola");
      }

      if (!tenant?.cnpj || tenant.cnpj.trim() === "") {
        missingFields.push("CNPJ da escola");
      }

      if (!tenant?.nome || tenant.nome.trim() === "") {
        missingFields.push("Nome da escola");
      }

      setValidation({
        isValid: missingFields.length === 0,
        missingFields,
        email: tenant?.email || null,
        cnpj: tenant?.cnpj || null,
        nome: tenant?.nome || null,
      });
    } catch (error) {
      console.error("Erro na validação:", error);
      setValidation({
        isValid: false,
        missingFields: ["Erro ao validar dados"],
        email: null,
        cnpj: null,
        nome: null,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) {
      toast.info("Você já possui este plano");
      return;
    }

    if (!validation.isValid) {
      toast.error("Complete os dados obrigatórios antes de continuar");
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

      const { url, error: checkoutError } = response.data;

      if (checkoutError) {
        throw new Error(checkoutError);
      }

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

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate("/escola");
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

        {/* Validation Alert */}
        {!validating && !validation.isValid && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Dados incompletos</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Para prosseguir com a assinatura, é necessário preencher os seguintes dados da escola:
              </p>
              <ul className="space-y-2 mb-4">
                {validation.missingFields.map((field, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    {field.includes("Email") ? (
                      <Mail className="h-4 w-4" />
                    ) : field.includes("CNPJ") ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {field}
                  </li>
                ))}
              </ul>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2"
                onClick={handleGoToSettings}
              >
                <ExternalLink className="h-4 w-4" />
                Ir para Dados da Escola
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Success */}
        {!validating && validation.isValid && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg my-4">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm">
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                Dados validados!
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                {validation.nome} • {validation.email}
              </span>
            </div>
          </div>
        )}

        {/* Loading validation state */}
        {validating && (
          <div className="flex items-center justify-center gap-2 p-4 my-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Validando dados...</span>
          </div>
        )}

        <div className={cn(
          "grid gap-4 md:grid-cols-3 mt-4",
          (!validation.isValid && !validating) && "opacity-50 pointer-events-none"
        )}>
          {plans.map((plan, index) => {
            const planOrder = getPlanOrder(plan.id);
            const isCurrentPlan = plan.id === currentPlan;
            const isUpgrade = planOrder > currentPlanOrder;

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
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} text-primary-foreground mb-3`}
                  >
                    {iconMap[plan.icon] || <Zap className="h-5 w-5" />}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">
                      {getPlanPriceFormatted(plan.price)}
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
                  disabled={isCurrentPlan || loading !== null || !validation.isValid || validating}
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
