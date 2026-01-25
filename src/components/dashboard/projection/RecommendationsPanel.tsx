import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FinancialRecommendation } from "@/hooks/useFinancialProjection";
import { Lightbulb, ChevronRight, Zap, Target, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RecommendationsPanelProps {
  recommendations: FinancialRecommendation[];
}

const priorityConfig = {
  high: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    badge: "bg-rose-500 text-white",
    label: "Alta prioridade",
    icon: Zap,
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500 text-white",
    label: "Média prioridade",
    icon: Target,
  },
  low: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500 text-white",
    label: "Baixa prioridade",
    icon: TrendingUp,
  },
};

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  const { t } = useTranslation();

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card border rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("projection.recommendations")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("projection.recommendationsDescription")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const config = priorityConfig[rec.priority];
          const PriorityIcon = config.icon;

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200",
                "hover:shadow-md cursor-pointer group",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                      config.badge
                    )}>
                      <PriorityIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {rec.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {rec.description}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Impacto:</span>
                    <span className="font-medium text-primary">{rec.impact}</span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
