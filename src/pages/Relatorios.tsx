import { useState } from "react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
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
  CreditCard
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mesesCompletos = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8884d8', '#82ca9d'];

const Relatorios = () => {
  const currentDate = new Date();
  const [periodoInicio, setPeriodoInicio] = useState(format(subMonths(currentDate, 6), "yyyy-MM-dd"));
  const [periodoFim, setPeriodoFim] = useState(format(currentDate, "yyyy-MM-dd"));
  const [anoSelecionado, setAnoSelecionado] = useState(currentDate.getFullYear().toString());

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
      const { data, error } = await supabase.from("alunos").select("*").eq("status_matricula", "ativo");
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
  const monthlyData = meses.map((mes, index) => {
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
  });

  // Faturas vencidas (inadimplência)
  const faturasVencidas = faturas.filter((f) => f.status === "Vencida");
  const alunosInadimplentes = [...new Set(faturasVencidas.map((f) => f.aluno_id))];
  const taxaInadimplencia = alunos.length > 0 ? (alunosInadimplentes.length / alunos.length) * 100 : 0;
  const valorInadimplente = faturasVencidas.reduce((sum, f) => sum + Number(f.valor), 0);

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

  // Dados para gráfico de pizza - Status das faturas
  const statusData = [
    { name: "Pagas", value: faturas.filter(f => f.status === "Paga").length, color: "hsl(142, 76%, 36%)" },
    { name: "Abertas", value: faturas.filter(f => f.status === "Aberta").length, color: "hsl(var(--primary))" },
    { name: "Vencidas", value: faturas.filter(f => f.status === "Vencida").length, color: "hsl(0, 84%, 60%)" },
    { name: "Canceladas", value: faturas.filter(f => f.status === "Cancelada").length, color: "hsl(var(--muted-foreground))" },
  ].filter(s => s.value > 0);

  // Despesas por categoria
  const despesasPorCategoria = ["fixa", "variavel", "unica"].map((cat) => {
    const total = despesas
      .filter((d) => d.categoria === cat && d.paga)
      .reduce((sum, d) => sum + Number(d.valor), 0);
    return {
      categoria: cat === "unica" ? "Única" : cat === "variavel" ? "Variável" : "Fixa",
      valor: total
    };
  });

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

  const anos = Array.from({ length: 5 }, (_, i) => (currentDate.getFullYear() - 2 + i).toString());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h2>
            <p className="text-muted-foreground mt-1">
              Análise completa com exportação para CSV
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportarResumoFinanceiro} className="gap-2">
              <Download className="h-4 w-4" />
              Resumo Geral
            </Button>
            <Button variant="outline" onClick={exportarReceitaMensal} className="gap-2">
              <Download className="h-4 w-4" />
              Receita Mensal
            </Button>
            <Button variant="outline" onClick={exportarInadimplencia} className="gap-2">
              <Download className="h-4 w-4" />
              Inadimplência
            </Button>
            <Button variant="outline" onClick={exportarPagamentosRecebidos} className="gap-2">
              <Download className="h-4 w-4" />
              Pagamentos
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
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

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalEntradasPeriodo)}</p>
                  <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Despesas</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalSaidasPeriodo)}</p>
                  <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("border-primary/20", saldoPeriodo < 0 && "border-destructive/20")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Período</p>
                  <p className={cn("text-2xl font-bold", saldoPeriodo >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(saldoPeriodo)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", saldoPeriodo >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                  <DollarSign className={cn("h-6 w-6", saldoPeriodo >= 0 ? "text-success" : "text-destructive")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inadimplência</p>
                  <p className="text-2xl font-bold text-warning">{taxaInadimplencia.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(valorInadimplente)} em aberto</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de relatórios */}
        <Tabs defaultValue="mensal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mensal">Receita Mensal</TabsTrigger>
            <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
            <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
          </TabsList>

          <TabsContent value="mensal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receitas x Despesas - {anoSelecionado}</CardTitle>
                <CardDescription>Evolução financeira mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis
                        className="text-xs"
                        tickFormatter={(value) =>
                          new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
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
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="taxaRecebimento" 
                        name="Taxa de Recebimento"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inadimplencia" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-warning">{faturasVencidas.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Faturas Vencidas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-destructive">{alunosInadimplentes.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Alunos Inadimplentes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-warning">{formatCurrency(valorInadimplente)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Valor Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                        <TableHead>Referência</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Dias</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faturasVencidas.slice(0, 15).map((fatura) => {
                        const diasVencido = Math.floor((new Date().getTime() - new Date(fatura.data_vencimento).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={fatura.id}>
                            <TableCell className="font-medium">{fatura.alunos?.nome_completo}</TableCell>
                            <TableCell>
                              {mesesCompletos[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                            </TableCell>
                            <TableCell className="font-semibold text-warning">
                              {formatCurrency(fatura.valor)}
                            </TableCell>
                            <TableCell>{format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{diasVencido} dias</Badge>
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

          <TabsContent value="distribuicao" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status das Faturas</CardTitle>
                  <CardDescription>Distribuição por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {statusData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${totalSaidas > 0 ? (cat.valor / totalSaidas) * 100 : 0}%`,
                              backgroundColor: COLORS[index]
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{alunos.length}</p>
                      <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{faturas.length}</p>
                      <p className="text-sm text-muted-foreground">Total de Faturas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pagamentos.length}</p>
                      <p className="text-sm text-muted-foreground">Pagamentos Recebidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                          <TableCell className="font-semibold text-success">
                            {formatCurrency(pagamento.valor)}
                          </TableCell>
                          <TableCell>{pagamento.metodo}</TableCell>
                          <TableCell>
                            <Badge variant={pagamento.gateway === "stripe" ? "default" : "secondary"}>
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
