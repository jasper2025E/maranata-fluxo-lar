import { useState } from "react";
import { useFuncionarios, useContratos, useCreateContrato, useUpdateContrato, Contrato } from "@/hooks/useRH";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { ptBR } from "date-fns/locale";

const tipoContratoLabels: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporário",
  estagio: "Estágio",
};

export function ContratosTab() {
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
    if (dias <= 30) return { label: `Vence em ${dias} dias`, variant: "secondary" as const };
    return null;
  };

  if (loadingFuncionarios || loadingContratos) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Funcionário *</Label>
                <Select
                  value={formData.funcionario_id}
                  onValueChange={(v) => setFormData({ ...formData, funcionario_id: v })}
                >
                  <SelectTrigger>
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
                <div>
                  <Label>Tipo de Contrato *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
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

                <div>
                  <Label>Carga Horária (h/sem)</Label>
                  <Input
                    type="number"
                    value={formData.carga_horaria}
                    onChange={(e) => setFormData({ ...formData, carga_horaria: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início *</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Salário *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre o contrato"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={createContrato.isPending || !formData.funcionario_id}>
                  Criar Contrato
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filteredContratos?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum contrato encontrado"
          description="Cadastre o primeiro contrato de trabalho"
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Carga Horária</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContratos?.map((contrato) => {
                const vencimento = getVencimentoStatus(contrato.data_fim);
                return (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">
                      {contrato.funcionarios?.nome_completo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tipoContratoLabels[contrato.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(contrato.data_inicio), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {contrato.data_fim
                        ? format(parseISO(contrato.data_fim), "dd/MM/yyyy")
                        : "Indeterminado"}
                    </TableCell>
                    <TableCell>{formatCurrency(contrato.salario)}</TableCell>
                    <TableCell>{contrato.carga_horaria}h/sem</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={contrato.ativo ? "default" : "secondary"}>
                          {contrato.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {vencimento && (
                          <Badge variant={vencimento.variant} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {vencimento.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
