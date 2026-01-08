import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  ShieldX,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { useMarketingDomains, useDeleteDomain, useUpdateDomain } from "@/hooks/useMarketing";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainDialog } from "./DomainDialog";
import type { MarketingDomain } from "@/hooks/useMarketing";

const statusConfig = {
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-500" },
  active: { label: "Ativo", icon: CheckCircle, color: "text-green-500" },
  error: { label: "Erro", icon: AlertCircle, color: "text-red-500" },
};

export function DomainsTab() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<MarketingDomain | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: domains, isLoading } = useMarketingDomains();
  const deleteMutation = useDeleteDomain();
  const updateMutation = useUpdateDomain();

  const filteredDomains = domains?.filter(domain =>
    domain.nome.toLowerCase().includes(search.toLowerCase()) ||
    domain.dominio.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (domain: MarketingDomain) => {
    setEditingDomain(domain);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleVerify = async (domain: MarketingDomain) => {
    // In a real scenario, this would check DNS records
    await updateMutation.mutateAsync({
      id: domain.id,
      verificado: true,
      status: 'active',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Domínios</CardTitle>
              <CardDescription>
                Gerencie os domínios das suas landing pages
              </CardDescription>
            </div>
            <Button onClick={() => { setEditingDomain(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Domínio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar domínios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDomains?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? "Nenhum domínio encontrado" : "Nenhum domínio cadastrado ainda"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>Verificado</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDomains?.map((domain) => {
                    const StatusIcon = statusConfig[domain.status].icon;
                    return (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{domain.dominio}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusConfig[domain.status].color}`} />
                            {statusConfig[domain.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {domain.ssl_ativo ? (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <ShieldX className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {domain.verificado ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(domain.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(domain)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {!domain.verificado && (
                                <DropdownMenuItem onClick={() => handleVerify(domain)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Verificar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(domain.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DomainDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        domain={editingDomain}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir domínio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O domínio será removido e as páginas vinculadas ficarão sem domínio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
