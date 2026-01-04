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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Search, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { despesaSchema } from "@/lib/validations";

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

const Despesas = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "",
    valor: "",
    data_vencimento: "",
    recorrente: false,
    observacoes: "",
  });

  const { data: despesas = [], isLoading } = useQuery({
    queryKey: ["despesas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Despesa[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("despesas").insert({
        titulo: data.titulo,
        categoria: data.categoria,
        valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento,
        recorrente: data.recorrente,
        observacoes: data.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa cadastrada com sucesso!");
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Erro ao cadastrar despesa:", error);
      toast.error(`Erro ao cadastrar despesa: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("despesas")
        .update({
          titulo: data.titulo,
          categoria: data.categoria,
          valor: parseFloat(data.valor),
          data_vencimento: data.data_vencimento,
          recorrente: data.recorrente,
          observacoes: data.observacoes || null,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa atualizada com sucesso!");
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar despesa:", error);
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa removida com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao remover despesa:", error);
      toast.error(`Erro ao remover despesa: ${error.message}`);
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("despesas")
        .update({ paga: true, data_pagamento: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa marcada como paga!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar despesa:", error);
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      categoria: "",
      valor: "",
      data_vencimento: "",
      recorrente: false,
      observacoes: "",
    });
    setEditingDespesa(null);
    setIsOpen(false);
  };

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setFormData({
      titulo: despesa.titulo,
      categoria: despesa.categoria,
      valor: despesa.valor.toString(),
      data_vencimento: despesa.data_vencimento,
      recorrente: despesa.recorrente,
      observacoes: despesa.observacoes || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = despesaSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    if (editingDespesa) {
      updateMutation.mutate({ id: editingDespesa.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredDespesas = despesas.filter(
    (despesa) =>
      despesa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPagas = despesas.filter((d) => d.paga).reduce((sum, d) => sum + d.valor, 0);
  const totalPendentes = despesas.filter((d) => !d.paga).reduce((sum, d) => sum + d.valor, 0);

  const getCategoryBadge = (categoria: string) => {
    switch (categoria) {
      case "Fixa":
        return <Badge>Fixa</Badge>;
      case "Variável":
        return <Badge variant="secondary">Variável</Badge>;
      case "Única":
        return <Badge variant="outline">Única</Badge>;
      default:
        return <Badge variant="outline">{categoria}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
            <p className="text-muted-foreground mt-1">
              Controle as despesas da escola
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingDespesa ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da despesa
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Ex: Domínio personalizado anual"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fixa">Fixa</SelectItem>
                          <SelectItem value="Variável">Variável</SelectItem>
                          <SelectItem value="Única">Única</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vencimento">Data de Vencimento</Label>
                    <Input
                      id="vencimento"
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recorrente"
                      checked={formData.recorrente}
                      onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked as boolean })}
                    />
                    <Label htmlFor="recorrente">Despesa recorrente (mensal)</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingDespesa ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Despesas</CardDescription>
              <CardTitle className="text-2xl">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDespesas)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pagas</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPagas)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-2xl text-destructive">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPendentes)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Despesas</CardTitle>
                <CardDescription>{filteredDespesas.length} despesa(s)</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
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
            ) : filteredDespesas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDespesas.map((despesa) => (
                    <TableRow key={despesa.id}>
                      <TableCell className="font-medium">
                        {despesa.titulo}
                        {despesa.recorrente && <span className="ml-2 text-xs text-muted-foreground">(Recorrente)</span>}
                      </TableCell>
                      <TableCell>{getCategoryBadge(despesa.categoria)}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(despesa.valor)}
                      </TableCell>
                      <TableCell>{format(new Date(despesa.data_vencimento), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={despesa.paga ? "default" : "destructive"}>
                          {despesa.paga ? "Paga" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!despesa.paga && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsPaidMutation.mutate(despesa.id)}
                            title="Marcar como paga"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(despesa)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(despesa.id)}
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

export default Despesas;
