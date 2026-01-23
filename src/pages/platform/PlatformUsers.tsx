import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  RefreshCw, 
  Building2,
  Mail,
  Calendar,
  Shield,
  UserPlus,
  Pencil,
  Trash2,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Tenant {
  id: string;
  nome: string;
}

interface PlatformUser {
  id: string;
  email: string;
  nome: string;
  role: AppRole;
  tenant_id: string | null;
  tenant_nome: string | null;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  platform_admin: "Platform Admin",
  admin: "Administrador",
  staff: "Staff",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
};

const roleBadgeVariants: Record<AppRole, string> = {
  platform_admin: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  financeiro: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  secretaria: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function PlatformUsers() {
  const { isPlatformAdmin } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    role: "staff" as AppRole,
    tenant_id: "",
  });

  useEffect(() => {
    if (isPlatformAdmin()) {
      fetchTenants();
      fetchUsers();
    }
  }, [isPlatformAdmin]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      toast.error("Erro ao carregar escolas");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with tenant info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          nome,
          email,
          tenant_id,
          created_at,
          tenants:tenant_id (nome)
        `)
        .order("nome");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Create a map of user_id to highest role
      const roleMap = new Map<string, AppRole>();
      const rolePriority: AppRole[] = ["platform_admin", "admin", "financeiro", "secretaria", "staff"];
      
      roles?.forEach(r => {
        const existingRole = roleMap.get(r.user_id);
        const newRolePriority = rolePriority.indexOf(r.role as AppRole);
        const existingPriority = existingRole ? rolePriority.indexOf(existingRole) : 999;
        
        if (newRolePriority < existingPriority) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });

      // Combine data
      const combinedUsers: PlatformUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        nome: profile.nome,
        role: roleMap.get(profile.id) || "staff",
        tenant_id: profile.tenant_id,
        tenant_nome: (profile.tenants as any)?.nome || null,
        created_at: profile.created_at,
      }));

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.nome || !formData.email || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "create",
          email: formData.email,
          password: formData.password,
          nome: formData.nome,
          role: formData.role,
          tenant_id: formData.tenant_id || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Usuário criado com sucesso!");
      setCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const updateData: any = {
        action: "update",
        userId: selectedUser.id,
        nome: formData.nome,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: updateData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update tenant_id separately if changed
      if (formData.tenant_id !== (selectedUser.tenant_id || "")) {
        await supabase
          .from("profiles")
          .update({ tenant_id: formData.tenant_id || null })
          .eq("id", selectedUser.id);
      }

      toast.success("Usuário atualizado com sucesso!");
      setEditDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "delete",
          userId: selectedUser.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Usuário excluído com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (user: PlatformUser) => {
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      password: "",
      role: user.role,
      tenant_id: user.tenant_id || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: PlatformUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      password: "",
      role: "staff",
      tenant_id: "",
    });
    setSelectedUser(null);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTenant = 
      selectedTenant === "all" || 
      (selectedTenant === "none" && !user.tenant_id) ||
      user.tenant_id === selectedTenant;
    
    const matchesRole = 
      selectedRole === "all" || 
      user.role === selectedRole;
    
    return matchesSearch && matchesTenant && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    platformAdmins: users.filter(u => u.role === "platform_admin").length,
    admins: users.filter(u => u.role === "admin").length,
    withoutTenant: users.filter(u => !u.tenant_id).length,
  };

  if (!isPlatformAdmin()) {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-amber-400" />
              Usuários Globais
            </h1>
            <p className="text-slate-400 mt-1">
              Gerencie todos os usuários da plataforma
            </p>
          </div>

          <Button 
            onClick={() => {
              resetForm();
              setCreateDialogOpen(true);
            }}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Platform Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-400">{stats.platformAdmins}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-400">{stats.admins}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Sem Escola</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-300">{stats.withoutTenant}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-800/50 border-slate-700 text-white">
              <Building2 className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filtrar por escola" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas as Escolas</SelectItem>
              <SelectItem value="none" className="text-slate-400">Sem Escola</SelectItem>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id} className="text-white">
                  {tenant.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full md:w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filtrar por cargo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todos os Cargos</SelectItem>
              {Object.entries(roleLabels).map(([role, label]) => (
                <SelectItem key={role} value={role} className="text-white">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Usuário</TableHead>
                    <TableHead className="text-slate-400">Cargo</TableHead>
                    <TableHead className="text-slate-400">Escola</TableHead>
                    <TableHead className="text-slate-400">Criado em</TableHead>
                    <TableHead className="text-slate-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Carregando usuários...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{user.nome}</span>
                            <span className="text-sm text-slate-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${roleBadgeVariants[user.role]} border`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.tenant_nome ? (
                            <span className="text-slate-300 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {user.tenant_nome}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Sem escola</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(user)}
                              disabled={user.role === "platform_admin"}
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-400" />
                Criar Novo Usuário
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Preencha os dados para criar um novo usuário na plataforma.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Senha *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Cargo *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as AppRole })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role} className="text-white">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Escola (opcional)</Label>
                <Select 
                  value={formData.tenant_id} 
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione uma escola" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="" className="text-slate-400">Nenhuma</SelectItem>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id} className="text-white">
                        {tenant.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={formLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {formLoading ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-amber-400" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Atualize os dados do usuário.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Nova Senha (deixe vazio para manter)</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nova senha"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Cargo</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as AppRole })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role} className="text-white">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Escola</Label>
                <Select 
                  value={formData.tenant_id} 
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione uma escola" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="" className="text-slate-400">Nenhuma</SelectItem>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id} className="text-white">
                        {tenant.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={formLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {formLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Tem certeza que deseja excluir o usuário <strong className="text-white">{selectedUser?.nome}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 text-slate-300">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={formLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {formLoading ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PlatformLayout>
  );
}
