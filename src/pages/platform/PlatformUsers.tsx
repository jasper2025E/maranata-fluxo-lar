import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Filter,
  X,
  Link,
  Unlink,
  CheckSquare,
  Square
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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

// Role labels - Platform Admin is the global system manager (not a school)
const roleLabels: Record<AppRole, string> = {
  platform_admin: "Platform Admin",
  admin: "Administrador",
  staff: "Staff",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
};

// Roles that can be assigned to schools (Platform Admin cannot be linked to schools)
const schoolRoles: AppRole[] = ["admin", "staff", "financeiro", "secretaria"];

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
  
  // Bulk selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionProgress, setBulkActionProgress] = useState(0);
  const [bulkLinkDialogOpen, setBulkLinkDialogOpen] = useState(false);
  const [bulkUnlinkDialogOpen, setBulkUnlinkDialogOpen] = useState(false);
  const [bulkTargetTenant, setBulkTargetTenant] = useState("");
  
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

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

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

  // Bulk selection handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter(u => u.role !== "platform_admin");
    if (selectedUserIds.size === selectableUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(selectableUsers.map(u => u.id)));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Bulk action handlers
  const handleBulkLink = async () => {
    if (!bulkTargetTenant || selectedUserIds.size === 0) return;

    setBulkActionLoading(true);
    setBulkActionProgress(0);
    
    const userIds = Array.from(selectedUserIds);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < userIds.length; i++) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ tenant_id: bulkTargetTenant })
          .eq("id", userIds[i]);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error linking user:", error);
        errorCount++;
      }
      setBulkActionProgress(((i + 1) / userIds.length) * 100);
    }

    setBulkActionLoading(false);
    setBulkLinkDialogOpen(false);
    setBulkTargetTenant("");
    clearSelection();
    fetchUsers();

    if (errorCount === 0) {
      toast.success(`${successCount} usuário(s) vinculado(s) com sucesso!`);
    } else {
      toast.warning(`${successCount} vinculado(s), ${errorCount} erro(s)`);
    }
  };

  const handleBulkUnlink = async () => {
    if (selectedUserIds.size === 0) return;

    setBulkActionLoading(true);
    setBulkActionProgress(0);
    
    const userIds = Array.from(selectedUserIds);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < userIds.length; i++) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ tenant_id: null })
          .eq("id", userIds[i]);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error unlinking user:", error);
        errorCount++;
      }
      setBulkActionProgress(((i + 1) / userIds.length) * 100);
    }

    setBulkActionLoading(false);
    setBulkUnlinkDialogOpen(false);
    clearSelection();
    fetchUsers();

    if (errorCount === 0) {
      toast.success(`${successCount} usuário(s) desvinculado(s) com sucesso!`);
    } else {
      toast.warning(`${successCount} desvinculado(s), ${errorCount} erro(s)`);
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

  // Bulk selection stats
  const selectableCount = filteredUsers.filter(u => u.role !== "platform_admin").length;
  const isAllSelected = selectableCount > 0 && selectedUserIds.size === selectableCount;
  const isSomeSelected = selectedUserIds.size > 0;

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

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {isSomeSelected && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                        {selectedUserIds.size} selecionado(s)
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        className="text-slate-400 hover:text-white h-8"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBulkLinkDialogOpen(true)}
                        disabled={bulkActionLoading}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Vincular a Escola
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBulkUnlinkDialogOpen(true)}
                        disabled={bulkActionLoading}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Desvincular
                      </Button>
                    </div>
                  </div>

                  {bulkActionLoading && (
                    <div className="mt-3">
                      <Progress value={bulkActionProgress} className="h-1 bg-slate-700" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
                    <TableHead className="w-12 text-slate-400">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center h-8 w-8 hover:bg-slate-700 rounded transition-colors"
                        disabled={selectableCount === 0}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </TableHead>
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
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Carregando usuários...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelectable = user.role !== "platform_admin";
                      const isSelected = selectedUserIds.has(user.id);
                      
                      return (
                        <TableRow 
                          key={user.id} 
                          className={`border-slate-700 hover:bg-slate-700/50 ${isSelected ? "bg-amber-500/5" : ""}`}
                        >
                          <TableCell>
                            {isSelectable ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                                className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                              />
                            ) : (
                              <div className="h-4 w-4" />
                            )}
                          </TableCell>
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk Link Dialog */}
        <Dialog open={bulkLinkDialogOpen} onOpenChange={setBulkLinkDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-emerald-400" />
                Vincular Usuários a Escola
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Selecione a escola para vincular os {selectedUserIds.size} usuário(s) selecionado(s).
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label className="text-slate-300">Escola de Destino</Label>
              <Select value={bulkTargetTenant} onValueChange={setBulkTargetTenant}>
                <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id} className="text-white">
                      {tenant.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkLinkDialogOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkLink}
                disabled={!bulkTargetTenant || bulkActionLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {bulkActionLoading ? "Vinculando..." : "Vincular"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Unlink Dialog */}
        <AlertDialog open={bulkUnlinkDialogOpen} onOpenChange={setBulkUnlinkDialogOpen}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <Unlink className="h-5 w-5 text-red-400" />
                Desvincular Usuários
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Tem certeza que deseja desvincular os {selectedUserIds.size} usuário(s) selecionado(s) de suas escolas?
                Eles ficarão sem escola vinculada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 text-slate-300">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkUnlink}
                disabled={bulkActionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkActionLoading ? "Desvinculando..." : "Desvincular"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  onValueChange={(value) => {
                    const newRole = value as AppRole;
                    // Platform Admin cannot be linked to schools
                    if (newRole === "platform_admin") {
                      setFormData({ ...formData, role: newRole, tenant_id: "" });
                    } else {
                      setFormData({ ...formData, role: newRole });
                    }
                  }}
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
                {formData.role === "platform_admin" && (
                  <p className="text-xs text-amber-400 mt-1">
                    ⚠️ Platform Admin é o gerenciador global - não pode ser vinculado a escolas
                  </p>
                )}
              </div>

              {formData.role !== "platform_admin" && (
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
              )}
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
                  onValueChange={(value) => {
                    const newRole = value as AppRole;
                    // Platform Admin cannot be linked to schools
                    if (newRole === "platform_admin") {
                      setFormData({ ...formData, role: newRole, tenant_id: "" });
                    } else {
                      setFormData({ ...formData, role: newRole });
                    }
                  }}
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
                {formData.role === "platform_admin" && (
                  <p className="text-xs text-amber-400 mt-1">
                    ⚠️ Platform Admin é o gerenciador global - não pode ser vinculado a escolas
                  </p>
                )}
              </div>

              {formData.role !== "platform_admin" && (
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
              )}
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
