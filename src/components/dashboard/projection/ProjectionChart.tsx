import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { ScenarioType } from "@/hooks/useFinancialProjection";
import { cn } from "@/lib/utils";

interface ProjectionChartProps {
  data: { month: string; conservative: number; realistic: number; optimistic: number }[];
  selectedScenario: ScenarioType;
  avgRevenue: number;
}

const scenarioColors = {
  conservative: "#f59e0b", // amber
  realistic: "#3b82f6",    // blue  
  optimistic: "#10b981",   // emerald
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">
            {entry.name === "conservative" ? "Conservador" : 
             entry.name === "realistic" ? "Realista" : "Otimista"}:
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function ProjectionChart({ data, selectedScenario, avgRevenue }: ProjectionChartProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-card border rounded-2xl p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t("projection.revenueProjection")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("projection.next12Months")}
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientConservative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scenarioColors.conservative} stopOpacity={0.3} />
                <stop offset="95%" stopColor={scenarioColors.conservative} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientRealistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scenarioColors.realistic} stopOpacity={0.3} />
                <stop offset="95%" stopColor={scenarioColors.realistic} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scenarioColors.optimistic} stopOpacity={0.3} />
                <stop offset="95%" stopColor={scenarioColors.optimistic} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false} 
            />
            
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine 
              y={avgRevenue} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ 
                value: "Média atual", 
                position: "insideTopRight",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />

            {/* Show all areas with different opacity based on selection */}
            <Area
              type="monotone"
              dataKey="conservative"
              stroke={scenarioColors.conservative}
              fill="url(#gradientConservative)"
              strokeWidth={selectedScenario === "conservative" ? 3 : 1}
              fillOpacity={selectedScenario === "conservative" ? 1 : 0.2}
              name="conservative"
            />
            <Area
              type="monotone"
              dataKey="realistic"
              stroke={scenarioColors.realistic}
              fill="url(#gradientRealistic)"
              strokeWidth={selectedScenario === "realistic" ? 3 : 1}
              fillOpacity={selectedScenario === "realistic" ? 1 : 0.2}
              name="realistic"
            />
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke={scenarioColors.optimistic}
              fill="url(#gradientOptimistic)"
              strokeWidth={selectedScenario === "optimistic" ? 3 : 1}
              fillOpacity={selectedScenario === "optimistic" ? 1 : 0.2}
              name="optimistic"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
        {Object.entries(scenarioColors).map(([key, color]) => (
          <div 
            key={key}
            className={cn(
              "flex items-center gap-2 text-sm transition-opacity",
              selectedScenario === key ? "opacity-100" : "opacity-50"
            )}
          >
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground capitalize">
              {key === "conservative" ? "Conservador" : 
               key === "realistic" ? "Realista" : "Otimista"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
