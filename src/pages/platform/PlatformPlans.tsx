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
  Plus,
  Trash2,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAllSubscriptionPlans, useUpdateSubscriptionPlan, getPlanPriceFormatted, SubscriptionPlan } from "@/hooks/useSubscriptionPlans";
import { toast } from "sonner";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Crown: <Crown className="h-5 w-5" />,
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
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Planos
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure os planos de assinatura disponíveis para as escolas
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative ${!plan.active ? "opacity-60" : ""}`}>
                <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    Popular
                  </Badge>
                )}
                
                {!plan.active && (
                  <Badge className="absolute top-4 right-4 bg-muted text-muted-foreground">
                    Inativo
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.color} text-primary-foreground`}>
                      {iconMap[plan.icon] || <Zap className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>ID: {plan.id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {editingPlan === plan.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Preço (em centavos)</Label>
                        <Input
                          type="number"
                          value={editForm.price || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          = {getPlanPriceFormatted(editForm.price || 0)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Limite de alunos</Label>
                        <Input
                          type="number"
                          value={editForm.limite_alunos || ""}
                          placeholder="Ilimitado"
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            limite_alunos: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Limite de usuários</Label>
                        <Input
                          type="number"
                          value={editForm.limite_usuarios || ""}
                          placeholder="Ilimitado"
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            limite_usuarios: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Recursos (um por linha)</Label>
                        <Textarea
                          rows={5}
                          value={(editForm.features || []).join("\n")}
                          onChange={(e) => handleFeaturesChange(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Popular</Label>
                        <Switch
                          checked={editForm.popular || false}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, popular: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Ativo</Label>
                        <Switch
                          checked={editForm.active !== false}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, active: checked }))}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleSave(plan.id)}
                          disabled={updatePlan.isPending}
                        >
                          {updatePlan.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="text-center py-2">
                        <span className="text-3xl font-bold text-foreground">
                          {getPlanPriceFormatted(plan.price)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Limite alunos:</div>
                        <div className="font-medium text-right">
                          {plan.limite_alunos || "Ilimitado"}
                        </div>
                        <div className="text-muted-foreground">Limite usuários:</div>
                        <div className="font-medium text-right">
                          {plan.limite_usuarios || "Ilimitado"}
                        </div>
                      </div>

                      <ul className="space-y-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar Plano
                      </Button>
                    </>
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
