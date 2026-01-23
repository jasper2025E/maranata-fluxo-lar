import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MrrChartProps {
  data: {
    monthLabel: string;
    mrr: number;
    newMrr: number;
    churnedMrr: number;
  }[];
}

export function MrrChart({ data }: MrrChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do MRR</CardTitle>
        <CardDescription>
          Receita recorrente mensal com expansão e churn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newMrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === "mrr" ? "MRR Total" : name === "newMrr" ? "Novo MRR" : "MRR Perdido"
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={(value) => 
                  value === "mrr" ? "MRR Total" : value === "newMrr" ? "Novo MRR" : "MRR Perdido"
                }
              />
              <Area 
                type="monotone" 
                dataKey="mrr" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#mrrGradient)"
              />
              <Area 
                type="monotone" 
                dataKey="newMrr" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#newMrrGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
