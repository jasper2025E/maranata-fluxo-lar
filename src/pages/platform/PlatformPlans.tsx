import { useState } from "react";
import {
  Edit2,
  Save,
  X,
  Check,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAllSubscriptionPlans, useUpdateSubscriptionPlan, getPlanPriceFormatted, SubscriptionPlan } from "@/hooks/useSubscriptionPlans";

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
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Planos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure preços e recursos dos planos de assinatura
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                bg-background border rounded-lg p-5 cursor-pointer
                transition-all duration-200 ease-out
                hover:shadow-md hover:-translate-y-0.5
                ${!plan.active ? "opacity-50" : ""}
                ${plan.popular ? "border-foreground" : "border-border hover:border-foreground/50"}
              `}
            >
              {editingPlan === plan.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <Input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Preço (centavos)</Label>
                    <Input
                      type="number"
                      value={editForm.price || 0}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">
                      = {getPlanPriceFormatted(editForm.price || 0)}/mês
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Alunos</Label>
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

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Usuários</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Recursos (um por linha)</Label>
                    <Textarea
                      rows={5}
                      value={(editForm.features || []).join("\n")}
                      onChange={(e) => handleFeaturesChange(e.target.value)}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Popular</span>
                    <Switch
                      checked={editForm.popular || false}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, popular: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ativo</span>
                    <Switch
                      checked={editForm.active !== false}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, active: checked }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8"
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
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.id}</p>
                    </div>
                    {plan.popular && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                    {!plan.active && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-2xl font-semibold text-foreground">
                      {getPlanPriceFormatted(plan.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>

                  {/* Limits */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>{plan.limite_alunos || "∞"} alunos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{plan.limite_usuarios || "∞"} usuários</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(plan)}
                    className="w-full h-8 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PlatformLayout>
  );
}
