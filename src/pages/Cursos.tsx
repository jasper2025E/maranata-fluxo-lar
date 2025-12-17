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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cursoSchema } from "@/lib/validations";

interface Curso {
  id: string;
  nome: string;
  nivel: string;
  mensalidade: number;
  duracao_meses: number;
  ativo: boolean;
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
    onError: () => toast.error("Erro ao cadastrar curso"),
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast.success("Curso removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover curso"),
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cursos</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie os cursos oferecidos pela escola
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingCurso ? "Editar Curso" : "Novo Curso"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do curso
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Curso</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Reforço Escolar - Fundamental I"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nivel">Nível</Label>
                    <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                      <SelectTrigger>
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
                      <Label htmlFor="mensalidade">Mensalidade (R$)</Label>
                      <Input
                        id="mensalidade"
                        type="number"
                        step="0.01"
                        value={formData.mensalidade}
                        onChange={(e) => setFormData({ ...formData, mensalidade: e.target.value })}
                        placeholder="160.00"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duracao">Duração (meses)</Label>
                      <Input
                        id="duracao"
                        type="number"
                        value={formData.duracao_meses}
                        onChange={(e) => setFormData({ ...formData, duracao_meses: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCurso ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cursos</CardTitle>
            <CardDescription>
              {cursos.length} curso(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : cursos.length === 0 ? (
              <p className="text-muted-foreground">Nenhum curso cadastrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell className="font-medium">{curso.nome}</TableCell>
                      <TableCell>{curso.nivel}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(curso.mensalidade)}
                      </TableCell>
                      <TableCell>{curso.duracao_meses} meses</TableCell>
                      <TableCell>
                        <Badge variant={curso.ativo ? "default" : "secondary"}>
                          {curso.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(curso)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(curso.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
