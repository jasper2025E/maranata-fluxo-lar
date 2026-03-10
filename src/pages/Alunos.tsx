import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, ChevronRight, Users, UserCheck, UserX, GraduationCap, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { alunoSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { useEnturmar } from "@/hooks/useEnturmacao";
import {
  AlunoKPIs, AlunoTable, AlunoViewDialog, AlunoEnturmarDialog,
  AlunoBatchActions, ExportButton,
} from "@/components/alunos";
import type { Aluno, Responsavel, Curso, Turma, StatusFilter } from "@/components/alunos";

const Alunos = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEnturmarOpen, setIsEnturmarOpen] = useState(false);
  const [enturmandoAluno, setEnturmandoAluno] = useState<Aluno | null>(null);
  const [viewingAluno, setViewingAluno] = useState<Aluno | null>(null);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modoFaturamento, setModoFaturamento] = useState<"nenhum" | "novas" | "substituir">("nenhum");
  const [formData, setFormData] = useState({
    nome_completo: "", data_nascimento: "", curso_id: "", turma_id: "",
    responsavel_id: "", telefone_responsavel: "", email_responsavel: "",
    endereco: "", observacoes: "", dia_vencimento: 10,
    data_inicio_cobranca: new Date().toISOString().split("T")[0],
    quantidade_parcelas: 12,
  });

  const enturmarMutation = useEnturmar();

  // Queries
  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["alunos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("*, cursos(nome, mensalidade), turmas(nome, serie), responsaveis(id, nome)")
        .order("nome_completo");
      if (error) throw error;
      return data as unknown as Aluno[];
    },
  });

  const { data: responsaveisLista = [] } = useQuery({
    queryKey: ["responsaveis-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("responsaveis").select("id, nome, telefone").eq("ativo", true).order("nome");
      if (error) throw error;
      return data as Responsavel[];
    },
  });

  const { data: cursos = [] } = useQuery({
    queryKey: ["cursos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cursos").select("id, nome, mensalidade").eq("ativo", true);
      if (error) throw error;
      return data as Curso[];
    },
  });

  const { data: turmas = [] } = useQuery({
    queryKey: ["turmas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("turmas").select("id, nome, serie").eq("ativo", true);
      if (error) throw error;
      return data as Turma[];
    },
  });

  // Faturas vencidas por aluno
  const { data: faturasVencidas = {} } = useQuery({
    queryKey: ["faturas-vencidas-por-aluno"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .select("aluno_id")
        .eq("status", "Vencida");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach(f => { map[f.aluno_id] = (map[f.aluno_id] || 0) + 1; });
      return map;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newAluno, error } = await supabase.from("alunos").insert({
        nome_completo: data.nome_completo, data_nascimento: data.data_nascimento,
        curso_id: data.curso_id, turma_id: data.turma_id || null,
        responsavel_id: data.responsavel_id || null, telefone_responsavel: data.telefone_responsavel,
        email_responsavel: data.email_responsavel, endereco: data.endereco,
        observacoes: data.observacoes || null, dia_vencimento: data.dia_vencimento,
        data_inicio_cobranca: data.data_inicio_cobranca, quantidade_parcelas: data.quantidade_parcelas,
      }).select().single();
      if (error) throw error;
      return newAluno;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success(t("students.createSuccess"));
      resetForm();
    },
    onError: (error) => { console.error(error); toast.error(t("students.createError")); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; modoFaturamento?: string } & typeof formData) => {
      const { error } = await supabase.from("alunos").update({
        nome_completo: data.nome_completo, data_nascimento: data.data_nascimento,
        curso_id: data.curso_id, turma_id: data.turma_id || null,
        responsavel_id: data.responsavel_id || null, telefone_responsavel: data.telefone_responsavel,
        email_responsavel: data.email_responsavel, endereco: data.endereco,
        observacoes: data.observacoes || null, dia_vencimento: data.dia_vencimento,
        data_inicio_cobranca: data.data_inicio_cobranca, quantidade_parcelas: data.quantidade_parcelas,
      }).eq("id", data.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success(t("students.updateSuccess"));

      if (data.modoFaturamento && data.modoFaturamento !== "nenhum" && data.quantidade_parcelas > 0) {
        void (async () => {
          try {
            const curso = cursos.find(c => c.id === data.curso_id);
            if (!curso) return;
            if (data.modoFaturamento === "substituir") {
              await supabase.from("faturas").update({ status: "Cancelada", motivo_cancelamento: "Substituída por nova configuração" }).eq("aluno_id", data.id).eq("status", "Aberta");
              toast.info("Faturas antigas foram canceladas");
            }
            const dataInicio = new Date(data.data_inicio_cobranca);
            dataInicio.setDate(data.dia_vencimento);
            await supabase.rpc("gerar_faturas_aluno", {
              p_aluno_id: data.id, p_curso_id: data.curso_id, p_valor: curso.mensalidade,
              p_data_inicio: dataInicio.toISOString().split("T")[0], p_quantidade_meses: data.quantidade_parcelas,
            });
            queryClient.invalidateQueries({ queryKey: ["faturas"] });
            toast.success(`${data.quantidade_parcelas} novas faturas geradas!`);
          } catch (err) { console.warn("Falha ao gerar faturas:", err); toast.error("Erro ao gerar novas faturas"); }
        })();
      }
      resetForm();
    },
    onError: () => toast.error(t("students.updateError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alunos"] }); toast.success(t("students.deleteSuccess")); },
    onError: () => toast.error(t("students.deleteError")),
  });

  const batchStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("alunos").update({ status_matricula: status as any }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      setSelectedIds([]);
      toast.success("Status atualizado em lote!");
    },
    onError: () => toast.error("Erro ao atualizar status em lote"),
  });

  // Helpers
  const resetForm = () => {
    setFormData({
      nome_completo: "", data_nascimento: "", curso_id: "", turma_id: "",
      responsavel_id: "", telefone_responsavel: "", email_responsavel: "",
      endereco: "", observacoes: "", dia_vencimento: 10,
      data_inicio_cobranca: new Date().toISOString().split("T")[0], quantidade_parcelas: 12,
    });
    setEditingAluno(null); setModoFaturamento("nenhum"); setIsOpen(false);
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setModoFaturamento("nenhum");
    setFormData({
      nome_completo: aluno.nome_completo, data_nascimento: aluno.data_nascimento,
      curso_id: aluno.curso_id, turma_id: aluno.turma_id || "",
      responsavel_id: aluno.responsavel_id || "", telefone_responsavel: aluno.telefone_responsavel,
      email_responsavel: aluno.email_responsavel, endereco: aluno.endereco,
      observacoes: aluno.observacoes || "", dia_vencimento: aluno.dia_vencimento ?? 10,
      data_inicio_cobranca: aluno.data_inicio_cobranca || new Date().toISOString().split("T")[0],
      quantidade_parcelas: aluno.quantidade_parcelas ?? 12,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = alunoSchema.safeParse(formData);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    if (editingAluno) {
      updateMutation.mutate({ id: editingAluno.id, ...formData, modoFaturamento });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmEnturmacao = async (turmaId: string) => {
    if (!enturmandoAluno) return;
    const curso = cursos.find(c => c.id === enturmandoAluno.curso_id);
    if (!curso) { toast.error(t("errors.courseNotFound")); return; }
    await enturmarMutation.mutateAsync({
      alunoId: enturmandoAluno.id, turmaId, cursoId: enturmandoAluno.curso_id,
      valorMensalidade: curso.mensalidade, responsavelId: enturmandoAluno.responsavel_id,
      gerarFaturas: false,
    });
    setEnturmandoAluno(null);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Filtered list
  const filteredAlunos = useMemo(() => {
    return alunos.filter(aluno => {
      const matchesSearch = aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.email_responsavel?.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === 'sem_turma') return matchesSearch && !aluno.turma_id;
      if (statusFilter !== 'todos') return matchesSearch && aluno.status_matricula === statusFilter;
      return matchesSearch;
    });
  }, [alunos, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => ({
    todos: alunos.length,
    ativo: alunos.filter(a => a.status_matricula === 'ativo').length,
    trancado: alunos.filter(a => a.status_matricula === 'trancado').length,
    cancelado: alunos.filter(a => a.status_matricula === 'cancelado' || a.status_matricula === 'transferido').length,
    sem_turma: alunos.filter(a => !a.turma_id).length,
  }), [alunos]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("nav.registrations")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("students.title")}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div />
          <div className="flex items-center gap-2">
            <ExportButton alunos={filteredAlunos} />
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />{t("students.newStudent")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      {editingAluno ? t("students.editStudent") : t("students.newStudent")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {editingAluno ? t("students.updateData") : t("students.invoicesGenerated")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5 py-6">
                    {/* Nome */}
                    <div className="grid gap-2">
                      <Label htmlFor="nome" className="text-sm font-medium text-muted-foreground">{t("students.fullName")}</Label>
                      <Input id="nome" value={formData.nome_completo} onChange={e => setFormData({ ...formData, nome_completo: e.target.value })} className="h-11" required />
                    </div>
                    {/* Nascimento + Curso */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t("students.birthDate")}</Label>
                        <Input type="date" value={formData.data_nascimento} onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })} className="h-11" required />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t("students.course")}</Label>
                        <Select value={formData.curso_id} onValueChange={v => setFormData({ ...formData, curso_id: v })}>
                          <SelectTrigger className="h-11"><SelectValue placeholder={t("students.selectCourse")} /></SelectTrigger>
                          <SelectContent>{cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} - {formatCurrency(c.mensalidade)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Turma + Responsável */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t("students.class")}</Label>
                        <Select value={formData.turma_id} onValueChange={v => setFormData({ ...formData, turma_id: v })}>
                          <SelectTrigger className="h-11"><SelectValue placeholder={t("students.selectClass")} /></SelectTrigger>
                          <SelectContent>{turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome} - {t.serie}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t("students.guardian")}</Label>
                        <Select value={formData.responsavel_id} onValueChange={v => setFormData({ ...formData, responsavel_id: v })}>
                          <SelectTrigger className="h-11"><SelectValue placeholder={t("students.selectGuardian")} /></SelectTrigger>
                          <SelectContent>{responsaveisLista.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Telefone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t("students.phone")}</Label>
                        <Input value={formData.telefone_responsavel} onChange={e => setFormData({ ...formData, telefone_responsavel: e.target.value })} className="h-11" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t("students.email")}</Label>
                        <Input type="email" value={formData.email_responsavel} onChange={e => setFormData({ ...formData, email_responsavel: e.target.value })} className="h-11" />
                      </div>
                    </div>
                    {/* Endereço */}
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">{t("students.address")}</Label>
                      <Input value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} className="h-11" />
                    </div>
                    {/* Observações */}
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">{t("students.observations")}</Label>
                      <Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} rows={3} />
                    </div>

                    {/* Configuração de Faturamento */}
                    <div className="border-t pt-5 mt-2">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {editingAluno ? "Gerenciamento de Faturas" : "Configuração de Faturamento"}
                      </h4>
                      {editingAluno && (
                        <div className="mb-4 space-y-2">
                          {(["nenhum", "novas", "substituir"] as const).map(modo => (
                            <div key={modo}
                              className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                modoFaturamento === modo ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                              )}
                              onClick={() => setModoFaturamento(modo)}
                            >
                              <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", modoFaturamento === modo ? "border-primary" : "border-muted-foreground")}>
                                {modoFaturamento === modo && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {modo === "nenhum" ? "Apenas salvar dados" : modo === "novas" ? "Gerar novas faturas" : "Substituir faturas existentes"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {modo === "nenhum" ? "Atualiza o cadastro sem mexer nas faturas" : modo === "novas" ? "Mantém as faturas antigas e cria novas" : "Cancela as faturas abertas e gera novas"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!editingAluno || modoFaturamento !== "nenhum") && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label className="text-sm font-medium text-muted-foreground">Dia de Vencimento</Label>
                              <Select value={formData.dia_vencimento.toString()} onValueChange={v => setFormData({ ...formData, dia_vencimento: parseInt(v) })}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Dia" /></SelectTrigger>
                                <SelectContent>{[1, 5, 10, 15, 20, 25, 28].map(d => <SelectItem key={d} value={d.toString()}>Dia {d}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-sm font-medium text-muted-foreground">Início da Cobrança</Label>
                              <Input type="date" value={formData.data_inicio_cobranca} onChange={e => setFormData({ ...formData, data_inicio_cobranca: e.target.value })} className="h-11" />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-sm font-medium text-muted-foreground">Qtd. de Parcelas</Label>
                              <Select value={formData.quantidade_parcelas.toString()} onValueChange={v => setFormData({ ...formData, quantidade_parcelas: parseInt(v) })}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Parcelas" /></SelectTrigger>
                                <SelectContent>{[1, 2, 3, 4, 5, 6, 10, 11, 12].map(q => <SelectItem key={q} value={q.toString()}>{q} {q === 1 ? "parcela" : "parcelas"}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.quantidade_parcelas} faturas serão geradas a partir de {formData.data_inicio_cobranca ? format(new Date(formData.data_inicio_cobranca + "T00:00:00"), "dd/MM/yyyy") : "-"}, vencendo todo dia {formData.dia_vencimento}.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>{t("common.cancel")}</Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {createMutation.isPending || updateMutation.isPending ? t("common.saving") : editingAluno ? t("common.save") : t("common.register")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <AlunoKPIs alunos={alunos} />

        {/* Batch Actions */}
        <AlunoBatchActions
          selectedIds={selectedIds}
          alunos={alunos}
          onClearSelection={() => setSelectedIds([])}
          onStatusChange={(ids, status) => batchStatusMutation.mutate({ ids, status })}
        />

        {/* Table Card */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">{t("students.studentList")}</CardTitle>
                  <CardDescription>{filteredAlunos.length} {t("students.studentsRegistered")}</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("common.search")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
                </div>
              </div>
              {/* Status Tabs */}
              <Tabs value={statusFilter} onValueChange={v => { setStatusFilter(v as StatusFilter); setSelectedIds([]); }}>
                <TabsList className="h-9 w-full sm:w-auto">
                  <TabsTrigger value="todos" className="text-xs gap-1">
                    <Users className="h-3 w-3" /> Todos ({statusCounts.todos})
                  </TabsTrigger>
                  <TabsTrigger value="ativo" className="text-xs gap-1">
                    <UserCheck className="h-3 w-3" /> Ativos ({statusCounts.ativo})
                  </TabsTrigger>
                  <TabsTrigger value="trancado" className="text-xs gap-1">
                    Trancados ({statusCounts.trancado})
                  </TabsTrigger>
                  <TabsTrigger value="cancelado" className="text-xs gap-1">
                    <UserX className="h-3 w-3" /> Inativos ({statusCounts.cancelado})
                  </TabsTrigger>
                  <TabsTrigger value="sem_turma" className="text-xs gap-1">
                    <GraduationCap className="h-3 w-3" /> Sem turma ({statusCounts.sem_turma})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <AlunoTable
              alunos={filteredAlunos}
              isLoading={isLoading}
              onView={(aluno) => { setViewingAluno(aluno); setIsViewOpen(true); }}
              onEdit={handleEdit}
              onDelete={(id) => { if (confirm(t("students.confirmDelete"))) deleteMutation.mutate(id); }}
              onEnturmar={(aluno) => { setEnturmandoAluno(aluno); setIsEnturmarOpen(true); }}
              isDeleting={deleteMutation.isPending}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              faturasVencidas={faturasVencidas}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AlunoViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} aluno={viewingAluno} faturasVencidas={faturasVencidas} />
        <AlunoEnturmarDialog
          open={isEnturmarOpen} onOpenChange={setIsEnturmarOpen}
          aluno={enturmandoAluno} turmas={turmas}
          onConfirm={handleConfirmEnturmacao} isPending={enturmarMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default Alunos;
