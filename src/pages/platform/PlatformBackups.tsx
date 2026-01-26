import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Download, 
  HardDrive, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Building2,
  FileArchive,
  Calendar,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Backup {
  id: string;
  tenant_id: string | null;
  backup_type: string;
  status: string;
  file_url: string | null;
  file_size_bytes: number | null;
  tables_included: string[];
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  tenants?: { nome: string } | null;
}

interface Tenant {
  id: string;
  nome: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: RefreshCw },
  completed: { label: "Concluído", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  failed: { label: "Falhou", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const typeLabels: Record<string, string> = {
  full: "Backup Completo",
  data_only: "Apenas Dados",
  config_only: "Apenas Configurações",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function PlatformBackups() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [backupType, setBackupType] = useState<string>("full");

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ["platform-backups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_backups")
        .select("*, tenants(nome)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Backup[];
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      return data as Tenant[];
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("platform_backups").insert({
        tenant_id: selectedTenant || null,
        backup_type: backupType,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-backups"] });
      toast.success("Backup solicitado com sucesso");
      setIsDialogOpen(false);
      setSelectedTenant("");
      setBackupType("full");
    },
    onError: () => toast.error("Erro ao solicitar backup"),
  });

  // Calculate stats
  const stats = {
    total: backups.length,
    completed: backups.filter(b => b.status === "completed").length,
    pending: backups.filter(b => b.status === "pending" || b.status === "in_progress").length,
    totalSize: backups.reduce((acc, b) => acc + (b.file_size_bytes || 0), 0),
  };

  return (
    <PlatformLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backups</h1>
            <p className="text-muted-foreground">Gerencie backups e exportações de dados</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <HardDrive className="h-4 w-4 mr-2" />
                Novo Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Backup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Escola (opcional)</Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as escolas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as escolas</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para backup de toda a plataforma
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Backup</Label>
                  <Select value={backupType} onValueChange={setBackupType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Backup Completo</SelectItem>
                      <SelectItem value="data_only">Apenas Dados</SelectItem>
                      <SelectItem value="config_only">Apenas Configurações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending}
                  >
                    {createBackupMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Solicitar Backup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileArchive className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de backups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
                  <p className="text-xs text-muted-foreground">Armazenamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <HardDrive className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum backup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Solicite o primeiro backup da plataforma
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.map((backup, index) => {
                  const config = statusConfig[backup.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={backup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border"
                    >
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <StatusIcon className={`h-5 w-5 ${backup.status === "in_progress" ? "animate-spin" : ""}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {typeLabels[backup.backup_type]}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {backup.tenants?.nome ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {backup.tenants.nome}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              Toda a plataforma
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(backup.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                          {backup.file_size_bytes && (
                            <span>{formatBytes(backup.file_size_bytes)}</span>
                          )}
                        </div>
                        {backup.error_message && (
                          <p className="text-xs text-destructive mt-1">{backup.error_message}</p>
                        )}
                      </div>

                      {backup.status === "completed" && backup.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={backup.file_url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </a>
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformLayout>
  );
}
