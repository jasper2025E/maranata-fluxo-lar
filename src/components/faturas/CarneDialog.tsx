import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Printer, Loader2, FileText, User, Calendar, Zap, QrCode, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCarneCompacto } from "@/lib/carneCompactoGenerator";
import { Fatura, formatCurrency, meses } from "@/hooks/useFaturas";
import { useAsaas } from "@/hooks/useAsaas";
import { toast } from "sonner";
import { format } from "date-fns";

interface CarneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Responsavel {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
}

export function CarneDialog({ open, onOpenChange }: CarneDialogProps) {
  const [selectedResponsavel, setSelectedResponsavel] = useState<string>("");
  const [selectedFaturas, setSelectedFaturas] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const { createPayment } = useAsaas();

  // Buscar responsáveis
  const { data: responsaveis, isLoading: loadingResponsaveis } = useQuery({
    queryKey: ["responsaveis-carne"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("id, nome, cpf, telefone")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Responsavel[];
    },
    enabled: open,
  });

  // Buscar escola
  const { data: escola } = useQuery({
    queryKey: ["escola-carne"],
    queryFn: async () => {
      const { data } = await supabase.from("escola").select("*").limit(1).maybeSingle();
      return data;
    },
    enabled: open,
  });

  // Buscar alunos vinculados ao responsável
  const { data: alunosDoResponsavel } = useQuery({
    queryKey: ["alunos-responsavel-carne", selectedResponsavel],
    queryFn: async () => {
      if (!selectedResponsavel) return [];
      const { data, error } = await supabase
        .from("alunos")
        .select("id")
        .eq("responsavel_id", selectedResponsavel);
      if (error) throw error;
      return data.map(a => a.id);
    },
    enabled: !!selectedResponsavel,
  });

  // Buscar faturas do responsável ou dos alunos vinculados
  const { data: faturas, isLoading: loadingFaturas, refetch: refetchFaturas } = useQuery({
    queryKey: ["faturas-responsavel-carne", selectedResponsavel, alunosDoResponsavel],
    queryFn: async () => {
      if (!selectedResponsavel) return [];
      
      let query = supabase
        .from("faturas")
        .select(`
          *,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone, cpf)
        `)
        .neq("status", "Cancelada")
        .order("ano_referencia", { ascending: true })
        .order("mes_referencia", { ascending: true });
      
      if (alunosDoResponsavel && alunosDoResponsavel.length > 0) {
        query = query.or(`responsavel_id.eq.${selectedResponsavel},aluno_id.in.(${alunosDoResponsavel.join(",")})`);
      } else {
        query = query.eq("responsavel_id", selectedResponsavel);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Fatura[];
    },
    enabled: !!selectedResponsavel && alunosDoResponsavel !== undefined,
  });

  const handleSelectAll = () => {
    if (faturas && faturas.length > 0) {
      const allSelected = faturas.every(f => selectedFaturas.has(f.id));
      if (allSelected) {
        setSelectedFaturas(new Set());
      } else {
        const newSelected = new Set<string>();
        faturas.forEach(f => newSelected.add(f.id));
        setSelectedFaturas(newSelected);
      }
    }
  };

  const handleToggleFatura = (faturaId: string) => {
    const newSelected = new Set(selectedFaturas);
    if (newSelected.has(faturaId)) {
      newSelected.delete(faturaId);
    } else {
      newSelected.add(faturaId);
    }
    setSelectedFaturas(newSelected);
  };

  const handleGenerateCarne = async () => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }

    if (selectedFaturas.size === 0) {
      toast.error("Selecione ao menos uma fatura");
      return;
    }

    setIsGenerating(true);
    setProgressValue(0);
    setProgressMessage("");

    try {
      const faturasParaImprimir = faturas?.filter(f => selectedFaturas.has(f.id)) || [];
      const responsavel = responsaveis?.find(r => r.id === selectedResponsavel);

      // Gerar cobranças Asaas para faturas que ainda não têm
      const faturasAbertas = faturasParaImprimir.filter(
        f => f.status !== "Paga" && !f.asaas_payment_id
      );

      if (faturasAbertas.length > 0) {
        setProgressMessage(`Gerando ${faturasAbertas.length} cobranças Asaas...`);
        
        for (let i = 0; i < faturasAbertas.length; i++) {
          const fatura = faturasAbertas[i];
          setProgressMessage(`Gerando cobrança ${i + 1}/${faturasAbertas.length}: ${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`);
          setProgressValue(((i + 1) / faturasAbertas.length) * 50);

          try {
            await createPayment(fatura.id, "UNDEFINED");
          } catch (error) {
            console.warn(`Falha ao gerar cobrança para fatura ${fatura.id}:`, error);
          }
        }
      }

      // Buscar faturas atualizadas com dados do Asaas
      setProgressMessage("Buscando dados atualizados...");
      setProgressValue(60);
      await refetchFaturas();

      // Aguardar um momento para garantir que os dados estão atualizados
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Buscar faturas atualizadas novamente
      const { data: faturasAtualizadas } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone, cpf)
        `)
        .in("id", Array.from(selectedFaturas));

      setProgressMessage("Gerando carnê com QR Codes...");
      setProgressValue(80);

      await generateCarneCompacto(
        (faturasAtualizadas as Fatura[]) || faturasParaImprimir,
        escola,
        responsavel
      );

      setProgressValue(100);
      toast.success(`Carnê gerado com ${faturasParaImprimir.length} fatura(s)!`);
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao gerar carnê";
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setProgressMessage("");
      setProgressValue(0);
    }
  };

  const handleResponsavelChange = (value: string) => {
    setSelectedResponsavel(value);
    setSelectedFaturas(new Set());
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paga": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "vencida": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "aberta": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const faturasAbertasSemAsaas = faturas?.filter(
    f => selectedFaturas.has(f.id) && f.status !== "Paga" && !f.asaas_payment_id
  ).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Imprimir Carnê
          </DialogTitle>
          <DialogDescription>
            Gere um carnê com as mensalidades selecionadas (3 por página A4).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col overflow-auto">
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável Financeiro</Label>
            {loadingResponsaveis ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedResponsavel} onValueChange={handleResponsavelChange}>
                <SelectTrigger id="responsavel">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis?.map((resp) => (
                    <SelectItem key={resp.id} value={resp.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{resp.nome}</span>
                        {resp.cpf && (
                          <span className="text-xs text-muted-foreground">
                            ({resp.cpf})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Info QR Code PIX */}
          {faturasAbertasSemAsaas > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <QrCode className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong>{faturasAbertasSemAsaas}</strong> fatura(s) selecionada(s) terão QR Code PIX gerado automaticamente.
              </p>
            </div>
          )}

          {/* Lista de Faturas */}
          {selectedResponsavel && (
            <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                <span className="text-sm font-medium">
                  Faturas ({faturas?.length || 0})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {faturas?.every(f => selectedFaturas.has(f.id)) && faturas.length > 0 
                    ? "Desmarcar todas" 
                    : "Selecionar todas"}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[300px]">
                {loadingFaturas ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : faturas && faturas.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {faturas.map((fatura) => (
                      <div
                        key={fatura.id}
                        onClick={() => handleToggleFatura(fatura.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedFaturas.has(fatura.id)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <Checkbox
                          checked={selectedFaturas.has(fatura.id)}
                          onCheckedChange={() => handleToggleFatura(fatura.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {meses[fatura.mes_referencia - 1]} / {fatura.ano_referencia}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(fatura.status)}`}>
                              {fatura.status}
                            </Badge>
                            {fatura.asaas_payment_id && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Zap className="h-3 w-3" />
                                Asaas
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{fatura.alunos?.nome_completo}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Venc: {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-sm">
                          {formatCurrency(fatura.valor_total || fatura.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma fatura encontrada para este responsável</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {isGenerating && progressMessage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressMessage}</span>
                <span className="font-medium">{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateCarne}
            disabled={selectedFaturas.size === 0 || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            {isGenerating 
              ? "Gerando..." 
              : `Gerar Carnê (${selectedFaturas.size})`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
