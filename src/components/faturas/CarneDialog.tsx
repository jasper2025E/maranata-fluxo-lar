import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Printer, Loader2, FileText, User, Calendar, 
  QrCode, Search, CheckCircle2, ChevronRight,
  CreditCard, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCarneCompacto } from "@/lib/carneCompactoGenerator";
import { waitForAsaasBoletoReady } from "@/lib/asaasBoleto";
import { Fatura, formatCurrency, meses } from "@/hooks/useFaturas";
import { useAsaas } from "@/hooks/useAsaas";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [searchTerm, setSearchTerm] = useState("");
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

  // Buscar escola do tenant atual
  const { data: escola } = useQuery({
    queryKey: ["escola-carne"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.tenant_id) return null;
      
      const { data } = await supabase
        .from("escola")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();
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

  // Filtrar responsáveis por busca
  const filteredResponsaveis = useMemo(() => {
    if (!responsaveis) return [];
    if (!searchTerm) return responsaveis;
    const term = searchTerm.toLowerCase();
    return responsaveis.filter(r => 
      r.nome.toLowerCase().includes(term) ||
      r.cpf?.includes(term)
    );
  }, [responsaveis, searchTerm]);

  const selectedResponsavelData = responsaveis?.find(r => r.id === selectedResponsavel);

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

      // Verificar faturas abertas sem dados ASAAS e bloquear
      const faturasSemAsaas = faturasParaImprimir.filter(
        f => f.status !== "Paga" && !f.asaas_payment_id
      );

      if (faturasSemAsaas.length > 0) {
        toast.error(`${faturasSemAsaas.length} fatura(s) não têm cobrança ASAAS. Crie as faturas via "Nova Fatura" para sincronizar.`);
        setIsGenerating(false);
        return;
      }

      // Recriar cobranças inválidas (billingType UNDEFINED) e garantir dados completos
      const faturasToRecreate = faturasParaImprimir.filter(
        f => f.status !== "Paga" && !!f.asaas_payment_id && f.asaas_billing_type === "UNDEFINED"
      );

      if (faturasToRecreate.length > 0) {
        setProgressMessage(`Recriando boletos inválidos...`);

        for (let i = 0; i < faturasToRecreate.length; i++) {
          const fatura = faturasToRecreate[i];
          setProgressMessage(`Recriando ${i + 1}/${faturasToRecreate.length}`);
          setProgressValue(((i + 1) / faturasToRecreate.length) * 35);

          try {
            // Usa a nova função que apenas deleta no Asaas sem mudar status local
            await supabase.functions.invoke("asaas-delete-remote-payment", {
              body: { faturaId: fatura.id },
            });
          } catch (err) {
            console.warn(`Falha ao deletar cobrança remota para fatura ${fatura.id}:`, err);
          }

          try {
            await createPayment(fatura.id, "BOLETO");
          } catch (error) {
            console.warn(`Falha ao recriar cobrança para fatura ${fatura.id}:`, error);
          }
        }
      }

      // Gerar cobranças Asaas para faturas que ainda não têm dados completos
      const faturasAbertas = faturasParaImprimir.filter(
        f =>
          f.status !== "Paga" &&
          (!f.asaas_pix_qrcode || !f.asaas_boleto_barcode || !f.asaas_boleto_bar_code)
      );

      if (faturasAbertas.length > 0) {
        setProgressMessage(`Gerando cobranças...`);
        
        for (let i = 0; i < faturasAbertas.length; i++) {
          const fatura = faturasAbertas[i];
          setProgressMessage(`Cobrança ${i + 1}/${faturasAbertas.length}`);
          setProgressValue(((i + 1) / faturasAbertas.length) * 50);

          try {
            await createPayment(fatura.id, "BOLETO");
          } catch (error) {
            console.warn(`Falha ao gerar cobrança para fatura ${fatura.id}:`, error);
          }
        }
      }

      setProgressMessage("Atualizando dados...");
      setProgressValue(55);
      await refetchFaturas();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar dados atualizados das faturas
      const { data: faturasAtualizadas } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos(nome_completo, email_responsavel, responsavel_id),
          cursos(nome),
          responsaveis(nome, email, telefone, cpf)
        `)
        .in("id", Array.from(selectedFaturas));

      // Verificar faturas que têm asaas_payment_id mas não têm QR Code/barcode
      setProgressMessage("Verificando dados de pagamento...");
      setProgressValue(65);
      
      const faturasIncompletas = (faturasAtualizadas || []).filter(
        f =>
          f.asaas_payment_id &&
          (!f.asaas_pix_qrcode || !f.asaas_boleto_barcode || !f.asaas_boleto_bar_code)
      );

      if (faturasIncompletas.length > 0) {
        for (let i = 0; i < faturasIncompletas.length; i++) {
          const fatura = faturasIncompletas[i];
          setProgressValue(65 + ((i + 1) / faturasIncompletas.length) * 10);

          const result = await waitForAsaasBoletoReady(fatura.id, {
            onProgress: (p) => setProgressMessage(p.message),
          });

          if (!result.success) {
            throw new Error(result.error || "Não foi possível sincronizar o boleto (código de barras/linha digitável)."
            );
          }
        }
        
        // Buscar novamente com dados atualizados
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: faturasFinais } = await supabase
          .from("faturas")
          .select(`
            *,
            alunos(nome_completo, email_responsavel, responsavel_id),
            cursos(nome),
            responsaveis(nome, email, telefone, cpf)
          `)
          .in("id", Array.from(selectedFaturas));
        
        if (faturasFinais) {
          (faturasAtualizadas as Fatura[]).length = 0;
          (faturasAtualizadas as Fatura[]).push(...(faturasFinais as Fatura[]));
        }
      }

      setProgressMessage("Gerando PDF...");
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

  const handleResponsavelChange = (id: string) => {
    setSelectedResponsavel(id);
    setSelectedFaturas(new Set());
  };

  const handleBack = () => {
    setSelectedResponsavel("");
    setSelectedFaturas(new Set());
    setSearchTerm("");
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "paga": return { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Paga" };
      case "vencida": return { color: "bg-red-500/10 text-red-600 dark:text-red-400", label: "Vencida" };
      case "aberta": return { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Aberta" };
      default: return { color: "bg-muted text-muted-foreground", label: status };
    }
  };

  const totalSelecionado = useMemo(() => {
    if (!faturas) return 0;
    return faturas
      .filter(f => selectedFaturas.has(f.id))
      .reduce((acc, f) => acc + (f.valor_total || f.valor), 0);
  }, [faturas, selectedFaturas]);

  const faturasAbertasSemAsaas = faturas?.filter(
    f => selectedFaturas.has(f.id) && f.status !== "Paga" && !f.asaas_payment_id
  ).length || 0;

  // Step 1: Seleção de Responsável
  if (!selectedResponsavel) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Printer className="h-4 w-4 text-primary" />
              </div>
              Imprimir Carnê
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Lista de Responsáveis */}
            <ScrollArea className="h-[320px] -mx-1 px-1">
              {loadingResponsaveis ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredResponsaveis.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredResponsaveis.map((resp) => (
                    <button
                      key={resp.id}
                      onClick={() => handleResponsavelChange(resp.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                        "hover:bg-muted/80 border border-transparent hover:border-border",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20"
                      )}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resp.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {resp.cpf || resp.telefone}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum responsável encontrado</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: Seleção de Faturas
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header com info do responsável */}
        <div className="px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              disabled={isGenerating}
              className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{selectedResponsavelData?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {selectedResponsavelData?.cpf || selectedResponsavelData?.telefone}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Faturas */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Header da lista */}
          <div className="px-5 py-3 border-b flex items-center justify-between bg-background sticky top-0 z-10">
            <span className="text-sm text-muted-foreground">
              {faturas?.length || 0} faturas disponíveis
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-7 px-2"
              disabled={!faturas?.length}
            >
              {faturas?.every(f => selectedFaturas.has(f.id)) && (faturas?.length ?? 0) > 0 
                ? "Desmarcar" 
                : "Selecionar tudo"}
            </Button>
          </div>

          {/* Lista scrollável */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              {loadingFaturas ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : faturas && faturas.length > 0 ? (
                <div className="space-y-1.5">
                  {faturas.map((fatura) => {
                    const isSelected = selectedFaturas.has(fatura.id);
                    const statusConfig = getStatusConfig(fatura.status);
                    
                    return (
                      <div
                        key={fatura.id}
                        onClick={() => handleToggleFatura(fatura.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                          isSelected
                            ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                            : "hover:bg-muted/50 border-transparent hover:border-border"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                          isSelected 
                            ? "bg-primary border-primary" 
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm">
                              {meses[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                            </span>
                            <Badge className={cn("text-[10px] px-1.5 py-0", statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                            {fatura.asaas_payment_id && (
                              <QrCode className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">{fatura.alunos?.nome_completo}</span>
                            <span>•</span>
                            <span className="shrink-0">
                              {format(new Date(fatura.data_vencimento), "dd/MM")}
                            </span>
                          </div>
                        </div>
                        
                        <span className={cn(
                          "font-semibold text-sm tabular-nums shrink-0",
                          isSelected && "text-primary"
                        )}>
                          {formatCurrency(fatura.valor_total || fatura.valor)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhuma fatura encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer fixo */}
        <div className="border-t bg-background p-4 space-y-3">
          {/* Info cobranças automáticas */}
          {faturasAbertasSemAsaas > 0 && !isGenerating && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {faturasAbertasSemAsaas} fatura(s) receberão QR Code PIX
              </span>
            </div>
          )}

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progressMessage}</span>
                <span className="font-medium">{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>
          )}

          {/* Resumo e botão */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {selectedFaturas.size > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedFaturas.size}</span>
                    <span className="text-xs text-muted-foreground">selecionada(s)</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(totalSelecionado)}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Selecione as faturas</span>
              )}
            </div>
            
            <Button
              onClick={handleGenerateCarne}
              disabled={selectedFaturas.size === 0 || isGenerating}
              size="sm"
              className="gap-2 shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {isGenerating ? "Gerando..." : "Gerar Carnê"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
