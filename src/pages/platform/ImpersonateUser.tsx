import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Acessar Como</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse o sistema como qualquer usuário para suporte técnico
          </p>
        </div>

        {/* Warning Card */}
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1 text-amber-800 dark:text-amber-400">Atenção: Funcionalidade de Suporte</p>
              <p className="text-amber-700 dark:text-amber-300/80">
                Esta funcionalidade deve ser usada apenas para suporte técnico. 
                Todas as ações são registradas no log de auditoria.
                Ao acessar como outro usuário, você terá as mesmas permissões dele.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={selectedTenant || "all"} onValueChange={handleTenantChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por escola" />
              </SelectTrigger>
              <SelectContent>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Disponíveis</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || loadingUsers ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.nome || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {getTenantName(user.tenant_id)}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {roleLabels[user.user_roles?.[0]?.role] || user.user_roles?.[0]?.role}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Acessar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Confirmar Acesso
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a acessar o sistema como:
              <div className="mt-4 p-4 rounded-lg bg-muted border">
                <p className="font-medium text-foreground">{selectedUser?.nome || "Sem nome"}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Escola: {selectedUser ? getTenantName(selectedUser.tenant_id) : ""}
                </p>
              </div>
              <p className="mt-4 text-amber-600 dark:text-amber-400 text-sm">
                Esta ação será registrada no log de auditoria.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImpersonate}
              disabled={impersonating}
            >
              {impersonating ? "Acessando..." : "Confirmar Acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformLayout>
  );
}
