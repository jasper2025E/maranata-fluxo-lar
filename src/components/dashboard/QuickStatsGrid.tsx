import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant: "blue" | "violet" | "emerald" | "rose" | "amber" | "cyan";
}

interface QuickStatsGridProps {
  stats: QuickStat[];
  className?: string;
}

const variantStyles = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100/50 dark:border-blue-800/30",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    border: "border-violet-100/50 dark:border-violet-800/30",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100/50 dark:border-emerald-800/30",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100/50 dark:border-rose-800/30",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100/50 dark:border-amber-800/30",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100/50 dark:border-cyan-800/30",
  },
};

export function QuickStatsGrid({ stats, className }: QuickStatsGridProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6", className)}>
      {stats.map((stat, index) => {
        const styles = variantStyles[stat.variant];
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border",
              styles.bg,
              styles.border,
              "transition-all duration-200 hover:scale-[1.02]"
            )}
          >
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", styles.iconBg)}>
              <Icon className={cn("h-5 w-5", styles.iconColor)} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground truncate">{stat.value}</p>
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
