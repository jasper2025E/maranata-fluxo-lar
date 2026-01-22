import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ChartData {
  mes: string;
  valor?: number;
  receitas?: number;
  despesas?: number;
  saldo?: number;
  [key: string]: string | number | undefined;
}

interface FinancialChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  type: "area" | "bar" | "comparison" | "composed" | "pie";
  className?: string;
  height?: number;
  colors?: string[];
}

const defaultColors = {
  primary: "hsl(var(--primary))",
  success: "hsl(142, 76%, 36%)",
  danger: "hsl(346, 87%, 58%)",
  warning: "hsl(38, 92%, 50%)",
  info: "hsl(217, 91%, 60%)",
  muted: "hsl(var(--muted-foreground))",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-semibold text-foreground">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function FinancialChart({
  title,
  description,
  data,
  type,
  className,
  height = 300,
  colors = [],
}: FinancialChartProps) {
  const { t } = useTranslation();
  
  const chartColors = colors.length > 0 ? colors : [
    defaultColors.success,
    defaultColors.danger,
    defaultColors.info,
    defaultColors.warning,
  ];

  const translatedLabels = {
    revenues: t("dashboard.revenues"),
    expenses: t("dashboard.expenses"),
    balance: t("dashboard.balance"),
    value: t("dashboard.value"),
  };

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors[0]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="valor"
              name={translatedLabels.value}
              stroke={chartColors[0]}
              strokeWidth={2.5}
              fill="url(#colorValor)"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="valor"
              name={translatedLabels.value}
              fill={chartColors[0]}
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        );

      case "comparison":
        return (
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: "16px" }}
            />
            <Bar
              dataKey="receitas"
              name={translatedLabels.revenues}
              fill={chartColors[0]}
              radius={[6, 6, 0, 0]}
              maxBarSize={35}
            />
            <Bar
              dataKey="despesas"
              name={translatedLabels.expenses}
              fill={chartColors[1]}
              radius={[6, 6, 0, 0]}
              maxBarSize={35}
            />
          </BarChart>
        );

      case "composed":
        return (
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors[0]} stopOpacity={0.2} />
                <stop offset="100%" stopColor={chartColors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "16px" }} />
            <Area
              type="monotone"
              dataKey="receitas"
              name={translatedLabels.revenues}
              fill="url(#colorReceitas)"
              stroke={chartColors[0]}
              strokeWidth={2}
            />
            <Bar
              dataKey="despesas"
              name={translatedLabels.expenses}
              fill={chartColors[1]}
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              name={translatedLabels.balance}
              stroke={chartColors[2]}
              strokeWidth={2.5}
              dot={{ fill: chartColors[2], strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        );

      case "pie":
        const RADIAN = Math.PI / 180;
        const renderCustomizedLabel = ({
          cx,
          cy,
          midAngle,
          innerRadius,
          outerRadius,
          percent,
          name,
        }: any) => {
          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
          const x = cx + radius * Math.cos(-midAngle * RADIAN);
          const y = cy + radius * Math.sin(-midAngle * RADIAN);

          return (
            <text
              x={x}
              y={y}
              fill="white"
              textAnchor={x > cx ? 'start' : 'end'}
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
            >
              {`${(percent * 100).toFixed(0)}%`}
            </text>
          );
        };

        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={40}
              dataKey="valor"
              nameKey="mes"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
