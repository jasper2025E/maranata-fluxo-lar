import { useState, useEffect } from "react";
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
  ChevronRight,
  Calendar as CalendarIcon,
  History,
  Download,
  QrCode,
  FileBarChart,
  RefreshCw,
  Trash2,
  Percent,
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
  onDownloadBoleto?: (fatura: Fatura) => void;
  onDelete?: (fatura: Fatura) => void;
  onReopen?: (fatura: Fatura) => void;
  onDiscount?: (fatura: Fatura) => void;
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
  if (normalizedStatus === "paga") return { label: "Paga", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 };
  if (normalizedStatus === "vencida") return { label: "Vencida", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle };
  if (normalizedStatus === "cancelada") return { label: "Cancelada", className: "bg-muted text-muted-foreground border-border", icon: XCircle };
  if (normalizedStatus === "rascunho") return { label: "Rascunho", className: "bg-muted/50 text-muted-foreground border-border", icon: FileText };
  if (vencendoEm7Dias) return { label: "Vencendo", className: "bg-warning/10 text-warning border-warning/20", icon: Clock };
  return { label: "Emitida", className: "bg-primary/10 text-primary border-primary/20", icon: FileText };
}

function TableSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
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
  onDownloadBoleto,
  onDelete,
  onReopen,
  onDiscount,
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
  onDownloadBoleto?: (fatura: Fatura) => void;
  onDelete?: (fatura: Fatura) => void;
  onReopen?: (fatura: Fatura) => void;
  onDiscount?: (fatura: Fatura) => void;
  isSelected?: boolean;
  onToggleSelect?: (faturaId: string) => void;
}) {
  const statusConfig = getStatusConfig(fatura.status, fatura.data_vencimento);
  const StatusIcon = statusConfig.icon;
  const valorFinal = getValorFinal(fatura);
  const valorOriginal = fatura.valor_original || fatura.valor;
  const temAlteracao = valorFinal !== valorOriginal;
  const isPendente = fatura.status === "Aberta" || fatura.status === "Vencida";
  const saldoRestante = fatura.saldo_restante || valorFinal;

  return (
    <TableRow className={cn(
      "transition-all duration-150 group",
      isSelected ? "bg-primary/5" : "hover:bg-muted/40"
    )}>
      {onToggleSelect && (
        <TableCell className="pl-5 w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(fatura.id)}
            className="rounded-md"
          />
        </TableCell>
      )}
      <TableCell className={cn("font-mono text-xs text-muted-foreground", !onToggleSelect && "pl-5")}>
        {fatura.codigo_sequencial || fatura.id.slice(0, 8)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shadow-sm">
              {fatura.alunos?.nome_completo?.charAt(0).toUpperCase() || '?'}
            </div>
            {fatura.consolidada && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
                2+
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-foreground">{fatura.alunos?.nome_completo || 'N/A'}</p>
              {fatura.consolidada && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20 font-semibold">
                  Consolidada
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{fatura.responsaveis?.nome || fatura.cursos?.nome}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm font-medium text-muted-foreground">
        {meses[fatura.mes_referencia - 1]?.slice(0, 3)}/{fatura.ano_referencia}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-foreground">{formatCurrency(valorFinal)}</span>
          {temAlteracao && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(valorOriginal)}</span>
          )}
          {saldoRestante > 0 && saldoRestante < valorFinal && (
            <span className="text-xs text-warning font-medium">Saldo: {formatCurrency(saldoRestante)}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">{format(new Date(fatura.data_vencimento), "dd/MM/yy")}</span>
          {fatura.dias_atraso && fatura.dias_atraso > 0 && fatura.status === "Vencida" && (
            <span className="text-xs text-destructive font-semibold">{fatura.dias_atraso}d atraso</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn("font-semibold gap-1.5 px-2.5 py-1 text-xs rounded-lg", statusConfig.className)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusConfig.label}
          </Badge>
          {fatura.asaas_payment_id && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-success/10 text-success border-success/20 rounded-md font-semibold">
              Asaas
            </Badge>
          )}
          {fatura.versao && fatura.versao > 1 && (
            <span className="text-[10px] text-muted-foreground font-medium">v{fatura.versao}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
            {onDownloadBoleto && fatura.asaas_payment_id && (
              (() => {
                // Validação: linha digitável (47 dígitos) e código de barras (44 dígitos)
                const linhaDigitavel = (fatura.asaas_boleto_barcode || "").replace(/\D/g, "");
                const barCode = (fatura.asaas_boleto_bar_code || "").replace(/\D/g, "");
                const isReady = linhaDigitavel.length === 47 && barCode.length === 44;
                
                return isReady ? (
                  <DropdownMenuItem onClick={() => onDownloadBoleto(fatura)}>
                    <FileBarChart className="h-4 w-4 mr-2" />Baixar Boleto
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <FileBarChart className="h-4 w-4 mr-2" />Sincronizando dados...
                  </DropdownMenuItem>
                );
              })()
            )}
            {!fatura.bloqueada && fatura.status !== 'Cancelada' && (
              <DropdownMenuItem onClick={() => onEdit(fatura)}>
                <Pencil className="h-4 w-4 mr-2" />Editar
              </DropdownMenuItem>
            )}
            {isPendente && (
              <>
                <DropdownMenuSeparator />
                {onAsaasPayment && (
                  <DropdownMenuItem onClick={() => onAsaasPayment(fatura)} className="text-success">
                    <QrCode className="h-4 w-4 mr-2" />
                    {fatura.asaas_payment_id ? "Ver cobrança" : "Gerar PIX/Boleto"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onPayment(fatura)} className="text-success">
                  <CreditCard className="h-4 w-4 mr-2" />Registrar pagamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onParcelar(fatura)}>
                  <SplitSquareVertical className="h-4 w-4 mr-2" />Parcelar
                </DropdownMenuItem>
                {onDiscount && (
                  <DropdownMenuItem onClick={() => onDiscount(fatura)}>
                    <Percent className="h-4 w-4 mr-2" />Desconto
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCancel(fatura)} className="text-destructive">
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
                {onReopen && (
                  <DropdownMenuItem onClick={() => onReopen(fatura)} className="text-warning">
                    <RefreshCw className="h-4 w-4 mr-2" />Reabrir fatura
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            {/* Opção de excluir permanentemente - sempre visível */}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(fatura)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />Excluir
                </DropdownMenuItem>
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
  onDownloadBoleto,
  onDelete,
  onReopen,
  onDiscount,
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
      // Desmarcar apenas os visíveis, mantendo outros selecionados
      const newSelection = new Set(selectedFaturas);
      visibleIds.forEach(id => newSelection.delete(id));
      onSelectionChange(newSelection);
    } else {
      // Adicionar todos os visíveis sem apagar os já selecionados
      const newSelection = new Set(selectedFaturas);
      visibleIds.forEach(id => newSelection.add(id));
      onSelectionChange(newSelection);
    }
  };

  const visibleIds = new Set(faturas.map(f => f.id));
  const visibleSelectedCount = faturas.filter(f => selectedFaturas?.has(f.id)).length;
  const isAllVisibleSelected = visibleSelectedCount === faturas.length && faturas.length > 0;
  const isSomeVisibleSelected = visibleSelectedCount > 0 && !isAllVisibleSelected;

  if (isLoading) {
    return <Card><TableSkeleton /></Card>;
  }

  if (faturas.length === 0) {
    return (
      <Card className="border rounded-2xl shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg mb-2">Nenhuma fatura encontrada</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] text-center">Ajuste os filtros ou crie uma nova fatura para começar</p>
        </CardContent>
      </Card>
    );
  }

  const rowProps = { 
    onViewDetails, onEdit, onPayment, onPaymentLink, onParcelar, onCancel, 
    onSendReceipt, onViewHistory, onDownloadPDF, onAsaasPayment, onDownloadReceipt, onDownloadBoleto,
    onDelete, onReopen, onDiscount,
    onToggleSelect: onSelectionChange ? handleToggleSelect : undefined,
  };

  // List view - Shopify Style
  if (viewMode === "list") {
    return (
      <Card className="border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b">
              {onSelectionChange && (
                <TableHead className="pl-5 w-12">
                  <Checkbox
                    checked={isAllVisibleSelected}
                    ref={(ref) => {
                      if (ref && isSomeVisibleSelected) {
                        (ref as any).indeterminate = true;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    className="rounded-md"
                  />
                </TableHead>
              )}
              <TableHead className={cn("w-[130px] text-xs font-semibold uppercase tracking-wide text-muted-foreground", !onSelectionChange && "pl-5")}>Código</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aluno / Responsável</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ref.</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vencimento</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
              <TableHead className="text-right pr-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ações</TableHead>
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
        <CardContent className="border-t bg-muted/20 py-3 text-center text-sm text-muted-foreground">
          {selectedFaturas && selectedFaturas.size > 0 
            ? <span className="font-medium text-foreground">{selectedFaturas.size} de {faturas.length} fatura(s) selecionada(s)</span>
            : `${faturas.length} fatura(s)`
          }
        </CardContent>
      </Card>
    );
  }

  // Grouped views
  let groups: { key: string; label: string; faturas: Fatura[]; total: number }[] = [];

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
    <div className="space-y-4">
    {groups.map(({ key, label, faturas: items, total }) => {
        const isExpanded = expandedGroups.has(key) || expandedGroups.size === 0;
        const config = viewMode === "status" ? getStatusConfig(key, new Date().toISOString()) : null;

        return (
          <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleGroup(key)}>
            <Card className="border">
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/30 transition-colors p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {config ? (
                        <Badge variant="outline" className={cn("font-medium", config.className)}>
                          {label}
                        </Badge>
                      ) : viewMode === "mes" ? (
                        <>
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{label}</span>
                        </>
                      ) : (
                        <>
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {label.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{label}</span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground">({items.length})</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {items.map(fatura => (
                        <FaturaRow key={fatura.id} fatura={fatura} {...rowProps} />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
