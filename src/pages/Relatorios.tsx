import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  Wallet,
  Receipt,
  BookOpen,
  UserCheck,
  Percent,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency as formatCurrencyLib } from "@/lib/formatters";
import { FinancialKPICard } from "@/components/dashboard/FinancialKPICard";
import { motion } from "framer-motion";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesesCompletos = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
  Paga: 'hsl(142, 76%, 36%)',
  Aberta: 'hsl(217, 91%, 60%)',
  Vencida: 'hsl(0, 84%, 60%)',
  Cancelada: 'hsl(var(--muted-foreground))'
};

const Relatorios = () => {
  const currentDate = new Date();
  const [periodoInicio, setPeriodoInicio] = useState(format(subMonths(currentDate, 6), "yyyy-MM-dd"));
  const [periodoFim, setPeriodoFim] = useState(format(currentDate, "yyyy-MM-dd"));
  const [anoSelecionado, setAnoSelecionado] = useState(currentDate.getFullYear().toString());
  const [activeTab, setActiveTab] = useState("visao-geral");

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

  const { data: responsaveis = [] } = useQuery({
    queryKey: ["responsaveis-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("responsaveis").select("*").eq("ativo", true);
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

  // Filtrar por período
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

  // Dados mensais do ano selecionado
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

  // Saldo acumulado por mês
  const saldoAcumuladoMensal = useMemo(() => {
    let acumulado = 0;
    return monthlyData.map(m => {
      acumulado += m.saldo;
      return { ...m, saldoAcumulado: acumulado };
    });
  }, [monthlyData]);

  // Faturas vencidas (inadimplência)
  const faturasVencidas = faturas.filter((f) => f.status === "Vencida");
  const alunosInadimplentes = [...new Set(faturasVencidas.map((f) => f.aluno_id))];
  const taxaInadimplencia = alunos.length > 0 ? (alunosInadimplentes.length / alunos.length) * 100 : 0;
  const valorInadimplente = faturasVencidas.reduce((sum, f) => sum + Number(f.valor), 0);

  // Aging de inadimplência
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
    { faixa: "0-30 dias", valor: agingData.ate30, fill: "hsl(38, 92%, 50%)" },
    { faixa: "31-60 dias", valor: agingData.de31a60, fill: "hsl(25, 95%, 53%)" },
    { faixa: "61-90 dias", valor: agingData.de61a90, fill: "hsl(0, 84%, 60%)" },
    { faixa: "+90 dias", valor: agingData.mais90, fill: "hsl(0, 72%, 51%)" },
  ].filter(d => d.valor > 0), [agingData]);

  // Totais do período
  const pagamentosPeriodo = filtrarPorPeriodo(pagamentos, "data_pagamento");
  const despesasPeriodo = filtrarPorPeriodo(despesas.filter(d => d.paga), "data_pagamento");
  
  const totalEntradasPeriodo = pagamentosPeriodo.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalSaidasPeriodo = despesasPeriodo.reduce((sum, d) => sum + Number(d.valor), 0);
  const saldoPeriodo = totalEntradasPeriodo - totalSaidasPeriodo;

  // Totais gerais
  const totalEntradas = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalSaidas = despesas.filter((d) => d.paga).reduce((sum, d) => sum + Number(d.valor), 0);
  const saldoAcumulado = totalEntradas - totalSaidas;

  // Faturas em aberto
  const faturasEmAberto = faturas.filter((f) => f.status === "Aberta" || f.status === "Vencida");
  const valorEmAberto = faturasEmAberto.reduce((sum, f) => sum + Number(f.valor), 0);

  // Ticket médio
  const ticketMedio = pagamentos.length > 0 ? totalEntradas / pagamentos.length : 0;

  // Dados para gráfico de pizza - Status das faturas
  const statusData = useMemo(() => [
    { name: "Pagas", value: faturas.filter(f => f.status === "Paga").length, color: STATUS_COLORS.Paga },
    { name: "Abertas", value: faturas.filter(f => f.status === "Aberta").length, color: STATUS_COLORS.Aberta },
    { name: "Vencidas", value: faturas.filter(f => f.status === "Vencida").length, color: STATUS_COLORS.Vencida },
    { name: "Canceladas", value: faturas.filter(f => f.status === "Cancelada").length, color: STATUS_COLORS.Cancelada },
  ].filter(s => s.value > 0), [faturas]);

  // Pagamentos por método
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

  // Receita por curso
  const receitaPorCurso = useMemo(() => {
    const cursosMap: Record<string, { nome: string; receita: number; alunos: number; faturas: number }> = {};
    
    cursos.forEach(c => {
      cursosMap[c.id] = { nome: c.nome, receita: 0, alunos: 0, faturas: 0 };
    });

    faturas.filter(f => f.status === "Paga").forEach(f => {
      if (cursosMap[f.curso_id]) {
        cursosMap[f.curso_id].receita += Number(f.valor);
        cursosMap[f.curso_id].faturas += 1;
      }
    });

    alunos.forEach(a => {
      if (cursosMap[a.curso_id]) {
        cursosMap[a.curso_id].alunos += 1;
      }
    });

    return Object.values(cursosMap).filter(c => c.receita > 0 || c.alunos > 0);
  }, [cursos, faturas, alunos]);

  // Top responsáveis por receita
  const topResponsaveis = useMemo(() => {
    const respMap: Record<string, { nome: string; receita: number; faturasPagas: number; faturasVencidas: number }> = {};
    
    faturas.forEach(f => {
      if (f.responsavel_id) {
        if (!respMap[f.responsavel_id]) {
          respMap[f.responsavel_id] = { 
            nome: f.responsaveis?.nome || "Desconhecido", 
            receita: 0, 
            faturasPagas: 0, 
            faturasVencidas: 0 
          };
        }
        if (f.status === "Paga") {
          respMap[f.responsavel_id].receita += Number(f.valor);
          respMap[f.responsavel_id].faturasPagas += 1;
        } else if (f.status === "Vencida") {
          respMap[f.responsavel_id].faturasVencidas += 1;
        }
      }
    });

    return Object.values(respMap)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }, [faturas]);

  // Comparativo ano anterior
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

  // Despesas por categoria
  const despesasPorCategoria = useMemo(() => ["fixa", "variavel", "unica"].map((cat) => {
    const total = despesas
      .filter((d) => d.categoria === cat && d.paga)
      .reduce((sum, d) => sum + Number(d.valor), 0);
    return {
      categoria: cat === "unica" ? "Única" : cat === "variavel" ? "Variável" : "Fixa",
      valor: total
    };
  }), [despesas]);

  // Previsão de fluxo (próximos 3 meses)
  const previsaoFluxo = useMemo(() => {
    const proximosMeses = [];
    for (let i = 1; i <= 3; i++) {
      const mes = (currentDate.getMonth() + i) % 12;
      const anoRef = currentDate.getMonth() + i > 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
      
      const faturasPrevisao = faturas.filter(f => 
        f.mes_referencia === mes + 1 && 
        f.ano_referencia === anoRef &&
        (f.status === "Aberta" || f.status === "Vencida")
      );
      
      const valorPrevisto = faturasPrevisao.reduce((sum, f) => sum + Number(f.valor), 0);
      
      proximosMeses.push({
        mes: meses[mes],
        mesCompleto: mesesCompletos[mes],
        valorPrevisto,
        qtdFaturas: faturasPrevisao.length
      });
    }
    return proximosMeses;
  }, [faturas, currentDate]);

  // Função para exportar CSV
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
    toast.success(`Relatório ${filename} exportado com sucesso!`);
  };

  const exportarReceitaMensal = () => {
    const data = monthlyData.map((m, i) => ({
      mes: mesesCompletos[i],
      ano: anoSelecionado,
      entradas: m.entradas,
      saidas: m.saidas,
      saldo: m.saldo,
      valorEmitido: m.valorEmitido,
      taxaRecebimento: m.taxaRecebimento
    }));
    exportToCSV(data, "receita_mensal", [
      { key: "mes", label: "Mês" },
      { key: "ano", label: "Ano" },
      { key: "entradas", label: "Receitas (R$)" },
      { key: "saidas", label: "Despesas (R$)" },
      { key: "saldo", label: "Saldo (R$)" },
      { key: "valorEmitido", label: "Faturas Emitidas (R$)" },
      { key: "taxaRecebimento", label: "Taxa Recebimento (%)" }
    ]);
  };

  const exportarInadimplencia = () => {
    const data = faturasVencidas.map(f => ({
      aluno: f.alunos?.nome_completo || "",
      responsavel: f.responsaveis?.nome || "",
      curso: f.cursos?.nome || "",
      mesReferencia: `${mesesCompletos[f.mes_referencia - 1]}/${f.ano_referencia}`,
      valor: f.valor,
      vencimento: format(new Date(f.data_vencimento), "dd/MM/yyyy"),
      diasVencido: Math.floor((new Date().getTime() - new Date(f.data_vencimento).getTime()) / (1000 * 60 * 60 * 24))
    }));
    exportToCSV(data, "inadimplencia", [
      { key: "aluno", label: "Aluno" },
      { key: "responsavel", label: "Responsável" },
      { key: "curso", label: "Curso" },
      { key: "mesReferencia", label: "Referência" },
      { key: "valor", label: "Valor (R$)" },
      { key: "vencimento", label: "Vencimento" },
      { key: "diasVencido", label: "Dias Vencido" }
    ]);
  };

  const exportarPagamentosRecebidos = () => {
    const data = pagamentosPeriodo.map(p => ({
      data: format(new Date(p.data_pagamento), "dd/MM/yyyy"),
      aluno: p.faturas?.alunos?.nome_completo || "",
      curso: p.faturas?.cursos?.nome || "",
      valor: p.valor,
      metodo: p.metodo,
      referencia: p.referencia || "",
      gateway: p.gateway || "Manual"
    }));
    exportToCSV(data, "pagamentos_recebidos", [
      { key: "data", label: "Data" },
      { key: "aluno", label: "Aluno" },
      { key: "curso", label: "Curso" },
      { key: "valor", label: "Valor (R$)" },
      { key: "metodo", label: "Método" },
      { key: "referencia", label: "Referência" },
      { key: "gateway", label: "Gateway" }
    ]);
  };

  const exportarResumoFinanceiro = () => {
    const data = [{
      periodo: `${format(new Date(periodoInicio), "dd/MM/yyyy")} a ${format(new Date(periodoFim), "dd/MM/yyyy")}`,
      totalRecebido: totalEntradasPeriodo,
      totalDespesas: totalSaidasPeriodo,
      saldoPeriodo: saldoPeriodo,
      valorEmAberto: valorEmAberto,
      valorInadimplente: valorInadimplente,
      taxaInadimplencia: taxaInadimplencia,
      alunosAtivos: alunos.length,
      responsaveisAtivos: responsaveis.length
    }];
    exportToCSV(data, "resumo_financeiro", [
      { key: "periodo", label: "Período" },
      { key: "totalRecebido", label: "Total Recebido (R$)" },
      { key: "totalDespesas", label: "Total Despesas (R$)" },
      { key: "saldoPeriodo", label: "Saldo Período (R$)" },
      { key: "valorEmAberto", label: "Valor em Aberto (R$)" },
      { key: "valorInadimplente", label: "Valor Inadimplente (R$)" },
      { key: "taxaInadimplencia", label: "Taxa Inadimplência (%)" },
      { key: "alunosAtivos", label: "Alunos Ativos" },
      { key: "responsaveisAtivos", label: "Responsáveis Ativos" }
    ]);
  };

  const exportarPorCurso = () => {
    exportToCSV(receitaPorCurso as Record<string, unknown>[], "receita_por_curso", [
      { key: "nome", label: "Curso" },
      { key: "alunos", label: "Alunos" },
      { key: "faturas", label: "Faturas Pagas" },
      { key: "receita", label: "Receita (R$)" }
    ]);
  };

  const anos = Array.from({ length: 5 }, (_, i) => (currentDate.getFullYear() - 2 + i).toString());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Financeiro</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Relatórios</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            
            <p className="text-muted-foreground mt-1 text-sm">
              Análise completa com insights e exportação
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportarResumoFinanceiro} className="gap-2">
              <Download className="h-4 w-4" />
              Resumo
            </Button>
            <Button variant="outline" size="sm" onClick={exportarReceitaMensal} className="gap-2">
              <Download className="h-4 w-4" />
              Mensal
            </Button>
            <Button variant="outline" size="sm" onClick={exportarInadimplencia} className="gap-2">
              <Download className="h-4 w-4" />
              Inadimplência
            </Button>
            <Button variant="outline" size="sm" onClick={exportarPorCurso} className="gap-2">
              <Download className="h-4 w-4" />
              Por Curso
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ano (Gráficos)</Label>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialKPICard
            title="Total Recebido"
            value={formatCurrency(totalEntradasPeriodo)}
            subtitle="No período selecionado"
            icon={TrendingUp}
            variant="success"
          />
          <FinancialKPICard
            title="Total Despesas"
            value={formatCurrency(totalSaidasPeriodo)}
            subtitle="No período selecionado"
            icon={TrendingDown}
            variant="danger"
          />
          <FinancialKPICard
            title="Saldo do Período"
            value={formatCurrency(saldoPeriodo)}
            subtitle="Receitas - Despesas"
            icon={DollarSign}
            variant={saldoPeriodo >= 0 ? "success" : "danger"}
            trend={saldoPeriodo >= 0 ? { value: Math.abs((saldoPeriodo / totalEntradasPeriodo) * 100), isPositive: true } : undefined}
          />
          <FinancialKPICard
            title="Inadimplência"
            value={`${taxaInadimplencia.toFixed(1)}%`}
            subtitle={formatCurrency(valorInadimplente)}
            icon={AlertTriangle}
            variant={taxaInadimplencia > 10 ? "danger" : taxaInadimplencia > 5 ? "warning" : "success"}
          />
        </div>

        {/* KPIs Secundários */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-xl font-bold">{formatCurrency(ticketMedio)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Aberto</p>
                    <p className="text-xl font-bold text-warning">{formatCurrency(valorEmAberto)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                    <p className="text-xl font-bold">{alunos.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    comparativoAnual.variacao >= 0 ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    {comparativoAnual.variacao >= 0 ? (
                      <ArrowUpRight className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">vs {anoAnterior}</p>
                    <p className={cn(
                      "text-xl font-bold",
                      comparativoAnual.variacao >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {comparativoAnual.variacao >= 0 ? "+" : ""}{comparativoAnual.variacao.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Faturas</p>
                    <p className="text-xl font-bold">{faturas.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs de relatórios */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="visao-geral" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="mensal" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Mensal</span>
            </TabsTrigger>
            <TabsTrigger value="inadimplencia" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Inadimplência</span>
            </TabsTrigger>
            <TabsTrigger value="cursos" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Por Curso</span>
            </TabsTrigger>
            <TabsTrigger value="responsaveis" className="gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Responsáveis</span>
            </TabsTrigger>
            <TabsTrigger value="detalhado" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Detalhado</span>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Receitas x Despesas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Receitas x Despesas - {anoSelecionado}
                  </CardTitle>
                  <CardDescription>Evolução financeira mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={saldoAcumuladoMensal}>
                        <defs>
                          <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} />
                        <Bar dataKey="entradas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="saidas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Line type="monotone" dataKey="saldoAcumulado" name="Saldo Acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status das Faturas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    Distribuição de Faturas
                  </CardTitle>
                  <CardDescription>Status atual de todas as faturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72 flex items-center">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
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
                        <div key={entry.name} className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <div>
                            <p className="text-sm font-medium">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">{entry.value} faturas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Métodos de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pagamentos por Método</CardTitle>
                  <CardDescription>Período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pagamentosPorMetodo.map((metodo, index) => (
                      <div key={metodo.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{metodo.name}</span>
                          <span className="text-muted-foreground">{formatCurrency(metodo.value)}</span>
                        </div>
                        <Progress 
                          value={totalEntradasPeriodo > 0 ? (metodo.value / totalEntradasPeriodo) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    ))}
                    {pagamentosPorMetodo.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum pagamento no período
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Aging de Inadimplência */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Aging de Inadimplência
                  </CardTitle>
                  <CardDescription>Tempo de atraso das faturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          0-30 dias
                        </span>
                        <span className="font-medium">{formatCurrency(agingData.ate30)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          31-60 dias
                        </span>
                        <span className="font-medium">{formatCurrency(agingData.de31a60)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          61-90 dias
                        </span>
                        <span className="font-medium">{formatCurrency(agingData.de61a90)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-700" />
                          +90 dias
                        </span>
                        <span className="font-medium">{formatCurrency(agingData.mais90)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span className="text-destructive">{formatCurrency(valorInadimplente)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Previsão de Fluxo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Previsão de Recebimento
                  </CardTitle>
                  <CardDescription>Próximos 3 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {previsaoFluxo.map((prev) => (
                      <div key={prev.mes} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{prev.mesCompleto}</p>
                          <p className="text-xs text-muted-foreground">{prev.qtdFaturas} faturas</p>
                        </div>
                        <p className="font-semibold text-primary">{formatCurrency(prev.valorPrevisto)}</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total Previsto</span>
                        <span className="text-primary">
                          {formatCurrency(previsaoFluxo.reduce((s, p) => s + p.valorPrevisto, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mensal */}
          <TabsContent value="mensal" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Receitas x Despesas - {anoSelecionado}</CardTitle>
                  <CardDescription>Evolução financeira mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} />
                        <Bar dataKey="entradas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="saidas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Recebimento por Mês</CardTitle>
                  <CardDescription>Percentual de faturas recebidas vs emitidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Area type="monotone" dataKey="taxaRecebimento" name="Taxa de Recebimento" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorTaxa)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela mensal */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resumo Mensal - {anoSelecionado}</CardTitle>
                  <CardDescription>Detalhamento mês a mês</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportarReceitaMensal} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Taxa Receb.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((m, i) => (
                      <TableRow key={m.mes}>
                        <TableCell className="font-medium">{mesesCompletos[i]}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(m.entradas)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(m.saidas)}</TableCell>
                        <TableCell className={cn("text-right font-medium", m.saldo >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(m.saldo)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={m.taxaRecebimento >= 80 ? "default" : m.taxaRecebimento >= 50 ? "secondary" : "destructive"}>
                            {m.taxaRecebimento.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inadimplência */}
          <TabsContent value="inadimplencia" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-warning/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-warning">{faturasVencidas.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Faturas Vencidas</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-destructive/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-destructive">{alunosInadimplentes.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Alunos Inadimplentes</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-warning/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-warning">{formatCurrency(valorInadimplente)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Valor Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("border-warning/30", taxaInadimplencia <= 5 && "border-success/30")}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className={cn("text-4xl font-bold", taxaInadimplencia <= 5 ? "text-success" : taxaInadimplencia <= 10 ? "text-warning" : "text-destructive")}>
                      {taxaInadimplencia.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Taxa de Inadimplência</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Gráfico de Aging */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Aging de Inadimplência
                  </CardTitle>
                  <CardDescription>Distribuição por tempo de atraso</CardDescription>
                </CardHeader>
                <CardContent>
                  {agingChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis type="category" dataKey="faixa" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={80} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                          <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]}>
                            {agingChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                        <TrendingUp className="h-6 w-6 text-success" />
                      </div>
                      <p className="font-medium">Parabéns!</p>
                      <p className="text-sm text-muted-foreground">Nenhuma fatura vencida</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Despesas por categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription>Distribuição das saídas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {despesasPorCategoria.map((cat, index) => (
                      <div key={cat.categoria} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cat.categoria}</span>
                          <span className="font-bold">{formatCurrency(cat.valor)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${totalSaidas > 0 ? (cat.valor / totalSaidas) * 100 : 0}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{ backgroundColor: COLORS[index] }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de inadimplência */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Detalhes da Inadimplência</CardTitle>
                  <CardDescription>
                    {faturasVencidas.length} fatura(s) vencida(s)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportarInadimplencia} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                {faturasVencidas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                    <p className="font-medium">Parabéns!</p>
                    <p className="text-sm text-muted-foreground">Nenhuma fatura vencida</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Atraso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faturasVencidas.slice(0, 15).map((fatura) => {
                        const diasVencido = Math.floor((new Date().getTime() - new Date(fatura.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={fatura.id}>
                            <TableCell className="font-medium">{fatura.alunos?.nome_completo}</TableCell>
                            <TableCell>{fatura.responsaveis?.nome || "-"}</TableCell>
                            <TableCell>
                              {mesesCompletos[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                            </TableCell>
                            <TableCell className="font-semibold text-warning">
                              {formatCurrency(fatura.valor)}
                            </TableCell>
                            <TableCell>{format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant={diasVencido > 60 ? "destructive" : diasVencido > 30 ? "secondary" : "outline"}>
                                {diasVencido} dias
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Curso */}
          <TabsContent value="cursos" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Receita por Curso
                  </CardTitle>
                  <CardDescription>Performance financeira de cada curso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={receitaPorCurso} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis type="category" dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={120} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Detalhamento por Curso</CardTitle>
                    <CardDescription>Alunos, faturas e receita</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportarPorCurso} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Curso</TableHead>
                        <TableHead className="text-right">Alunos</TableHead>
                        <TableHead className="text-right">Fat. Pagas</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receitaPorCurso.map((curso) => (
                        <TableRow key={curso.nome}>
                          <TableCell className="font-medium">{curso.nome}</TableCell>
                          <TableCell className="text-right">{curso.alunos}</TableCell>
                          <TableCell className="text-right">{curso.faturas}</TableCell>
                          <TableCell className="text-right font-semibold text-success">
                            {formatCurrency(curso.receita)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Responsáveis */}
          <TabsContent value="responsaveis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Top 10 Responsáveis por Receita
                </CardTitle>
                <CardDescription>Maiores contribuidores financeiros</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Faturas Pagas</TableHead>
                      <TableHead className="text-right">Faturas Vencidas</TableHead>
                      <TableHead className="text-right">Receita Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topResponsaveis.map((resp, index) => (
                      <TableRow key={resp.nome}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            {index + 1}º
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{resp.nome}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-success border-success/30">
                            {resp.faturasPagas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {resp.faturasVencidas > 0 ? (
                            <Badge variant="destructive">{resp.faturasVencidas}</Badge>
                          ) : (
                            <Badge variant="outline">0</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          {formatCurrency(resp.receita)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detalhado */}
          <TabsContent value="detalhado" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pagamentos do Período</CardTitle>
                  <CardDescription>
                    {pagamentosPeriodo.length} pagamento(s) - Total: {formatCurrency(totalEntradasPeriodo)}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportarPagamentosRecebidos} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                {pagamentosPeriodo.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum pagamento no período selecionado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Gateway</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosPeriodo.slice(0, 20).map((pagamento) => (
                        <TableRow key={pagamento.id}>
                          <TableCell>{format(new Date(pagamento.data_pagamento), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="font-medium">
                            {pagamento.faturas?.alunos?.nome_completo || "-"}
                          </TableCell>
                          <TableCell>{pagamento.faturas?.cursos?.nome || "-"}</TableCell>
                          <TableCell className="font-semibold text-success">
                            {formatCurrency(pagamento.valor)}
                          </TableCell>
                          <TableCell>{pagamento.metodo}</TableCell>
                          <TableCell>
                            <Badge variant={pagamento.gateway === "asaas" ? "default" : pagamento.gateway === "stripe" ? "secondary" : "outline"}>
                              {pagamento.gateway || "Manual"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
