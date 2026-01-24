import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFuncionarios, useFolhaPagamento, useCreateFolhaPagamento, useMarcarFolhaPaga, FolhaPagamento } from "@/hooks/useRH";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText, CheckCircle, Download } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const meses = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function FolhaTab() {
  const { t } = useTranslation();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [formData, setFormData] = useState({
    bonificacoes: 0,
    horas_extras_valor: 0,
    adicional_noturno: 0,
    adicional_periculosidade: 0,
    outros_adicionais: 0,
    descontos: 0,
    faltas_atrasos: 0,
  });

  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: folhas, isLoading: loadingFolhas } = useFolhaPagamento(selectedMonth, selectedYear);
  const createFolha = useCreateFolhaPagamento();
  const marcarPaga = useMarcarFolhaPaga();

  const funcionariosAtivos = funcionarios?.filter(f => f.status === 'ativo') || [];
  const funcionarioSelecionado = funcionarios?.find(f => f.id === selectedFuncionario);

  const calcularFolha = () => {
    if (!funcionarioSelecionado) return null;

    const salarioBase = funcionarioSelecionado.salario_base;
    const totalAdicionais = 
      formData.bonificacoes +
      formData.horas_extras_valor +
      formData.adicional_noturno +
      formData.adicional_periculosidade +
      formData.outros_adicionais;
    
    const totalBruto = salarioBase + totalAdicionais;
    
    // Cálculo INSS (simplificado)
    let inss = 0;
    if (totalBruto <= 1412) inss = totalBruto * 0.075;
    else if (totalBruto <= 2666.68) inss = totalBruto * 0.09;
    else if (totalBruto <= 4000.03) inss = totalBruto * 0.12;
    else inss = totalBruto * 0.14;
    inss = Math.min(inss, 908.86);

    // FGTS (8%)
    const fgts = totalBruto * 0.08;

    // IRRF simplificado
    const baseIR = totalBruto - inss;
    let irrf = 0;
    if (baseIR > 4664.68) irrf = baseIR * 0.275 - 896.00;
    else if (baseIR > 3751.06) irrf = baseIR * 0.225 - 662.77;
    else if (baseIR > 2826.66) irrf = baseIR * 0.15 - 381.44;
    else if (baseIR > 2259.21) irrf = baseIR * 0.075 - 169.44;
    irrf = Math.max(0, irrf);

    const totalDescontos = inss + irrf + formData.descontos + formData.faltas_atrasos;
    const totalLiquido = totalBruto - totalDescontos;

    return {
      salario_base: salarioBase,
      total_bruto: totalBruto,
      inss,
      fgts,
      irrf,
      total_liquido: totalLiquido,
    };
  };

  const handleGerarFolha = async () => {
    const calculo = calcularFolha();
    if (!calculo || !funcionarioSelecionado) return;

    await createFolha.mutateAsync({
      funcionario_id: selectedFuncionario,
      mes_referencia: selectedMonth,
      ano_referencia: selectedYear,
      salario_base: calculo.salario_base,
      horas_extras_valor: formData.horas_extras_valor,
      bonificacoes: formData.bonificacoes,
      adicional_noturno: formData.adicional_noturno,
      adicional_periculosidade: formData.adicional_periculosidade,
      outros_adicionais: formData.outros_adicionais,
      descontos: formData.descontos,
      faltas_atrasos: formData.faltas_atrasos,
      inss: calculo.inss,
      fgts: calculo.fgts,
      irrf: calculo.irrf,
      total_bruto: calculo.total_bruto,
      total_liquido: calculo.total_liquido,
      pago: false,
      data_pagamento: null,
      despesa_id: null,
      observacoes: null,
    });

    setIsDialogOpen(false);
    setSelectedFuncionario("");
    setFormData({
      bonificacoes: 0,
      horas_extras_valor: 0,
      adicional_noturno: 0,
      adicional_periculosidade: 0,
      outros_adicionais: 0,
      descontos: 0,
      faltas_atrasos: 0,
    });
  };

  const handleMarcarPaga = async (folha: FolhaPagamento) => {
    // Criar despesa automaticamente
    const { data: despesa, error } = await supabase
      .from('despesas')
      .insert({
        titulo: `Folha de Pagamento - ${folha.funcionarios?.nome_completo}`,
        categoria: 'Folha de Pagamento',
        valor: folha.total_liquido,
        data_vencimento: new Date().toISOString().split('T')[0],
        paga: true,
        data_pagamento: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar despesa");
      return;
    }

    await marcarPaga.mutateAsync({ folhaId: folha.id, despesaId: despesa.id });
  };

  const calculo = calcularFolha();

  if (loadingFuncionarios) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[150px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes) => (
                <SelectItem key={mes.value} value={String(mes.value)}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Gerar Folha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Gerar Folha de Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label>Funcionário</Label>
                <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                  <SelectTrigger className="h-11 mt-1">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionariosAtivos.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome_completo} - {formatCurrency(f.salario_base)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {funcionarioSelecionado && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horas Extras (R$)</Label>
                      <Input
                        type="number"
                        value={formData.horas_extras_valor}
                        onChange={(e) => setFormData({ ...formData, horas_extras_valor: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bonificações</Label>
                      <Input
                        type="number"
                        value={formData.bonificacoes}
                        onChange={(e) => setFormData({ ...formData, bonificacoes: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adicional Noturno</Label>
                      <Input
                        type="number"
                        value={formData.adicional_noturno}
                        onChange={(e) => setFormData({ ...formData, adicional_noturno: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adicional Periculosidade</Label>
                      <Input
                        type="number"
                        value={formData.adicional_periculosidade}
                        onChange={(e) => setFormData({ ...formData, adicional_periculosidade: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Outros Adicionais</Label>
                      <Input
                        type="number"
                        value={formData.outros_adicionais}
                        onChange={(e) => setFormData({ ...formData, outros_adicionais: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descontos</Label>
                      <Input
                        type="number"
                        value={formData.descontos}
                        onChange={(e) => setFormData({ ...formData, descontos: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Faltas/Atrasos</Label>
                      <Input
                        type="number"
                        value={formData.faltas_atrasos}
                        onChange={(e) => setFormData({ ...formData, faltas_atrasos: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  {calculo && (
                    <Card className="border-border/50 bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Resumo da Folha</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Salário Base:</div>
                        <div className="text-right font-medium">{formatCurrency(calculo.salario_base)}</div>
                        <div className="text-muted-foreground">Total Bruto:</div>
                        <div className="text-right font-medium">{formatCurrency(calculo.total_bruto)}</div>
                        <div className="text-muted-foreground">INSS:</div>
                        <div className="text-right text-destructive">-{formatCurrency(calculo.inss)}</div>
                        <div className="text-muted-foreground">IRRF:</div>
                        <div className="text-right text-destructive">-{formatCurrency(calculo.irrf)}</div>
                        <div className="text-muted-foreground">FGTS (empresa):</div>
                        <div className="text-right text-muted-foreground">{formatCurrency(calculo.fgts)}</div>
                        <div className="font-bold pt-2 border-t border-border">Total Líquido:</div>
                        <div className="text-right font-bold pt-2 border-t border-border text-emerald-600">
                          {formatCurrency(calculo.total_liquido)}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleGerarFolha} disabled={createFolha.isPending}>
                      Gerar Folha
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Card */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Folhas de Pagamento
          </CardTitle>
          <CardDescription>
            {meses.find(m => m.value === selectedMonth)?.label} de {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingFolhas ? (
            <div className="py-16">
              <LoadingState />
            </div>
          ) : folhas?.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={FileText}
                title="Nenhuma folha encontrada"
                description="Gere a primeira folha de pagamento do mês"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Funcionário</TableHead>
                  <TableHead className="font-semibold text-foreground">Cargo</TableHead>
                  <TableHead className="font-semibold text-foreground">Salário Base</TableHead>
                  <TableHead className="font-semibold text-foreground">Total Bruto</TableHead>
                  <TableHead className="font-semibold text-foreground">Descontos</TableHead>
                  <TableHead className="font-semibold text-foreground">Total Líquido</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folhas?.map((folha: any, index: number) => (
                  <motion.tr
                    key={folha.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors border-b border-border/50"
                  >
                    <TableCell className="font-medium text-foreground">
                      {folha.funcionarios?.nome_completo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {folha.funcionarios?.cargos?.nome || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(folha.salario_base)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(folha.total_bruto)}
                    </TableCell>
                    <TableCell className="text-destructive">
                      -{formatCurrency(folha.inss + folha.irrf + folha.descontos + folha.faltas_atrasos)}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {formatCurrency(folha.total_liquido)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-medium",
                          folha.pago 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}
                      >
                        {folha.pago ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!folha.pago && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => handleMarcarPaga(folha)}
                            disabled={marcarPaga.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
