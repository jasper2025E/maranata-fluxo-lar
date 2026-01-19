import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Pencil, Trash2, Search, Eye, Users, UserCheck, UserX, GraduationCap, Phone, Mail, MapPin, Calendar, BookOpen } from "lucide-react";
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

const statusConfig = {
  ativo: { label: "Ativo", color: "bg-emerald-100 text-emerald-700" },
  trancado: { label: "Trancado", color: "bg-amber-100 text-amber-700" },
  cancelado: { label: "Cancelado", color: "bg-rose-100 text-rose-700" },
  transferido: { label: "Transferido", color: "bg-gray-100 text-gray-700" },
};

const Alunos = () => {
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
  });

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

      // Gerar faturas automáticas
      const curso = cursos.find((c) => c.id === data.curso_id);
      if (curso && newAluno) {
        await supabase.rpc("gerar_faturas_aluno", {
          p_aluno_id: newAluno.id,
          p_curso_id: data.curso_id,
          p_valor: curso.mensalidade,
          p_data_inicio: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Aluno cadastrado e faturas geradas com sucesso!");
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar aluno. Verifique suas permissões.");
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
      toast.success("Aluno atualizado com sucesso!");
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar aluno"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover aluno (verifique se há faturas vinculadas)"),
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
      toast.error("Curso não encontrado");
      return;
    }

    await enturmarMutation.mutateAsync({
      alunoId: enturmandoAluno.id,
      turmaId: selectedTurmaId,
      cursoId: enturmandoAluno.curso_id,
      valorMensalidade: curso.mensalidade,
      responsavelId: (enturmandoAluno as any).responsavel_id,
      gerarFaturas: !enturmandoAluno.turma_id, // Só gera faturas se não tinha turma antes
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

  // Stats calculations
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === 'ativo').length;
  const alunosTrancados = alunos.filter(a => a.status_matricula === 'trancado').length;
  const alunosCancelados = alunos.filter(a => a.status_matricula === 'cancelado' || a.status_matricula === 'transferido').length;
  const alunosSemTurma = alunos.filter(a => !a.turma_id).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Alunos</h2>
            <p className="text-muted-foreground mt-1.5">
              Gerencie os alunos matriculados na escola
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editingAluno ? "Editar Aluno" : "Novo Aluno"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">
                    {editingAluno ? "Atualize os dados do aluno" : "Ao cadastrar, as faturas serão geradas automaticamente"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  <div className="grid gap-2">
                    <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                      Nome Completo
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
                      <Label htmlFor="nascimento" className="text-sm font-medium text-gray-700">
                        Data de Nascimento
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
                      <Label htmlFor="curso" className="text-sm font-medium text-gray-700">
                        Curso
                      </Label>
                      <Select value={formData.curso_id} onValueChange={(value) => setFormData({ ...formData, curso_id: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o curso" />
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
                      <Label htmlFor="turma" className="text-sm font-medium text-gray-700">
                        Turma
                      </Label>
                      <Select value={formData.turma_id} onValueChange={(value) => setFormData({ ...formData, turma_id: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a turma" />
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
                      <Label htmlFor="responsavel" className="text-sm font-medium text-gray-700">
                        Responsável Financeiro
                      </Label>
                      <Select 
                        value={formData.responsavel_id} 
                        onValueChange={(value) => setFormData({ ...formData, responsavel_id: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione o responsável" />
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
                      <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">
                        Telefone do Responsável
                      </Label>
                      <Input
                        id="telefone"
                        value={formData.telefone_responsavel}
                        onChange={(e) => setFormData({ ...formData, telefone_responsavel: e.target.value })}
                        placeholder="(99) 99999-9999"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        E-mail do Responsável
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email_responsavel}
                        onChange={(e) => setFormData({ ...formData, email_responsavel: e.target.value })}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endereco" className="text-sm font-medium text-gray-700">
                      Endereço
                    </Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
                      Observações
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Observações administrativas..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingAluno ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards - Premium Design */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <FinancialKPICard title="Total de Alunos" value={totalAlunos} icon={Users} variant="info" size="sm" />
          <FinancialKPICard title="Alunos Ativos" value={alunosAtivos} icon={UserCheck} variant="success" size="sm" />
          <FinancialKPICard title="Trancados" value={alunosTrancados} icon={Users} variant="warning" size="sm" />
          <FinancialKPICard title="Sem Turma" value={alunosSemTurma} icon={BookOpen} variant="danger" size="sm" />
        </div>

        {/* Table Card */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden animate-fade-in bg-card">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Lista de Alunos
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {filteredAlunos.length} aluno(s) encontrado(s)
                  {filterSemTurma && " • Filtro: sem turma"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={filterSemTurma ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterSemTurma(!filterSemTurma)}
                  className={cn(
                    "h-10",
                    filterSemTurma && "bg-destructive hover:bg-destructive/90"
                  )}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Sem Turma ({alunosSemTurma})
                </Button>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
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
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {searchTerm 
                    ? "Tente buscar com outros termos." 
                    : "Clique no botão \"Novo Aluno\" para começar a cadastrar os alunos da escola."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Turma</TableHead>
                    <TableHead className="font-semibold text-gray-700">Curso</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contato</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow 
                      key={aluno.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {aluno.nome_completo.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{aluno.nome_completo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {aluno.turmas ? `${aluno.turmas.nome} - ${aluno.turmas.serie}` : "-"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {aluno.cursos?.nome || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                          <Phone className="h-3.5 w-3.5" />
                          {aluno.telefone_responsavel}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "font-medium",
                            statusConfig[aluno.status_matricula]?.color || "bg-gray-100 text-gray-700"
                          )}
                        >
                          {statusConfig[aluno.status_matricula]?.label || aluno.status_matricula}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleEnturmar(aluno)}
                            title="Enturmar"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleView(aluno)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => handleEdit(aluno)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover este aluno?")) {
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
              <DialogTitle className="text-xl font-semibold">Detalhes do Aluno</DialogTitle>
            </DialogHeader>
            {viewingAluno && (
              <div className="space-y-6 py-4">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {viewingAluno.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{viewingAluno.nome_completo}</h3>
                    <Badge 
                      className={cn(
                        "font-medium mt-1",
                        statusConfig[viewingAluno.status_matricula]?.color || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {statusConfig[viewingAluno.status_matricula]?.label || viewingAluno.status_matricula}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Data de Nascimento</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(viewingAluno.data_nascimento), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Curso e Turma</p>
                      <p className="font-medium text-gray-900">
                        {viewingAluno.cursos?.nome || "-"}
                        {viewingAluno.turmas && ` • ${viewingAluno.turmas.nome} - ${viewingAluno.turmas.serie}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Telefone do Responsável</p>
                      <p className="font-medium text-gray-900">{viewingAluno.telefone_responsavel}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">E-mail do Responsável</p>
                      <p className="font-medium text-gray-900">{viewingAluno.email_responsavel}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Endereço</p>
                      <p className="font-medium text-gray-900">{viewingAluno.endereco}</p>
                    </div>
                  </div>

                  {viewingAluno.observacoes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-sm text-amber-700 font-medium mb-1">Observações</p>
                      <p className="text-sm text-amber-900">{viewingAluno.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enturmação Dialog */}
        <Dialog open={isEnturmarOpen} onOpenChange={(open) => {
          if (!open) {
            setEnturmandoAluno(null);
            setSelectedTurmaId("");
          }
          setIsEnturmarOpen(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Enturmação Simplificada
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Selecione a turma e confirme. As faturas serão geradas automaticamente.
              </DialogDescription>
            </DialogHeader>
            {enturmandoAluno && (
              <div className="space-y-6 py-4">
                {/* Aluno Info */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">
                      {enturmandoAluno.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{enturmandoAluno.nome_completo}</h3>
                    <p className="text-sm text-gray-500">
                      {enturmandoAluno.cursos?.nome} • {formatCurrency(enturmandoAluno.cursos?.mensalidade || 0)}/mês
                    </p>
                  </div>
                </div>

                {/* Turma atual */}
                {enturmandoAluno.turmas && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-700">
                      <strong>Turma atual:</strong> {enturmandoAluno.turmas.nome} - {enturmandoAluno.turmas.serie}
                    </p>
                  </div>
                )}

                {/* Seleção de Turma */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {enturmandoAluno.turmas ? "Nova Turma" : "Selecione a Turma"}
                  </Label>
                  <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Escolha uma turma..." />
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

                {/* Info sobre faturas */}
                {!enturmandoAluno.turma_id && selectedTurmaId && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-700">
                      ✓ Ao confirmar, 12 faturas mensais de <strong>{formatCurrency(enturmandoAluno.cursos?.mensalidade || 0)}</strong> serão geradas automaticamente.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEnturmarOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmEnturmacao}
                disabled={!selectedTurmaId || enturmarMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {enturmarMutation.isPending ? "Processando..." : "Confirmar Enturmação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Alunos;