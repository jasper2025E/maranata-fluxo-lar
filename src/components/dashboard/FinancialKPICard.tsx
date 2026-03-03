import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FinancialKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info" | "premium";
  size?: "sm" | "md" | "lg";
  className?: string;
  index?: number;
}

const variantConfig = {
  default: {
    gradient: "from-slate-500/10 via-slate-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-primary/20 to-primary/5",
    iconColor: "text-primary",
    accentLine: "from-primary/60 to-primary/20",
    glow: "group-hover:shadow-primary/10",
  },
  success: {
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentLine: "from-emerald-500/60 to-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
  },
  warning: {
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-600 dark:text-amber-400",
    accentLine: "from-amber-500/60 to-amber-500/20",
    glow: "group-hover:shadow-amber-500/10",
  },
  danger: {
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-600 dark:text-rose-400",
    accentLine: "from-rose-500/60 to-rose-500/20",
    glow: "group-hover:shadow-rose-500/10",
  },
  info: {
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentLine: "from-blue-500/60 to-blue-500/20",
    glow: "group-hover:shadow-blue-500/10",
  },
  premium: {
    gradient: "from-violet-500/10 via-fuchsia-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-violet-500/5",
    iconColor: "text-violet-600 dark:text-violet-400",
    accentLine: "from-violet-500/60 via-fuchsia-500/40 to-violet-500/20",
    glow: "group-hover:shadow-violet-500/10",
  },
};

const sizeConfig = {
  sm: {
    padding: "p-3 sm:p-4",
    iconSize: "h-9 w-9 sm:h-11 sm:w-11",
    iconInner: "h-4 w-4 sm:h-5 sm:w-5",
    titleSize: "text-[10px] sm:text-xs",
    valueSize: "text-lg sm:text-xl",
    subtitleSize: "text-[10px] sm:text-[11px]",
  },
  md: {
    padding: "p-3 sm:p-5",
    iconSize: "h-9 w-9 sm:h-13 sm:w-13",
    iconInner: "h-4 w-4 sm:h-6 sm:w-6",
    titleSize: "text-[10px] sm:text-xs",
    valueSize: "text-lg sm:text-2xl",
    subtitleSize: "text-[10px] sm:text-xs",
  },
  lg: {
    padding: "p-4 sm:p-6",
    iconSize: "h-10 w-10 sm:h-14 sm:w-14",
    iconInner: "h-5 w-5 sm:h-7 sm:w-7",
    titleSize: "text-xs sm:text-sm",
    valueSize: "text-xl sm:text-3xl",
    subtitleSize: "text-xs sm:text-sm",
  },
};

export function FinancialKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  size = "md",
  className,
  index = 0,
}: FinancialKPICardProps) {
  const colors = variantConfig[variant];
  const sizes = sizeConfig[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        scale: 1.01,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className={cn(
        "group relative overflow-hidden",
        "bg-card/80 backdrop-blur-sm rounded-2xl",
        sizes.padding,
        "border border-border/40",
        "shadow-sm hover:shadow-xl",
        colors.glow,
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-60",
        colors.gradient
      )} />
      
      {/* Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px]",
        "bg-gradient-to-r",
        colors.accentLine,
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )} />

      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative flex flex-col gap-2 sm:gap-3 min-w-0">
        {/* Header: Icon + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 8 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
              "flex-shrink-0 rounded-xl",
              sizes.iconSize,
              colors.iconBg,
              "flex items-center justify-center",
              "shadow-inner",
              "transition-all duration-300"
            )}
          >
            <Icon
              className={cn(sizes.iconInner, colors.iconColor)}
              strokeWidth={1.75}
            />
          </motion.div>
          <p className={cn(
            sizes.titleSize,
            "font-semibold text-muted-foreground/80 uppercase tracking-wider truncate"
          )}>
            {title}
          </p>
        </div>

        {/* Value */}
        <motion.p 
          className={cn(
            sizes.valueSize, 
            "font-bold text-foreground tracking-tight leading-none truncate"
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 + 0.2, duration: 0.3 }}
        >
          {value}
        </motion.p>

        {/* Trend or Subtitle */}
        {trend ? (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                trend.isPositive 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              <motion.span
                initial={{ rotate: trend.isPositive ? 45 : -45 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {trend.isPositive ? "↑" : "↓"}
              </motion.span>
              {Math.abs(trend.value).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground/70">
              {trend.label || "vs. mês anterior"}
            </span>
          </motion.div>
        ) : subtitle ? (
          <p className={cn(
            sizes.subtitleSize, 
            "text-muted-foreground/70"
          )}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Bottom Glow Effect */}
      <div className={cn(
        "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl",
        "bg-gradient-to-br",
        colors.gradient,
        "opacity-0 group-hover:opacity-40 transition-opacity duration-500"
      )} />
    </motion.div>
  );
}
