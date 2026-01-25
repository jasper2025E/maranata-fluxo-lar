import { useTenant } from "./useTenant";
import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "basic" | "pro" | "enterprise";
export type FeatureAccess = "full" | "partial" | "none";

/**
 * Mapeamento de funcionalidades por plano:
 * 
 * BASIC (Profissional 4 - R$99,99):
 * - Até 50 alunos, 3 usuários
 * - Gestão de matrículas
 * - Gestão de faturas
 * - Relatórios básicos
 * - Suporte por email
 * 
 * PRO (Profissional - R$170,99):
 * - Até 200 alunos, 10 usuários
 * - Tudo do plano Básico
 * - Integração Asaas/PIX
 * - Relatórios avançados
 * - Gestão de RH completa
 * - Gestão de turmas
 * - Suporte prioritário
 * 
 * ENTERPRISE (R$499,99):
 * - Alunos ilimitados, usuários ilimitados
 * - Tudo do plano Profissional
 * - Contabilidade avançada
 * - Projeção financeira (Saúde Financeira)
 * - API personalizada
 * - Site escolar incluso
 * - Suporte dedicado 24/7
 */

interface PremiumFeatureConfig {
  // Módulos Premium Enterprise
  accounting: FeatureAccess;         // Contabilidade avançada
  financialHealth: FeatureAccess;    // Projeção/Saúde Financeira
  apiAccess: FeatureAccess;          // API personalizada
  schoolWebsite: FeatureAccess;      // Site escolar
  
  // Módulos Pro
  advancedReports: FeatureAccess;    // Relatórios avançados
  hrManagement: FeatureAccess;       // Gestão de RH completa
  asaasIntegration: FeatureAccess;   // Integração Asaas/PIX
  classManagement: FeatureAccess;    // Gestão de turmas
  
  // Módulos Básicos (todos têm acesso)
  basicReports: FeatureAccess;       // Relatórios básicos
  enrollmentManagement: FeatureAccess; // Gestão de matrículas
  invoiceManagement: FeatureAccess;  // Gestão de faturas
}

const planFeatures: Record<PlanTier, PremiumFeatureConfig> = {
  basic: {
    // Enterprise
    accounting: "none",
    financialHealth: "none",
    apiAccess: "none",
    schoolWebsite: "none",
    // Pro
    advancedReports: "none",
    hrManagement: "partial",      // Básico do RH
    asaasIntegration: "none",
    classManagement: "partial",   // Visualização apenas
    // Básico
    basicReports: "full",
    enrollmentManagement: "full",
    invoiceManagement: "full",
  },
  pro: {
    // Enterprise
    accounting: "partial",        // Visão básica
    financialHealth: "partial",   // Indicadores básicos
    apiAccess: "none",
    schoolWebsite: "none",
    // Pro
    advancedReports: "full",
    hrManagement: "full",
    asaasIntegration: "full",
    classManagement: "full",
    // Básico
    basicReports: "full",
    enrollmentManagement: "full",
    invoiceManagement: "full",
  },
  enterprise: {
    // Enterprise
    accounting: "full",
    financialHealth: "full",
    apiAccess: "full",
    schoolWebsite: "full",
    // Pro
    advancedReports: "full",
    hrManagement: "full",
    asaasIntegration: "full",
    classManagement: "full",
    // Básico
    basicReports: "full",
    enrollmentManagement: "full",
    invoiceManagement: "full",
  },
};

export function usePremiumFeatures() {
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const { isPlatformAdmin } = useAuth();

  // Platform admins have full access to everything
  if (isPlatformAdmin()) {
    return {
      isLoading: false,
      currentPlan: "enterprise" as PlanTier,
      features: planFeatures.enterprise,
      canAccess: () => true,
      getAccessLevel: () => "full" as FeatureAccess,
      isPremium: true,
      isEnterprise: true,
      requiresUpgrade: () => false,
      getPlanLimits: () => ({ students: null, users: null }),
    };
  }

  const currentPlan = (tenant?.plano as PlanTier) || "basic";
  const features = planFeatures[currentPlan] || planFeatures.basic;

  const canAccess = (feature: keyof PremiumFeatureConfig): boolean => {
    return features[feature] !== "none";
  };

  const getAccessLevel = (feature: keyof PremiumFeatureConfig): FeatureAccess => {
    return features[feature];
  };

  const requiresUpgrade = (feature: keyof PremiumFeatureConfig): boolean => {
    return features[feature] === "none";
  };

  const getPlanLimits = () => ({
    students: tenant?.limite_alunos ?? null,
    users: tenant?.limite_usuarios ?? null,
  });

  return {
    isLoading: tenantLoading,
    currentPlan,
    features,
    canAccess,
    getAccessLevel,
    isPremium: currentPlan === "pro" || currentPlan === "enterprise",
    isEnterprise: currentPlan === "enterprise",
    requiresUpgrade,
    getPlanLimits,
  };
}

// Hook para verificar acesso a funcionalidade específica
export function useFeatureAccess(feature: keyof PremiumFeatureConfig) {
  const { canAccess, getAccessLevel, requiresUpgrade, isLoading, currentPlan, getPlanLimits } = usePremiumFeatures();

  return {
    isLoading,
    hasAccess: canAccess(feature),
    accessLevel: getAccessLevel(feature),
    needsUpgrade: requiresUpgrade(feature),
    currentPlan,
    isPartial: getAccessLevel(feature) === "partial",
    isFull: getAccessLevel(feature) === "full",
    limits: getPlanLimits(),
  };
}
