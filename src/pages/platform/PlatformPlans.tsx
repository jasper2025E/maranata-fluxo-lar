import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Sparkles,
  Crown,
  Edit2,
  Save,
  X,
  Check,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAllSubscriptionPlans, useUpdateSubscriptionPlan, getPlanPriceFormatted, SubscriptionPlan } from "@/hooks/useSubscriptionPlans";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
};

export default function PlatformPlans() {
  const { data: plans = [], isLoading, refetch } = useAllSubscriptionPlans();
  const updatePlan = useUpdateSubscriptionPlan();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setEditForm({
      name: plan.name,
      price: plan.price,
      features: plan.features,
      limite_alunos: plan.limite_alunos,
      limite_usuarios: plan.limite_usuarios,
      popular: plan.popular,
      active: plan.active,
      color: plan.color,
      icon: plan.icon,
    });
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setEditForm({});
  };

  const handleSave = async (planId: string) => {
    try {
      await updatePlan.mutateAsync({
        id: planId,
        ...editForm,
      });
      setEditingPlan(null);
      setEditForm({});
      refetch();
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  const handleFeaturesChange = (value: string) => {
    const features = value.split("\n").filter(f => f.trim() !== "");
    setEditForm(prev => ({ ...prev, features }));
  };

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Planos de assinatura
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os planos disponíveis para as escolas
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Card 
                className={`
                  relative overflow-hidden border-border/60 
                  transition-all duration-300 hover:shadow-lg hover:border-border
                  ${!plan.active ? "opacity-50" : ""}
                  ${plan.popular ? "ring-2 ring-primary/20" : ""}
                `}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                      Mais popular
                    </div>
                  </div>
                )}

                {/* Inactive Badge */}
                {!plan.active && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-3 right-3 bg-muted text-muted-foreground"
                  >
                    Inativo
                  </Badge>
                )}

                <CardContent className="p-6">
                  {editingPlan === plan.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Nome do plano
                        </Label>
                        <Input
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Preço (centavos)
                        </Label>
                        <Input
                          type="number"
                          value={editForm.price || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          Exibido como: {getPlanPriceFormatted(editForm.price || 0)}/mês
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Limite alunos
                          </Label>
                          <Input
                            type="number"
                            value={editForm.limite_alunos || ""}
                            placeholder="∞"
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              limite_alunos: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Limite usuários
                          </Label>
                          <Input
                            type="number"
                            value={editForm.limite_usuarios || ""}
                            placeholder="∞"
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              limite_usuarios: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Recursos (um por linha)
                        </Label>
                        <Textarea
                          rows={5}
                          value={(editForm.features || []).join("\n")}
                          onChange={(e) => handleFeaturesChange(e.target.value)}
                          className="text-sm resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm">Marcar como popular</Label>
                        <Switch
                          checked={editForm.popular || false}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, popular: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Label className="text-sm">Plano ativo</Label>
                        <Switch
                          checked={editForm.active !== false}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, active: checked }))}
                        />
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          className="flex-1 h-9"
                          onClick={() => handleSave(plan.id)}
                          disabled={updatePlan.isPending}
                        >
                          {updatePlan.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1.5" />
                              Salvar
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCancel}
                          className="h-9 px-3"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-5">
                      {/* Plan Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            p-2.5 rounded-xl bg-gradient-to-br ${plan.color} 
                            text-white shadow-sm
                          `}>
                            {iconMap[plan.icon] || <Zap className="h-6 w-6" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{plan.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono">{plan.id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold tracking-tight text-foreground">
                            {getPlanPriceFormatted(plan.price)}
                          </span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                      </div>

                      {/* Limits */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {plan.limite_alunos ? `${plan.limite_alunos} alunos` : "Ilimitado"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {plan.limite_usuarios ? `${plan.limite_usuarios} usuários` : "Ilimitado"}
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 pt-2">
                        {plan.features.map((feature, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-2.5 text-sm text-muted-foreground"
                          >
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 h-9 text-sm font-medium"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Editar plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </PlatformLayout>
  );
}
