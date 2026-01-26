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
} from "@/components/dashboard/projection";
import { Loader2, TrendingUp, ChevronRight, Activity, Target, AlertCircle, Lightbulb, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { useSearchParams } from "react-router-dom";
// PremiumGate removido - single-tenant

type TabType = "overview" | "scenarios" | "alerts" | "recommendations";

const tabs: { id: TabType; labelKey: string; icon: React.ElementType }[] = [
  { id: "overview", labelKey: "financialHealth.tabs.overview", icon: Activity },
  { id: "scenarios", labelKey: "financialHealth.tabs.scenarios", icon: Target },
  { id: "alerts", labelKey: "financialHealth.tabs.alerts", icon: AlertCircle },
  { id: "recommendations", labelKey: "financialHealth.tabs.recommendations", icon: Lightbulb },
];

const SaudeFinanceira = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get("tab") as TabType) || "overview";
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("realistic");
  
  const { data, isLoading, error } = useFinancialProjection();

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  return (
    <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Mobile Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>

            {/* Mobile Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-card border rounded-2xl p-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {t("projection.loading")}
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-card border rounded-2xl p-12 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t("projection.loadError")}
                </p>
              </div>
            )}

            {/* Content */}
            {data && (
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {currentTab === "overview" && (
                  <>
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

                    {/* Projection Chart */}
                    <ProjectionChart
                      data={data.projectionData}
                      selectedScenario={selectedScenario}
                      avgRevenue={data.avgMonthlyRevenue}
                    />
                  </>
                )}

                {currentTab === "scenarios" && (
                  <>
                    <ScenarioSelector
                      scenarios={data.scenarios}
                      selectedScenario={selectedScenario}
                      onScenarioChange={setSelectedScenario}
                    />
                    
                    <ProjectionChart
                      data={data.projectionData}
                      selectedScenario={selectedScenario}
                      avgRevenue={data.avgMonthlyRevenue}
                    />
                  </>
                )}

                {currentTab === "alerts" && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <AlertsPanel alerts={data.alerts} />
                    
                    {/* Summary Card */}
                    <div className="bg-card border rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{t("financialHealth.quickSummary")}</h3>
                          <p className="text-sm text-muted-foreground">{t("financialHealth.keyMetrics")}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-muted-foreground">{t("projection.profitMargin")}</span>
                          <span className={cn(
                            "font-semibold",
                            data.profitMargin >= 15 ? "text-emerald-600" : 
                            data.profitMargin >= 5 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {data.profitMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-muted-foreground">{t("financialHealth.delinquencyRate")}</span>
                          <span className={cn(
                            "font-semibold",
                            data.delinquencyRate <= 5 ? "text-emerald-600" : 
                            data.delinquencyRate <= 10 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {data.delinquencyRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground">{t("financialHealth.runway")}</span>
                          <span className={cn(
                            "font-semibold",
                            data.monthsOfRunway >= 6 ? "text-emerald-600" : 
                            data.monthsOfRunway >= 3 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {data.monthsOfRunway.toFixed(1)} {t("common.months")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentTab === "recommendations" && (
                  <RecommendationsPanel recommendations={data.recommendations} />
                )}
              </motion.div>
          </div>
      </DashboardLayout>
  );
};

export default SaudeFinanceira;
