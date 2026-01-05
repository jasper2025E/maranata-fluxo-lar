import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  RefreshCw,
  Loader2,
  Trash2,
  Receipt,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useCreateFatura, formatCurrency, meses, FaturaItem } from "@/hooks/useFaturas";

interface Aluno {
  id: string;
  nome_completo: string;
  responsavel_id: string | null;
}

interface Curso {
  id: string;
  nome: string;
  mensalidade: number;
}

interface CreateFaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunos: Aluno[];
  cursos: Curso[];
}

export function CreateFaturaDialog({ open, onOpenChange, alunos, cursos }: CreateFaturaDialogProps) {
  const createMutation = useCreateFatura();
  
  const [mode, setMode] = useState<"simples" | "detalhada">("simples");
  const [tipo, setTipo] = useState<"avulsa" | "recorrente">("avulsa");
  const [data, setData] = useState({
    aluno_id: "",
    curso_id: "",
    valor: 0,
    data_vencimento: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    mes_referencia: new Date().getMonth() + 1,
    ano_referencia: new Date().getFullYear(),
    meses_recorrencia: 12,
  });
  
  const [itens, setItens] = useState<FaturaItem[]>([]);
  const [newItem, setNewItem] = useState({
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
  });

  const handleCursoSelect = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    setData(prev => ({
      ...prev,
      curso_id: cursoId,
      valor: curso?.mensalidade || 0,
    }));
  };

  const addItem = () => {
    if (!newItem.descricao || newItem.valor_unitario <= 0) return;
    
    const subtotal = newItem.quantidade * newItem.valor_unitario;
    setItens([...itens, {
      ...newItem,
      subtotal,
      desconto_valor: 0,
      desconto_percentual: 0,
      desconto_aplicado: 0,
      valor_final: subtotal,
      ordem: itens.length,
    }]);
    setNewItem({ descricao: "", quantidade: 1, valor_unitario: 0 });
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const valorTotal = mode === "detalhada" && itens.length > 0
    ? itens.reduce((sum, item) => sum + item.valor_final, 0)
    : data.valor;

  const handleCreate = async () => {
    if (!data.aluno_id || !data.curso_id || valorTotal <= 0) {
      return;
    }

    const aluno = alunos.find(a => a.id === data.aluno_id);
    const responsavelId = aluno?.responsavel_id ?? undefined;
    
    try {
      if (tipo === "recorrente") {
        // Para faturas recorrentes, criar múltiplas
        for (let i = 0; i < data.meses_recorrencia; i++) {
          const date = new Date(data.ano_referencia, data.mes_referencia - 1 + i, 10);
          await createMutation.mutateAsync({
            aluno_id: data.aluno_id,
            curso_id: data.curso_id,
            responsavel_id: responsavelId,
            valor: valorTotal,
            data_vencimento: format(date, "yyyy-MM-dd"),
            mes_referencia: date.getMonth() + 1,
            ano_referencia: date.getFullYear(),
            itens: mode === "detalhada" ? itens : undefined,
          });
        }
      } else {
        await createMutation.mutateAsync({
          aluno_id: data.aluno_id,
          curso_id: data.curso_id,
          responsavel_id: responsavelId,
          valor: valorTotal,
          data_vencimento: data.data_vencimento,
          mes_referencia: data.mes_referencia,
          ano_referencia: data.ano_referencia,
          itens: mode === "detalhada" ? itens : undefined,
        });
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Erro já tratado pelo mutation
    }
  };

  const resetForm = () => {
    setMode("simples");
    setTipo("avulsa");
    setData({
      aluno_id: "",
      curso_id: "",
      valor: 0,
      data_vencimento: format(addDays(new Date(), 10), "yyyy-MM-dd"),
      mes_referencia: new Date().getMonth() + 1,
      ano_referencia: new Date().getFullYear(),
      meses_recorrencia: 12,
    });
    setItens([]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Fatura
          </DialogTitle>
          <DialogDescription>Crie faturas avulsas ou recorrentes com itens detalhados</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "simples" | "detalhada")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simples">Fatura Simples</TabsTrigger>
            <TabsTrigger value="detalhada">Com Itens</TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            {/* Tipo */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tipo === "avulsa" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTipo("avulsa")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Avulsa
              </Button>
              <Button
                type="button"
                variant={tipo === "recorrente" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTipo("recorrente")}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recorrente
              </Button>
            </div>

            {/* Aluno & Curso */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select value={data.aluno_id} onValueChange={(v) => setData({ ...data, aluno_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select value={data.curso_id} onValueChange={handleCursoSelect}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Referência & Vencimento */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mês Ref.</Label>
                <Select value={String(data.mes_referencia)} onValueChange={(v) => setData({ ...data, mes_referencia: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {meses.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano Ref.</Label>
                <Select value={String(data.ano_referencia)} onValueChange={(v) => setData({ ...data, ano_referencia: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {tipo === "avulsa" ? (
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={data.data_vencimento}
                    onChange={(e) => setData({ ...data, data_vencimento: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Select value={String(data.meses_recorrencia)} onValueChange={(v) => setData({ ...data, meses_recorrencia: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 6, 12, 24].map(n => <SelectItem key={n} value={String(n)}>{n} meses</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="simples" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.valor || ""}
                  onChange={(e) => setData({ ...data, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </TabsContent>

            <TabsContent value="detalhada" className="mt-0 space-y-4">
              {/* Add Item Form */}
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
                        placeholder="Valor unit."
                        value={newItem.valor_unitario || ""}
                        onChange={(e) => setNewItem({ ...newItem, valor_unitario: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={addItem} className="w-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              {itens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Unitário</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-center">{item.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.valor_final)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Adicione itens à fatura</p>
                </div>
              )}
            </TabsContent>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(valorTotal)}</span>
                </div>
                {tipo === "recorrente" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {data.meses_recorrencia} faturas de {formatCurrency(valorTotal)} serão criadas
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || !data.aluno_id || !data.curso_id || valorTotal <= 0}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar {tipo === "recorrente" ? `${data.meses_recorrencia} Faturas` : "Fatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
