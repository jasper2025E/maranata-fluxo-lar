// Hook simplificado para sistema single-tenant
// Todas as funcionalidades premium agora estão disponíveis

export type PlanTier = "basic" | "pro" | "enterprise";
export type FeatureAccess = "full" | "partial" | "none";

interface PremiumFeatureConfig {
  accounting: FeatureAccess;
  financialHealth: FeatureAccess;
  apiAccess: FeatureAccess;
  schoolWebsite: FeatureAccess;
  advancedReports: FeatureAccess;
  hrManagement: FeatureAccess;
  asaasIntegration: FeatureAccess;
  classManagement: FeatureAccess;
  basicReports: FeatureAccess;
  enrollmentManagement: FeatureAccess;
  invoiceManagement: FeatureAccess;
}

// Acesso total a todas as funcionalidades
const fullAccessFeatures: PremiumFeatureConfig = {
  accounting: "full",
  financialHealth: "full",
  apiAccess: "full",
  schoolWebsite: "full",
  advancedReports: "full",
  hrManagement: "full",
  asaasIntegration: "full",
  classManagement: "full",
  basicReports: "full",
  enrollmentManagement: "full",
  invoiceManagement: "full",
};

export function usePremiumFeatures() {
  // Sistema single-tenant - acesso total a tudo
  const canAccess = (_feature: keyof PremiumFeatureConfig): boolean => true;
  const getAccessLevel = (_feature: keyof PremiumFeatureConfig): FeatureAccess => "full";
  const requiresUpgrade = (_feature: keyof PremiumFeatureConfig): boolean => false;
  const getPlanLimits = () => ({ students: null, users: null });

  return {
    isLoading: false,
    currentPlan: "enterprise" as PlanTier,
    features: fullAccessFeatures,
    canAccess,
    getAccessLevel,
    isPremium: true,
    isEnterprise: true,
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
