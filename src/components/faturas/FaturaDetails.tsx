import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  User,
  Calendar,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  History,
  Receipt,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Download,
  FileDown,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { generateFaturaPDF, generateReciboPDF } from "@/lib/pdfGenerator";
import { generateCarneFatura } from "@/lib/carneGenerator";
import { toast } from "sonner";
import {
  Fatura,
  FaturaItem,
  FaturaDesconto,
  Pagamento,
  useFaturaItens,
  useFaturaDescontos,
  useFaturaHistorico,
  useFaturaPagamentos,
  useAddFaturaItem,
  useRemoveFaturaItem,
  useAddFaturaDesconto,
  useRegistrarPagamento,
  useEstornarPagamento,
  getValorFinal,
  formatCurrency,
  meses,
} from "@/hooks/useFaturas";

interface FaturaDetailsProps {
  fatura: Fatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", className)}>{value}</span>
    </div>
  );
}

function ItemsTab({ faturaId, isEditable }: { faturaId: string; isEditable: boolean }) {
  const { data: itens, isLoading } = useFaturaItens(faturaId);
  const addItem = useAddFaturaItem();
  const removeItem = useRemoveFaturaItem();
  const [newItem, setNewItem] = useState({
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
  });

  const handleAddItem = () => {
    if (!newItem.descricao || newItem.valor_unitario <= 0) {
      toast.error("Preencha a descrição e o valor unitário");
      return;
    }
    
    const subtotal = newItem.quantidade * newItem.valor_unitario;
    addItem.mutate({
      fatura_id: faturaId,
      descricao: newItem.descricao,
      quantidade: newItem.quantidade,
      valor_unitario: newItem.valor_unitario,
      subtotal,
      desconto_valor: 0,
      desconto_percentual: 0,
      desconto_aplicado: 0,
      valor_final: subtotal,
      ordem: (itens?.length || 0),
    });
    setNewItem({ descricao: "", quantidade: 1, valor_unitario: 0 });
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-4">
      {isEditable && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <Input
                  placeholder="Descrição do item"
                  value={newItem.descricao}
                  onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={newItem.quantidade}
                  onChange={(e) => setNewItem({ ...newItem, quantidade: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={newItem.valor_unitario || ""}
                  onChange={(e) => setNewItem({ ...newItem, valor_unitario: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleAddItem} disabled={addItem.isPending} className="w-full">
                  {addItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {itens && itens.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center">Qtd</TableHead>
              <TableHead className="text-right">Unitário</TableHead>
              <TableHead className="text-right">Desconto</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {isEditable && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.descricao}</TableCell>
                <TableCell className="text-center">{item.quantidade}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                <TableCell className="text-right text-destructive">
                  {item.desconto_aplicado > 0 ? `-${formatCurrency(item.desconto_aplicado)}` : "-"}
                </TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(item.valor_final)}</TableCell>
                {isEditable && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem.mutate({ id: item.id!, fatura_id: faturaId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum item adicionado</p>
          <p className="text-xs">Os itens detalham a composição da fatura</p>
        </div>
      )}
    </div>
  );
}

function DescontosTab({ faturaId, valorBase, isEditable }: { faturaId: string; valorBase: number; isEditable: boolean }) {
  const { data: descontos, isLoading } = useFaturaDescontos(faturaId);
  const addDesconto = useAddFaturaDesconto();
  const [newDesconto, setNewDesconto] = useState({
    tipo: "manual" as FaturaDesconto['tipo'],
    descricao: "",
    valor: 0,
    percentual: 0,
    isPercentual: false,
  });

  const handleAdd = () => {
    if (!newDesconto.descricao) {
      toast.error("Preencha a descrição do desconto");
      return;
    }
    
    const valorAplicado = newDesconto.isPercentual
      ? valorBase * (newDesconto.percentual / 100)
      : newDesconto.valor;

    if (valorAplicado <= 0) {
      toast.error("Informe um valor ou percentual válido");
      return;
    }

    addDesconto.mutate({
      fatura_id: faturaId,
      tipo: newDesconto.tipo,
      descricao: newDesconto.descricao,
      valor: newDesconto.isPercentual ? 0 : newDesconto.valor,
      percentual: newDesconto.isPercentual ? newDesconto.percentual : 0,
      valor_aplicado: valorAplicado,
    });
    setNewDesconto({ tipo: "manual", descricao: "", valor: 0, percentual: 0, isPercentual: false });
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const tipoLabels: Record<string, string> = {
    convenio: "Convênio",
    bolsa: "Bolsa",
    campanha: "Campanha",
    pontualidade: "Pontualidade",
    manual: "Manual",
    item: "Item",
  };

  return (
    <div className="space-y-4">
      {isEditable && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={newDesconto.tipo} onValueChange={(v: FaturaDesconto['tipo']) => setNewDesconto({ ...newDesconto, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="convenio">Convênio</SelectItem>
                  <SelectItem value="bolsa">Bolsa</SelectItem>
                  <SelectItem value="campanha">Campanha</SelectItem>
                  <SelectItem value="pontualidade">Pontualidade</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant={!newDesconto.isPercentual ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setNewDesconto({ ...newDesconto, isPercentual: false })}
                >
                  R$
                </Button>
                <Button
                  variant={newDesconto.isPercentual ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setNewDesconto({ ...newDesconto, isPercentual: true })}
                >
                  %
                </Button>
              </div>
            </div>
            <Input
              placeholder="Descrição do desconto"
              value={newDesconto.descricao}
              onChange={(e) => setNewDesconto({ ...newDesconto, descricao: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder={newDesconto.isPercentual ? "Percentual" : "Valor"}
                value={newDesconto.isPercentual ? newDesconto.percentual || "" : newDesconto.valor || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setNewDesconto({
                    ...newDesconto,
                    [newDesconto.isPercentual ? "percentual" : "valor"]: val,
                  });
                }}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={addDesconto.isPending}>
                {addDesconto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {descontos && descontos.length > 0 ? (
        <div className="space-y-2">
          {descontos.map((d) => (
            <Card key={d.id} className="border">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{tipoLabels[d.tipo]}</Badge>
                    <span className="font-medium text-sm">{d.descricao}</span>
                  </div>
                  {d.percentual > 0 && (
                    <span className="text-xs text-muted-foreground">{d.percentual}% do valor base</span>
                  )}
                </div>
                <span className="font-semibold text-destructive">-{formatCurrency(d.valor_aplicado)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Percent className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum desconto aplicado</p>
        </div>
      )}
    </div>
  );
}

function PagamentosTab({ faturaId, valorTotal, onDownloadRecibo }: { faturaId: string; valorTotal: number; onDownloadRecibo?: (pagamento: Pagamento) => void }) {
  const { data: pagamentos, isLoading } = useFaturaPagamentos(faturaId);
  const registrarPagamento = useRegistrarPagamento();
  const estornar = useEstornarPagamento();
  const [showForm, setShowForm] = useState(false);
  const [newPagamento, setNewPagamento] = useState({
    valor: 0,
    metodo: "",
    referencia: "",
    tipo: "total" as "total" | "parcial",
  });

  const handlePagar = () => {
    if (!newPagamento.metodo) {
      toast.error("Selecione o método de pagamento");
      return;
    }
    if (newPagamento.valor <= 0) {
      toast.error("Informe o valor do pagamento");
      return;
    }
    registrarPagamento.mutate({
      fatura_id: faturaId,
      valor: newPagamento.valor,
      metodo: newPagamento.metodo,
      referencia: newPagamento.referencia || undefined,
      tipo: newPagamento.tipo,
    });
    setNewPagamento({ valor: 0, metodo: "", referencia: "", tipo: "total" });
    setShowForm(false);
  };

  const totalPago = (pagamentos || [])
    .filter(p => p.tipo !== 'estorno')
    .reduce((sum, p) => sum + Number(p.valor), 0);
  const totalEstornado = (pagamentos || [])
    .filter(p => p.tipo === 'estorno')
    .reduce((sum, p) => sum + Number(p.valor), 0);
  const saldo = valorTotal - totalPago + totalEstornado;

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total da Fatura</p>
            <p className="font-bold">{formatCurrency(valorTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Pago</p>
            <p className="font-bold text-success">{formatCurrency(totalPago - totalEstornado)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo Restante</p>
            <p className={cn("font-bold", saldo > 0 ? "text-warning" : "text-success")}>
              {formatCurrency(Math.max(0, saldo))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de pagamento */}
      {saldo > 0 && (
        showForm ? (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={newPagamento.tipo === "total" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPagamento({ ...newPagamento, tipo: "total", valor: saldo })}
                >
                  Pagamento Total
                </Button>
                <Button
                  variant={newPagamento.tipo === "parcial" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPagamento({ ...newPagamento, tipo: "parcial", valor: 0 })}
                >
                  Pagamento Parcial
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPagamento.valor || ""}
                    onChange={(e) => setNewPagamento({ ...newPagamento, valor: parseFloat(e.target.value) || 0 })}
                    disabled={newPagamento.tipo === "total"}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Método</Label>
                  <Select value={newPagamento.metodo} onValueChange={(v) => setNewPagamento({ ...newPagamento, metodo: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                      <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                placeholder="Referência/Comprovante (opcional)"
                value={newPagamento.referencia}
                onChange={(e) => setNewPagamento({ ...newPagamento, referencia: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handlePagar} disabled={registrarPagamento.isPending} className="flex-1">
                  {registrarPagamento.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => { setShowForm(true); setNewPagamento({ ...newPagamento, valor: saldo, tipo: "total" }); }} className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Registrar Pagamento
          </Button>
        )
      )}

      {/* Lista de pagamentos */}
      {pagamentos && pagamentos.length > 0 ? (
        <div className="space-y-2">
          {pagamentos.map((p) => (
            <Card key={p.id} className={cn("border", p.tipo === 'estorno' && "bg-destructive/5 border-destructive/20")}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.tipo === 'estorno' ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{p.metodo}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                        {p.referencia && ` • ${p.referencia}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold", p.tipo === 'estorno' ? "text-destructive" : "text-success")}>
                      {p.tipo === 'estorno' ? '-' : '+'}{formatCurrency(p.valor)}
                    </span>
                    {p.tipo !== 'estorno' && onDownloadRecibo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDownloadRecibo(p)}
                        title="Baixar recibo"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {p.motivo_estorno && (
                  <p className="text-xs text-destructive mt-1">Motivo: {p.motivo_estorno}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum pagamento registrado</p>
        </div>
      )}
    </div>
  );
}

function HistoricoTab({ faturaId }: { faturaId: string }) {
  const { data: historico, isLoading } = useFaturaHistorico(faturaId);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!historico || historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma alteração registrada</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {historico.map((h) => (
          <Card key={h.id} className="border">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{h.acao}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">v{h.versao}</Badge>
              </div>
              {h.motivo && (
                <p className="text-sm mt-2 text-muted-foreground">{h.motivo}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

export function FaturaDetails({ fatura: faturaProp, open, onOpenChange }: FaturaDetailsProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingCarne, setIsGeneratingCarne] = useState(false);
  
  // Buscar fatura atualizada internamente para refletir mudanças em tempo real
  const { data: faturaAtualizada } = useQuery({
    queryKey: ['faturas', 'detail', faturaProp?.id],
    queryFn: async () => {
      if (!faturaProp?.id) return null;
      const { data, error } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone)
        `)
        .eq("id", faturaProp.id)
        .maybeSingle();
      if (error) throw error;
      return data as Fatura | null;
    },
    enabled: !!faturaProp?.id && open,
  });

  // Usar fatura atualizada ou a prop original como fallback
  const fatura = faturaAtualizada || faturaProp;
  
  const { data: escola } = useQuery({
    queryKey: ['escola-pdf'],
    queryFn: async () => {
      const { data } = await supabase.from('escola').select('*').limit(1).maybeSingle();
      return data;
    },
  });

  const { data: itens } = useFaturaItens(fatura?.id || null);
  const { data: pagamentos } = useFaturaPagamentos(fatura?.id || null);

  if (!fatura) return null;

  const valorFinal = getValorFinal(fatura);
  const isEditable = !fatura.bloqueada && fatura.status !== 'Paga' && fatura.status !== 'Cancelada';

  const handleDownloadFatura = async () => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }
    setIsGeneratingPDF(true);
    try {
      await generateFaturaPDF(fatura, escola, itens || undefined);
      toast.success("PDF da fatura gerado!");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadCarne = async () => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }
    setIsGeneratingCarne(true);
    try {
      // Buscar CPF do responsável
      let responsavelData = null;
      if (fatura.responsavel_id) {
        const { data } = await supabase
          .from("responsaveis")
          .select("nome, cpf")
          .eq("id", fatura.responsavel_id)
          .maybeSingle();
        responsavelData = data;
      }
      
      await generateCarneFatura(fatura, escola, responsavelData);
      toast.success("Carnê gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar carnê");
    } finally {
      setIsGeneratingCarne(false);
    }
  };

  const handleDownloadRecibo = async (pagamento: Pagamento) => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }
    setIsGeneratingPDF(true);
    try {
      await generateReciboPDF(fatura, pagamento, escola);
      toast.success("Recibo gerado!");
    } catch (error) {
      toast.error("Erro ao gerar recibo");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {fatura.codigo_sequencial || `Fatura #${fatura.id.slice(0, 8)}`}
            </DialogTitle>
            <DialogDescription>
              {meses[fatura.mes_referencia - 1]} de {fatura.ano_referencia}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadCarne}
              disabled={isGeneratingCarne}
              className="gap-2"
              title="Imprimir carnê individual (99x210mm)"
            >
              {isGeneratingCarne ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Imprimir Fatura</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadFatura}
              disabled={isGeneratingPDF}
              className="gap-2"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Resumo */}
          <Card className="mb-4 bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Aluno</span>
                  </div>
                  <p className="font-medium">{fatura.alunos?.nome_completo}</p>
                  <p className="text-sm text-muted-foreground">{fatura.responsaveis?.nome || 'Responsável não vinculado'}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Valor Total</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(valorFinal)}</p>
                  {fatura.saldo_restante !== undefined && fatura.saldo_restante !== valorFinal && (
                    <p className="text-sm text-warning">Saldo: {formatCurrency(fatura.saldo_restante)}</p>
                  )}
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Emissão</p>
                  <p className="font-medium">{format(new Date(fatura.data_emissao), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">{fatura.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="itens" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="itens">Itens</TabsTrigger>
              <TabsTrigger value="descontos">Descontos</TabsTrigger>
              <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="itens" className="mt-4">
              <ItemsTab faturaId={fatura.id} isEditable={isEditable} />
            </TabsContent>

            <TabsContent value="descontos" className="mt-4">
              <DescontosTab faturaId={fatura.id} valorBase={fatura.valor_original || fatura.valor} isEditable={isEditable} />
            </TabsContent>

            <TabsContent value="pagamentos" className="mt-4">
              <PagamentosTab faturaId={fatura.id} valorTotal={valorFinal} onDownloadRecibo={handleDownloadRecibo} />
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <HistoricoTab faturaId={fatura.id} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
