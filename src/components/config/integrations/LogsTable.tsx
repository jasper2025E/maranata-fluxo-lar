import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Webhook,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// API Request Logs
interface ApiLog {
  id: string;
  method: string;
  endpoint: string;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
}

interface ApiLogsTableProps {
  logs: ApiLog[] | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function ApiLogsTable({
  logs,
  isLoading,
  search,
  onSearchChange,
  onRefresh,
}: ApiLogsTableProps) {
  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "POST": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "PUT": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default: return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden",
        "bg-card/80 backdrop-blur-sm rounded-2xl",
        "border border-border/40",
        "shadow-sm"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-transparent opacity-60" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-500/5 flex items-center justify-center shadow-inner">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Histórico de Requisições</h3>
              <p className="text-xs text-muted-foreground">Últimas requisições feitas às APIs externas</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por endpoint ou método..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-muted/30 border-border/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma requisição registrada</p>
              <p className="text-sm">As requisições às APIs externas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Método</TableHead>
                    <TableHead className="text-xs font-semibold">Endpoint</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Tempo</TableHead>
                    <TableHead className="text-xs font-semibold">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell>
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-md text-xs font-medium",
                          getMethodBadgeClass(log.method)
                        )}>
                          {log.method}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate text-muted-foreground">
                        {log.endpoint}
                      </TableCell>
                      <TableCell>
                        {log.status_code && log.status_code >= 200 && log.status_code < 300 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            {log.status_code}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <XCircle className="h-3 w-3" />
                            {log.status_code || "Erro"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Webhook Logs
interface WebhookLog {
  id: string;
  source: string;
  event_type: string;
  status: string;
  processing_time_ms: number | null;
  created_at: string;
}

interface WebhookLogsTableProps {
  logs: WebhookLog[] | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
}

export function WebhookLogsTable({
  logs,
  isLoading,
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
}: WebhookLogsTableProps) {
  const getSourceBadgeClass = (source: string) => {
    switch (source.toLowerCase()) {
      case "asaas": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "stripe": return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
      default: return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Processado
          </span>
        );
      case "received":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock className="h-3 w-3" />
            Recebido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            Falhou
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden",
        "bg-card/80 backdrop-blur-sm rounded-2xl",
        "border border-border/40",
        "shadow-sm"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-60" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center shadow-inner">
              <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Webhooks Recebidos</h3>
              <p className="text-xs text-muted-foreground">Eventos recebidos dos serviços externos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 p-4 border-b border-border/30">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por evento..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-muted/30 border-border/50"
            />
          </div>
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger className="w-[140px] bg-muted/30 border-border/50">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas fontes</SelectItem>
              <SelectItem value="asaas">Asaas</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px] bg-muted/30 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="processed">Processado</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum webhook recebido</p>
              <p className="text-sm">Os eventos dos gateways de pagamento aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Fonte</TableHead>
                    <TableHead className="text-xs font-semibold">Evento</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Tempo</TableHead>
                    <TableHead className="text-xs font-semibold">Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell>
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                          getSourceBadgeClass(log.source)
                        )}>
                          {log.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-mono bg-muted/50 text-muted-foreground">
                          {log.event_type}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.processing_time_ms ? `${log.processing_time_ms}ms` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
