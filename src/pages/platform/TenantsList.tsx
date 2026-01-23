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

export default function TenantsList() {
  const navigate = useNavigate();
  const { isPlatformAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

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

  const handleDelete = async () => {
    if (!selectedTenant) return;

    try {
      // Primeiro, deletar registros dependentes em ordem
      // 1. Deletar escola vinculada ao tenant
      const { error: escolaError } = await supabase
        .from("escola")
        .delete()
        .eq("tenant_id", selectedTenant.id);

      if (escolaError) {
        console.error("Error deleting escola:", escolaError);
        // Continuar mesmo se não houver escola (pode não existir)
      }

      // 2. Deletar histórico de assinatura
      const { error: historyError } = await supabase
        .from("subscription_history")
        .delete()
        .eq("tenant_id", selectedTenant.id);

      if (historyError) {
        console.error("Error deleting subscription_history:", historyError);
      }

      // 3. Deletar profiles vinculados ao tenant
      const { error: profilesError } = await supabase
        .from("profiles")
        .delete()
        .eq("tenant_id", selectedTenant.id);

      if (profilesError) {
        console.error("Error deleting profiles:", profilesError);
      }

      // 4. Finalmente, deletar o tenant
      const { error: tenantError } = await supabase
        .from("tenants")
        .delete()
        .eq("id", selectedTenant.id);

      if (tenantError) throw tenantError;

      toast.success("Escola removida com sucesso");
      setTenants(tenants.filter(t => t.id !== selectedTenant.id));
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error("Erro ao remover escola. Verifique se não há dados vinculados.");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
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
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setDeleteDialogOpen(true);
                              }}
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir a escola "{selectedTenant?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformLayout>
  );
}
