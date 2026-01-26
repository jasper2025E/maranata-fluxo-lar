import { useState } from "react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Shield, 
  Crown, 
  Users,
  Loader2,
  Calendar,
  Mail
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePlatformManagers, platformRoles, useCurrentManagerPermissions } from "@/hooks/usePlatformManagers";

export default function PlatformManagers() {
  const { managers, isLoading, updateRole, toggleActive, isUpdating } = usePlatformManagers();
  const { isSuperAdmin, currentManager } = useCurrentManagerPermissions();

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Stats
  const stats = {
    total: managers.length,
    active: managers.filter(m => m.is_active).length,
    superAdmins: managers.filter(m => m.platform_role === "super_admin").length,
  };

  return (
    <PlatformLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestores do Sistema</h1>
          <p className="text-muted-foreground">Gerencie as permissões dos administradores da plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de gestores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.superAdmins}</p>
                  <p className="text-xs text-muted-foreground">Super Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Managers List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : managers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum gestor cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione gestores do sistema para gerenciar a plataforma
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gestores</CardTitle>
              <CardDescription>
                Gerencie os níveis de acesso de cada gestor da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {managers.map((manager, index) => {
                  const roleConfig = platformRoles[manager.platform_role as keyof typeof platformRoles] || platformRoles.read_only;
                  const isCurrentUser = manager.id === currentManager?.id;

                  return (
                    <motion.div
                      key={manager.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        manager.is_active ? "border-border" : "border-border/50 opacity-60"
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        {manager.avatar_url && <AvatarImage src={manager.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(manager.nome, manager.email)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {manager.nome || "Sem nome"}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">Você</Badge>
                          )}
                          <Badge className={`text-xs ${roleConfig.color}`}>
                            {roleConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {manager.email}
                          </span>
                          {manager.last_login_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Último acesso: {format(new Date(manager.last_login_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {isSuperAdmin && !isCurrentUser && (
                          <>
                            <Select
                              value={manager.platform_role}
                              onValueChange={(role) => updateRole({ id: manager.id, role })}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(platformRoles).map(([key, { label }]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Switch
                              checked={manager.is_active}
                              onCheckedChange={(isActive) => toggleActive({ id: manager.id, isActive })}
                              disabled={isUpdating}
                            />
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Referência de Permissões</CardTitle>
            <CardDescription>
              Cada nível de acesso possui permissões específicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(platformRoles).map(([key, config]) => (
                <div key={key} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
