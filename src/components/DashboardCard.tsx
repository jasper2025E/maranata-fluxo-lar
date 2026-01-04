import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  index?: number;
}

const colorConfig = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    accentBorder: "hover:border-blue-200/60",
  },
  green: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    accentBorder: "hover:border-emerald-200/60",
  },
  red: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
    accentBorder: "hover:border-rose-200/60",
  },
  yellow: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    accentBorder: "hover:border-amber-200/60",
  },
  purple: {
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    accentBorder: "hover:border-violet-200/60",
  },
};

export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  className,
  index = 0,
}: DashboardCardProps) {
  const colors = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className={cn(
        // Base styles - white background
        "group relative bg-white rounded-[20px] p-6",
        // Border subtle
        "border border-gray-200/50",
        // Shadow elegant
        "shadow-[0_1px_3px_0_rgb(0,0,0,0.02),0_4px_12px_-2px_rgb(0,0,0,0.05)]",
        // Hover shadow
        "hover:shadow-[0_4px_16px_-2px_rgb(0,0,0,0.08),0_8px_24px_-4px_rgb(0,0,0,0.06)]",
        colors.accentBorder,
        // Smooth transition
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Content */}
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Text content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Label */}
          <p className="text-sm font-medium text-gray-500 tracking-wide">
            {title}
          </p>

          {/* Value */}
          <p className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">
            {value}
          </p>

          {/* Subtitle or Trend */}
          {trend ? (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center text-sm font-semibold",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-400">vs. mês anterior</span>
            </div>
          ) : subtitle ? (
            <p className="text-[13px] text-gray-400 font-normal leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Right side - Icon container circular */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className={cn(
            // Circular container
            "flex-shrink-0 h-12 w-12 rounded-full",
            // Background with low opacity
            colors.iconBg,
            // Flex center
            "flex items-center justify-center",
            // Transition
            "transition-transform duration-300"
          )}
        >
          <Icon
            className={cn("h-[22px] w-[22px]", colors.iconColor)}
            strokeWidth={1.5}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
