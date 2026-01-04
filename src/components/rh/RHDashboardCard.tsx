import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RHDashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "red" | "yellow" | "purple" | "indigo";
  index?: number;
}

const colorVariants = {
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    border: "border-blue-200/50",
  },
  green: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-600",
    border: "border-emerald-200/50",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-600",
    border: "border-red-200/50",
  },
  yellow: {
    bg: "bg-amber-500/10",
    icon: "text-amber-600",
    border: "border-amber-200/50",
  },
  purple: {
    bg: "bg-purple-500/10",
    icon: "text-purple-600",
    border: "border-purple-200/50",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    icon: "text-indigo-600",
    border: "border-indigo-200/50",
  },
};

export function RHDashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  index = 0 
}: RHDashboardCardProps) {
  const colors = colorVariants[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "bg-card rounded-[20px] p-6 shadow-md border transition-all duration-300",
        "hover:shadow-lg",
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-full", colors.bg)}>
          <Icon className={cn("h-6 w-6", colors.icon)} strokeWidth={1.5} />
        </div>
      </div>
    </motion.div>
  );
}
