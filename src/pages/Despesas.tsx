import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CheckCircle, ChevronDown, Printer, UserPlus, Receipt, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────
interface Receita {
  id: string;
  valor: number;
  valor_total: number | null;
  data_vencimento: string;
  data_emissao: string;
  status: string;
  mes_referencia: number;
  ano_referencia: number;
  aluno_nome: string | null;
  curso_nome: string | null;
}

interface Despesa {
  id: string;
  titulo: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  paga: boolean;
  data_pagamento: string | null;
  recorrente: boolean;
  observacoes: string | null;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const TABS = [
  { key: "recebimentos", label: "Recebimentos" },
  { key: "despesas_fixas", label: "Despesas Fixas" },
  { key: "despesas_variaveis", label: "Despesas Variáveis" },
  { key: "pessoas", label: "Pessoas" },
  { key: "impostos", label: "Impostos" },
  { key: "transferencias", label: "Transferências" },
];

const Despesas = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState("recebimentos");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // ─── Despesas state ───────────────────────────────
  const [isDespesaOpen, setIsDespesaOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [despesaForm, setDespesaForm] = useState({
    titulo: "", categoria: "", valor: "", data_vencimento: "", recorrente: false, observacoes: "", recorrencia_ate: "",
  });

  // ─── Receitas avulsas state ───────────────────────
  const [isReceitaOpen, setIsReceitaOpen] = useState(false);
  const [receitaForm, setReceitaForm] = useState({
    titulo: "", categoria: "Avulsa", valor: "", data_recebimento: "", recorrente: false, observacoes: "",
  });

  // ─── Queries ──────────────────────────────────────
  // Auto-generate recurring despesas on load
  useQuery({
    queryKey: ["gerar-recorrentes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("gerar_despesas_recorrentes");
      if (error) console.error("Erro ao gerar recorrentes:", error);
      return data;
    },
    staleTime: 1000 * 60 * 5, // only run every 5 min
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Despesa[];
    },
  });

