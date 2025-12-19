import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, BookOpen, DollarSign, Clock, Users, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cursoSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface Curso {
  id: string;
  nome: string;
  nivel: string;
  mensalidade: number;
  duracao_meses: number;
  ativo: boolean;
}

// Premium stat card component
function StatCardMini({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  color: "blue" | "green" | "amber" | "purple" 
}) {
  const colorConfig = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
    purple: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
  };

  const colors = colorConfig[color];

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl bg-white border shadow-sm",
      "hover:shadow-md transition-all duration-300",
      colors.border
    )}>
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", colors.bg)}>
        <Icon className={cn("h-5 w-5", colors.icon)} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
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
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

const Cursos = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    nivel: "",
    mensalidade: "",
    duracao_meses: "12",
  });

  const { data: cursos = [], isLoading } = useQuery({
    queryKey: ["cursos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Curso[];
    },
  });

  // Get student counts per curso
  const { data: alunosCounts = {} } = useQuery({
    queryKey: ["cursos-alunos-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("curso_id")
        .eq("status_matricula", "ativo");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(aluno => {
        if (aluno.curso_id) {
          counts[aluno.curso_id] = (counts[aluno.curso_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("cursos").insert({
        nome: data.nome,
        nivel: data.nivel,
        mensalidade: parseFloat(data.mensalidade),
        duracao_meses: parseInt(data.duracao_meses),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso cadastrado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar curso. Verifique suas permissões.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("cursos")
        .update({
          nome: data.nome,
          nivel: data.nivel,
          mensalidade: parseFloat(data.mensalidade),
          duracao_meses: parseInt(data.duracao_meses),
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso atualizado com sucesso!");
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar curso"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("cursos")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover curso (verifique se há alunos vinculados)"),
  });

  const resetForm = () => {
    setFormData({ nome: "", nivel: "", mensalidade: "", duracao_meses: "12" });
    setEditingCurso(null);
    setIsOpen(false);
  };

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      nome: curso.nome,
      nivel: curso.nivel,
      mensalidade: curso.mensalidade.toString(),
      duracao_meses: curso.duracao_meses.toString(),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = cursoSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    if (editingCurso) {
      updateMutation.mutate({ id: editingCurso.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // Stats calculations
  const totalCursos = cursos.length;
  const cursosAtivos = cursos.filter(c => c.ativo).length;
  const receitaPotencial = cursos
    .filter(c => c.ativo)
    .reduce((sum, c) => sum + (c.mensalidade * (alunosCounts[c.id] || 0)), 0);
  const totalAlunosMatriculados = Object.values(alunosCounts).reduce((sum, count) => sum + count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Cursos</h2>
            <p className="text-gray-500 mt-1.5">
              Gerencie os cursos oferecidos pela escola
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editingCurso ? "Editar Curso" : "Novo Curso"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Preencha os dados do curso
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  <div className="grid gap-2">
                    <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                      Nome do Curso
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Reforço Escolar - Fundamental I"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nivel" className="text-sm font-medium text-gray-700">
                      Nível
                    </Label>
                    <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Educação Infantil">Educação Infantil</SelectItem>
                        <SelectItem value="Fundamental I">Fundamental I</SelectItem>
                        <SelectItem value="Fundamental II">Fundamental II</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="mensalidade" className="text-sm font-medium text-gray-700">
                        Mensalidade (R$)
                      </Label>
                      <Input
                        id="mensalidade"
                        type="number"
                        step="0.01"
                        value={formData.mensalidade}
                        onChange={(e) => setFormData({ ...formData, mensalidade: e.target.value })}
                        placeholder="160.00"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duracao" className="text-sm font-medium text-gray-700">
                        Duração (meses)
                      </Label>
                      <Input
                        id="duracao"
                        type="number"
                        value={formData.duracao_meses}
                        onChange={(e) => setFormData({ ...formData, duracao_meses: e.target.value })}
                        className="h-11"
                        required
                      />
                    </div>
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
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingCurso ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <StatCardMini title="Total de Cursos" value={totalCursos} icon={BookOpen} color="blue" />
          <StatCardMini title="Cursos Ativos" value={cursosAtivos} icon={BookOpen} color="green" />
          <StatCardMini title="Alunos Matriculados" value={totalAlunosMatriculados} icon={Users} color="purple" />
          <StatCardMini title="Receita Potencial" value={formatCurrency(receitaPotencial)} icon={DollarSign} color="amber" />
        </div>

        {/* Table Card */}
        <Card className="border-gray-100/80 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Lista de Cursos
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {cursos.length} curso(s) cadastrado(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : cursos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Nenhum curso cadastrado
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Clique no botão "Novo Curso" para começar a cadastrar os cursos da escola.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nível</TableHead>
                    <TableHead className="font-semibold text-gray-700">Mensalidade</TableHead>
                    <TableHead className="font-semibold text-gray-700">Duração</TableHead>
                    <TableHead className="font-semibold text-gray-700">Alunos</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow 
                      key={curso.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">{curso.nome}</TableCell>
                      <TableCell className="text-gray-600">{curso.nivel}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(curso.mensalidade)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          {curso.duracao_meses} meses
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Users className="h-3.5 w-3.5" />
                          {alunosCounts[curso.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={curso.ativo ? "default" : "secondary"}
                          className={cn(
                            "font-medium",
                            curso.ativo 
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {curso.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(curso)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => toggleActiveMutation.mutate({ id: curso.id, ativo: !curso.ativo })}
                            disabled={toggleActiveMutation.isPending}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover este curso?")) {
                                deleteMutation.mutate(curso.id);
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
      </div>
    </DashboardLayout>
  );
};

export default Cursos;