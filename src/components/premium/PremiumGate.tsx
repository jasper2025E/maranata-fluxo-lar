import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Crown, Lock, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useFeatureAccess } from "@/hooks/usePremiumFeatures";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  feature: "accounting" | "financialHealth" | "advancedReports" | "apiAccess" | "hrManagement";
  children: ReactNode;
  fallback?: ReactNode;
  showPartialContent?: boolean;
}

export function PremiumGate({ 
  feature, 
  children, 
  fallback, 
  showPartialContent = true 
}: PremiumGateProps) {
  const { hasAccess, isPartial, needsUpgrade, isLoading, currentPlan } = useFeatureAccess(feature);
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Full access
  if (hasAccess && !isPartial) {
    return <>{children}</>;
  }

  // Partial access - show content with upgrade banner
  if (isPartial && showPartialContent) {
    return (
      <div className="relative">
        {/* Upgrade Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("premium.partialAccess")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("premium.upgradeForFull")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/assinatura")}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {t("premium.upgrade")}
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
        {children}
      </div>
    );
  }

  // No access - show upgrade wall
  if (needsUpgrade) {
    return fallback || <PremiumUpgradeWall feature={feature} currentPlan={currentPlan} />;
  }

  return <>{children}</>;
}

interface PremiumUpgradeWallProps {
  feature: string;
  currentPlan: string;
}

function PremiumUpgradeWall({ feature, currentPlan }: PremiumUpgradeWallProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const featureLabels: Record<string, { title: string; description: string }> = {
    accounting: {
      title: t("premium.features.accounting.title"),
      description: t("premium.features.accounting.description"),
    },
    financialHealth: {
      title: t("premium.features.financialHealth.title"),
      description: t("premium.features.financialHealth.description"),
    },
    advancedReports: {
      title: t("premium.features.advancedReports.title"),
      description: t("premium.features.advancedReports.description"),
    },
    apiAccess: {
      title: t("premium.features.apiAccess.title"),
      description: t("premium.features.apiAccess.description"),
    },
    hrManagement: {
      title: t("premium.features.hrManagement.title"),
      description: t("premium.features.hrManagement.description"),
    },
  };

  const featureInfo = featureLabels[feature] || {
    title: t("premium.features.default.title"),
    description: t("premium.features.default.description"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <div className="relative max-w-md text-center">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 blur-3xl -z-10" />
        
        {/* Lock Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/25"
        >
          <Lock className="h-10 w-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          {featureInfo.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6"
        >
          {featureInfo.description}
        </motion.p>

        {/* Current Plan Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground mb-6"
        >
          <span>{t("premium.currentPlan")}:</span>
          <span className="font-semibold capitalize">{currentPlan}</span>
        </motion.div>

        {/* Upgrade Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            onClick={() => navigate("/assinatura")}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
          >
            <Crown className="mr-2 h-5 w-5" />
            {t("premium.upgradeToPremium")}
          </Button>
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-left bg-card border rounded-xl p-6"
        >
          <p className="text-sm font-medium text-foreground mb-4">
            {t("premium.includedInPremium")}:
          </p>
          <ul className="space-y-2">
            {[
              t("premium.benefits.accounting"),
              t("premium.benefits.projections"),
              t("premium.benefits.alerts"),
              t("premium.benefits.recommendations"),
              t("premium.benefits.reports"),
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
