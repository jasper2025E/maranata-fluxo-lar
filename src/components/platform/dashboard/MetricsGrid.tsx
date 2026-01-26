import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Metric {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
  bgColor: string;
  chart?: number[];
}

interface MetricsGridProps {
  metrics: Metric[];
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100;
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 15)}%` }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={cn("w-1 rounded-full", color)}
          />
        );
      })}
    </div>
  );
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + index * 0.05 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", metric.bgColor)}>
              <metric.icon className={cn("h-4 w-4", metric.color)} />
            </div>
            <span className="text-sm text-muted-foreground">{metric.label}</span>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{metric.value}</span>
              {metric.suffix && (
                <span className="text-sm text-muted-foreground ml-1">{metric.suffix}</span>
              )}
            </div>
            {metric.chart && (
              <MiniChart data={metric.chart} color={metric.bgColor} />
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
