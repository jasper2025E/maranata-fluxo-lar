import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScenarioType, FinancialScenario, ProjectionPeriod } from "@/hooks/useFinancialProjection";
import { TrendingDown, TrendingUp, Minus, Target } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useTranslation } from "react-i18next";

interface ScenarioSelectorProps {
  scenarios: FinancialScenario[];
  selectedScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
}

const scenarioConfig = {
  conservative: {
    icon: TrendingDown,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    activeBg: "bg-amber-500",
    activeText: "text-white",
  },
  realistic: {
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    activeBg: "bg-blue-500",
    activeText: "text-white",
  },
  optimistic: {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    activeBg: "bg-emerald-500",
    activeText: "text-white",
  },
};

export function ScenarioSelector({ 
  scenarios, 
  selectedScenario, 
  onScenarioChange 
}: ScenarioSelectorProps) {
  const { t } = useTranslation();
  const activeScenario = scenarios.find(s => s.type === selectedScenario);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border rounded-2xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("projection.scenarios")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("projection.scenariosDescription")}
          </p>
        </div>
        
        {/* Scenario Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {scenarios.map(scenario => {
            const config = scenarioConfig[scenario.type];
            const Icon = config.icon;
            const isActive = scenario.type === selectedScenario;
            
            return (
              <button
                key={scenario.type}
                onClick={() => onScenarioChange(scenario.type)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? cn(config.activeBg, config.activeText, "shadow-sm")
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                )}
              >
                <Icon className="h-4 w-4" />
                {scenario.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projections Table */}
      {activeScenario && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">
                  {t("projection.period")}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-2">
                  {t("projection.projectedRevenue")}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-2">
                  {t("projection.projectedExpenses")}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-2">
                  {t("projection.projectedProfit")}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-2">
                  {t("projection.margin")}
                </th>
              </tr>
            </thead>
            <tbody>
              {activeScenario.projections.map((projection, index) => (
                <motion.tr
                  key={projection.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{projection.label}</span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-2">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(projection.revenue)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-2">
                    <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrency(projection.expenses)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-2">
                    <span className={cn(
                      "text-sm font-bold",
                      projection.profit >= 0 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-rose-600 dark:text-rose-400"
                    )}>
                      {formatCurrency(projection.profit)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-2">
                    <span className={cn(
                      "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                      projection.margin >= 15 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : projection.margin >= 5
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    )}>
                      {projection.margin.toFixed(1)}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