  // Recebimentos = faturas dos alunos
  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas-faturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .select(`
          id,
          valor,
          valor_total,
          data_vencimento,
          data_emissao,
          status,
          mes_referencia,
          ano_referencia,
          alunos!inner ( nome_completo ),
          cursos!inner ( nome )
        `)
        .not("status", "eq", "Cancelada")
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return (data || []).map((f: any) => ({
        id: f.id,
        valor: f.valor,
        valor_total: f.valor_total,
        data_vencimento: f.data_vencimento,
        data_emissao: f.data_emissao,
        status: f.status,
        mes_referencia: f.mes_referencia,
        ano_referencia: f.ano_referencia,
        aluno_nome: f.alunos?.nome_completo || null,
        curso_nome: f.cursos?.nome || null,
      })) as Receita[];
    },
  });

  // Receitas avulsas query
  const { data: receitasAvulsas = [] } = useQuery({
    queryKey: ["receitas-avulsas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas")
        .select("*")
        .order("data_recebimento", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Receitas avulsas do mês filtrado
  const receitasAvulsasMes = useMemo(() => {
    return receitasAvulsas.filter((r: any) => {
      const dt = new Date(r.data_recebimento);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth;
    });
  }, [receitasAvulsas, selectedYear, selectedMonth]);


  const filteredRecebimentos = useMemo(() => {
    return receitas.filter((r) => r.ano_referencia === selectedYear && r.mes_referencia === selectedMonth + 1);
  }, [receitas, selectedYear, selectedMonth]);

  const filteredDespesasFixas = useMemo(() => {
    return despesas.filter((d) => {
      const dt = new Date(d.data_vencimento);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth && d.categoria === "Fixa";
    });
  }, [despesas, selectedYear, selectedMonth]);

  const filteredDespesasVariaveis = useMemo(() => {
    return despesas.filter((d) => {
      const dt = new Date(d.data_vencimento);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth && (d.categoria === "Variável" || d.categoria === "Única");
    });
  }, [despesas, selectedYear, selectedMonth]);

  // Monthly totals (faturas + receitas avulsas)
  const totalReceitasFaturas = filteredRecebimentos.reduce((s, r) => s + (r.valor_total || r.valor), 0);
  const receitasPagasFaturas = filteredRecebimentos.filter((r) => r.status === "Paga").reduce((s, r) => s + (r.valor_total || r.valor), 0);
  const totalReceitasAvulsas = receitasAvulsasMes.reduce((s: number, r: any) => s + Number(r.valor), 0);
  const receitasAvulsasRecebidas = receitasAvulsasMes.filter((r: any) => r.recebida).reduce((s: number, r: any) => s + Number(r.valor), 0);
  const totalReceitasMes = totalReceitasFaturas + totalReceitasAvulsas;
  const receitasPagasMes = receitasPagasFaturas + receitasAvulsasRecebidas;

  const monthDespesas = useMemo(() => {
    return despesas.filter((d) => {
      const dt = new Date(d.data_vencimento);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth;
    });
  }, [despesas, selectedYear, selectedMonth]);

  const totalDespesasMes = monthDespesas.reduce((s, d) => s + d.valor, 0);
  const despesasPagasMes = monthDespesas.filter((d) => d.paga).reduce((s, d) => s + d.valor, 0);
  const saldoAtual = receitasPagasMes - despesasPagasMes;

  const receitaProgress = totalReceitasMes > 0 ? (receitasPagasMes / totalReceitasMes) * 100 : 0;
  const despesaProgress = totalDespesasMes > 0 ? (despesasPagasMes / totalDespesasMes) * 100 : 0;

  // ─── Active tab data ──────────────────────────────
  const activeData = useMemo((): any[] => {
    switch (activeTab) {
      case "recebimentos": return receitasAvulsasMes;
      case "despesas_fixas": return filteredDespesasFixas;
      case "despesas_variaveis": return filteredDespesasVariaveis;
      default: return [];
    }
  }, [activeTab, receitasAvulsasMes, filteredDespesasFixas, filteredDespesasVariaveis]);

  const totalPages = Math.max(1, Math.ceil(activeData.length / perPage));
  const paginatedData = activeData.slice((page - 1) * perPage, page * perPage);

  const handleTabChange = (tab: string) => { setActiveTab(tab); setPage(1); setSelectedRows(new Set()); };
  const handleMonthChange = (m: number) => { setSelectedMonth(m); setPage(1); setSelectedRows(new Set()); };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── Mutations ────────────────────────────────────
  const createDespesa = useMutation({
    mutationFn: async (data: typeof despesaForm) => {
      const dia = data.data_vencimento ? new Date(data.data_vencimento).getDate() : null;
      const { error } = await supabase.from("despesas").insert({
        titulo: data.titulo, categoria: data.categoria, valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento, recorrente: data.recorrente, observacoes: data.observacoes || null,
        recorrencia_ate: data.recorrente && data.recorrencia_ate ? data.recorrencia_ate : null,
        dia_vencimento: dia,
      });
      if (error) throw error;
      // If recurring, trigger generation immediately
      if (data.recorrente && data.recorrencia_ate) {
        await supabase.rpc("gerar_despesas_recorrentes");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      toast.success("Despesa criada com sucesso");
      resetDespesaForm();
    },
    onError: () => toast.error("Erro ao criar despesa"),
  });

  const updateDespesa = useMutation({
    mutationFn: async (data: { id: string } & typeof despesaForm) => {
      const { error } = await supabase.from("despesas").update({
        titulo: data.titulo, categoria: data.categoria, valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento, recorrente: data.recorrente, observacoes: data.observacoes || null,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      toast.success("Despesa atualizada");
      resetDespesaForm();
    },
    onError: () => toast.error("Erro ao atualizar despesa"),
  });

  const deleteDespesa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      toast.success("Despesa removida");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const markDespesaPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").update({
        paga: true, data_pagamento: new Date().toISOString().split("T")[0],
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      toast.success("Despesa marcada como paga");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteSelected = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedRows);
      if (activeTab !== "recebimentos") {
        const { error } = await supabase.from("despesas").delete().in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      setSelectedRows(new Set());
      toast.success("Registros removidos");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  // ─── Receita Mutation ─────────────────────────────
  const createReceita = useMutation({
    mutationFn: async (data: typeof receitaForm) => {
      const { error } = await supabase.from("receitas").insert({
        titulo: data.titulo,
        categoria: data.categoria,
        valor: parseFloat(data.valor),
        data_recebimento: data.data_recebimento,
        recorrente: data.recorrente,
        observacoes: data.observacoes || null,
        origem: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas-avulsas"], refetchType: "all" });
      toast.success("Receita registrada com sucesso");
      resetReceitaForm();
    },
    onError: () => toast.error("Erro ao registrar receita"),
  });

  // ─── Helpers ──────────────────────────────────────
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const resetDespesaForm = () => {
    setDespesaForm({ titulo: "", categoria: "", valor: "", data_vencimento: "", recorrente: false, observacoes: "", recorrencia_ate: "" });
    setEditingDespesa(null);
    setIsDespesaOpen(false);
  };

  const resetReceitaForm = () => {
    setReceitaForm({ titulo: "", categoria: "Avulsa", valor: "", data_recebimento: "", recorrente: false, observacoes: "" });
    setIsReceitaOpen(false);
  };

  const handleSubmitReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receitaForm.titulo || !receitaForm.valor || !receitaForm.data_recebimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createReceita.mutate(receitaForm);
  };

  const handleEditDespesa = (d: Despesa) => {
    setEditingDespesa(d);
    setDespesaForm({ titulo: d.titulo, categoria: d.categoria, valor: d.valor.toString(), data_vencimento: d.data_vencimento, recorrente: d.recorrente, observacoes: d.observacoes || "" });
    setIsDespesaOpen(true);
  };

  const handleSubmitDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!despesaForm.titulo || !despesaForm.categoria || !despesaForm.valor || !despesaForm.data_vencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingDespesa) updateDespesa.mutate({ id: editingDespesa.id, ...despesaForm });
    else createDespesa.mutate(despesaForm);
  };

  const isDespesaTab = activeTab === "despesas_fixas" || activeTab === "despesas_variaveis";
  const isRecebimentosTab = activeTab === "recebimentos";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground">Movimentações Financeiras</h1>
          <Button variant="default" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* ═══ Saldo + Receitas/Despesas ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
          <Card className="border border-border">
            <CardContent className="flex items-center justify-center gap-6 py-8">
              <Select defaultValue="principal">
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Conta Principal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Conta Principal</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-center">
                <p className={cn(
                  "text-3xl font-bold tracking-tight",
                  saldoAtual >= 0 ? "text-foreground" : "text-destructive"
                )}>
                  {formatCurrency(saldoAtual)}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">SALDO ATUAL</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="py-5 px-6 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground">RECEITAS</span>
                  <span className="text-xs font-semibold text-primary">
                    {formatCurrency(receitasPagasMes)} de {formatCurrency(totalReceitasMes)}
                  </span>
                </div>
                <Progress value={receitaProgress} className="h-2.5 bg-muted" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground">DESPESAS</span>
                  <span className="text-xs font-semibold text-primary">
                    {formatCurrency(despesasPagasMes)} de {formatCurrency(totalDespesasMes)}
                  </span>
                </div>
                <Progress value={despesaProgress} className="h-2.5 bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Year + Month Selector ═══ */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => { setSelectedYear(parseInt(v)); setPage(1); }}
          >
            <SelectTrigger className="w-[90px] h-9 text-sm font-semibold bg-primary text-primary-foreground border-0 rounded-full">
              <SelectValue />
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </SelectTrigger>
            <SelectContent>
              {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-0">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                className={cn(
                  "px-4 py-2 text-sm border border-border transition-colors",
                  "first:rounded-l-md last:rounded-r-md",
                  selectedMonth === i
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-card text-foreground hover:bg-muted"
                )}
                onClick={() => handleMonthChange(i)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Tabs ═══ */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  "px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Action Buttons ═══ */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDespesaOpen} onOpenChange={(open) => { if (!open) resetDespesaForm(); setIsDespesaOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar Despesa
              </Button>
            </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmitDespesa}>
                  <DialogHeader>
                    <DialogTitle>{editingDespesa ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
                    <DialogDescription>Preencha os dados da despesa</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Título</Label>
                      <Input value={despesaForm.titulo} onChange={(e) => setDespesaForm({ ...despesaForm, titulo: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select value={despesaForm.categoria} onValueChange={(v) => setDespesaForm({ ...despesaForm, categoria: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fixa">Fixa</SelectItem>
                            <SelectItem value="Variável">Variável</SelectItem>
                            <SelectItem value="Única">Única</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Valor</Label>
                        <Input type="number" step="0.01" value={despesaForm.valor} onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Data de Vencimento</Label>
                      <Input type="date" value={despesaForm.data_vencimento} onChange={(e) => setDespesaForm({ ...despesaForm, data_vencimento: e.target.value })} required />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="desp-recorrente" checked={despesaForm.recorrente} onCheckedChange={(c) => setDespesaForm({ ...despesaForm, recorrente: c as boolean, recorrencia_ate: c ? despesaForm.recorrencia_ate : "" })} />
                      <Label htmlFor="desp-recorrente">Recorrente</Label>
                    </div>
                    {despesaForm.recorrente && (
                      <div className="grid gap-2">
                        <Label>Recorrência até (data final)</Label>
                        <Input type="date" value={despesaForm.recorrencia_ate} onChange={(e) => setDespesaForm({ ...despesaForm, recorrencia_ate: e.target.value })} placeholder="Até quando repetir" />
                        <p className="text-xs text-muted-foreground">As parcelas mensais serão geradas automaticamente até esta data, mantendo o mesmo dia de vencimento.</p>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label>Observações</Label>
                      <Textarea value={despesaForm.observacoes} onChange={(e) => setDespesaForm({ ...despesaForm, observacoes: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetDespesaForm}>Cancelar</Button>
                    <Button type="submit" disabled={createDespesa.isPending || updateDespesa.isPending}>
                      {editingDespesa ? "Salvar" : "Registrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          <Dialog open={isReceitaOpen} onOpenChange={(open) => { if (!open) resetReceitaForm(); setIsReceitaOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Adicionar Receita
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmitReceita}>
                <DialogHeader>
                  <DialogTitle>Nova Receita Avulsa</DialogTitle>
                  <DialogDescription>Registre uma receita que não está vinculada a faturas de alunos</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input value={receitaForm.titulo} onChange={(e) => setReceitaForm({ ...receitaForm, titulo: e.target.value })} placeholder="Ex: Venda de materiais, Doação, Aluguel de espaço" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Categoria</Label>
                      <Select value={receitaForm.categoria} onValueChange={(v) => setReceitaForm({ ...receitaForm, categoria: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Avulsa">Avulsa</SelectItem>
                          <SelectItem value="Doação">Doação</SelectItem>
                          <SelectItem value="Evento">Evento</SelectItem>
                          <SelectItem value="Aluguel">Aluguel</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Valor</Label>
                      <Input type="number" step="0.01" value={receitaForm.valor} onChange={(e) => setReceitaForm({ ...receitaForm, valor: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Data de Recebimento</Label>
                    <Input type="date" value={receitaForm.data_recebimento} onChange={(e) => setReceitaForm({ ...receitaForm, data_recebimento: e.target.value })} required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rec-recorrente" checked={receitaForm.recorrente} onCheckedChange={(c) => setReceitaForm({ ...receitaForm, recorrente: c as boolean })} />
                    <Label htmlFor="rec-recorrente">Recorrente</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea value={receitaForm.observacoes} onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetReceitaForm}>Cancelar</Button>
                  <Button type="submit" disabled={createReceita.isPending}>Registrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {isDespesaTab && (
            <Button
              size="sm"
              variant="destructive"
              disabled={selectedRows.size === 0}
              onClick={() => {
                if (selectedRows.size > 0 && confirm(`Remover ${selectedRows.size} registro(s)?`)) {
                  deleteSelected.mutate();
                }
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remover
            </Button>
          )}

          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <UserPlus className="mr-1.5 h-4 w-4" />
            Nova Pessoa / Empresa
          </Button>

          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Receipt className="mr-1.5 h-4 w-4" />
            Emitir Recibo
          </Button>
        </div>

        {/* ═══ Table ═══ */}
        <Card className="border border-border overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            {paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum registro encontrado para {MONTHS[selectedMonth]}/{selectedYear}.
                </p>
              </div>
             ) : isRecebimentosTab ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Vencimento</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Descrição</TableHead>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Valor</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Recebido de</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Categoria</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paginatedData as any[]).map((r) => (
                    <TableRow
                      key={r.id}
                      className={cn(
                        "transition-colors border-l-4",
                        r.recebida ? "border-l-primary/40 bg-primary/5" : "border-l-muted bg-card"
                      )}
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedRows.has(r.id)}
                          onCheckedChange={() => toggleRow(r.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {format(new Date(r.data_recebimento), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{r.titulo}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{r.origem || "Manual"}</TableCell>
                      <TableCell className="text-sm text-foreground">{r.categoria}</TableCell>
                      <TableCell>
                        {r.recebida ? (
                          <span className="flex items-center gap-1 text-sm text-foreground">
                            Sim <CheckCircle className="h-4 w-4 text-primary" />
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : isDespesaTab ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Vencimento</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Descrição</TableHead>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Valor</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Categoria</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase">Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paginatedData as Despesa[]).map((d) => (
                    <TableRow
                      key={d.id}
                      className={cn(
                        "transition-colors border-l-4",
                        d.paga ? "border-l-primary/40 bg-primary/5" : "border-l-muted bg-card"
                      )}
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedRows.has(d.id)}
                          onCheckedChange={() => toggleRow(d.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {format(new Date(d.data_vencimento), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{d.titulo}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditDespesa(d)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{d.categoria}</TableCell>
                      <TableCell>
                        {d.paga ? (
                          <span className="flex items-center gap-1 text-sm text-foreground">
                            Sim <CheckCircle className="h-4 w-4 text-primary" />
                          </span>
                        ) : (
                          <button
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => markDespesaPaid.mutate(d.id)}
                          >
                            Não
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Módulo em desenvolvimento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ Pagination ═══ */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {activeData.length === 0 ? 0 : (page - 1) * perPage + 1} até{" "}
            {Math.min(page * perPage, activeData.length)} de {activeData.length} registros
          </p>
          <div className="flex items-center gap-0">
            <button
              className="px-4 py-2 text-sm border border-border rounded-l-md bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm border-y border-border bg-card text-foreground font-medium">
              {page}
            </span>
            <button
              className="px-4 py-2 text-sm border border-border rounded-r-md bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Despesas;
