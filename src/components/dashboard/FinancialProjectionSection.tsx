import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useFinancialProjection, ScenarioType } from "@/hooks/useFinancialProjection";
import { 
  ProjectionKPIs,
  HealthIndicators,
  ScenarioSelector,
  AlertsPanel,
  RecommendationsPanel,
  ProjectionChart,
} from "./projection";
import { Loader2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function FinancialProjectionSection() {
  const { t } = useTranslation();
  const { hasRole, isPlatformAdmin } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("realistic");
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { data, isLoading, error } = useFinancialProjection();

  // Access control: only admin, financeiro, or platform_admin
  const canAccess = hasRole("admin") || hasRole("financeiro") || isPlatformAdmin();
  
  if (!canAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-card border rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {t("projection.loading")}
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t("projection.loadError")}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {t("projection.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("projection.subtitle")}
            </p>
          </div>
        </div>

        <button className={cn(
          "p-2 rounded-lg hover:bg-muted transition-colors",
          isExpanded ? "bg-muted/50" : ""
        )}>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="space-y-6">
          {/* KPIs */}
          <ProjectionKPIs
            avgMonthlyRevenue={data.avgMonthlyRevenue}
            avgMonthlyExpenses={data.avgMonthlyExpenses}
            avgMonthlyProfit={data.avgMonthlyProfit}
            profitMargin={data.profitMargin}
            monthsOfRunway={data.monthsOfRunway}
            breakEvenPoint={data.breakEvenPoint}
            revenueGrowthRate={data.revenueGrowthRate}
            historicalMonths={data.historicalMonths}
          />

          {/* Health Indicators */}
          <HealthIndicators
            indicators={data.healthIndicators}
            overallHealth={data.overallHealth}
          />

          {/* Charts & Scenarios */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ProjectionChart
              data={data.projectionData}
              selectedScenario={selectedScenario}
              avgRevenue={data.avgMonthlyRevenue}
            />
            
            <ScenarioSelector
              scenarios={data.scenarios}
              selectedScenario={selectedScenario}
              onScenarioChange={setSelectedScenario}
            />
          </div>

          {/* Alerts & Recommendations */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AlertsPanel alerts={data.alerts} />
            <RecommendationsPanel recommendations={data.recommendations} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
