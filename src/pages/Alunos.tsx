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
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Aluno {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  curso_id: string;
  telefone_responsavel: string;
  email_responsavel: string;
  endereco: string;
  data_matricula: string;
  ativo: boolean;
  observacoes: string | null;
  cursos?: { nome: string; mensalidade: number };
}

interface Curso {
  id: string;
  nome: string;
  mensalidade: number;
}

const Alunos = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingAluno, setViewingAluno] = useState<Aluno | null>(null);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    curso_id: "",
    telefone_responsavel: "",
    email_responsavel: "",
    endereco: "",
    observacoes: "",
  });

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["alunos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("*, cursos(nome, mensalidade)")
        .order("nome_completo");
      if (error) throw error;
      return data as Aluno[];
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newAluno, error } = await supabase
        .from("alunos")
        .insert({
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          curso_id: data.curso_id,
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
      toast.success("Aluno cadastrado e faturas geradas com sucesso!");
      resetForm();
    },
    onError: () => toast.error("Erro ao cadastrar aluno"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("alunos")
        .update({
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          curso_id: data.curso_id,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAluno) {
      updateMutation.mutate({ id: editingAluno.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredAlunos = alunos.filter(
    (aluno) =>
      aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email_responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Alunos</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie os alunos matriculados na escola
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingAluno ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
                  <DialogDescription>
                    {editingAluno ? "Atualize os dados do aluno" : "Ao cadastrar, as faturas serão geradas automaticamente"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nascimento">Data de Nascimento</Label>
                      <Input
                        id="nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="curso">Curso</Label>
                      <Select value={formData.curso_id} onValueChange={(value) => setFormData({ ...formData, curso_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(curso.mensalidade)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone do Responsável</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone_responsavel}
                        onChange={(e) => setFormData({ ...formData, telefone_responsavel: e.target.value })}
                        placeholder="(99) 99999-9999"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail do Responsável</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email_responsavel}
                        onChange={(e) => setFormData({ ...formData, email_responsavel: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Observações administrativas..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAluno ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Alunos</CardTitle>
                <CardDescription>{filteredAlunos.length} aluno(s)</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredAlunos.length === 0 ? (
              <p className="text-muted-foreground">Nenhum aluno encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                      <TableCell>{aluno.cursos?.nome || "-"}</TableCell>
                      <TableCell>{aluno.telefone_responsavel}</TableCell>
                      <TableCell>{aluno.email_responsavel}</TableCell>
                      <TableCell>
                        <Badge variant={aluno.ativo ? "default" : "secondary"}>
                          {aluno.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleView(aluno)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(aluno)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(aluno.id)}
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

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Aluno</DialogTitle>
            </DialogHeader>
            {viewingAluno && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{viewingAluno.nome_completo}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data de Nascimento</Label>
                    <p className="font-medium">{format(new Date(viewingAluno.data_nascimento), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Curso</Label>
                    <p className="font-medium">{viewingAluno.cursos?.nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data da Matrícula</Label>
                    <p className="font-medium">{format(new Date(viewingAluno.data_matricula), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{viewingAluno.telefone_responsavel}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">E-mail</Label>
                    <p className="font-medium">{viewingAluno.email_responsavel}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Endereço</Label>
                  <p className="font-medium">{viewingAluno.endereco}</p>
                </div>
                {viewingAluno.observacoes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="font-medium">{viewingAluno.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Alunos;
