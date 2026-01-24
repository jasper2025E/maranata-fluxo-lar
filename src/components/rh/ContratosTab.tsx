import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFuncionarios, useContratos, useCreateContrato, Contrato } from "@/hooks/useRH";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Search, AlertCircle } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/formatters";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const tipoContratoLabels: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporário",
  estagio: "Estágio",
};

export function ContratosTab() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    funcionario_id: "",
    tipo: "clt" as const,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "",
    salario: 0,
    carga_horaria: 44,
    observacoes: "",
  });

  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: contratos, isLoading: loadingContratos } = useContratos();
  const createContrato = useCreateContrato();

  const filteredContratos = contratos?.filter(c =>
    c.funcionarios?.nome_completo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    await createContrato.mutateAsync({
      ...formData,
      data_fim: formData.data_fim || null,
      documento_url: null,
      ativo: true,
    });
    setIsDialogOpen(false);
    setFormData({
      funcionario_id: "",
      tipo: "clt",
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: "",
      salario: 0,
      carga_horaria: 44,
      observacoes: "",
    });
  };

  const getVencimentoStatus = (dataFim: string | null) => {
    if (!dataFim) return null;
    const dias = differenceInDays(parseISO(dataFim), new Date());
    if (dias < 0) return { label: "Vencido", variant: "destructive" as const };
    if (dias <= 30) return { label: `Vence em ${dias} dias`, variant: "warning" as const };
    return null;
  };

  if (loadingFuncionarios || loadingContratos) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label>Funcionário *</Label>
                <Select
                  value={formData.funcionario_id}
                  onValueChange={(v) => setFormData({ ...formData, funcionario_id: v })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Contrato *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="temporario">Temporário</SelectItem>
                      <SelectItem value="estagio">Estágio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Carga Horária (h/sem)</Label>
                  <Input
                    type="number"
                    value={formData.carga_horaria}
                    onChange={(e) => setFormData({ ...formData, carga_horaria: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início *</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Salário *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: Number(e.target.value) })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre o contrato"
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSubmit} disabled={createContrato.isPending || !formData.funcionario_id}>
                  Criar Contrato
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Card */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Lista de Contratos
          </CardTitle>
          <CardDescription>
            {filteredContratos?.length || 0} contrato(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredContratos?.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={FileText}
                title="Nenhum contrato encontrado"
                description="Cadastre o primeiro contrato de trabalho"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Funcionário</TableHead>
                  <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                  <TableHead className="font-semibold text-foreground">Início</TableHead>
                  <TableHead className="font-semibold text-foreground">Fim</TableHead>
                  <TableHead className="font-semibold text-foreground">Salário</TableHead>
                  <TableHead className="font-semibold text-foreground">Carga</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContratos?.map((contrato, index) => {
                  const vencimento = getVencimentoStatus(contrato.data_fim);
                  return (
                    <motion.tr
                      key={contrato.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {contrato.funcionarios?.nome_completo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {tipoContratoLabels[contrato.tipo]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(parseISO(contrato.data_inicio), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contrato.data_fim
                          ? format(parseISO(contrato.data_fim), "dd/MM/yyyy")
                          : "Indeterminado"}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(contrato.salario)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contrato.carga_horaria}h/sem
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium",
                              contrato.ativo 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {contrato.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          {vencimento && (
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-xs flex items-center gap-1",
                                vencimento.variant === "destructive" 
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              )}
                            >
                              <AlertCircle className="h-3 w-3" />
                              {vencimento.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
