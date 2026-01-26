import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search, Eye, Users, UserCheck, UserX, GraduationCap, Phone, Mail, MapPin, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { alunoSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { useEnturmar } from "@/hooks/useEnturmacao";
import { FinancialKPICard } from "@/components/dashboard";

interface Aluno {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  curso_id: string;
  turma_id: string | null;
  responsavel_id: string | null;
  telefone_responsavel: string;
  email_responsavel: string;
  endereco: string;
  data_matricula: string;
  status_matricula: 'ativo' | 'trancado' | 'cancelado' | 'transferido';
  desconto_percentual: number;
  observacoes: string | null;
  cursos?: { nome: string; mensalidade: number };
  turmas?: { nome: string; serie: string } | null;
  responsaveis?: { id: string; nome: string } | null;
}

interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
}

interface Curso {
  id: string;
  nome: string;
  mensalidade: number;
}

interface Turma {
  id: string;
  nome: string;
  serie: string;
}

// Loading skeleton for table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

const Alunos = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEnturmarOpen, setIsEnturmarOpen] = useState(false);
  const [enturmandoAluno, setEnturmandoAluno] = useState<Aluno | null>(null);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [viewingAluno, setViewingAluno] = useState<Aluno | null>(null);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemTurma, setFilterSemTurma] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    curso_id: "",
    turma_id: "",
    responsavel_id: "",
    telefone_responsavel: "",
    email_responsavel: "",
    endereco: "",
    observacoes: "",
    // Campos de configuração de faturamento
    dia_vencimento: 10,
    data_inicio_cobranca: new Date().toISOString().split("T")[0],
    quantidade_parcelas: 12,
  });

  const statusConfig = {
    ativo: { label: t("students.statusActive"), color: "bg-emerald-100 text-emerald-700" },
    trancado: { label: t("students.statusLocked"), color: "bg-amber-100 text-amber-700" },
    cancelado: { label: t("students.statusCanceled"), color: "bg-rose-100 text-rose-700" },
    transferido: { label: t("students.statusTransferred"), color: "bg-gray-100 text-gray-700" },
  };

  const enturmarMutation = useEnturmar();

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
      const { data, error } = await supabase
        .from("responsaveis")
        .select("id, nome, telefone")
        .eq("ativo", true)
        .order("nome");
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newAluno, error } = await supabase
        .from("alunos")
        .insert({
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          curso_id: data.curso_id,
          turma_id: data.turma_id || null,
          responsavel_id: data.responsavel_id || null,
          telefone_responsavel: data.telefone_responsavel,
          email_responsavel: data.email_responsavel,
          endereco: data.endereco,
          observacoes: data.observacoes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return newAluno;
    },
    onSuccess: (newAluno, variables) => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success(t("students.createSuccess"));
      resetForm();

      void (async () => {
        try {
          if (!newAluno) return;
          const curso = cursos.find((c) => c.id === variables.curso_id);
          if (!curso) return;

          // Usa os parâmetros de faturamento configurados pelo usuário
          const dataInicio = new Date(variables.data_inicio_cobranca);
          dataInicio.setDate(variables.dia_vencimento);

          await supabase.rpc("gerar_faturas_aluno", {
            p_aluno_id: (newAluno as any).id,
            p_curso_id: variables.curso_id,
            p_valor: curso.mensalidade,
            p_data_inicio: dataInicio.toISOString().split("T")[0],
            p_quantidade_meses: variables.quantidade_parcelas,
          });

          const responsavelId = variables.responsavel_id || null;
          if (!responsavelId) return;

          const { data: faturasGeradas } = await supabase
            .from("faturas")
            .select("id")
            .eq("aluno_id", (newAluno as any).id)
            .eq("status", "Aberta")
            .is("asaas_payment_id", null)
            .order("data_vencimento", { ascending: true })
            .limit(3);

          for (const fatura of faturasGeradas || []) {
            const invoke = supabase.functions.invoke("asaas-create-payment", {
              body: { faturaId: fatura.id, billingType: "UNDEFINED" },
            });

            await Promise.race([
              invoke,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("timeout_asaas")), 12_000)
              ),
            ]).catch(() => {});
          }
        } catch (err) {
          console.warn("Falha ao gerar faturas/cobranças em background:", err);
        }
      })();
    },
    onError: (error) => {
      console.error(error);
      toast.error(t("students.createError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("alunos")
        .update({
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          curso_id: data.curso_id,
          turma_id: data.turma_id || null,
          responsavel_id: data.responsavel_id || null,
          telefone_responsavel: data.telefone_responsavel,
          email_responsavel: data.email_responsavel,
          endereco: data.endereco,
          observacoes: data.observacoes || null,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success(t("students.updateSuccess"));
      resetForm();
    },
    onError: () => toast.error(t("students.updateError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success(t("students.deleteSuccess"));
    },
    onError: () => toast.error(t("students.deleteError")),
  });

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      data_nascimento: "",
      curso_id: "",
      turma_id: "",
      responsavel_id: "",
      telefone_responsavel: "",
      email_responsavel: "",
      endereco: "",
      observacoes: "",
      dia_vencimento: 10,
      data_inicio_cobranca: new Date().toISOString().split("T")[0],
      quantidade_parcelas: 12,
    });
    setEditingAluno(null);
    setIsOpen(false);
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome_completo: aluno.nome_completo,
      data_nascimento: aluno.data_nascimento,
      curso_id: aluno.curso_id,
      turma_id: aluno.turma_id || "",
      responsavel_id: aluno.responsavel_id || "",
      telefone_responsavel: aluno.telefone_responsavel,
      email_responsavel: aluno.email_responsavel,
      endereco: aluno.endereco,
      observacoes: aluno.observacoes || "",
      dia_vencimento: 10,
      data_inicio_cobranca: new Date().toISOString().split("T")[0],
      quantidade_parcelas: 12,
    });
    setIsOpen(true);
  };

  const handleView = (aluno: Aluno) => {
    setViewingAluno(aluno);
    setIsViewOpen(true);
  };

  const handleEnturmar = (aluno: Aluno) => {
    setEnturmandoAluno(aluno);
    setSelectedTurmaId(aluno.turma_id || "");
    setIsEnturmarOpen(true);
  };

  const handleConfirmEnturmacao = async () => {
    if (!enturmandoAluno || !selectedTurmaId) return;

    const curso = cursos.find((c) => c.id === enturmandoAluno.curso_id);
    if (!curso) {
      toast.error(t("errors.courseNotFound"));
      return;
    }

    await enturmarMutation.mutateAsync({
      alunoId: enturmandoAluno.id,
      turmaId: selectedTurmaId,
      cursoId: enturmandoAluno.curso_id,
      valorMensalidade: curso.mensalidade,
      responsavelId: (enturmandoAluno as any).responsavel_id,
      gerarFaturas: !enturmandoAluno.turma_id,
    });

    setIsEnturmarOpen(false);
    setEnturmandoAluno(null);
    setSelectedTurmaId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = alunoSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    if (editingAluno) {
      updateMutation.mutate({ id: editingAluno.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch = 
      aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email_responsavel?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTurmaFilter = filterSemTurma ? !aluno.turma_id : true;
    return matchesSearch && matchesTurmaFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === 'ativo').length;
  const alunosTrancados = alunos.filter(a => a.status_matricula === 'trancado').length;
  const alunosCancelados = alunos.filter(a => a.status_matricula === 'cancelado' || a.status_matricula === 'transferido').length;
  const alunosSemTurma = alunos.filter(a => !a.turma_id).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("nav.registrations")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("students.title")}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("students.newStudent")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
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
                  <div className="grid gap-2">
                    <Label htmlFor="nome" className="text-sm font-medium text-muted-foreground">
                      {t("students.fullName")}
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nascimento" className="text-sm font-medium text-muted-foreground">
                        {t("students.birthDate")}
                      </Label>
                      <Input
                        id="nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="curso" className="text-sm font-medium text-muted-foreground">
                        {t("students.course")}
                      </Label>
                      <Select value={formData.curso_id} onValueChange={(value) => setFormData({ ...formData, curso_id: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("students.selectCourse")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome} - {formatCurrency(curso.mensalidade)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="turma" className="text-sm font-medium text-muted-foreground">
                        {t("students.class")}
                      </Label>
                      <Select value={formData.turma_id} onValueChange={(value) => setFormData({ ...formData, turma_id: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("students.selectClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome} - {turma.serie}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="responsavel" className="text-sm font-medium text-muted-foreground">
                        {t("students.guardian")}
                      </Label>
                      <Select value={formData.responsavel_id} onValueChange={(value) => setFormData({ ...formData, responsavel_id: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t("students.selectGuardian")} />
                        </SelectTrigger>
                        <SelectContent>
                          {responsaveisLista.map((resp) => (
                            <SelectItem key={resp.id} value={resp.id}>
                              {resp.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="telefone" className="text-sm font-medium text-muted-foreground">
                        {t("students.phone")}
                      </Label>
                      <Input
                        id="telefone"
                        value={formData.telefone_responsavel}
                        onChange={(e) => setFormData({ ...formData, telefone_responsavel: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                        {t("students.email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email_responsavel}
                        onChange={(e) => setFormData({ ...formData, email_responsavel: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endereco" className="text-sm font-medium text-muted-foreground">
                      {t("students.address")}
                    </Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes" className="text-sm font-medium text-muted-foreground">
                      {t("students.observations")}
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Configuração de Faturamento - apenas para novos alunos */}
                  {!editingAluno && (
                    <div className="border-t pt-5 mt-2">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Configuração de Faturamento
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="dia_vencimento" className="text-sm font-medium text-muted-foreground">
                            Dia de Vencimento
                          </Label>
                          <Select 
                            value={formData.dia_vencimento.toString()} 
                            onValueChange={(value) => setFormData({ ...formData, dia_vencimento: parseInt(value) })}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Dia" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 5, 10, 15, 20, 25, 28].map((dia) => (
                                <SelectItem key={dia} value={dia.toString()}>
                                  Dia {dia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="data_inicio" className="text-sm font-medium text-muted-foreground">
                            Início da Cobrança
                          </Label>
                          <Input
                            id="data_inicio"
                            type="date"
                            value={formData.data_inicio_cobranca}
                            onChange={(e) => setFormData({ ...formData, data_inicio_cobranca: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quantidade_parcelas" className="text-sm font-medium text-muted-foreground">
                            Qtd. de Parcelas
                          </Label>
                          <Select 
                            value={formData.quantidade_parcelas.toString()} 
                            onValueChange={(value) => setFormData({ ...formData, quantidade_parcelas: parseInt(value) })}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Parcelas" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 10, 11, 12].map((qtd) => (
                                <SelectItem key={qtd} value={qtd.toString()}>
                                  {qtd} {qtd === 1 ? "parcela" : "parcelas"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formData.quantidade_parcelas} faturas serão geradas a partir de {formData.data_inicio_cobranca ? format(new Date(formData.data_inicio_cobranca + "T00:00:00"), "dd/MM/yyyy") : "-"}, vencendo todo dia {formData.dia_vencimento}.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? t("common.saving") : editingAluno ? t("common.save") : t("common.register")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in">
          <FinancialKPICard title={t("students.totalStudents")} value={totalAlunos} icon={Users} variant="info" size="sm" index={0} />
          <FinancialKPICard title={t("students.activeStudents")} value={alunosAtivos} icon={UserCheck} variant="success" size="sm" index={1} />
          <FinancialKPICard title={t("students.lockedStudents")} value={alunosTrancados} icon={Users} variant="warning" size="sm" index={2} />
          <FinancialKPICard title={t("students.canceledStudents")} value={alunosCancelados} icon={UserX} variant="danger" size="sm" index={3} />
          <FinancialKPICard title={t("students.withoutClass")} value={alunosSemTurma} icon={GraduationCap} variant="premium" size="sm" index={4} />
        </div>

        {/* Table Card */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {t("students.studentList")}
                </CardTitle>
                <CardDescription>
                  {filteredAlunos.length} {t("students.studentsRegistered")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filterSemTurma ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterSemTurma(!filterSemTurma)}
                >
                  {t("students.withoutClass")}
                </Button>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredAlunos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {t("students.noStudentsFound")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t("students.noStudentsDescription")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">{t("students.name")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("students.course")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("students.class")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("students.guardian")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("students.status")}</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow 
                      key={aluno.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium text-foreground">{aluno.nome_completo}</TableCell>
                      <TableCell className="text-muted-foreground">{aluno.cursos?.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {aluno.turmas ? `${aluno.turmas.nome} - ${aluno.turmas.serie}` : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            {t("students.withoutClass")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{aluno.responsaveis?.nome || "-"}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", statusConfig[aluno.status_matricula]?.color)}>
                          {statusConfig[aluno.status_matricula]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                            onClick={() => handleEnturmar(aluno)}
                            title={t("students.assignClass")}
                          >
                            <GraduationCap className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleView(aluno)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEdit(aluno)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(t("students.confirmDelete"))) {
                                deleteMutation.mutate(aluno.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
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

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("students.studentDetails")}</DialogTitle>
            </DialogHeader>
            {viewingAluno && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{viewingAluno.nome_completo}</h3>
                      <p className="text-sm text-muted-foreground">{viewingAluno.cursos?.nome}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(viewingAluno.data_nascimento), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{viewingAluno.turmas ? `${viewingAluno.turmas.nome}` : t("students.withoutClass")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{viewingAluno.telefone_responsavel || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{viewingAluno.email_responsavel || "-"}</span>
                    </div>
                  </div>
                  {viewingAluno.endereco && (
                    <div className="flex items-start gap-2 text-sm pt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{viewingAluno.endereco}</span>
                    </div>
                  )}
                  {viewingAluno.observacoes && (
                    <div className="pt-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{t("students.observations")}:</p>
                      <p className="text-sm">{viewingAluno.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enturmar Dialog */}
        <Dialog open={isEnturmarOpen} onOpenChange={setIsEnturmarOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("students.assignClass")}</DialogTitle>
              <DialogDescription>
                {t("students.selectClassFor")} {enturmandoAluno?.nome_completo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>{t("students.class")}</Label>
                <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("students.selectClass")} />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.serie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!enturmandoAluno?.turma_id && (
                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
                  {t("students.invoicesWillBeGenerated")}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEnturmarOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleConfirmEnturmacao}
                disabled={!selectedTurmaId || enturmarMutation.isPending}
              >
                {enturmarMutation.isPending ? t("common.saving") : t("common.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Alunos;
