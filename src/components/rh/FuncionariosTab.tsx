import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFuncionarios, useCreateFuncionario, useUpdateFuncionario, useDeleteFuncionario, Funcionario } from "@/hooks/useRH";
import { FuncionarioForm } from "./FuncionarioForm";
import { DocumentosUpload } from "./DocumentosUpload";
import { PontoLinkManager } from "./PontoLinkManager";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Search, User, FileText, Link2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  inativo: "bg-muted text-muted-foreground border-border",
  afastado: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ferias: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const tipoLabels: Record<string, string> = {
  professor: "Professor",
  administrativo: "Administrativo",
  outro: "Outro",
};

export function FuncionariosTab() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [documentosFuncionario, setDocumentosFuncionario] = useState<Funcionario | null>(null);
  const [pontoLinkFuncionario, setPontoLinkFuncionario] = useState<Funcionario | null>(null);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingFuncionario(null);
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
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

      {/* Table Card */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Lista de Funcionários
              </CardTitle>
              <CardDescription>
                {filteredFuncionarios?.length || 0} funcionário(s) cadastrado(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFuncionarios?.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={User}
                title="Nenhum funcionário encontrado"
                description="Comece cadastrando seu primeiro funcionário"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Nome</TableHead>
                  <TableHead className="font-semibold text-foreground">Cargo</TableHead>
                  <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Salário</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios?.map((funcionario, index) => (
                  <motion.tr
                    key={funcionario.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors border-b border-border/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarImage src={funcionario.foto_url || undefined} alt={funcionario.nome_completo} />
                          <AvatarFallback className="bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{funcionario.nome_completo}</p>
                          <p className="text-sm text-muted-foreground">{funcionario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {funcionario.cargos?.nome || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tipoLabels[funcionario.tipo]}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn("font-medium capitalize", statusColors[funcionario.status])}
                      >
                        {funcionario.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(funcionario.salario_base)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className={cn(
                            "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted",
                            funcionario.ponto_token && "text-emerald-600"
                          )}
                          onClick={() => setPontoLinkFuncionario(funcionario)}
                          title="Link de Ponto"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => setDocumentosFuncionario(funcionario)}
                          title="Documentos"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEdit(funcionario)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
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
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sheet para Documentos */}
      <Sheet open={!!documentosFuncionario} onOpenChange={(open) => !open && setDocumentosFuncionario(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {documentosFuncionario?.foto_url && (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={documentosFuncionario.foto_url} />
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
              <div>
                <span>{documentosFuncionario?.nome_completo}</span>
                <p className="text-sm font-normal text-muted-foreground">Documentos do funcionário</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {documentosFuncionario && (
              <DocumentosUpload funcionarioId={documentosFuncionario.id} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Link de Ponto */}
      {pontoLinkFuncionario && (
        <PontoLinkManager
          funcionario={pontoLinkFuncionario}
          open={!!pontoLinkFuncionario}
          onOpenChange={(open) => !open && setPontoLinkFuncionario(null)}
        />
      )}
    </motion.div>
  );
}
