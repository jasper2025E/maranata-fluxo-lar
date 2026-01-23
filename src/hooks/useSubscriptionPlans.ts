import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // In cents
  features: string[];
  limite_alunos: number | null;
  limite_usuarios: number | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  popular: boolean;
  active: boolean;
  display_order: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching subscription plans:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAllSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans", "all"],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching all subscription plans:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Partial<SubscriptionPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .update({
          name: plan.name,
          price: plan.price,
          features: plan.features,
          limite_alunos: plan.limite_alunos,
          limite_usuarios: plan.limite_usuarios,
          popular: plan.popular,
          active: plan.active,
          display_order: plan.display_order,
          color: plan.color,
          icon: plan.icon,
        })
        .eq("id", plan.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plano atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating plan:", error);
      toast.error("Erro ao atualizar plano");
    },
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlan, "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plano criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating plan:", error);
      toast.error("Erro ao criar plano");
    },
  });
}

export function getPlanPriceFormatted(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
