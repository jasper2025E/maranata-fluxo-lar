import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Loader2,
  AlertTriangle,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubscriptionPlans, getPlanPriceFormatted } from "@/hooks/useSubscriptionPlans";

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
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Alterar plano
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Selecione o plano ideal para sua escola
            </DialogDescription>
          </DialogHeader>

          {/* Validation States */}
          {validating && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Validando dados...</span>
            </div>
          )}

          {!validating && !validation.isValid && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-medium">Dados incompletos:</span>{" "}
                {validation.missingFields.join(", ")}.{" "}
                <button 
                  onClick={handleGoToSettings}
                  className="underline hover:no-underline"
                >
                  Completar cadastro
                </button>
              </AlertDescription>
            </Alert>
          )}

          {!validating && validation.isValid && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg border border-border">
              <Check className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground">
                {validation.nome}
              </span>
              <span className="text-sm text-muted-foreground">
                • {validation.email}
              </span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className={cn(
          "p-6",
          (!validation.isValid && !validating) && "opacity-50 pointer-events-none"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, index) => {
              const planOrder = getPlanOrder(plan.id);
              const isCurrentPlan = plan.id === currentPlan;
              const isUpgrade = planOrder > currentPlanOrder;

              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrentPlan && !loading && validation.isValid && handleSelectPlan(plan.id)}
                  className={cn(
                    "relative rounded-lg border p-5 transition-all duration-200 animate-fade-in",
                    isCurrentPlan
                      ? "border-foreground bg-muted/30 cursor-default"
                      : "border-border cursor-pointer hover:border-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                  )}
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
                >
                  {/* Current Plan Indicator */}
                  {isCurrentPlan && (
                    <div className="absolute -top-2.5 left-4">
                      <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-medium rounded">
                        Plano atual
                      </span>
                    </div>
                  )}

                  {/* Plan Name */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {getPlanPriceFormatted(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Button
                    className={cn(
                      "w-full",
                      isCurrentPlan && "bg-muted text-muted-foreground hover:bg-muted cursor-default",
                      !isCurrentPlan && isUpgrade && "bg-foreground text-background hover:bg-foreground/90",
                      !isCurrentPlan && !isUpgrade && "bg-background text-foreground border border-border hover:bg-muted"
                    )}
                    disabled={isCurrentPlan || loading !== null || !validation.isValid || validating}
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      "Plano atual"
                    ) : isUpgrade ? (
                      "Fazer upgrade"
                    ) : (
                      "Fazer downgrade"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Pagamento seguro via Stripe. Cancele quando quiser. A cobrança é proporcional ao período restante.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}