import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  INSERT: { label: "Criação", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  UPDATE: { label: "Atualização", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  DELETE: { label: "Exclusão", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  alteracao: { label: "Alteração", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
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
  
  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Available tables for filtering
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
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Get unique user IDs and tenant IDs
      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))];
      const tenantIds = [...new Set((logsData || []).map(l => l.tenant_id).filter(Boolean))];

      // Fetch profiles for user info
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

      // Fetch tenants for tenant names
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

      // Combine data
      const enrichedLogs: AuditLog[] = (logsData || []).map(log => ({
        ...log,
        user_nome: log.user_id ? profilesMap.get(log.user_id)?.nome : undefined,
        user_email: log.user_id ? profilesMap.get(log.user_id)?.email : undefined,
        tenant_nome: log.tenant_id ? tenantsMap.get(log.tenant_id) : undefined,
      }));

      setLogs(enrichedLogs);

      // Extract unique tables
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

  // Filter logs
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

  // Stats
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-amber-400" />
              Logs de Auditoria
            </h1>
            <p className="text-slate-400 mt-1">
              Monitore todas as ações realizadas no sistema
            </p>
          </div>

          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total de Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-400">{stats.today}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Criações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-400">{stats.inserts}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Atualizações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">{stats.updates}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Exclusões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">{stats.deletes}</p>
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
              placeholder="Buscar por tabela, ação ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full md:w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <Building2 className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Escola" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id} className="text-white">
                  {tenant.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full md:w-[160px] bg-slate-800/50 border-slate-700 text-white">
              <FileText className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Tabela" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              {tables.map(table => (
                <SelectItem key={table} value={table} className="text-white">
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-full md:w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              <SelectItem value="INSERT" className="text-white">Criação</SelectItem>
              <SelectItem value="UPDATE" className="text-white">Atualização</SelectItem>
              <SelectItem value="DELETE" className="text-white">Exclusão</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Logs Table */}
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
                    <TableHead className="text-slate-400">Data/Hora</TableHead>
                    <TableHead className="text-slate-400">Usuário</TableHead>
                    <TableHead className="text-slate-400">Ação</TableHead>
                    <TableHead className="text-slate-400">Tabela</TableHead>
                    <TableHead className="text-slate-400">Escola</TableHead>
                    <TableHead className="text-slate-400 text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Carregando logs...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.slice(0, 100).map((log) => {
                      const actionStyle = actionLabels[log.acao] || { label: log.acao, color: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
                      
                      return (
                        <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(log.created_at), "HH:mm:ss")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user_nome ? (
                              <div className="flex flex-col">
                                <span className="text-white flex items-center gap-1">
                                  <User className="h-3 w-3 text-slate-400" />
                                  {log.user_nome}
                                </span>
                                <span className="text-xs text-slate-500">{log.user_email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Sistema</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${actionStyle.color} border`}>
                              {actionStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-300 font-mono text-sm">{log.tabela}</span>
                          </TableCell>
                          <TableCell>
                            {log.tenant_nome ? (
                              <span className="text-slate-300 flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                {log.tenant_nome}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Global</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDetailDialog(log)}
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
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
                <div className="p-4 text-center text-slate-400 border-t border-slate-700">
                  Exibindo 100 de {filteredLogs.length} logs. Use os filtros para refinar a busca.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-400" />
                Detalhes do Log
              </DialogTitle>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Data/Hora</p>
                    <p className="text-white">
                      {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Usuário</p>
                    <p className="text-white">{selectedLog.user_nome || "Sistema"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Ação</p>
                    <p className="text-white">{selectedLog.acao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Tabela</p>
                    <p className="text-white font-mono">{selectedLog.tabela}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">ID do Registro</p>
                    <p className="text-white font-mono text-sm">{selectedLog.registro_id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Escola</p>
                    <p className="text-white">{selectedLog.tenant_nome || "Global"}</p>
                  </div>
                </div>

                {selectedLog.dados_anteriores && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Dados Anteriores</p>
                    <ScrollArea className="h-32 bg-slate-800 rounded-lg p-3">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.dados_anteriores, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedLog.dados_novos && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Dados Novos</p>
                    <ScrollArea className="h-32 bg-slate-800 rounded-lg p-3">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
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
