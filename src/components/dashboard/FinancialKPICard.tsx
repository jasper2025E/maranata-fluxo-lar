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
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
  index?: number;
}

const variantConfig = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    accentBorder: "hover:border-primary/30",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
    accentBorder: "hover:border-success/30",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    accentBorder: "hover:border-warning/30",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  danger: {
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    accentBorder: "hover:border-destructive/30",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  info: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    accentBorder: "hover:border-blue-300/50",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
};

const sizeConfig = {
  sm: {
    padding: "p-4",
    iconSize: "h-10 w-10",
    iconInner: "h-5 w-5",
    titleSize: "text-xs",
    valueSize: "text-xl",
    subtitleSize: "text-[11px]",
  },
  md: {
    padding: "p-5",
    iconSize: "h-12 w-12",
    iconInner: "h-6 w-6",
    titleSize: "text-sm",
    valueSize: "text-2xl",
    subtitleSize: "text-xs",
  },
  lg: {
    padding: "p-6",
    iconSize: "h-14 w-14",
    iconInner: "h-7 w-7",
    titleSize: "text-sm",
    valueSize: "text-3xl",
    subtitleSize: "text-sm",
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -3,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className={cn(
        "group relative bg-card rounded-2xl",
        sizes.padding,
        "border border-border/50",
        "shadow-sm hover:shadow-lg",
        colors.accentBorder,
        "transition-all duration-300 ease-out",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <p className={cn(sizes.titleSize, "font-medium text-muted-foreground uppercase tracking-wider")}>
            {title}
          </p>

          <p className={cn(sizes.valueSize, "font-bold text-foreground tracking-tight leading-none")}>
            {value}
          </p>

          {trend ? (
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className={cn(
                  "inline-flex items-center text-xs font-semibold",
                  trend.isPositive ? colors.trendPositive : colors.trendNegative
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label || "vs. mês anterior"}
              </span>
            </div>
          ) : subtitle ? (
            <p className={cn(sizes.subtitleSize, "text-muted-foreground pt-1")}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex-shrink-0 rounded-xl",
            sizes.iconSize,
            colors.iconBg,
            "flex items-center justify-center",
            "transition-all duration-300"
          )}
        >
          <Icon
            className={cn(sizes.iconInner, colors.iconColor)}
            strokeWidth={1.75}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
