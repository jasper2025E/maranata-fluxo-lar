import { LucideIcon } from "lucide-react";
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
}

const colorConfig = {
  blue: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    accentBorder: "hover:border-blue-200/50",
  },
  green: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    accentBorder: "hover:border-emerald-200/50",
  },
  red: {
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    accentBorder: "hover:border-rose-200/50",
  },
  yellow: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accentBorder: "hover:border-amber-200/50",
  },
  purple: {
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    accentBorder: "hover:border-violet-200/50",
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
}: DashboardCardProps) {
  const colors = colorConfig[color];

  return (
    <div
      className={cn(
        // Base styles
        "group relative bg-white rounded-2xl p-6",
        // Border and shadow
        "border border-gray-100/80 shadow-sm",
        // Hover effects
        "hover:shadow-lg hover:-translate-y-0.5",
        colors.accentBorder,
        // Transitions
        "transition-all duration-300 ease-out",
        // Animation
        "animate-fade-in",
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
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
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
            <p className="text-sm text-gray-400 font-normal">{subtitle}</p>
          ) : null}
        </div>

        {/* Right side - Icon */}
        <div
          className={cn(
            // Container circular
            "flex-shrink-0 h-12 w-12 rounded-xl",
            // Background
            colors.iconBg,
            // Flex center
            "flex items-center justify-center",
            // Hover scale
            "group-hover:scale-105 transition-transform duration-300"
          )}
        >
          <Icon
            className={cn("h-6 w-6", colors.iconColor)}
            strokeWidth={1.75}
          />
        </div>
      </div>

      {/* Subtle gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100",
          "bg-gradient-to-br from-white/50 via-transparent to-transparent",
          "pointer-events-none transition-opacity duration-300"
        )}
      />
    </div>
  );
}
