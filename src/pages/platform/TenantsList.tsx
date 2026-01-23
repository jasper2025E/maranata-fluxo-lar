import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Escolas</h1>
            <p className="text-slate-400">
              Gerencie todas as escolas cadastradas na plataforma
            </p>
          </div>
          <Button 
            onClick={() => navigate("/platform/tenants/new")}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Escola
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </motion.div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Lista de Escolas</CardTitle>
              <CardDescription className="text-slate-400">
                {filteredTenants.length} escola(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-400">
                  Carregando...
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma escola encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTenants.map((tenant, index) => (
                    <motion.div
                      key={tenant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{tenant.nome}</p>
                          <p className="text-sm text-slate-400">
                            {tenant.cnpj || "CNPJ não informado"} • {tenant.email || "Email não informado"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {tenant.plano}
                        </Badge>
                        {getStatusBadge(tenant.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem 
                              className="text-slate-300 hover:text-white focus:text-white"
                              onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-slate-300 hover:text-white focus:text-white"
                              onClick={() => navigate(`/platform/tenants/${tenant.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 hover:text-red-300 focus:text-red-300"
                              onClick={() => openDeleteDialog(tenant)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeleteConfirmed(false);
        }
      }}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-slate-400 space-y-4">
                <p>
                  Você está prestes a excluir permanentemente a escola <strong className="text-white">"{selectedTenant?.nome}"</strong>.
                </p>
                
                {dataCounts.loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                    <span className="ml-2 text-sm">Verificando dados...</span>
                  </div>
                ) : (
                  <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4 space-y-3">
                    <p className="text-red-400 font-medium text-sm">
                      Os seguintes dados serão excluídos permanentemente:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {dataCounts.alunos > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span>{dataCounts.alunos} aluno(s)</span>
                        </div>
                      )}
                      {dataCounts.faturas > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span>{dataCounts.faturas} fatura(s)</span>
                        </div>
                      )}
                      {dataCounts.responsaveis > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span>{dataCounts.responsaveis} responsável(eis)</span>
                        </div>
                      )}
                      {dataCounts.cursos > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span>{dataCounts.cursos} curso(s)</span>
                        </div>
                      )}
                      {dataCounts.funcionarios > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span>{dataCounts.funcionarios} funcionário(s)</span>
                        </div>
                      )}
                      {dataCounts.usuarios > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span>{dataCounts.usuarios} usuário(s)</span>
                        </div>
                      )}
                      {dataCounts.alunos === 0 && dataCounts.faturas === 0 && dataCounts.responsaveis === 0 && 
                       dataCounts.cursos === 0 && dataCounts.funcionarios === 0 && dataCounts.usuarios === 0 && (
                        <div className="col-span-2 text-slate-500 italic">
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
                      className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Entendo que esta ação é irreversível e desejo prosseguir
                    </span>
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!deleteConfirmed || dataCounts.loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
