import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Search, CheckCircle, Wallet, TrendingDown, TrendingUp, Clock, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { FinancialKPICard } from "@/components/dashboard";

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

// ─── Component ──────────────────────────────────────
const MovimentacoesFinanceiras = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "recebimentos";

  // ─── Despesas state ───────────────────────────────
  const [isDespesaOpen, setIsDespesaOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [despesaSearch, setDespesaSearch] = useState("");
  const [despesaForm, setDespesaForm] = useState({
    titulo: "", categoria: "", valor: "", data_vencimento: "", recorrente: false, observacoes: "",
  });

  // ─── Receitas state ───────────────────────────────
  const [isReceitaOpen, setIsReceitaOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [receitaSearch, setReceitaSearch] = useState("");
  const [receitaForm, setReceitaForm] = useState({
    titulo: "", categoria: "", valor: "", data_recebimento: "", recorrente: false, origem: "", observacoes: "",
  });

  // ─── Queries ──────────────────────────────────────
  const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
    queryKey: ["despesas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*").order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Despesa[];
    },
  });

  const { data: receitas = [], isLoading: loadingReceitas } = useQuery({
    queryKey: ["receitas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("receitas").select("*").order("data_recebimento", { ascending: false });
      if (error) throw error;
      return data as Receita[];
    },
  });

  // ─── Despesas Mutations ───────────────────────────
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

  // ─── Receitas Mutations ───────────────────────────
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
    if (editingDespesa) {
      updateDespesa.mutate({ id: editingDespesa.id, ...despesaForm });
    } else {
      createDespesa.mutate(despesaForm);
    }
  };

  const handleSubmitReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receitaForm.titulo || !receitaForm.categoria || !receitaForm.valor || !receitaForm.data_recebimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingReceita) {
      updateReceita.mutate({ id: editingReceita.id, ...receitaForm });
    } else {
      createReceita.mutate(receitaForm);
    }
  };

  // ─── Computed ─────────────────────────────────────
  const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0);
  const totalRecebidas = receitas.filter((r) => r.recebida).reduce((s, r) => s + r.valor, 0);
  const totalReceitasPendentes = receitas.filter((r) => !r.recebida).reduce((s, r) => s + r.valor, 0);

  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const totalPagas = despesas.filter((d) => d.paga).reduce((s, d) => s + d.valor, 0);
  const totalPendentes = despesas.filter((d) => !d.paga).reduce((s, d) => s + d.valor, 0);

  const saldoAtual = totalRecebidas - totalPagas;

  const filteredDespesas = despesas.filter((d) =>
    d.titulo.toLowerCase().includes(despesaSearch.toLowerCase()) ||
    d.categoria.toLowerCase().includes(despesaSearch.toLowerCase())
  );

  const filteredReceitas = receitas.filter((r) =>
    r.titulo.toLowerCase().includes(receitaSearch.toLowerCase()) ||
    r.categoria.toLowerCase().includes(receitaSearch.toLowerCase())
  );

  const getCategoryBadgeDespesa = (cat: string) => {
    switch (cat) {
      case "Fixa": return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{t("expenses.fixed")}</Badge>;
      case "Variável": return <Badge variant="secondary">{t("expenses.variable")}</Badge>;
      case "Única": return <Badge variant="outline">{t("expenses.oneTime")}</Badge>;
      default: return <Badge variant="outline">{cat}</Badge>;
    }
  };

  const getCategoryBadgeReceita = (cat: string) => {
    switch (cat) {
      case "Mensalidade": return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{t("income.tuition")}</Badge>;
      case "Matrícula": return <Badge variant="secondary">{t("income.enrollment")}</Badge>;
      case "Doação": return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">{t("income.donation")}</Badge>;
      case "Outros": return <Badge variant="outline">{t("income.other")}</Badge>;
      default: return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Global KPIs */}
        <div className="grid gap-4 sm:grid-cols-4 animate-fade-in">
          <FinancialKPICard
            title={t("income.saldoAtual")}
            value={formatCurrency(saldoAtual)}
            icon={Wallet}
            variant={saldoAtual >= 0 ? "success" : "danger"}
            size="sm"
            index={0}
          />
          <FinancialKPICard
            title={t("income.totalIncome")}
            value={formatCurrency(totalReceitas)}
            icon={TrendingUp}
            variant="success"
            size="sm"
            index={1}
          />
          <FinancialKPICard
            title={t("expenses.totalExpenses")}
            value={formatCurrency(totalDespesas)}
            icon={TrendingDown}
            variant="danger"
            size="sm"
            index={2}
          />
          <FinancialKPICard
            title={t("income.pendingTotal")}
            value={formatCurrency(totalReceitasPendentes + totalPendentes)}
            icon={Clock}
            variant="info"
            size="sm"
            index={3}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recebimentos" className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              {t("income.title")}
            </TabsTrigger>
            <TabsTrigger value="despesas" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              {t("expenses.title")}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ RECEBIMENTOS TAB ═══════════ */}
          <TabsContent value="recebimentos" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-3 animate-fade-in">
              <FinancialKPICard title={t("income.totalIncome")} value={formatCurrency(totalReceitas)} icon={TrendingUp} variant="info" size="sm" index={0} />
              <FinancialKPICard title={t("income.received")} value={formatCurrency(totalRecebidas)} icon={CheckCircle} variant="success" size="sm" index={1} />
              <FinancialKPICard title={t("income.pendingIncome")} value={formatCurrency(totalReceitasPendentes)} icon={Clock} variant="danger" size="sm" index={2} />
            </div>

            <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{t("income.incomeList")}</CardTitle>
                    <CardDescription>{filteredReceitas.length} {t("income.incomeCount")}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t("common.search")} value={receitaSearch} onChange={(e) => setReceitaSearch(e.target.value)} className="pl-8" />
                    </div>
                    <Dialog open={isReceitaOpen} onOpenChange={(open) => { if (!open) resetReceitaForm(); setIsReceitaOpen(open); }}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t("income.newIncome")}</Button>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {loadingReceitas ? (
                  <p className="text-muted-foreground p-6">{t("common.loading")}</p>
                ) : filteredReceitas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">{t("income.noIncomeFound")}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">{t("income.noIncomeDescription")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">{t("income.incomeTitle")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("income.category")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("income.value")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("income.receiptDate")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("income.origin")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("expenses.status")}</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceitas.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-foreground">
                            {r.titulo}
                            {r.recorrente && <span className="ml-2 text-xs text-muted-foreground">({t("income.recurringLabel")})</span>}
                          </TableCell>
                          <TableCell>{getCategoryBadgeReceita(r.categoria)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(r.valor)}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(r.data_recebimento), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-muted-foreground">{r.origem || "—"}</TableCell>
                          <TableCell>
                            <Badge className={r.recebida ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}>
                              {r.recebida ? t("income.received") : t("income.pendingIncome")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!r.recebida && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => markReceitaReceived.mutate(r.id)} title={t("income.markAsReceived")}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditReceita(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(t("income.confirmDelete"))) deleteReceita.mutate(r.id); }} disabled={deleteReceita.isPending}>
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
          </TabsContent>

          {/* ═══════════ DESPESAS TAB ═══════════ */}
          <TabsContent value="despesas" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-3 animate-fade-in">
              <FinancialKPICard title={t("expenses.totalExpenses")} value={formatCurrency(totalDespesas)} icon={Wallet} variant="info" size="sm" index={0} />
              <FinancialKPICard title={t("expenses.paid")} value={formatCurrency(totalPagas)} icon={CheckCircle} variant="success" size="sm" index={1} />
              <FinancialKPICard title={t("expenses.pending")} value={formatCurrency(totalPendentes)} icon={Clock} variant="danger" size="sm" index={2} />
            </div>

            <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{t("expenses.expenseList")}</CardTitle>
                    <CardDescription>{filteredDespesas.length} {t("expenses.expensesCount")}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t("common.search")} value={despesaSearch} onChange={(e) => setDespesaSearch(e.target.value)} className="pl-8" />
                    </div>
                    <Dialog open={isDespesaOpen} onOpenChange={(open) => { if (!open) resetDespesaForm(); setIsDespesaOpen(open); }}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t("expenses.newExpense")}</Button>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {loadingDespesas ? (
                  <p className="text-muted-foreground p-6">{t("common.loading")}</p>
                ) : filteredDespesas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <TrendingDown className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">{t("expenses.noExpensesFound")}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">{t("expenses.noExpensesDescription")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">{t("expenses.expenseTitle")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("expenses.category")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("expenses.value")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("expenses.dueDate")}</TableHead>
                        <TableHead className="font-semibold text-foreground">{t("expenses.status")}</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDespesas.map((d) => (
                        <TableRow key={d.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-foreground">
                            {d.titulo}
                            {d.recorrente && <span className="ml-2 text-xs text-muted-foreground">({t("expenses.recurringLabel")})</span>}
                          </TableCell>
                          <TableCell>{getCategoryBadgeDespesa(d.categoria)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(d.valor)}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(d.data_vencimento), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge className={d.paga ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}>
                              {d.paga ? t("expenses.paid") : t("expenses.pending")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!d.paga && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => markDespesaPaid.mutate(d.id)} title={t("expenses.markAsPaid")}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditDespesa(d)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(t("expenses.confirmDelete"))) deleteDespesa.mutate(d.id); }} disabled={deleteDespesa.isPending}>
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MovimentacoesFinanceiras;
