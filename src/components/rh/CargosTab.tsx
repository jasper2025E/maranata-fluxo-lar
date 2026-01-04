import { useState } from "react";
import { useCargos, useCreateCargo, useUpdateCargo, useDeleteCargo, useSetores, useCreateSetor, useUpdateSetor, useDeleteSetor, Cargo, Setor } from "@/hooks/useRH";
import { CargoForm } from "./CargoForm";
import { SetorForm } from "./SetorForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Briefcase, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";

export function CargosTab() {
  const [activeSubTab, setActiveSubTab] = useState("cargos");
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [isSetorDialogOpen, setIsSetorDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);

  const { data: cargos, isLoading: loadingCargos } = useCargos();
  const { data: setores, isLoading: loadingSetores } = useSetores();

  const createCargoMutation = useCreateCargo();
  const updateCargoMutation = useUpdateCargo();
  const deleteCargoMutation = useDeleteCargo();

  const createSetorMutation = useCreateSetor();
  const updateSetorMutation = useUpdateSetor();
  const deleteSetorMutation = useDeleteSetor();

  const handleCargoSubmit = async (data: any) => {
    if (editingCargo) {
      await updateCargoMutation.mutateAsync({ id: editingCargo.id, ...data });
    } else {
      await createCargoMutation.mutateAsync(data);
    }
    setIsCargoDialogOpen(false);
    setEditingCargo(null);
  };

  const handleSetorSubmit = async (data: any) => {
    if (editingSetor) {
      await updateSetorMutation.mutateAsync({ id: editingSetor.id, ...data });
    } else {
      await createSetorMutation.mutateAsync(data);
    }
    setIsSetorDialogOpen(false);
    setEditingSetor(null);
  };

  if (loadingCargos || loadingSetores) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="cargos">Cargos</TabsTrigger>
            <TabsTrigger value="setores">Setores</TabsTrigger>
          </TabsList>
          
          {activeSubTab === "cargos" ? (
            <Dialog open={isCargoDialogOpen} onOpenChange={(open) => {
              setIsCargoDialogOpen(open);
              if (!open) setEditingCargo(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cargo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCargo ? "Editar Cargo" : "Novo Cargo"}
                  </DialogTitle>
                </DialogHeader>
                <CargoForm
                  cargo={editingCargo}
                  onSubmit={handleCargoSubmit}
                  isLoading={createCargoMutation.isPending || updateCargoMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isSetorDialogOpen} onOpenChange={(open) => {
              setIsSetorDialogOpen(open);
              if (!open) setEditingSetor(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Setor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSetor ? "Editar Setor" : "Novo Setor"}
                  </DialogTitle>
                </DialogHeader>
                <SetorForm
                  setor={editingSetor}
                  onSubmit={handleSetorSubmit}
                  isLoading={createSetorMutation.isPending || updateSetorMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="cargos" className="mt-4">
          {cargos?.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nenhum cargo cadastrado"
              description="Comece cadastrando os cargos da escola"
            />
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargos?.map((cargo) => (
                    <TableRow key={cargo.id}>
                      <TableCell className="font-medium">{cargo.nome}</TableCell>
                      <TableCell>{cargo.setores?.nome || "-"}</TableCell>
                      <TableCell>{formatCurrency(cargo.salario_base)}</TableCell>
                      <TableCell>
                        <Badge variant={cargo.ativo ? "default" : "secondary"}>
                          {cargo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingCargo(cargo);
                            setIsCargoDialogOpen(true);
                          }}>
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
                                  Tem certeza que deseja excluir o cargo "{cargo.nome}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCargoMutation.mutate(cargo.id)}>
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
        </TabsContent>

        <TabsContent value="setores" className="mt-4">
          {setores?.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhum setor cadastrado"
              description="Comece cadastrando os setores da escola"
            />
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setores?.map((setor) => (
                    <TableRow key={setor.id}>
                      <TableCell className="font-medium">{setor.nome}</TableCell>
                      <TableCell>{setor.descricao || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={setor.ativo ? "default" : "secondary"}>
                          {setor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingSetor(setor);
                            setIsSetorDialogOpen(true);
                          }}>
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
                                  Tem certeza que deseja excluir o setor "{setor.nome}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSetorMutation.mutate(setor.id)}>
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
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
