import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Link,
  CreditCard,
  SplitSquareVertical,
  Ban,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ChevronDown,
  History,
  Download,
  QrCode,
  Receipt,
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Fatura, getValorFinal, formatCurrency, meses } from "@/hooks/useFaturas";

type ViewMode = "list" | "status" | "aluno" | "mes";

interface FaturaTableProps {
  faturas: Fatura[];
  isLoading: boolean;
  viewMode: ViewMode;
  onViewDetails: (fatura: Fatura) => void;
  onEdit: (fatura: Fatura) => void;
  onPayment: (fatura: Fatura) => void;
  onPaymentLink: (fatura: Fatura) => void;
  onParcelar: (fatura: Fatura) => void;
  onCancel: (fatura: Fatura) => void;
  onSendReceipt: (fatura: Fatura) => void;
  onViewHistory: (fatura: Fatura) => void;
  onDownloadPDF?: (fatura: Fatura) => void;
  onAsaasPayment?: (fatura: Fatura) => void;
  onDownloadReceipt?: (fatura: Fatura) => void;
  selectedFaturas?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
}

function getStatusConfig(status: string, dataVencimento: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  const vencendoEm7Dias = isAfter(vencimento, hoje) && isBefore(vencimento, addDays(hoje, 7));

  const normalizedStatus = status?.toLowerCase() || '';
  
  if (normalizedStatus === "paga") {
    return { 
      label: "Paga", 
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", 
      icon: CheckCircle2,
      dot: "bg-emerald-500"
    };
  }
  if (normalizedStatus === "vencida") {
    return { 
      label: "Vencida", 
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", 
      icon: AlertCircle,
      dot: "bg-red-500"
    };
  }
  if (normalizedStatus === "cancelada") {
    return { 
      label: "Cancelada", 
      className: "bg-muted text-muted-foreground border-border", 
      icon: XCircle,
      dot: "bg-gray-400"
    };
  }
  if (normalizedStatus === "rascunho") {
    return { 
      label: "Rascunho", 
      className: "bg-muted/50 text-muted-foreground border-border", 
      icon: FileText,
      dot: "bg-gray-300"
    };
  }
  if (vencendoEm7Dias) {
    return { 
      label: "Vencendo", 
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", 
      icon: Clock,
      dot: "bg-amber-500"
    };
  }
  return { 
    label: "Aberta", 
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", 
    icon: FileText,
    dot: "bg-blue-500"
  };
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

function FaturaRow({ 
  fatura, 
  onViewDetails, 
  onEdit, 
  onPayment, 
  onPaymentLink, 
  onParcelar, 
  onCancel, 
  onSendReceipt,
  onViewHistory,
  onDownloadPDF,
  onAsaasPayment,
  onDownloadReceipt,
  isSelected,
  onToggleSelect,
}: {
  fatura: Fatura;
  onViewDetails: (fatura: Fatura) => void;
  onEdit: (fatura: Fatura) => void;
  onPayment: (fatura: Fatura) => void;
  onPaymentLink: (fatura: Fatura) => void;
  onParcelar: (fatura: Fatura) => void;
  onCancel: (fatura: Fatura) => void;
  onSendReceipt: (fatura: Fatura) => void;
  onViewHistory: (fatura: Fatura) => void;
  onDownloadPDF?: (fatura: Fatura) => void;
  onAsaasPayment?: (fatura: Fatura) => void;
  onDownloadReceipt?: (fatura: Fatura) => void;
  isSelected?: boolean;
  onToggleSelect?: (faturaId: string) => void;
}) {
  const statusConfig = getStatusConfig(fatura.status, fatura.data_vencimento);
  const StatusIcon = statusConfig.icon;
  const valorFinal = getValorFinal(fatura);
  const valorOriginal = fatura.valor_original || fatura.valor;
  const temAlteracao = valorFinal !== valorOriginal;
  const isPendente = fatura.status === "Aberta" || fatura.status === "Vencida";

  return (
    <TableRow 
      className={cn(
        "group transition-colors",
        isSelected && "bg-primary/5",
        !isSelected && "hover:bg-muted/30"
      )}
    >
      {onToggleSelect && (
        <TableCell className="pl-4 w-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(fatura.id)}
            className="transition-all"
          />
        </TableCell>
      )}
      <TableCell className={cn("font-mono text-xs text-muted-foreground", !onToggleSelect && "pl-4")}>
        {fatura.codigo_sequencial || fatura.id.slice(0, 8)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {fatura.alunos?.nome_completo?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{fatura.alunos?.nome_completo || 'N/A'}</p>
            <p className="text-xs text-muted-foreground truncate">{fatura.responsaveis?.nome || fatura.cursos?.nome}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {meses[fatura.mes_referencia - 1]?.slice(0, 3)}/{fatura.ano_referencia}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tabular-nums">{formatCurrency(valorFinal)}</span>
          {temAlteracao && (
            <span className="text-[11px] text-muted-foreground line-through tabular-nums">
              {formatCurrency(valorOriginal)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm tabular-nums">{format(new Date(fatura.data_vencimento), "dd/MM/yy")}</span>
          {fatura.dias_atraso && fatura.dias_atraso > 0 && fatura.status === "Vencida" && (
            <span className="text-[11px] text-red-500 font-medium">{fatura.dias_atraso}d atraso</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Badge 
            variant="outline" 
            className={cn("font-medium gap-1.5 px-2 py-0.5 text-xs border", statusConfig.className)}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
            {statusConfig.label}
          </Badge>
          {fatura.asaas_payment_id && (
            <span title="Asaas ativo">
              <QrCode className="h-3.5 w-3.5 text-emerald-500" />
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onViewDetails(fatura)}>
              <Eye className="h-4 w-4 mr-2" />Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewHistory(fatura)}>
              <History className="h-4 w-4 mr-2" />Histórico
            </DropdownMenuItem>
            {onDownloadPDF && (
              <DropdownMenuItem onClick={() => onDownloadPDF(fatura)}>
                <Download className="h-4 w-4 mr-2" />Baixar PDF
              </DropdownMenuItem>
            )}
            {!fatura.bloqueada && fatura.status !== 'Paga' && (
              <DropdownMenuItem onClick={() => onEdit(fatura)}>
                <Pencil className="h-4 w-4 mr-2" />Editar
              </DropdownMenuItem>
            )}
            {isPendente && (
              <>
                <DropdownMenuSeparator />
                {onAsaasPayment && (
                  <DropdownMenuItem onClick={() => onAsaasPayment(fatura)} className="text-emerald-600">
                    <QrCode className="h-4 w-4 mr-2" />
                    {fatura.asaas_payment_id ? "Ver cobrança Asaas" : "Gerar PIX/Boleto"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onPaymentLink(fatura)}>
                  <Link className="h-4 w-4 mr-2" />
                  {fatura.payment_url ? "Ver link Stripe" : "Gerar link Stripe"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPayment(fatura)} className="text-emerald-600">
                  <CreditCard className="h-4 w-4 mr-2" />Registrar pagamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onParcelar(fatura)}>
                  <SplitSquareVertical className="h-4 w-4 mr-2" />Parcelar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCancel(fatura)} className="text-red-600">
                  <Ban className="h-4 w-4 mr-2" />Cancelar
                </DropdownMenuItem>
              </>
            )}
            {fatura.status === "Paga" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSendReceipt(fatura)}>
                  <Mail className="h-4 w-4 mr-2" />Enviar recibo
                </DropdownMenuItem>
                {onDownloadReceipt && (
                  <DropdownMenuItem onClick={() => onDownloadReceipt(fatura)}>
                    <Download className="h-4 w-4 mr-2" />Baixar recibo
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function FaturaTable({
  faturas,
  isLoading,
  viewMode,
  onViewDetails,
  onEdit,
  onPayment,
  onPaymentLink,
  onParcelar,
  onCancel,
  onSendReceipt,
  onViewHistory,
  onDownloadPDF,
  onAsaasPayment,
  onDownloadReceipt,
  selectedFaturas,
  onSelectionChange,
}: FaturaTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const handleToggleSelect = (faturaId: string) => {
    if (!onSelectionChange || !selectedFaturas) return;
    const newSelection = new Set(selectedFaturas);
    if (newSelection.has(faturaId)) {
      newSelection.delete(faturaId);
    } else {
      newSelection.add(faturaId);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange || !selectedFaturas) return;
    
    const visibleIds = new Set(faturas.map(f => f.id));
    const allVisibleSelected = faturas.every(f => selectedFaturas.has(f.id));
    
    if (allVisibleSelected) {
      const newSelection = new Set(selectedFaturas);
      visibleIds.forEach(id => newSelection.delete(id));
      onSelectionChange(newSelection);
    } else {
      const newSelection = new Set(selectedFaturas);
      visibleIds.forEach(id => newSelection.add(id));
      onSelectionChange(newSelection);
    }
  };

  const visibleSelectedCount = faturas.filter(f => selectedFaturas?.has(f.id)).length;
  const isAllVisibleSelected = visibleSelectedCount === faturas.length && faturas.length > 0;
  const isSomeVisibleSelected = visibleSelectedCount > 0 && !isAllVisibleSelected;

  if (isLoading) {
    return <Card className="border-0 shadow-sm overflow-hidden"><TableSkeleton /></Card>;
  }

  if (faturas.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Nenhuma fatura encontrada</h3>
          <p className="text-sm text-muted-foreground">Ajuste os filtros ou crie uma nova fatura</p>
        </CardContent>
      </Card>
    );
  }

  const rowProps = { 
    onViewDetails, onEdit, onPayment, onPaymentLink, onParcelar, onCancel, 
    onSendReceipt, onViewHistory, onDownloadPDF, onAsaasPayment, onDownloadReceipt,
    onToggleSelect: onSelectionChange ? handleToggleSelect : undefined,
  };

  // List view
  if (viewMode === "list") {
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {onSelectionChange && (
                <TableHead className="pl-4 w-10">
                  <Checkbox
                    checked={isAllVisibleSelected}
                    ref={(ref) => {
                      if (ref && isSomeVisibleSelected) {
                        (ref as any).indeterminate = true;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className={cn("w-[100px] text-xs font-medium", !onSelectionChange && "pl-4")}>Código</TableHead>
              <TableHead className="text-xs font-medium">Aluno</TableHead>
              <TableHead className="text-xs font-medium">Ref.</TableHead>
              <TableHead className="text-xs font-medium">Valor</TableHead>
              <TableHead className="text-xs font-medium">Vencimento</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-right pr-4 text-xs font-medium w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faturas.map(fatura => (
              <FaturaRow 
                key={fatura.id} 
                fatura={fatura} 
                isSelected={selectedFaturas?.has(fatura.id)}
                {...rowProps} 
              />
            ))}
          </TableBody>
        </Table>
        
        {/* Footer */}
        <div className="border-t bg-muted/20 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {faturas.length} fatura{faturas.length !== 1 && "s"}
          </span>
          {selectedFaturas && selectedFaturas.size > 0 && (
            <span className="text-xs font-medium text-primary">
              {selectedFaturas.size} selecionada{selectedFaturas.size !== 1 && "s"}
            </span>
          )}
        </div>
      </Card>
    );
  }

  // Grouped views
  let groups: { key: string; label: string; faturas: Fatura[]; total: number; statusConfig?: ReturnType<typeof getStatusConfig> }[] = [];

  if (viewMode === "status") {
    const byStatus: Record<string, Fatura[]> = { Vencida: [], Aberta: [], Paga: [], Cancelada: [] };
    faturas.forEach(f => {
      if (!byStatus[f.status]) byStatus[f.status] = [];
      byStatus[f.status].push(f);
    });
    groups = Object.entries(byStatus)
      .filter(([_, items]) => items.length > 0)
      .map(([status, items]) => ({
        key: status,
        label: status,
        faturas: items,
        total: items.reduce((sum, f) => sum + getValorFinal(f), 0),
        statusConfig: getStatusConfig(status, new Date().toISOString()),
      }));
  } else if (viewMode === "aluno") {
    const byAluno: Record<string, { nome: string; faturas: Fatura[] }> = {};
    faturas.forEach(f => {
      const key = f.aluno_id;
      if (!byAluno[key]) {
        byAluno[key] = { nome: f.alunos?.nome_completo || "Sem aluno", faturas: [] };
      }
      byAluno[key].faturas.push(f);
    });
    groups = Object.entries(byAluno).map(([key, { nome, faturas }]) => ({
      key,
      label: nome,
      faturas,
      total: faturas.filter(f => f.status !== 'Paga' && f.status !== 'Cancelada')
        .reduce((sum, f) => sum + getValorFinal(f), 0),
    }));
  } else if (viewMode === "mes") {
    const byMes: Record<string, Fatura[]> = {};
    faturas.forEach(f => {
      const key = `${f.ano_referencia}-${String(f.mes_referencia).padStart(2, "0")}`;
      if (!byMes[key]) byMes[key] = [];
      byMes[key].push(f);
    });
    groups = Object.entries(byMes)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const [ano, mes] = key.split("-");
        return {
          key,
          label: `${meses[parseInt(mes) - 1]} ${ano}`,
          faturas: items,
          total: items.reduce((sum, f) => sum + getValorFinal(f), 0),
        };
      });
  }

  return (
    <div className="space-y-3">
      {groups.map(({ key, label, faturas: items, total, statusConfig }) => {
        const isExpanded = expandedGroups.has(key) || expandedGroups.size === 0;

        return (
          <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleGroup(key)}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      !isExpanded && "-rotate-90"
                    )} />
                    {statusConfig && (
                      <span className={cn("h-2.5 w-2.5 rounded-full", statusConfig.dot)} />
                    )}
                    <span className="font-medium">{label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t">
                  <Table>
                    <TableBody>
                      {items.map(fatura => (
                        <FaturaRow 
                          key={fatura.id} 
                          fatura={fatura} 
                          isSelected={selectedFaturas?.has(fatura.id)}
                          {...rowProps} 
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
