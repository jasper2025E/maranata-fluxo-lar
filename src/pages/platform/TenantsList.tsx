import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import PlatformLayout from "@/components/platform/PlatformLayout";

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  plano: string;
  status: string;
  data_contrato: string;
  limite_alunos: number;
  limite_usuarios: number;
  created_at: string;
}

interface TenantDataCounts {
  alunos: number;
  faturas: number;
  responsaveis: number;
  cursos: number;
  turmas: number;
  funcionarios: number;
  usuarios: number;
  loading: boolean;
}

export default function TenantsList() {
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [dataCounts, setDataCounts] = useState<TenantDataCounts>({
    alunos: 0,
    faturas: 0,
    responsaveis: 0,
    cursos: 0,
    turmas: 0,
    funcionarios: 0,
    usuarios: 0,
    loading: false,
  });
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchTenants();
  }, [isPlatformAdmin, navigate]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Erro ao carregar escolas");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantDataCounts = async (tenantId: string) => {
    setDataCounts(prev => ({ ...prev, loading: true }));
    
    try {
      // Buscar contagens em paralelo
      const [
        alunosRes,
        faturasRes,
        responsaveisRes,
        cursosRes,
        funcionariosRes,
        usuariosRes,
      ] = await Promise.all([
        supabase.from("alunos").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("faturas").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("responsaveis").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("cursos").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("funcionarios").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      ]);

      setDataCounts({
        alunos: alunosRes.count || 0,
        faturas: faturasRes.count || 0,
        responsaveis: responsaveisRes.count || 0,
        cursos: cursosRes.count || 0,
        turmas: 0,
        funcionarios: funcionariosRes.count || 0,
        usuarios: usuariosRes.count || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching data counts:", error);
      setDataCounts(prev => ({ ...prev, loading: false }));
    }
  };

  const openDeleteDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteConfirmed(false);
    setDeleteDialogOpen(true);
    fetchTenantDataCounts(tenant.id);
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;

    try {
      // Usar Edge Function com service role para garantir exclusão completa
      const { data, error } = await supabase.functions.invoke("delete-tenant", {
        body: { tenantId: selectedTenant.id },
      });

      if (error) {
        console.error("Error from delete-tenant function:", error);
        throw new Error(error.message || "Erro ao excluir escola");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Escola excluída com sucesso");
      setTenants(tenants.filter(t => t.id !== selectedTenant.id));
    } catch (error) {
      console.error("Error deleting tenant:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover escola";
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
      setDeleteConfirmed(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }> = {
      ativo: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      inativo: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      suspenso: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
    };
    const config = variants[status] || variants.inativo;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Escolas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie todas as escolas cadastradas na plataforma
            </p>
          </div>
          <Button onClick={() => navigate("/platform/tenants/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Escola
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50 focus-visible:ring-primary/30"
          />
        </div>

        {/* List */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Lista de Escolas</CardTitle>
                <CardDescription>
                  {filteredTenants.length} escola(s) encontrada(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                Carregando...
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma escola encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredTenants.map((tenant, index) => (
                  <div
                    key={tenant.id}
                    className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tenant.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.cnpj || "CNPJ não informado"} • {tenant.email || "Email não informado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="hidden sm:flex">{tenant.plano}</Badge>
                      {getStatusBadge(tenant.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/platform/tenants/${tenant.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/platform/tenants/${tenant.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => openDeleteDialog(tenant)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeleteConfirmed(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Você está prestes a excluir permanentemente a escola <strong className="text-foreground">"{selectedTenant?.nome}"</strong>.
                </p>
                
                {dataCounts.loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm">Verificando dados...</span>
                  </div>
                ) : (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
                    <p className="text-destructive font-medium text-sm">
                      Os seguintes dados serão excluídos permanentemente:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {dataCounts.alunos > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                          <span>{dataCounts.alunos} aluno(s)</span>
                        </div>
                      )}
                      {dataCounts.faturas > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                          <span>{dataCounts.faturas} fatura(s)</span>
                        </div>
                      )}
                      {dataCounts.responsaveis > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                          <span>{dataCounts.responsaveis} responsável(eis)</span>
                        </div>
                      )}
                      {dataCounts.cursos > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                          <span>{dataCounts.cursos} curso(s)</span>
                        </div>
                      )}
                      {dataCounts.funcionarios > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                          <span>{dataCounts.funcionarios} funcionário(s)</span>
                        </div>
                      )}
                      {dataCounts.usuarios > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                          <span>{dataCounts.usuarios} usuário(s)</span>
                        </div>
                      )}
                      {dataCounts.alunos === 0 && dataCounts.faturas === 0 && dataCounts.responsaveis === 0 && 
                       dataCounts.cursos === 0 && dataCounts.funcionarios === 0 && dataCounts.usuarios === 0 && (
                        <div className="col-span-2 text-muted-foreground italic">
                          Nenhum dado adicional encontrado
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      Entendo que esta ação é irreversível e desejo prosseguir
                    </span>
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!deleteConfirmed || dataCounts.loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformLayout>
  );
}
