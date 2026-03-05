import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface AnnualHistoryChartProps {
  data: { month: string; revenue: number; expenses: number; profit: number }[];
}

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
          <span className="text-muted-foreground">
            {entry.name === "revenue"
              ? "Receitas"
              : entry.name === "expenses"
              ? "Despesas"
              : "Lucro"}
            :
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function AnnualHistoryChart({ data }: AnnualHistoryChartProps) {
  const { t } = useTranslation();

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border rounded-2xl p-6"
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("financialHealth.annualHistory", "Histórico Anual")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("financialHealth.last12Months", "Receitas vs Despesas - Últimos 12 meses")}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{t("financialHealth.totalRevenue", "Receita Total")}</p>
            <p className="font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{t("financialHealth.totalExpenses", "Despesa Total")}</p>
            <p className="font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{t("financialHealth.annualResult", "Resultado")}</p>
            <p className={`font-bold ${totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="revenue" opacity={0.85} />
            <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="expenses" opacity={0.85} />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#3b82f6" }}
              name="profit"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">{t("dashboard.revenues", "Receitas")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-sm bg-rose-500" />
          <span className="text-muted-foreground">{t("dashboard.expenses", "Despesas")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">{t("dashboard.profit", "Lucro")}</span>
        </div>
      </div>
    </motion.div>
  );
}
