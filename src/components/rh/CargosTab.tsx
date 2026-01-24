import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCargos, useCreateCargo, useUpdateCargo, useDeleteCargo, useSetores, useCreateSetor, useUpdateSetor, useDeleteSetor, Cargo, Setor } from "@/hooks/useRH";
import { CargoForm } from "./CargoForm";
import { SetorForm } from "./SetorForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Briefcase, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function CargosTab() {
  const { t } = useTranslation();
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

  const navItems: NavItem[] = [
    { id: "cargos", label: "Cargos", icon: Briefcase },
    { id: "setores", label: "Setores", icon: Building2 },
  ];

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Sub-navigation + Action */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeSubTab === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        
        {activeSubTab === "cargos" ? (
          <Dialog open={isCargoDialogOpen} onOpenChange={(open) => {
            setIsCargoDialogOpen(open);
            if (!open) setEditingCargo(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
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
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Setor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
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

      {/* Content */}
      {activeSubTab === "cargos" ? (
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Lista de Cargos
            </CardTitle>
            <CardDescription>
              {cargos?.length || 0} cargo(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {cargos?.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  icon={Briefcase}
                  title="Nenhum cargo cadastrado"
                  description="Comece cadastrando os cargos da escola"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Nome</TableHead>
                    <TableHead className="font-semibold text-foreground">Setor</TableHead>
                    <TableHead className="font-semibold text-foreground">Salário Base</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargos?.map((cargo, index) => (
                    <motion.tr
                      key={cargo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      <TableCell className="font-medium text-foreground">{cargo.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{cargo.setores?.nome || "-"}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(cargo.salario_base)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "font-medium",
                            cargo.ativo 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {cargo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setEditingCargo(cargo);
                              setIsCargoDialogOpen(true);
                            }}
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
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Lista de Setores
            </CardTitle>
            <CardDescription>
              {setores?.length || 0} setor(es) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {setores?.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  icon={Building2}
                  title="Nenhum setor cadastrado"
                  description="Comece cadastrando os setores da escola"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Nome</TableHead>
                    <TableHead className="font-semibold text-foreground">Descrição</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setores?.map((setor, index) => (
                    <motion.tr
                      key={setor.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      <TableCell className="font-medium text-foreground">{setor.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{setor.descricao || "-"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "font-medium",
                            setor.ativo 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {setor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setEditingSetor(setor);
                              setIsSetorDialogOpen(true);
                            }}
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
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
