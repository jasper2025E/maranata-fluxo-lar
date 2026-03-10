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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, CheckCircle, Wallet, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────
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

interface Receita {
  id: string;
  titulo: string;
  categoria: string;
  valor: number;
  data_recebimento: string;
  recebida: boolean;
  data_confirmacao: string | null;
  recorrente: boolean;
  origem: string | null;
  observacoes: string | null;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const TABS = [
  { key: "recebimentos", label: "Recebimentos" },
  { key: "despesas_fixas", label: "Despesas Fixas" },
  { key: "despesas_variaveis", label: "Despesas Variáveis" },
  { key: "unicas", label: "Despesas Únicas" },
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

  // ─── Despesas state ───────────────────────────────
  const [isDespesaOpen, setIsDespesaOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [despesaForm, setDespesaForm] = useState({
    titulo: "", categoria: "", valor: "", data_vencimento: "", recorrente: false, observacoes: "",
  });

  // ─── Receitas state ───────────────────────────────
  const [isReceitaOpen, setIsReceitaOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [receitaForm, setReceitaForm] = useState({
    titulo: "", categoria: "", valor: "", data_recebimento: "", recorrente: false, origem: "", observacoes: "",
  });

  // ─── Queries ──────────────────────────────────────
  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*").order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Despesa[];
    },
  });

  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("receitas").select("*").order("data_recebimento", { ascending: false });
      if (error) throw error;
      return data as Receita[];
    },
  });

  // ─── Filtered by month/year ───────────────────────
  const filteredReceitas = useMemo(() => {
    return receitas.filter((r) => {
      const d = new Date(r.data_recebimento);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
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
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth && d.categoria === "Variável";
    });
  }, [despesas, selectedYear, selectedMonth]);

  const filteredDespesasUnicas = useMemo(() => {
    return despesas.filter((d) => {
      const dt = new Date(d.data_vencimento);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth && d.categoria === "Única";
    });
  }, [despesas, selectedYear, selectedMonth]);

  // Monthly totals
  const monthReceitas = useMemo(() => {
    return receitas.filter((r) => {
      const d = new Date(r.data_recebimento);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [receitas, selectedYear, selectedMonth]);

  const monthDespesas = useMemo(() => {
    return despesas.filter((d) => {
      const dt = new Date(d.data_vencimento);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth;
    });
  }, [despesas, selectedYear, selectedMonth]);

  const totalReceitasMes = monthReceitas.reduce((s, r) => s + r.valor, 0);
  const receitasRecebidasMes = monthReceitas.filter((r) => r.recebida).reduce((s, r) => s + r.valor, 0);
  const totalDespesasMes = monthDespesas.reduce((s, d) => s + d.valor, 0);
  const despesasPagasMes = monthDespesas.filter((d) => d.paga).reduce((s, d) => s + d.valor, 0);
  const saldoAtual = receitasRecebidasMes - despesasPagasMes;

  const receitaProgress = totalReceitasMes > 0 ? (receitasRecebidasMes / totalReceitasMes) * 100 : 0;
  const despesaProgress = totalDespesasMes > 0 ? (despesasPagasMes / totalDespesasMes) * 100 : 0;

  // ─── Active tab data ──────────────────────────────
  const activeData = useMemo(() => {
    switch (activeTab) {
      case "recebimentos": return filteredReceitas;
      case "despesas_fixas": return filteredDespesasFixas;
      case "despesas_variaveis": return filteredDespesasVariaveis;
      case "unicas": return filteredDespesasUnicas;
      default: return [];
    }
  }, [activeTab, filteredReceitas, filteredDespesasFixas, filteredDespesasVariaveis, filteredDespesasUnicas]);

  const totalPages = Math.max(1, Math.ceil(activeData.length / perPage));
  const paginatedData = activeData.slice((page - 1) * perPage, page * perPage);

  const handleTabChange = (tab: string) => { setActiveTab(tab); setPage(1); };
  const handleMonthChange = (m: number) => { setSelectedMonth(m); setPage(1); };

  // ─── Mutations ────────────────────────────────────
  const createDespesa = useMutation({
    mutationFn: async (data: typeof despesaForm) => {
      const { error } = await supabase.from("despesas").insert({
        titulo: data.titulo, categoria: data.categoria, valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento, recorrente: data.recorrente, observacoes: data.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
      toast.success(t("expenses.createSuccess"));
      resetDespesaForm();
    },
    onError: () => toast.error(t("expenses.createError")),
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
      toast.success(t("expenses.updateSuccess"));
      resetDespesaForm();
    },
    onError: () => toast.error(t("expenses.updateError")),
  });

  const deleteDespesa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      toast.success(t("expenses.deleteSuccess"));
    },
    onError: () => toast.error(t("expenses.deleteError")),
  });

  const markDespesaPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").update({ paga: true, data_pagamento: new Date().toISOString().split("T")[0] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
      toast.success(t("expenses.markedAsPaid"));
    },
    onError: () => toast.error(t("expenses.updateError")),
  });

  const createReceita = useMutation({
    mutationFn: async (data: typeof receitaForm) => {
      const { error } = await supabase.from("receitas").insert({
        titulo: data.titulo, categoria: data.categoria, valor: parseFloat(data.valor),
        data_recebimento: data.data_recebimento, recorrente: data.recorrente,
        origem: data.origem || null, observacoes: data.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
      toast.success(t("income.createSuccess"));
      resetReceitaForm();
    },
    onError: () => toast.error(t("income.createError")),
  });

  const updateReceita = useMutation({
    mutationFn: async (data: { id: string } & typeof receitaForm) => {
      const { error } = await supabase.from("receitas").update({
        titulo: data.titulo, categoria: data.categoria, valor: parseFloat(data.valor),
        data_recebimento: data.data_recebimento, recorrente: data.recorrente,
        origem: data.origem || null, observacoes: data.observacoes || null,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"], refetchType: "all" });
      toast.success(t("income.updateSuccess"));
      resetReceitaForm();
    },
    onError: () => toast.error(t("income.updateError")),
  });

  const deleteReceita = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receitas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"], refetchType: "all" });
      toast.success(t("income.deleteSuccess"));
    },
    onError: () => toast.error(t("income.deleteError")),
  });

  const markReceitaReceived = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receitas").update({ recebida: true, data_confirmacao: new Date().toISOString().split("T")[0] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receitas"], refetchType: "all" });
      toast.success(t("income.markedAsReceived"));
    },
    onError: () => toast.error(t("income.updateError")),
  });

  // ─── Helpers ──────────────────────────────────────
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const resetDespesaForm = () => {
    setDespesaForm({ titulo: "", categoria: "", valor: "", data_vencimento: "", recorrente: false, observacoes: "" });
    setEditingDespesa(null);
    setIsDespesaOpen(false);
  };

  const resetReceitaForm = () => {
    setReceitaForm({ titulo: "", categoria: "", valor: "", data_recebimento: "", recorrente: false, origem: "", observacoes: "" });
    setEditingReceita(null);
    setIsReceitaOpen(false);
  };

  const handleEditDespesa = (d: Despesa) => {
    setEditingDespesa(d);
    setDespesaForm({ titulo: d.titulo, categoria: d.categoria, valor: d.valor.toString(), data_vencimento: d.data_vencimento, recorrente: d.recorrente, observacoes: d.observacoes || "" });
    setIsDespesaOpen(true);
  };

  const handleEditReceita = (r: Receita) => {
    setEditingReceita(r);
    setReceitaForm({ titulo: r.titulo, categoria: r.categoria, valor: r.valor.toString(), data_recebimento: r.data_recebimento, recorrente: r.recorrente, origem: r.origem || "", observacoes: r.observacoes || "" });
    setIsReceitaOpen(true);
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

  const handleSubmitReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receitaForm.titulo || !receitaForm.categoria || !receitaForm.valor || !receitaForm.data_recebimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingReceita) updateReceita.mutate({ id: editingReceita.id, ...receitaForm });
    else createReceita.mutate(receitaForm);
  };

  const isRecebimentosTab = activeTab === "recebimentos";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Movimentações Financeiras</h1>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* Saldo + Receitas/Despesas Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <Card className="border-border/50 shadow-sm rounded-2xl">
            <CardContent className="flex items-center justify-center py-8 gap-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className={cn("text-3xl font-bold", saldoAtual >= 0 ? "text-foreground" : "text-destructive")}>
                  {formatCurrency(saldoAtual)}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Saldo Atual</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm rounded-2xl">
            <CardContent className="py-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">RECEITAS</span>
                  <span className="text-sm text-primary font-semibold">
                    {formatCurrency(receitasRecebidasMes)} de {formatCurrency(totalReceitasMes)}
                  </span>
                </div>
                <Progress value={receitaProgress} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">DESPESAS</span>
                  <span className="text-sm text-destructive font-semibold">
                    {formatCurrency(despesasPagasMes)} de {formatCurrency(totalDespesasMes)}
                  </span>
                </div>
                <Progress value={despesaProgress} className="h-2 [&>div]:bg-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Year + Month Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="text-sm px-3 py-1 font-semibold">{selectedYear}</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear((y) => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {MONTHS.map((m, i) => (
              <Button
                key={m}
                variant={selectedMonth === i ? "default" : "outline"}
                size="sm"
                className={cn("text-xs px-3 h-8", selectedMonth === i && "shadow-sm")}
                onClick={() => handleMonthChange(i)}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {isRecebimentosTab ? (
              <Dialog open={isReceitaOpen} onOpenChange={(open) => { if (!open) resetReceitaForm(); setIsReceitaOpen(open); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" />Adicionar Recebimento</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmitReceita}>
                    <DialogHeader>
                      <DialogTitle>{editingReceita ? t("income.editIncome") : t("income.newIncome")}</DialogTitle>
                      <DialogDescription>{t("income.fillData")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>{t("income.incomeTitle")}</Label>
                        <Input value={receitaForm.titulo} onChange={(e) => setReceitaForm({ ...receitaForm, titulo: e.target.value })} placeholder={t("income.titlePlaceholder")} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>{t("income.category")}</Label>
                          <Select value={receitaForm.categoria} onValueChange={(v) => setReceitaForm({ ...receitaForm, categoria: v })}>
                            <SelectTrigger><SelectValue placeholder={t("income.selectCategory")} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mensalidade">{t("income.tuition")}</SelectItem>
                              <SelectItem value="Matrícula">{t("income.enrollment")}</SelectItem>
                              <SelectItem value="Doação">{t("income.donation")}</SelectItem>
                              <SelectItem value="Outros">{t("income.other")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>{t("income.value")}</Label>
                          <Input type="number" step="0.01" value={receitaForm.valor} onChange={(e) => setReceitaForm({ ...receitaForm, valor: e.target.value })} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>{t("income.receiptDate")}</Label>
                          <Input type="date" value={receitaForm.data_recebimento} onChange={(e) => setReceitaForm({ ...receitaForm, data_recebimento: e.target.value })} required />
                        </div>
                        <div className="grid gap-2">
                          <Label>{t("income.origin")}</Label>
                          <Input value={receitaForm.origem} onChange={(e) => setReceitaForm({ ...receitaForm, origem: e.target.value })} placeholder={t("income.originPlaceholder")} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="rec-recorrente" checked={receitaForm.recorrente} onCheckedChange={(c) => setReceitaForm({ ...receitaForm, recorrente: c as boolean })} />
                        <Label htmlFor="rec-recorrente">{t("income.recurring")}</Label>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("income.observations")}</Label>
                        <Textarea value={receitaForm.observacoes} onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })} placeholder={t("income.observationsPlaceholder")} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetReceitaForm}>{t("common.cancel")}</Button>
                      <Button type="submit" disabled={createReceita.isPending || updateReceita.isPending}>{editingReceita ? t("common.save") : t("common.register")}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isDespesaOpen} onOpenChange={(open) => { if (!open) resetDespesaForm(); setIsDespesaOpen(open); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" />Adicionar Despesa</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmitDespesa}>
                    <DialogHeader>
                      <DialogTitle>{editingDespesa ? t("expenses.editExpense") : t("expenses.newExpense")}</DialogTitle>
                      <DialogDescription>{t("expenses.fillData")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>{t("expenses.expenseTitle")}</Label>
                        <Input value={despesaForm.titulo} onChange={(e) => setDespesaForm({ ...despesaForm, titulo: e.target.value })} placeholder={t("expenses.titlePlaceholder")} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>{t("expenses.category")}</Label>
                          <Select value={despesaForm.categoria} onValueChange={(v) => setDespesaForm({ ...despesaForm, categoria: v })}>
                            <SelectTrigger><SelectValue placeholder={t("expenses.selectCategory")} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Fixa">{t("expenses.fixed")}</SelectItem>
                              <SelectItem value="Variável">{t("expenses.variable")}</SelectItem>
                              <SelectItem value="Única">{t("expenses.oneTime")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>{t("expenses.value")}</Label>
                          <Input type="number" step="0.01" value={despesaForm.valor} onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })} required />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("expenses.dueDate")}</Label>
                        <Input type="date" value={despesaForm.data_vencimento} onChange={(e) => setDespesaForm({ ...despesaForm, data_vencimento: e.target.value })} required />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="desp-recorrente" checked={despesaForm.recorrente} onCheckedChange={(c) => setDespesaForm({ ...despesaForm, recorrente: c as boolean })} />
                        <Label htmlFor="desp-recorrente">{t("expenses.recurring")}</Label>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("expenses.observations")}</Label>
                        <Textarea value={despesaForm.observacoes} onChange={(e) => setDespesaForm({ ...despesaForm, observacoes: e.target.value })} placeholder={t("expenses.observationsPlaceholder")} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetDespesaForm}>{t("common.cancel")}</Button>
                      <Button type="submit" disabled={createDespesa.isPending || updateDespesa.isPending}>{editingDespesa ? t("common.save") : t("common.register")}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Table */}
          {TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4">
              <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                  {paginatedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">Nenhum registro encontrado</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Não há {isRecebimentosTab ? "recebimentos" : "despesas"} para {MONTHS[selectedMonth]}/{selectedYear}.
                      </p>
                    </div>
                  ) : isRecebimentosTab ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold text-foreground">Data</TableHead>
                          <TableHead className="font-semibold text-foreground">Descrição</TableHead>
                          <TableHead className="font-semibold text-foreground">Valor</TableHead>
                          <TableHead className="font-semibold text-foreground">Origem</TableHead>
                          <TableHead className="font-semibold text-foreground">Categoria</TableHead>
                          <TableHead className="font-semibold text-foreground">Recebido</TableHead>
                          <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(paginatedData as Receita[]).map((r) => (
                          <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-muted-foreground">{format(new Date(r.data_recebimento), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              {r.titulo}
                              {r.recorrente && <span className="ml-2 text-xs text-muted-foreground">(recorrente)</span>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatCurrency(r.valor)}</TableCell>
                            <TableCell className="text-muted-foreground">{r.origem || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{r.categoria}</Badge>
                            </TableCell>
                            <TableCell>
                              {r.recebida ? (
                                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-4 w-4" /> Sim</span>
                              ) : (
                                <span className="text-muted-foreground">Não</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!r.recebida && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => markReceitaReceived.mutate(r.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditReceita(r)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(t("income.confirmDelete"))) deleteReceita.mutate(r.id); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold text-foreground">Vencimento</TableHead>
                          <TableHead className="font-semibold text-foreground">Descrição</TableHead>
                          <TableHead className="font-semibold text-foreground">Valor</TableHead>
                          <TableHead className="font-semibold text-foreground">Categoria</TableHead>
                          <TableHead className="font-semibold text-foreground">Pago</TableHead>
                          <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(paginatedData as Despesa[]).map((d) => (
                          <TableRow key={d.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-muted-foreground">{format(new Date(d.data_vencimento), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              {d.titulo}
                              {d.recorrente && <span className="ml-2 text-xs text-muted-foreground">(recorrente)</span>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatCurrency(d.valor)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{d.categoria}</Badge>
                            </TableCell>
                            <TableCell>
                              {d.paga ? (
                                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-4 w-4" /> Sim</span>
                              ) : (
                                <span className="text-muted-foreground">Não</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!d.paga && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => markDespesaPaid.mutate(d.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditDespesa(d)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(t("expenses.confirmDelete"))) deleteDespesa.mutate(d.id); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {activeData.length === 0 ? 0 : (page - 1) * perPage + 1} até {Math.min(page * perPage, activeData.length)} de {activeData.length} registros
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Badge variant="secondary" className="px-3 py-1">{page}</Badge>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Próximo
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Despesas;
