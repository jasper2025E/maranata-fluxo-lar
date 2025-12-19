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
import { Plus, Pencil, Trash2, Users, Calendar, Clock, GraduationCap, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const turmaSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  serie: z.string().min(1, "Série é obrigatória"),
  turno: z.string().min(1, "Turno é obrigatório"),
  ano_letivo: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 2000, "Ano inválido"),
});

interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  ano_letivo: number;
  ativo: boolean;
  alunos_count?: number;
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
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

const Turmas = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    nome: "",
    serie: "",
    turno: "Manhã",
    ano_letivo: currentYear.toString(),
  });

  const { data: turmas = [], isLoading } = useQuery({
    queryKey: ["turmas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .order("ano_letivo", { ascending: false });
      if (error) throw error;
      return data as Turma[];
    },
  });

  // Get student counts per turma
  const { data: alunosCounts = {} } = useQuery({
    queryKey: ["turmas-alunos-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("turma_id")
        .eq("status_matricula", "ativo");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(aluno => {
        if (aluno.turma_id) {
          counts[aluno.turma_id] = (counts[aluno.turma_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("turmas").insert({
        nome: data.nome,
        serie: data.serie,
        turno: data.turno,
        ano_letivo: parseInt(data.ano_letivo),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Turma cadastrada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar turma. Verifique suas permissões.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("turmas")
        .update({
          nome: data.nome,
          serie: data.serie,
          turno: data.turno,
          ano_letivo: parseInt(data.ano_letivo),
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Turma atualizada com sucesso!");
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar turma"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("turmas")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("turmas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Turma removida com sucesso!");
    },
    onError: () => toast.error("Erro ao remover turma (verifique se há alunos vinculados)"),
  });

  const resetForm = () => {
    setFormData({ nome: "", serie: "", turno: "Manhã", ano_letivo: currentYear.toString() });
    setEditingTurma(null);
    setIsOpen(false);
  };

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      serie: turma.serie,
      turno: turma.turno,
      ano_letivo: turma.ano_letivo.toString(),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = turmaSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (editingTurma) {
      updateMutation.mutate({ id: editingTurma.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Stats calculations
  const totalTurmas = turmas.length;
  const turmasAtivas = turmas.filter(t => t.ativo).length;
  const turmasAnoAtual = turmas.filter(t => t.ano_letivo === currentYear).length;
  const totalAlunos = Object.values(alunosCounts).reduce((sum, count) => sum + count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Turmas</h2>
            <p className="text-gray-500 mt-1.5">
              Gerencie as turmas e séries da escola
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editingTurma ? "Editar Turma" : "Nova Turma"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Preencha os dados da turma
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  <div className="grid gap-2">
                    <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                      Nome da Turma
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Turma A"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="serie" className="text-sm font-medium text-gray-700">
                        Série
                      </Label>
                      <Select value={formData.serie} onValueChange={(value) => setFormData({ ...formData, serie: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maternal">Maternal</SelectItem>
                          <SelectItem value="Jardim I">Jardim I</SelectItem>
                          <SelectItem value="Jardim II">Jardim II</SelectItem>
                          <SelectItem value="1º Ano">1º Ano</SelectItem>
                          <SelectItem value="2º Ano">2º Ano</SelectItem>
                          <SelectItem value="3º Ano">3º Ano</SelectItem>
                          <SelectItem value="4º Ano">4º Ano</SelectItem>
                          <SelectItem value="5º Ano">5º Ano</SelectItem>
                          <SelectItem value="6º Ano">6º Ano</SelectItem>
                          <SelectItem value="7º Ano">7º Ano</SelectItem>
                          <SelectItem value="8º Ano">8º Ano</SelectItem>
                          <SelectItem value="9º Ano">9º Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="turno" className="text-sm font-medium text-gray-700">
                        Turno
                      </Label>
                      <Select value={formData.turno} onValueChange={(value) => setFormData({ ...formData, turno: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manhã">Manhã</SelectItem>
                          <SelectItem value="Tarde">Tarde</SelectItem>
                          <SelectItem value="Integral">Integral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ano" className="text-sm font-medium text-gray-700">
                      Ano Letivo
                    </Label>
                    <Input
                      id="ano"
                      type="number"
                      value={formData.ano_letivo}
                      onChange={(e) => setFormData({ ...formData, ano_letivo: e.target.value })}
                      className="h-11"
                      required
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
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingTurma ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <StatCardMini title="Total de Turmas" value={totalTurmas} icon={GraduationCap} color="blue" />
          <StatCardMini title="Turmas Ativas" value={turmasAtivas} icon={Users} color="green" />
          <StatCardMini title="Ano Atual" value={turmasAnoAtual} icon={Calendar} color="amber" />
          <StatCardMini title="Alunos Vinculados" value={totalAlunos} icon={Users} color="purple" />
        </div>

        {/* Table Card */}
        <Card className="border-gray-100/80 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Lista de Turmas
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {turmas.length} turma(s) cadastrada(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : turmas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Nenhuma turma cadastrada
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Clique no botão "Nova Turma" para começar a cadastrar as turmas da escola.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Série</TableHead>
                    <TableHead className="font-semibold text-gray-700">Turno</TableHead>
                    <TableHead className="font-semibold text-gray-700">Ano Letivo</TableHead>
                    <TableHead className="font-semibold text-gray-700">Alunos</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turmas.map((turma) => (
                    <TableRow 
                      key={turma.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">{turma.nome}</TableCell>
                      <TableCell className="text-gray-600">{turma.serie}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          {turma.turno}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{turma.ano_letivo}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Users className="h-3.5 w-3.5" />
                          {alunosCounts[turma.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={turma.ativo ? "default" : "secondary"}
                          className={cn(
                            "font-medium",
                            turma.ativo 
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(turma)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => toggleActiveMutation.mutate({ id: turma.id, ativo: !turma.ativo })}
                            disabled={toggleActiveMutation.isPending}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover esta turma?")) {
                                deleteMutation.mutate(turma.id);
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

export default Turmas;