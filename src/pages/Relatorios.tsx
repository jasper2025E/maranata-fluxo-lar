import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  FileText,
  Users,
  ChevronRight,
  Clock,
  Wallet,
  Receipt,
} from "lucide-react";
import { format, subMonths, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { FinancialKPICard } from "@/components/dashboard/FinancialKPICard";
import { PremiumGate } from "@/components/premium";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesesCompletos = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];
const STATUS_COLORS = {
  Paga: 'hsl(142, 76%, 36%)',
  Aberta: 'hsl(217, 91%, 60%)',
  Vencida: 'hsl(0, 84%, 60%)',
  Cancelada: 'hsl(var(--muted-foreground))'
};

const Relatorios = () => {
  const { t } = useTranslation();
  const currentDate = new Date();
  const [periodoInicio, setPeriodoInicio] = useState(format(subMonths(currentDate, 6), "yyyy-MM-dd"));
  const [periodoFim, setPeriodoFim] = useState(format(currentDate, "yyyy-MM-dd"));
  const [anoSelecionado, setAnoSelecionado] = useState(currentDate.getFullYear().toString());
  const [activeSection, setActiveSection] = useState("visao-geral");

  const { data: faturas = [] } = useQuery({
    queryKey: ["faturas-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .select("*, alunos(nome_completo, responsavel_id), cursos(nome), responsaveis(nome)");
      if (error) throw error;
      return data;
    },
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*, faturas(aluno_id, alunos(nome_completo), cursos(nome))");
      if (error) throw error;
      return data;
    },
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: alunos = [] } = useQuery({
    queryKey: ["alunos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alunos").select("*, cursos(nome)").eq("status_matricula", "ativo");
      if (error) throw error;
      return data;
    },
  });

  const { data: cursos = [] } = useQuery({
    queryKey: ["cursos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cursos").select("*").eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const filtrarPorPeriodo = <T extends { data_pagamento?: string; data_vencimento?: string }>(
    items: T[],
    dateField: keyof T
  ) => {
    return items.filter((item) => {
      const date = item[dateField] as string;
      if (!date) return false;
      return date >= periodoInicio && date <= periodoFim;
    });
  };

  const ano = parseInt(anoSelecionado);
  const monthlyData = useMemo(() => meses.map((mes, index) => {
    const entradas = pagamentos
      .filter((p) => {
        const date = new Date(p.data_pagamento);
        return date.getMonth() === index && date.getFullYear() === ano;
      })
      .reduce((sum, p) => sum + Number(p.valor), 0);

    const saidas = despesas
      .filter((d) => {
        const date = new Date(d.data_vencimento);
        return date.getMonth() === index && date.getFullYear() === ano && d.paga;
      })
      .reduce((sum, d) => sum + Number(d.valor), 0);

    const faturasEmitidas = faturas.filter((f) => f.mes_referencia === index + 1 && f.ano_referencia === ano);
    const valorEmitido = faturasEmitidas.reduce((sum, f) => sum + Number(f.valor), 0);
    const faturasAbertas = faturasEmitidas.filter((f) => f.status === "Aberta" || f.status === "Vencida");
    const valorAberto = faturasAbertas.reduce((sum, f) => sum + Number(f.valor), 0);

    return { 
      mes, 
      entradas, 
      saidas, 
      saldo: entradas - saidas,
      valorEmitido,
      valorAberto,
      taxaRecebimento: valorEmitido > 0 ? ((valorEmitido - valorAberto) / valorEmitido) * 100 : 0
    };
  }), [pagamentos, despesas, faturas, ano]);

  const saldoAcumuladoMensal = useMemo(() => {
    let acumulado = 0;
    return monthlyData.map(m => {
      acumulado += m.saldo;
      return { ...m, saldoAcumulado: acumulado };
    });
  }, [monthlyData]);

  const faturasVencidas = faturas.filter((f) => f.status === "Vencida");
  const alunosInadimplentes = [...new Set(faturasVencidas.map((f) => f.aluno_id))];
  const taxaInadimplencia = alunos.length > 0 ? (alunosInadimplentes.length / alunos.length) * 100 : 0;
  const valorInadimplente = faturasVencidas.reduce((sum, f) => sum + Number(f.valor), 0);

  const agingData = useMemo(() => {
    const hoje = new Date();
    const aging = { ate30: 0, de31a60: 0, de61a90: 0, mais90: 0 };
    
    faturasVencidas.forEach(f => {
      const dias = differenceInDays(hoje, new Date(f.data_vencimento));
      const valor = Number(f.valor);
      if (dias <= 30) aging.ate30 += valor;
      else if (dias <= 60) aging.de31a60 += valor;
      else if (dias <= 90) aging.de61a90 += valor;
      else aging.mais90 += valor;
    });
    
    return aging;
  }, [faturasVencidas]);

  const agingChartData = useMemo(() => [
    { faixa: "0-30d", valor: agingData.ate30, fill: "hsl(38, 92%, 50%)" },
    { faixa: "31-60d", valor: agingData.de31a60, fill: "hsl(25, 95%, 53%)" },
    { faixa: "61-90d", valor: agingData.de61a90, fill: "hsl(0, 84%, 60%)" },
    { faixa: "+90d", valor: agingData.mais90, fill: "hsl(0, 72%, 51%)" },
  ].filter(d => d.valor > 0), [agingData]);

  const pagamentosPeriodo = filtrarPorPeriodo(pagamentos, "data_pagamento");
  const despesasPeriodo = filtrarPorPeriodo(despesas.filter(d => d.paga), "data_pagamento");
  
  const totalEntradasPeriodo = pagamentosPeriodo.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalSaidasPeriodo = despesasPeriodo.reduce((sum, d) => sum + Number(d.valor), 0);
  const saldoPeriodo = totalEntradasPeriodo - totalSaidasPeriodo;

  const faturasEmAberto = faturas.filter((f) => f.status === "Aberta" || f.status === "Vencida");
  const valorEmAberto = faturasEmAberto.reduce((sum, f) => sum + Number(f.valor), 0);

  const ticketMedio = pagamentos.length > 0 ? pagamentos.reduce((sum, p) => sum + Number(p.valor), 0) / pagamentos.length : 0;

  const statusData = useMemo(() => [
    { name: "Pagas", value: faturas.filter(f => f.status === "Paga").length, color: STATUS_COLORS.Paga },
    { name: "Abertas", value: faturas.filter(f => f.status === "Aberta").length, color: STATUS_COLORS.Aberta },
    { name: "Vencidas", value: faturas.filter(f => f.status === "Vencida").length, color: STATUS_COLORS.Vencida },
  ].filter(s => s.value > 0), [faturas]);

  const pagamentosPorMetodo = useMemo(() => {
    const metodos: Record<string, number> = {};
    pagamentosPeriodo.forEach(p => {
      const metodo = p.metodo || "Outros";
      metodos[metodo] = (metodos[metodo] || 0) + Number(p.valor);
    });
    return Object.entries(metodos).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [pagamentosPeriodo]);

  const receitaPorCurso = useMemo(() => {
    const cursosMap: Record<string, { nome: string; receita: number; alunos: number }> = {};
    
    cursos.forEach(c => {
      cursosMap[c.id] = { nome: c.nome, receita: 0, alunos: 0 };
    });

    faturas.filter(f => f.status === "Paga").forEach(f => {
      if (cursosMap[f.curso_id]) {
        cursosMap[f.curso_id].receita += Number(f.valor);
      }
    });

    alunos.forEach(a => {
      if (cursosMap[a.curso_id]) {
        cursosMap[a.curso_id].alunos += 1;
      }
    });

    return Object.values(cursosMap).filter(c => c.receita > 0 || c.alunos > 0);
  }, [cursos, faturas, alunos]);

  const anoAnterior = ano - 1;
  const comparativoAnual = useMemo(() => {
    const anoAtualTotal = pagamentos
      .filter(p => new Date(p.data_pagamento).getFullYear() === ano)
      .reduce((sum, p) => sum + Number(p.valor), 0);
    
    const anoAnteriorTotal = pagamentos
      .filter(p => new Date(p.data_pagamento).getFullYear() === anoAnterior)
      .reduce((sum, p) => sum + Number(p.valor), 0);

    const variacao = anoAnteriorTotal > 0 
      ? ((anoAtualTotal - anoAnteriorTotal) / anoAnteriorTotal) * 100 
      : 0;

    return { anoAtualTotal, anoAnteriorTotal, variacao };
  }, [pagamentos, ano, anoAnterior]);

  const exportToCSV = (data: Record<string, unknown>[], filename: string, headers: { key: string; label: string }[]) => {
    const csvHeaders = headers.map(h => h.label).join(";");
    const csvRows = data.map(row => 
      headers.map(h => {
        const value = row[h.key];
        if (typeof value === "number") {
          return value.toFixed(2).replace(".", ",");
        }
        return String(value || "");
      }).join(";")
    );
    
    const csvContent = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  const exportarReceitaMensal = () => {
    const data = monthlyData.map((m, i) => ({
      mes: mesesCompletos[i],
      ano: anoSelecionado,
      entradas: m.entradas,
      saidas: m.saidas,
      saldo: m.saldo,
    }));
    exportToCSV(data, "receita_mensal", [
      { key: "mes", label: "Mês" },
      { key: "ano", label: "Ano" },
      { key: "entradas", label: "Receitas (R$)" },
      { key: "saidas", label: "Despesas (R$)" },
      { key: "saldo", label: "Saldo (R$)" },
    ]);
  };

  const exportarInadimplencia = () => {
    const data = faturasVencidas.map(f => ({
      aluno: f.alunos?.nome_completo || "",
      responsavel: f.responsaveis?.nome || "",
      valor: f.valor,
      vencimento: format(new Date(f.data_vencimento), "dd/MM/yyyy"),
      diasVencido: Math.floor((new Date().getTime() - new Date(f.data_vencimento).getTime()) / (1000 * 60 * 60 * 24))
    }));
    exportToCSV(data, "inadimplencia", [
      { key: "aluno", label: "Aluno" },
      { key: "responsavel", label: "Responsável" },
      { key: "valor", label: "Valor (R$)" },
      { key: "vencimento", label: "Vencimento" },
      { key: "diasVencido", label: "Dias Vencido" }
    ]);
  };

  const anos = Array.from({ length: 5 }, (_, i) => (currentDate.getFullYear() - 2 + i).toString());

  const sections = [
    { id: "visao-geral", label: "Visão geral" },
    { id: "mensal", label: "Mensal" },
    { id: "inadimplencia", label: "Inadimplência" },
    { id: "cursos", label: "Por curso" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-2.5 min-w-[120px]">
          <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </span>
              <span className="font-medium text-foreground">
                {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <PremiumGate feature="advancedReports">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Filters Bar */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">De</span>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportarReceitaMensal}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Mensal
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportarInadimplencia}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Inadimplência
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialKPICard
            title={t("reports.received")}
            value={formatCurrency(totalEntradasPeriodo)}
            subtitle={t("reports.inPeriod")}
            icon={TrendingUp}
            variant="success"
            index={0}
          />
          <FinancialKPICard
            title={t("reports.expenses")}
            value={formatCurrency(totalSaidasPeriodo)}
            subtitle={t("reports.inPeriod")}
            icon={TrendingDown}
            variant="danger"
            index={1}
          />
          <FinancialKPICard
            title={t("reports.balance")}
            value={formatCurrency(saldoPeriodo)}
            subtitle={t("reports.revenuesMinusExpenses")}
            icon={DollarSign}
            variant={saldoPeriodo >= 0 ? "success" : "danger"}
            index={2}
          />
          <FinancialKPICard
            title={t("reports.delinquency")}
            value={`${taxaInadimplencia.toFixed(1)}%`}
            subtitle={formatCurrency(valorInadimplente)}
            icon={AlertTriangle}
            variant={taxaInadimplencia > 10 ? "danger" : taxaInadimplencia > 5 ? "warning" : "success"}
            index={3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.averageTicket")}</p>
              <p className="text-sm font-semibold">{formatCurrency(ticketMedio)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <Wallet className="h-4 w-4 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.openValue")}</p>
              <p className="text-sm font-semibold text-warning">{formatCurrency(valorEmAberto)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("reports.students")}</p>
              <p className="text-sm font-semibold">{alunos.length}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            {comparativoAnual.variacao >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">vs {anoAnterior}</p>
              <p className={cn("text-sm font-semibold", comparativoAnual.variacao >= 0 ? "text-success" : "text-destructive")}>
                {comparativoAnual.variacao >= 0 ? "+" : ""}{comparativoAnual.variacao.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Faturas</p>
              <p className="text-sm font-semibold">{faturas.length}</p>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex border-b border-border">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeSection === section.id
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Visão Geral */}
          {activeSection === "visao-geral" && (
            <div className="p-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Chart */}
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Receitas x Despesas</p>
                  <p className="text-xs text-muted-foreground mb-4">{anoSelecionado}</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={saldoAcumuladoMensal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="entradas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[3, 3, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="saidas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[3, 3, 0, 0]} maxBarSize={24} />
                        <Line type="monotone" dataKey="saldoAcumulado" name="Acumulado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status */}
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Status das faturas</p>
                  <p className="text-xs text-muted-foreground mb-4">Distribuição atual</p>
                  <div className="h-64 flex items-center gap-6">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} faturas`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {statusData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <div>
                            <p className="text-xs font-medium">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">{entry.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Métodos */}
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Por método</p>
                  <div className="space-y-3">
                    {pagamentosPorMetodo.map((metodo) => (
                      <div key={metodo.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{metodo.name}</span>
                          <span className="text-muted-foreground">{formatCurrency(metodo.value)}</span>
                        </div>
                        <Progress 
                          value={totalEntradasPeriodo > 0 ? (metodo.value / totalEntradasPeriodo) * 100 : 0} 
                          className="h-1.5"
                        />
                      </div>
                    ))}
                    {pagamentosPorMetodo.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                    )}
                  </div>
                </div>

                {/* Aging */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-foreground">Aging</p>
                  </div>
                  {agingChartData.length > 0 ? (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingChartData} layout="vertical">
                          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="faixa" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={45} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="valor" radius={[0, 3, 3, 0]}>
                            {agingChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Sem vencidas</p>
                    </div>
                  )}
                </div>

                {/* Cursos */}
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Por curso</p>
                  <div className="space-y-2.5">
                    {receitaPorCurso.slice(0, 5).map((c) => (
                      <div key={c.nome} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[140px]">{c.nome}</span>
                        <span className="font-medium">{formatCurrency(c.receita)}</span>
                      </div>
                    ))}
                    {receitaPorCurso.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mensal */}
          {activeSection === "mensal" && (
            <div className="p-4 space-y-4">
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-4">Resumo mensal - {anoSelecionado}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Mês</TableHead>
                      <TableHead className="text-xs text-right">Receitas</TableHead>
                      <TableHead className="text-xs text-right">Despesas</TableHead>
                      <TableHead className="text-xs text-right">Saldo</TableHead>
                      <TableHead className="text-xs text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((m, i) => (
                      <TableRow key={m.mes}>
                        <TableCell className="text-sm">{mesesCompletos[i]}</TableCell>
                        <TableCell className="text-sm text-right text-green-600">{formatCurrency(m.entradas)}</TableCell>
                        <TableCell className="text-sm text-right text-destructive">{formatCurrency(m.saidas)}</TableCell>
                        <TableCell className={cn("text-sm text-right font-medium", m.saldo >= 0 ? "text-green-600" : "text-destructive")}>
                          {formatCurrency(m.saldo)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("text-xs px-1.5 py-0.5 rounded", m.taxaRecebimento >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground")}>
                            {m.taxaRecebimento.toFixed(0)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Inadimplência */}
          {activeSection === "inadimplencia" && (
            <div className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="text-center py-4 border border-border rounded-lg">
                  <p className="text-3xl font-semibold text-yellow-600">{faturasVencidas.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Faturas vencidas</p>
                </div>
                <div className="text-center py-4 border border-border rounded-lg">
                  <p className="text-3xl font-semibold text-destructive">{alunosInadimplentes.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Alunos</p>
                </div>
                <div className="text-center py-4 border border-border rounded-lg">
                  <p className="text-3xl font-semibold text-yellow-600">{formatCurrency(valorInadimplente)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Valor total</p>
                </div>
                <div className="text-center py-4 border border-border rounded-lg">
                  <p className={cn("text-3xl font-semibold", taxaInadimplencia <= 5 ? "text-green-600" : "text-yellow-600")}>
                    {taxaInadimplencia.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Taxa</p>
                </div>
              </div>

              {faturasVencidas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
                  <p className="text-sm font-medium">Parabéns!</p>
                  <p className="text-xs text-muted-foreground">Nenhuma fatura vencida</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Aluno</TableHead>
                        <TableHead className="text-xs">Responsável</TableHead>
                        <TableHead className="text-xs">Referência</TableHead>
                        <TableHead className="text-xs text-right">Valor</TableHead>
                        <TableHead className="text-xs text-right">Atraso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faturasVencidas.slice(0, 15).map((fatura) => {
                        const diasVencido = Math.floor((new Date().getTime() - new Date(fatura.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={fatura.id}>
                            <TableCell className="text-sm font-medium">{fatura.alunos?.nome_completo}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fatura.responsaveis?.nome || "-"}</TableCell>
                            <TableCell className="text-sm">{mesesCompletos[fatura.mes_referencia - 1]}/{fatura.ano_referencia}</TableCell>
                            <TableCell className="text-sm text-right font-medium text-yellow-600">{formatCurrency(fatura.valor)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={diasVencido > 60 ? "destructive" : "secondary"} className="text-xs">
                                {diasVencido}d
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Cursos */}
          {activeSection === "cursos" && (
            <div className="p-4">
              <div className="border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Curso</TableHead>
                      <TableHead className="text-xs text-right">Alunos</TableHead>
                      <TableHead className="text-xs text-right">Receita</TableHead>
                      <TableHead className="text-xs text-right">Ticket médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitaPorCurso.map((c) => (
                      <TableRow key={c.nome}>
                        <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">{c.alunos}</TableCell>
                        <TableCell className="text-sm text-right font-medium text-green-600">{formatCurrency(c.receita)}</TableCell>
                        <TableCell className="text-sm text-right">{c.alunos > 0 ? formatCurrency(c.receita / c.alunos) : "-"}</TableCell>
                      </TableRow>
                    ))}
                    {receitaPorCurso.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                          Sem dados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
      </PremiumGate>
    </DashboardLayout>
  );
};

export default Relatorios;
