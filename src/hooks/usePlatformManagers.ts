import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlatformManager {
  id: string;
  email: string;
  nome: string | null;
  platform_role: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  avatar_url: string | null;
  phone: string | null;
  last_login_at: string | null;
  created_at: string;
}

export const platformRoles = {
  super_admin: {
    label: "Super Admin",
    description: "Acesso total a todas as funcionalidades",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  admin_financeiro: {
    label: "Admin Financeiro",
    description: "Gestão de assinaturas, planos e billing",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  suporte: {
    label: "Suporte",
    description: "Atendimento, comunicados e roadmap",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  read_only: {
    label: "Apenas Leitura",
    description: "Visualização sem permissão de edição",
    color: "bg-muted text-muted-foreground",
  },
} as const;

export const rolePermissions = {
  super_admin: [
    "view_tenants", "manage_tenants", "delete_tenants",
    "view_subscriptions", "manage_subscriptions",
    "view_users", "manage_users",
    "view_analytics",
    "manage_announcements",
    "view_roadmap", "manage_roadmap",
    "view_backups", "manage_backups",
    "view_logs", "view_security",
    "manage_settings", "manage_branding",
  ],
  admin_financeiro: [
    "view_tenants",
    "view_subscriptions", "manage_subscriptions",
    "view_analytics",
    "view_logs",
  ],
  suporte: [
    "view_tenants",
    "view_subscriptions",
    "manage_announcements",
    "view_roadmap", "manage_roadmap",
    "view_logs",
  ],
  read_only: [
    "view_tenants",
    "view_subscriptions",
    "view_analytics",
    "view_roadmap",
    "view_logs",
  ],
};

export function usePlatformManagers() {
  const queryClient = useQueryClient();

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ["platform-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_managers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PlatformManager[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from("system_managers")
        .update({ platform_role: role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-managers"] });
      toast.success("Permissão atualizada");
    },
    onError: () => toast.error("Erro ao atualizar permissão"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("system_managers")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-managers"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  return {
    managers,
    isLoading,
    updateRole: updateRoleMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    isUpdating: updateRoleMutation.isPending || toggleActiveMutation.isPending,
  };
}

export function useCurrentManagerPermissions() {
  const { data: currentManager } = useQuery({
    queryKey: ["current-platform-manager"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("system_managers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) return null;
      return data as PlatformManager;
    },
  });

  const hasPermission = (permission: string): boolean => {
    if (!currentManager) return false;
    const role = currentManager.platform_role as keyof typeof rolePermissions;
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
  };

  const isSuperAdmin = currentManager?.platform_role === "super_admin";

  return {
    currentManager,
    hasPermission,
    isSuperAdmin,
    role: currentManager?.platform_role || "read_only",
  };
}
