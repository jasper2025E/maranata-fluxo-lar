import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ConversionChartProps {
  data: {
    monthLabel: string;
    trialStarts: number;
    trialConversions: number;
  }[];
}

export function ConversionChart({ data }: ConversionChartProps) {
  // Calculate conversion rate for each month
  const dataWithRate = data.map(d => ({
    ...d,
    conversionRate: d.trialStarts > 0 ? Math.round((d.trialConversions / d.trialStarts) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversão de Trials</CardTitle>
        <CardDescription>
          Trials iniciados vs convertidos por mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataWithRate}>
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
                  if (name === "conversionRate") return [`${value}%`, "Taxa"];
                  return [value, name === "trialStarts" ? "Trials" : "Conversões"];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={(value) => {
                  if (value === "trialStarts") return "Trials Iniciados";
                  if (value === "trialConversions") return "Conversões";
                  return "Taxa de Conversão";
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="trialStarts" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="trialConversions" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
