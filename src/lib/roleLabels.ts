import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Mapeamento de roles técnicos para labels amigáveis
 * Usado em todo o sistema para exibição consistente
 */
export const roleLabels: Record<AppRole, string> = {
  platform_admin: "Gestor",
  admin: "Administrador",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
  staff: "Colaborador",
};

/**
 * Descrições dos papéis para tooltips e contexto
 */
export const roleDescriptions: Record<AppRole, string> = {
  platform_admin: "Acesso total à plataforma e todas as escolas",
  admin: "Administrador da escola com acesso total aos dados",
  financeiro: "Gerencia faturas, pagamentos e relatórios financeiros",
  secretaria: "Gerencia alunos, matrículas e responsáveis",
  staff: "Acesso básico às funcionalidades da escola",
};

/**
 * Cores dos badges por role
 */
export const roleBadgeColors: Record<AppRole, string> = {
  platform_admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  financeiro: "bg-green-500/20 text-green-400 border-green-500/30",
  secretaria: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  staff: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

/**
 * Roles que pertencem a uma escola específica (tenant)
 */
export const schoolRoles: AppRole[] = ["admin", "financeiro", "secretaria", "staff"];

/**
 * Verifica se um role é de nível de plataforma (Gestor)
 */
export function isPlatformRole(role: AppRole): boolean {
  return role === "platform_admin";
}

/**
 * Verifica se um role é de nível de escola
 */
export function isSchoolRole(role: AppRole): boolean {
  return schoolRoles.includes(role);
}

/**
 * Retorna o label amigável para um role
 */
export function getRoleLabel(role: AppRole): string {
  return roleLabels[role] || role;
}

/**
 * Retorna a descrição de um role
 */
export function getRoleDescription(role: AppRole): string {
  return roleDescriptions[role] || "";
}

/**
 * Retorna as classes CSS do badge para um role
 */
export function getRoleBadgeColor(role: AppRole): string {
  return roleBadgeColors[role] || roleBadgeColors.staff;
}
