import { useTenant } from "./useTenant";
import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "basic" | "pro" | "enterprise";
export type FeatureAccess = "full" | "partial" | "none";

interface PremiumFeatureConfig {
  accounting: FeatureAccess;
  financialHealth: FeatureAccess;
  advancedReports: FeatureAccess;
  apiAccess: FeatureAccess;
  hrManagement: FeatureAccess;
}

const planFeatures: Record<PlanTier, PremiumFeatureConfig> = {
  basic: {
    accounting: "none",
    financialHealth: "none",
    advancedReports: "none",
    apiAccess: "none",
    hrManagement: "partial",
  },
  pro: {
    accounting: "partial",
    financialHealth: "partial",
    advancedReports: "full",
    apiAccess: "none",
    hrManagement: "full",
  },
  enterprise: {
    accounting: "full",
    financialHealth: "full",
    advancedReports: "full",
    apiAccess: "full",
    hrManagement: "full",
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

  return {
    isLoading: tenantLoading,
    currentPlan,
    features,
    canAccess,
    getAccessLevel,
    isPremium: currentPlan === "pro" || currentPlan === "enterprise",
    isEnterprise: currentPlan === "enterprise",
    requiresUpgrade,
  };
}

// Hook para verificar acesso a funcionalidade específica
export function useFeatureAccess(feature: keyof PremiumFeatureConfig) {
  const { canAccess, getAccessLevel, requiresUpgrade, isLoading, currentPlan } = usePremiumFeatures();

  return {
    isLoading,
    hasAccess: canAccess(feature),
    accessLevel: getAccessLevel(feature),
    needsUpgrade: requiresUpgrade(feature),
    currentPlan,
    isPartial: getAccessLevel(feature) === "partial",
    isFull: getAccessLevel(feature) === "full",
  };
}
