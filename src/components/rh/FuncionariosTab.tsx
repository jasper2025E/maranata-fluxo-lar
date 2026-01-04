import { useState } from "react";
import { useFuncionarios, useCreateFuncionario, useUpdateFuncionario, useDeleteFuncionario, Funcionario } from "@/hooks/useRH";
import { FuncionarioForm } from "./FuncionarioForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, User } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-800",
  inativo: "bg-gray-100 text-gray-800",
  afastado: "bg-amber-100 text-amber-800",
  ferias: "bg-blue-100 text-blue-800",
};

const tipoLabels: Record<string, string> = {
  professor: "Professor",
  administrativo: "Administrativo",
  outro: "Outro",
};

export function FuncionariosTab() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);

  const { data: funcionarios, isLoading } = useFuncionarios();
  const createMutation = useCreateFuncionario();
  const updateMutation = useUpdateFuncionario();
  const deleteMutation = useDeleteFuncionario();

  const filteredFuncionarios = funcionarios?.filter(f =>
    f.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
    f.cpf?.includes(search) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (data: any) => {
    if (editingFuncionario) {
      await updateMutation.mutateAsync({ id: editingFuncionario.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingFuncionario(null);
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingFuncionario(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}
              </DialogTitle>
            </DialogHeader>
            <FuncionarioForm
              funcionario={editingFuncionario}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {filteredFuncionarios?.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum funcionário encontrado"
          description="Comece cadastrando seu primeiro funcionário"
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFuncionarios?.map((funcionario) => (
                <TableRow key={funcionario.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{funcionario.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">{funcionario.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{funcionario.cargos?.nome || "-"}</TableCell>
                  <TableCell>{tipoLabels[funcionario.tipo]}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[funcionario.status]}>
                      {funcionario.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(funcionario.salario_base)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(funcionario)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir {funcionario.nome_completo}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(funcionario.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
