import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  RefreshCw,
  Loader2,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  XCircle,
  Users,
  UserCheck,
} from "lucide-react";
import { format, addDays, setDate } from "date-fns";
import { formatCurrency, meses, queryKeys } from "@/hooks/useFaturas";
import { 
  createFaturaWithAsaasSync, 
  createMultipleFaturasWithAsaasSync,
  SyncProgress,
  FaturaCreateData,
} from "@/hooks/useFaturaAsaasSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AlunoWithCurso {
  id: string;
  nome_completo: string;
  responsavel_id: string | null;
  curso_id: string;
  curso?: {
    id: string;
    nome: string;
    mensalidade: number;
  } | null;
}

interface Responsavel {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  asaas_customer_id: string | null;
}

interface AlunoSelecionado {
  aluno: AlunoWithCurso;
  valor: number;
  desconto: number;
  valorFinal: number;
}

interface CreateFaturaConsolidadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFaturaConsolidadaDialog({ open, onOpenChange }: CreateFaturaConsolidadaDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Buscar tenant_id do perfil do usuário
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-tenant", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && open,
  });
  const tenantId = userProfile?.tenant_id || null;
  
  const [tipo, setTipo] = useState<"avulsa" | "recorrente">("avulsa");
  const [isCreating, setIsCreating] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [alunosSelecionados, setAlunosSelecionados] = useState<AlunoSelecionado[]>([]);
  
  const [config, setConfig] = useState({
    data_vencimento: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    mes_referencia: new Date().getMonth() + 1,
    ano_referencia: new Date().getFullYear(),
    meses_recorrencia: 12,
    dia_vencimento: 10,
  });

  // Buscar responsáveis
  const { data: responsaveis = [] } = useQuery({
    queryKey: ["responsaveis-consolidada", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("id, nome, cpf, email, asaas_customer_id")
        .order("nome");
      if (error) throw error;
      return data as Responsavel[];
    },
    enabled: open,
  });

  // Buscar alunos do responsável selecionado
  const { data: alunosDoResponsavel = [], isLoading: loadingAlunos } = useQuery({
    queryKey: ["alunos-responsavel", responsavelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id,
          nome_completo,
          responsavel_id,
          curso_id,
          curso:cursos(id, nome, mensalidade)
        `)
        .eq("responsavel_id", responsavelId)
        .eq("status_matricula", "ativo");
      if (error) throw error;
      return data as AlunoWithCurso[];
    },
    enabled: !!responsavelId,
  });

  const responsavelSelecionado = useMemo(() => 
    responsaveis.find(r => r.id === responsavelId),
    [responsaveis, responsavelId]
  );

  // Validar CPF do responsável
  const responsavelStatus = useMemo((): { type: "success" | "warning" | "error"; message: string } | null => {
    if (!responsavelSelecionado) return null;
    
    const cpf = responsavelSelecionado.cpf?.replace(/\D/g, '') || '';
    if (!cpf) return { type: "error", message: `Responsável sem CPF cadastrado. Cadastre o CPF antes de criar faturas.` };
    if (cpf.length !== 11 && cpf.length !== 14) return { type: "error", message: `CPF/CNPJ inválido (${cpf.length} dígitos).` };
    
    return { 
      type: "success", 
      message: `${responsavelSelecionado.nome}${responsavelSelecionado.asaas_customer_id ? ' ✓ Cadastrado no gateway' : ''}` 
    };
  }, [responsavelSelecionado]);

  const handleResponsavelChange = (id: string) => {
    setResponsavelId(id);
    setAlunosSelecionados([]);
  };

  const handleToggleAluno = (aluno: AlunoWithCurso, checked: boolean) => {
    if (checked) {
      const mensalidade = aluno.curso?.mensalidade || 0;
      setAlunosSelecionados(prev => [...prev, {
        aluno,
        valor: mensalidade,
        desconto: 0,
        valorFinal: mensalidade,
      }]);
    } else {
      setAlunosSelecionados(prev => prev.filter(a => a.aluno.id !== aluno.id));
    }
  };

  const handleValorChange = (alunoId: string, valor: number) => {
    setAlunosSelecionados(prev => prev.map(item => {
      if (item.aluno.id === alunoId) {
        const valorFinal = Math.max(0, valor - item.desconto);
        return { ...item, valor, valorFinal };
      }
      return item;
    }));
  };

  const handleDescontoChange = (alunoId: string, desconto: number) => {
    setAlunosSelecionados(prev => prev.map(item => {
      if (item.aluno.id === alunoId) {
        const valorFinal = Math.max(0, item.valor - desconto);
        return { ...item, desconto, valorFinal };
      }
      return item;
    }));
  };

  const valorTotal = useMemo(() => 
    alunosSelecionados.reduce((sum, item) => sum + item.valorFinal, 0),
    [alunosSelecionados]
  );

  const canCreate = useMemo(() => {
    return responsavelStatus?.type === "success" && 
           alunosSelecionados.length > 0 && 
           valorTotal > 0;
  }, [responsavelStatus, alunosSelecionados, valorTotal]);

  const handleCreate = async () => {
    if (!canCreate || !responsavelSelecionado) return;

    const primeiroAluno = alunosSelecionados[0];
    
    setIsCreating(true);
    setSyncProgress(null);

    try {
      if (tipo === "recorrente") {
        const dataList: FaturaCreateData[] = [];
        
        for (let i = 0; i < config.meses_recorrencia; i++) {
          const baseDate = new Date(config.ano_referencia, config.mes_referencia - 1 + i, 1);
          const vencimento = setDate(baseDate, config.dia_vencimento);
          
          dataList.push({
            aluno_id: primeiroAluno.aluno.id,
            curso_id: primeiroAluno.aluno.curso_id,
            responsavel_id: responsavelId,
            valor: valorTotal,
            data_vencimento: format(vencimento, "yyyy-MM-dd"),
            mes_referencia: vencimento.getMonth() + 1,
            ano_referencia: vencimento.getFullYear(),
          });
        }

        const result = await createMultipleFaturasWithAsaasSync(dataList, setSyncProgress);
        
        if (result.failedAt) {
          toast.error(`Erro na fatura ${result.failedAt}: ${result.error}`);
        } else {
          if (result.createdIds && result.createdIds.length > 0) {
            await saveAlunosDetails(result.createdIds);
          }
          toast.success(`${result.successCount} faturas consolidadas criadas!`);
          onOpenChange(false);
          resetForm();
        }
      } else {
        const result = await createFaturaWithAsaasSync({
          aluno_id: primeiroAluno.aluno.id,
          curso_id: primeiroAluno.aluno.curso_id,
          responsavel_id: responsavelId,
          valor: valorTotal,
          data_vencimento: config.data_vencimento,
          mes_referencia: config.mes_referencia,
          ano_referencia: config.ano_referencia,
        }, setSyncProgress);

        if (result.success && result.faturaId) {
          await saveAlunosDetails([result.faturaId]);
          
          await supabase
            .from("faturas")
            .update({ consolidada: true })
            .eq("id", result.faturaId);
          
          toast.success("Fatura consolidada criada!");
          onOpenChange(false);
          resetForm();
        } else {
          toast.error(result.error || "Erro ao criar fatura");
        }
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
    } catch (error: any) {
      toast.error(error.message || "Erro inesperado");
    } finally {
      setIsCreating(false);
      setSyncProgress(null);
    }
  };

  const saveAlunosDetails = async (faturaIds: string[]) => {
    const insertData = faturaIds.flatMap(faturaId => 
      alunosSelecionados.map(item => ({
        fatura_id: faturaId,
        aluno_id: item.aluno.id,
        curso_id: item.aluno.curso_id,
        valor_unitario: item.valor,
        desconto_valor: item.desconto,
        valor_final: item.valorFinal,
        descricao: item.aluno.curso?.nome || "Mensalidade",
        tenant_id: tenantId,
      }))
    );

    const { error } = await supabase
      .from("fatura_alunos")
      .insert(insertData);

    if (error) {
      console.error("Erro ao salvar detalhes dos alunos:", error);
    }
  };

  const resetForm = () => {
    setTipo("avulsa");
    setSyncProgress(null);
    setResponsavelId("");
    setAlunosSelecionados([]);
    setConfig({
      data_vencimento: format(addDays(new Date(), 10), "yyyy-MM-dd"),
      mes_referencia: new Date().getMonth() + 1,
      ano_referencia: new Date().getFullYear(),
      meses_recorrencia: 12,
      dia_vencimento: 10,
    });
  };

  const diasDoMes = Array.from({ length: 28 }, (_, i) => i + 1);

  const getProgressIcon = () => {
    if (!syncProgress) return null;
    if (syncProgress.step === 'done') return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (syncProgress.step === 'error') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Loader2 className="h-4 w-4 animate-spin" />;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isCreating) { onOpenChange(o); if (!o) resetForm(); } }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Fatura Consolidada
          </DialogTitle>
          <DialogDescription>
            Combine múltiplos alunos do mesmo responsável em uma única fatura
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {isCreating && syncProgress && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {getProgressIcon()}
                <span className="text-sm font-medium">{syncProgress.message}</span>
              </div>
              <Progress value={syncProgress.progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Tipo de Fatura */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipo === "avulsa" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTipo("avulsa")}
              disabled={isCreating}
            >
              <FileText className="h-4 w-4 mr-2" />
              Avulsa
            </Button>
            <Button
              type="button"
              variant={tipo === "recorrente" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setTipo("recorrente")}
              disabled={isCreating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recorrente
            </Button>
          </div>

          {/* Seleção de Responsável */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Responsável Financeiro *
            </Label>
            <Select value={responsavelId} onValueChange={handleResponsavelChange} disabled={isCreating}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}
                    {r.cpf && <span className="text-muted-foreground ml-2">({r.cpf})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status do Responsável */}
          {responsavelSelecionado && responsavelStatus && (
            <Alert 
              variant={responsavelStatus.type === "error" ? "destructive" : "default"}
              className={responsavelStatus.type === "success" ? "border-success/50 bg-success/10" : ""}
            >
              {responsavelStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>{responsavelStatus.message}</AlertDescription>
            </Alert>
          )}

          {/* Lista de Alunos do Responsável */}
          {responsavelId && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Alunos Vinculados
                {alunosSelecionados.length > 0 && (
                  <Badge variant="secondary">{alunosSelecionados.length} selecionado(s)</Badge>
                )}
              </Label>
              
              {loadingAlunos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : alunosDoResponsavel.length === 0 ? (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum aluno ativo vinculado a este responsável.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[200px] rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead className="text-right w-28">Valor</TableHead>
                        <TableHead className="text-right w-28">Desconto</TableHead>
                        <TableHead className="text-right w-28">Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alunosDoResponsavel.map((aluno) => {
                        const isSelected = alunosSelecionados.some(a => a.aluno.id === aluno.id);
                        const itemData = alunosSelecionados.find(a => a.aluno.id === aluno.id);
                        
                        return (
                          <TableRow key={aluno.id} className={isSelected ? "bg-primary/5" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleToggleAluno(aluno, !!checked)}
                                disabled={isCreating}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {aluno.curso?.nome || "—"}
                            </TableCell>
                            <TableCell>
                              {isSelected ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={itemData?.valor || ""}
                                  onChange={(e) => handleValorChange(aluno.id, parseFloat(e.target.value) || 0)}
                                  className="h-8 text-right w-24"
                                  disabled={isCreating}
                                />
                              ) : (
                                <span className="text-muted-foreground text-right block">
                                  {formatCurrency(aluno.curso?.mensalidade || 0)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isSelected ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={itemData?.desconto || ""}
                                  onChange={(e) => handleDescontoChange(aluno.id, parseFloat(e.target.value) || 0)}
                                  className="h-8 text-right w-24"
                                  disabled={isCreating}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {isSelected ? formatCurrency(itemData?.valorFinal || 0) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Configuração de Data/Vencimento */}
          {alunosSelecionados.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês de Referência</Label>
                  <Select 
                    value={String(config.mes_referencia)} 
                    onValueChange={(v) => setConfig({ ...config, mes_referencia: parseInt(v) })} 
                    disabled={isCreating}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {meses.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano de Referência</Label>
                  <Select 
                    value={String(config.ano_referencia)} 
                    onValueChange={(v) => setConfig({ ...config, ano_referencia: parseInt(v) })} 
                    disabled={isCreating}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tipo === "avulsa" ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Vencimento
                  </Label>
                  <Input
                    type="date"
                    value={config.data_vencimento}
                    onChange={(e) => setConfig({ ...config, data_vencimento: e.target.value })}
                    disabled={isCreating}
                  />
                </div>
              ) : (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      Configuração Recorrente
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dia de Vencimento</Label>
                        <Select 
                          value={String(config.dia_vencimento)} 
                          onValueChange={(v) => setConfig({ ...config, dia_vencimento: parseInt(v) })}
                          disabled={isCreating}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {diasDoMes.map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade de Meses</Label>
                        <Select 
                          value={String(config.meses_recorrencia)} 
                          onValueChange={(v) => setConfig({ ...config, meses_recorrencia: parseInt(v) })} 
                          disabled={isCreating}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'mês' : 'meses'}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Resumo */}
          {alunosSelecionados.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>{alunosSelecionados.length}</strong> aluno(s) na fatura consolidada:
                  </p>
                  <ul className="text-sm space-y-1">
                    {alunosSelecionados.map(item => (
                      <li key={item.aluno.id} className="flex justify-between">
                        <span>{item.aluno.nome_completo}</span>
                        <span className="font-medium">{formatCurrency(item.valorFinal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(valorTotal)}</span>
                  </div>
                  {tipo === "recorrente" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {config.meses_recorrencia} faturas de {formatCurrency(valorTotal)} serão criadas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={isCreating}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !canCreate}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isCreating 
              ? (syncProgress?.message?.slice(0, 25) || "Processando...") 
              : `Criar Fatura Consolidada`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
