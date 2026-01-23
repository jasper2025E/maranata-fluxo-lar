import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChurnChartProps {
  data: {
    monthLabel: string;
    churnedTenants: number;
    newTenants: number;
  }[];
}

export function ChurnChart({ data }: ChurnChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aquisição vs Churn</CardTitle>
        <CardDescription>
          Novos clientes e cancelamentos por mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value, 
                  name === "newTenants" ? "Novos" : "Churn"
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="newTenants" 
                name="Novos"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="churnedTenants" 
                name="Churn"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
