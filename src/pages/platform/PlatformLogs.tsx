import { useState, useEffect } from "react";
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Building2,
  User,
  Calendar,
  Filter,
  Clock,
  FileText,
  Eye
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tenant {
  id: string;
  nome: string;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  acao: string;
  tabela: string;
  registro_id: string | null;
  dados_anteriores: any;
  dados_novos: any;
  created_at: string;
  tenant_id: string | null;
  user_email?: string;
  user_nome?: string;
  tenant_nome?: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  INSERT: { label: "Criação", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" },
  UPDATE: { label: "Atualização", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  DELETE: { label: "Exclusão", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
  alteracao: { label: "Alteração", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
};

export default function PlatformLogs() {
  const { isPlatformAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    if (isPlatformAdmin()) {
      fetchTenants();
      fetchLogs();
    }
  }, [isPlatformAdmin]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome")
        .order("nome");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))];
      const tenantIds = [...new Set((logsData || []).map(l => l.tenant_id).filter(Boolean))];

      let profilesMap = new Map<string, { nome: string; email: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", userIds);
        
        profiles?.forEach(p => {
          profilesMap.set(p.id, { nome: p.nome, email: p.email });
        });
      }

      let tenantsMap = new Map<string, string>();
      if (tenantIds.length > 0) {
        const { data: tenantsData } = await supabase
          .from("tenants")
          .select("id, nome")
          .in("id", tenantIds);
        
        tenantsData?.forEach(t => {
          tenantsMap.set(t.id, t.nome);
        });
      }

      const enrichedLogs: AuditLog[] = (logsData || []).map(log => ({
        ...log,
        user_nome: log.user_id ? profilesMap.get(log.user_id)?.nome : undefined,
        user_email: log.user_id ? profilesMap.get(log.user_id)?.email : undefined,
        tenant_nome: log.tenant_id ? tenantsMap.get(log.tenant_id) : undefined,
      }));

      setLogs(enrichedLogs);

      const uniqueTables = [...new Set(enrichedLogs.map(l => l.tabela))].sort();
      setTables(uniqueTables);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.tabela.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTenant = 
      selectedTenant === "all" || 
      log.tenant_id === selectedTenant;
    
    const matchesTable = 
      selectedTable === "all" || 
      log.tabela === selectedTable;
    
    const matchesAction = 
      selectedAction === "all" || 
      log.acao === selectedAction;
    
    return matchesSearch && matchesTenant && matchesTable && matchesAction;
  });

  const stats = {
    total: logs.length,
    today: logs.filter(l => {
      const logDate = new Date(l.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    inserts: logs.filter(l => l.acao === "INSERT").length,
    updates: logs.filter(l => l.acao === "UPDATE" || l.acao === "alteracao").length,
    deletes: logs.filter(l => l.acao === "DELETE").length,
  };

  if (!isPlatformAdmin()) {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Registros de Atividade
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe todas as ações realizadas na plataforma
            </p>
          </div>

          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.today}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Criações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.inserts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Atualizações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.updates}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Exclusões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.deletes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tabela, ação ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Escola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full md:w-[160px]">
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tabela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {tables.map(table => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-full md:w-[150px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.slice(0, 100).map((log) => {
                    const actionStyle = actionLabels[log.acao] || { label: log.acao, color: "bg-muted text-muted-foreground border-border" };
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.created_at), "HH:mm:ss")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.user_nome ? (
                            <div className="flex flex-col">
                              <span className="text-foreground flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {log.user_nome}
                              </span>
                              <span className="text-xs text-muted-foreground">{log.user_email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Sistema</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionStyle.color} border`}>
                            {actionStyle.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{log.tabela}</span>
                        </TableCell>
                        <TableCell>
                          {log.tenant_nome ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {log.tenant_nome}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Global</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailDialog(log)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {filteredLogs.length > 100 && (
              <div className="p-4 text-center text-muted-foreground border-t">
                Exibindo 100 de {filteredLogs.length} logs. Use os filtros para refinar a busca.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Detalhes do Log
              </DialogTitle>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data/Hora</p>
                    <p className="text-foreground">
                      {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Usuário</p>
                    <p className="text-foreground">{selectedLog.user_nome || "Sistema"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ação</p>
                    <p className="text-foreground">{selectedLog.acao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tabela</p>
                    <p className="font-mono">{selectedLog.tabela}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ID do Registro</p>
                    <p className="font-mono text-sm">{selectedLog.registro_id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Escola</p>
                    <p className="text-foreground">{selectedLog.tenant_nome || "Global"}</p>
                  </div>
                </div>

                {selectedLog.dados_anteriores && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Dados Anteriores</p>
                    <ScrollArea className="h-32 bg-muted rounded-lg p-3">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.dados_anteriores, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedLog.dados_novos && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Dados Novos</p>
                    <ScrollArea className="h-32 bg-muted rounded-lg p-3">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.dados_novos, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  );
}
