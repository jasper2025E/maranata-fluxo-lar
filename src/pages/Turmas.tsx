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
import { z } from "zod";

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
    onError: () => toast.error("Erro ao cadastrar turma"),
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Turmas</h2>
            <p className="text-muted-foreground mt-1">Gerencie as turmas e séries da escola</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova Turma</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingTurma ? "Editar Turma" : "Nova Turma"}</DialogTitle>
                  <DialogDescription>Preencha os dados da turma</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome da Turma</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Turma A"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="serie">Série</Label>
                      <Select value={formData.serie} onValueChange={(value) => setFormData({ ...formData, serie: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                      <Label htmlFor="turno">Turno</Label>
                      <Select value={formData.turno} onValueChange={(value) => setFormData({ ...formData, turno: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manhã">Manhã</SelectItem>
                          <SelectItem value="Tarde">Tarde</SelectItem>
                          <SelectItem value="Integral">Integral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ano">Ano Letivo</Label>
                    <Input
                      id="ano"
                      type="number"
                      value={formData.ano_letivo}
                      onChange={(e) => setFormData({ ...formData, ano_letivo: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTurma ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Turmas</CardTitle>
            <CardDescription>{turmas.length} turma(s) cadastrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : turmas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma turma cadastrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Ano Letivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turmas.map((turma) => (
                    <TableRow key={turma.id}>
                      <TableCell className="font-medium">{turma.nome}</TableCell>
                      <TableCell>{turma.serie}</TableCell>
                      <TableCell>{turma.turno}</TableCell>
                      <TableCell>{turma.ano_letivo}</TableCell>
                      <TableCell>
                        <Badge variant={turma.ativo ? "default" : "secondary"}>
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(turma)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(turma.id)}
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

export default Turmas;
