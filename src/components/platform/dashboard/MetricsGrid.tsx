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
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="grid grid-cols-4 divide-x divide-border">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.05 }}
            className={cn("px-4 first:pl-0 last:pr-0")}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", metric.bgColor)}>
                <metric.icon className={cn("h-4 w-4", metric.color)} />
              </div>
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <span className={cn("text-2xl font-bold", metric.color)}>{metric.value}</span>
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
      </div>
    </motion.div>
  );
}
