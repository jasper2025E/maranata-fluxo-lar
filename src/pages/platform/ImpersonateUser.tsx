import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserCog, 
  Search, 
  Building2,
  LogIn,
  AlertTriangle,
  User,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface UserToImpersonate {
  id: string;
  nome: string;
  email: string;
  tenant_id: string | null;
  user_roles: { role: string }[];
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  staff: "Equipe",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
};

export default function ImpersonateUser() {
  const navigate = useNavigate();
  const { isPlatformAdmin, session } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<UserToImpersonate[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserToImpersonate | null>(null);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchTenants();
    fetchUsers();
  }, [isPlatformAdmin, navigate]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (tenantId?: string) => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke("impersonate-user", {
        body: { 
          action: "get_users",
          tenant_id: tenantId || undefined
        },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTenantChange = (value: string) => {
    setSelectedTenant(value);
    if (value === "all") {
      fetchUsers();
    } else {
      fetchUsers(value);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUser) return;

    setImpersonating(true);
    try {
      const { data, error } = await supabase.functions.invoke("impersonate-user", {
        body: { 
          action: "start",
          target_user_id: selectedUser.id
        },
      });

      if (error) throw error;

      if (data.impersonation_url) {
        // Store platform admin info for return
        localStorage.setItem("platform_admin_return", JSON.stringify({
          email: session?.user?.email,
          timestamp: Date.now()
        }));
        
        toast.success(`Acessando como ${selectedUser.email}...`);
        
        // Redirect to the impersonation URL
        window.location.href = data.impersonation_url;
      }
    } catch (error: any) {
      console.error("Error impersonating:", error);
      toast.error(error.message || "Erro ao acessar como usuário");
    } finally {
      setImpersonating(false);
      setConfirmDialogOpen(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "Sem escola";
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.nome || "Escola não encontrada";
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <UserCog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Acessar Como</h1>
              <p className="text-slate-400">
                Acesse o sistema como qualquer usuário para suporte técnico
              </p>
            </div>
          </div>
        </motion.div>

        {/* Warning Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="flex items-start gap-4 pt-6">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">Atenção: Funcionalidade de Suporte</p>
                <p className="text-amber-300/80">
                  Esta funcionalidade deve ser usada apenas para suporte técnico. 
                  Todas as ações são registradas no log de auditoria.
                  Ao acessar como outro usuário, você terá as mesmas permissões dele.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="w-full sm:w-64">
            <Select value={selectedTenant} onValueChange={handleTenantChange}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Filtrar por escola" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todas as escolas</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Usuários Disponíveis</CardTitle>
              <CardDescription className="text-slate-400">
                {filteredUsers.length} usuário(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading || loadingUsers ? (
                <div className="text-center py-8 text-slate-400">
                  Carregando...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.nome || "Sem nome"}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Building2 className="h-3 w-3" />
                            {getTenantName(user.tenant_id)}
                          </div>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {roleLabels[user.user_roles?.[0]?.role] || user.user_roles?.[0]?.role}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setConfirmDialogOpen(true);
                          }}
                          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Acessar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Confirmar Acesso
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Você está prestes a acessar o sistema como:
              <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="font-medium text-white">{selectedUser?.nome || "Sem nome"}</p>
                <p className="text-sm text-slate-400">{selectedUser?.email}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Escola: {selectedUser ? getTenantName(selectedUser.tenant_id) : ""}
                </p>
              </div>
              <p className="mt-4 text-amber-300/80 text-sm">
                Esta ação será registrada no log de auditoria.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={impersonating}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImpersonate}
              disabled={impersonating}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {impersonating ? "Acessando..." : "Confirmar Acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformLayout>
  );
}
