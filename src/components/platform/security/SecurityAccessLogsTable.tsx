import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ShieldCheck, 
  ShieldX, 
  ShieldAlert,
  Globe,
  User,
  Database
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SecurityAccessLog } from "@/hooks/useSecurityLogs";

interface SecurityAccessLogsTableProps {
  logs: SecurityAccessLog[];
  loading?: boolean;
}

export function SecurityAccessLogsTable({ logs, loading }: SecurityAccessLogsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ShieldCheck className="h-12 w-12 mb-4 text-green-500" />
        <p className="text-lg font-medium">Nenhum registro de acesso</p>
        <p className="text-sm">Não há logs de segurança para o período selecionado</p>
      </div>
    );
  }

  const getStatusIcon = (status: string, isCrossTenant: boolean) => {
    if (isCrossTenant) {
      return <ShieldAlert className="h-4 w-4 text-amber-500" />;
    }
    if (status === "allowed") {
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    }
    return <ShieldX className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: string, isCrossTenant: boolean) => {
    if (isCrossTenant) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
          Cross-Tenant
        </Badge>
      );
    }
    if (status === "allowed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
          Permitido
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        Negado
      </Badge>
    );
  };

  const getOperationBadge = (operation: string) => {
    const colors: Record<string, string> = {
      SELECT: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
      INSERT: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400",
      UPDATE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
      DELETE: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    };

    return (
      <Badge variant="outline" className={colors[operation] || "bg-muted"}>
        {operation}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Status</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Recurso</TableHead>
            <TableHead>Operação</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead className="text-right">Data/Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow 
              key={log.id}
              className={log.is_cross_tenant_attempt ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status, log.is_cross_tenant_attempt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {log.is_platform_admin ? (
                    <Globe className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {log.user_email || "Usuário desconhecido"}
                    </p>
                    {log.is_platform_admin && (
                      <span className="text-xs text-primary">Gestor</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{log.resource_type}</span>
                </div>
              </TableCell>
              <TableCell>
                {getOperationBadge(log.operation)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(log.status, log.is_cross_tenant_attempt)}
                  {log.error_message && (
                    <span className="text-xs text-red-500 truncate max-w-[150px]" title={log.error_message}>
                      {log.error_message}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
