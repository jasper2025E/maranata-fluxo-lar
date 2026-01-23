import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GrowthChartProps {
  data: {
    monthLabel: string;
    activeTenants: number;
    mrr: number;
  }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  // Calculate growth rate
  const dataWithGrowth = data.map((d, i) => {
    const prev = i > 0 ? data[i - 1] : null;
    const mrrGrowth = prev && prev.mrr > 0 
      ? Math.round(((d.mrr - prev.mrr) / prev.mrr) * 100) 
      : 0;
    return { ...d, mrrGrowth };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento Mensal</CardTitle>
        <CardDescription>
          Evolução de clientes ativos e taxa de crescimento do MRR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataWithGrowth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "mrrGrowth") return [`${value}%`, "Crescimento MRR"];
                  return [value, "Clientes Ativos"];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={(value) => 
                  value === "activeTenants" ? "Clientes Ativos" : "Crescimento MRR %"
                }
              />
              <Bar 
                yAxisId="left"
                dataKey="activeTenants" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="mrrGrowth" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ r: 5, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
