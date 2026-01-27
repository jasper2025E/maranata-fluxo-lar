import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, 
  Ban, 
  Printer, 
  QrCode, 
  Loader2,
  Download,
  Link,
  ChevronDown,
  Mail,
  Pencil,
  SplitSquareVertical,
  Calendar,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generateCarneCompacto } from "@/lib/carneCompactoGenerator";
import { generateFaturaPDF } from "@/lib/pdfGenerator";
import { Fatura, formatCurrency, useCancelarFatura } from "@/hooks/useFaturas";
import { useAsaas } from "@/hooks/useAsaas";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  faturas: Fatura[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionsBar({ 
  selectedIds, 
  faturas, 
  onClearSelection,
  onActionComplete 
}: BulkActionsBarProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  
  // Edit dialog state
  const [editData, setEditData] = useState({
    novaDataVencimento: "",
    novoDiaVencimento: "",
  });
  
  const { createPayment } = useAsaas();
  const cancelMutation = useCancelarFatura();

  // Buscar escola do tenant atual para geração do carnê
  const { data: escola } = useQuery({
    queryKey: ["escola-bulk"],
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
  });

  const selectedFaturas = faturas.filter(f => selectedIds.has(f.id));
  const selectedCount = selectedIds.size;
  
  const pendingCount = selectedFaturas.filter(
    f => f.status === "Aberta" || f.status === "Vencida"
  ).length;
  
  const totalValue = selectedFaturas.reduce((sum, f) => sum + (f.valor || 0), 0);

  if (selectedCount === 0) return null;

  const handleBulkCancel = async () => {
    if (!cancelMotivo.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    const pendingFaturas = selectedFaturas.filter(
      f => f.status === "Aberta" || f.status === "Vencida"
    );

    if (pendingFaturas.length === 0) {
      toast.error("Nenhuma fatura pendente selecionada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let cancelled = 0;

    try {
      for (const fatura of pendingFaturas) {
        setProgressMessage(`Cancelando ${cancelled + 1} de ${pendingFaturas.length}...`);
        
        await cancelMutation.mutateAsync({ 
          id: fatura.id, 
          motivo: cancelMotivo.trim() 
        });
        
        cancelled++;
        setProgressValue((cancelled / pendingFaturas.length) * 100);
      }

      toast.success(`${cancelled} fatura(s) cancelada(s) com sucesso!`);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      toast.error("Erro ao cancelar algumas faturas");
    } finally {
      setIsProcessing(false);
      setIsCancelDialogOpen(false);
      setCancelMotivo("");
      setProgressMessage("");
    }
  };

  const handleGenerateCarne = async () => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }

    const pendingFaturas = selectedFaturas.filter(
      f => f.status !== "Cancelada"
    );

    if (pendingFaturas.length === 0) {
      toast.error("Nenhuma fatura válida selecionada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;

    try {
      // Primeiro, criar cobranças Asaas para faturas que não têm
      const faturasWithoutAsaas = pendingFaturas.filter(
        f => !f.asaas_payment_id && (f.status === "Aberta" || f.status === "Vencida")
      );

      if (faturasWithoutAsaas.length > 0) {
        setProgressMessage(`Gerando cobranças Asaas (0/${faturasWithoutAsaas.length})...`);
        
        for (const fatura of faturasWithoutAsaas) {
          try {
            await createPayment(fatura.id, "UNDEFINED");
          } catch (err) {
            console.warn(`Erro ao criar cobrança para fatura ${fatura.id}:`, err);
          }
          processed++;
          setProgressMessage(`Gerando cobranças Asaas (${processed}/${faturasWithoutAsaas.length})...`);
          setProgressValue((processed / (faturasWithoutAsaas.length + 1)) * 50);
        }
      }

      // Buscar faturas atualizadas com dados do Asaas
      setProgressMessage("Buscando dados atualizados...");
      const { data: updatedFaturas } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos:aluno_id (nome_completo, email_responsavel, responsavel_id),
          cursos:curso_id (nome),
          responsaveis:responsavel_id (nome, cpf, telefone)
        `)
        .in("id", pendingFaturas.map(f => f.id));

      if (!updatedFaturas || updatedFaturas.length === 0) {
        throw new Error("Não foi possível buscar faturas atualizadas");
      }

      setProgressMessage("Gerando PDF do carnê...");
      setProgressValue(90);

      await generateCarneCompacto(
        updatedFaturas as unknown as Fatura[],
        {
          nome: escola.nome,
          endereco: escola.endereco || "",
          telefone: escola.telefone || "",
          email: escola.email || "",
          cnpj: escola.cnpj || "",
          logo_url: escola.logo_url || undefined,
        }
      );

      setProgressValue(100);
      toast.success(`Carnê gerado com ${updatedFaturas.length} fatura(s)!`);
      onClearSelection();
    } catch (error: any) {
      console.error("Erro ao gerar carnê:", error);
      toast.error(error.message || "Erro ao gerar carnê");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleGenerateAsaas = async () => {
    const faturasWithoutAsaas = selectedFaturas.filter(
      f => !f.asaas_payment_id && (f.status === "Aberta" || f.status === "Vencida")
    );

    if (faturasWithoutAsaas.length === 0) {
      toast.info("Todas as faturas selecionadas já têm cobrança Asaas");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;
    let success = 0;

    try {
      for (const fatura of faturasWithoutAsaas) {
        setProgressMessage(`Gerando cobrança ${processed + 1} de ${faturasWithoutAsaas.length}...`);
        
        try {
          await createPayment(fatura.id, "UNDEFINED");
          success++;
        } catch (err) {
          console.warn(`Erro na fatura ${fatura.id}:`, err);
        }
        
        processed++;
        setProgressValue((processed / faturasWithoutAsaas.length) * 100);
      }

      toast.success(`${success} cobrança(s) Asaas gerada(s)!`);
      onActionComplete();
    } catch (error) {
      toast.error("Erro ao gerar cobranças");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleBulkDownloadPDF = async () => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }

    const validFaturas = selectedFaturas.filter(f => f.status !== "Cancelada");
    if (validFaturas.length === 0) {
      toast.error("Nenhuma fatura válida selecionada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;

    try {
      for (const fatura of validFaturas) {
        setProgressMessage(`Gerando PDF ${processed + 1} de ${validFaturas.length}...`);
        
        const { data: itens } = await supabase
          .from("fatura_itens")
          .select("*")
          .eq("fatura_id", fatura.id)
          .order("ordem");
        
        await generateFaturaPDF(fatura, escola, itens || undefined);
        
        processed++;
        setProgressValue((processed / validFaturas.length) * 100);
      }

      toast.success(`${processed} PDF(s) gerado(s)!`);
    } catch (error: any) {
      console.error("Erro ao gerar PDFs:", error);
      toast.error(error.message || "Erro ao gerar PDFs");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleBulkGenerateStripeLinks = async () => {
    const faturasWithoutStripe = selectedFaturas.filter(
      f => !f.payment_url && (f.status === "Aberta" || f.status === "Vencida")
    );

    if (faturasWithoutStripe.length === 0) {
      toast.info("Todas as faturas selecionadas já têm link Stripe ou estão pagas/canceladas");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;
    let success = 0;

    try {
      for (const fatura of faturasWithoutStripe) {
        setProgressMessage(`Gerando link ${processed + 1} de ${faturasWithoutStripe.length}...`);
        
        try {
          const { error } = await supabase.functions.invoke("create-subscription-checkout", {
            body: { faturaId: fatura.id },
          });
          if (!error) success++;
        } catch (err) {
          console.warn(`Erro na fatura ${fatura.id}:`, err);
        }
        
        processed++;
        setProgressValue((processed / faturasWithoutStripe.length) * 100);
      }

      toast.success(`${success} link(s) Stripe gerado(s)!`);
      onActionComplete();
    } catch (error) {
      toast.error("Erro ao gerar links");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleBulkSendReceipts = async () => {
    const paidFaturas = selectedFaturas.filter(f => f.status === "Paga");
    
    if (paidFaturas.length === 0) {
      toast.error("Selecione faturas pagas para enviar recibos");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;
    let success = 0;

    try {
      for (const fatura of paidFaturas) {
        setProgressMessage(`Enviando recibo ${processed + 1} de ${paidFaturas.length}...`);
        
        try {
          const { error } = await supabase.functions.invoke("send-receipt-email", {
            body: { faturaId: fatura.id },
          });
          if (!error) success++;
        } catch (err) {
          console.warn(`Erro na fatura ${fatura.id}:`, err);
        }
        
        processed++;
        setProgressValue((processed / paidFaturas.length) * 100);
      }

      toast.success(`${success} recibo(s) enviado(s)!`);
    } catch (error) {
      toast.error("Erro ao enviar recibos");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleBulkEditVencimento = async () => {
    if (!editData.novaDataVencimento && !editData.novoDiaVencimento) {
      toast.error("Selecione uma data ou dia de vencimento");
      return;
    }

    const editableFaturas = selectedFaturas.filter(
      f => f.status === "Aberta" || f.status === "Vencida"
    );

    if (editableFaturas.length === 0) {
      toast.error("Nenhuma fatura pendente selecionada para editar");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;
    let success = 0;

    try {
      for (const fatura of editableFaturas) {
        setProgressMessage(`Editando ${processed + 1} de ${editableFaturas.length}...`);
        
        let novaData = editData.novaDataVencimento;
        
        // Se escolheu dia fixo, calcular a data baseada no mês/ano da fatura
        if (editData.novoDiaVencimento && !editData.novaDataVencimento) {
          const dia = parseInt(editData.novoDiaVencimento);
          const ano = fatura.ano_referencia;
          const mes = fatura.mes_referencia - 1; // 0-indexed
          novaData = new Date(ano, mes, dia).toISOString().split('T')[0];
        }
        
        if (novaData) {
          const { error } = await supabase
            .from("faturas")
            .update({ data_vencimento: novaData, updated_at: new Date().toISOString() })
            .eq("id", fatura.id);
          
          if (!error) {
            success++;
            
            // Se tem cobrança Asaas, atualizar a data
            if (fatura.asaas_payment_id) {
              try {
                await supabase.functions.invoke("asaas-update-payment", {
                  body: { faturaId: fatura.id },
                });
              } catch (err) {
                console.warn("Erro ao atualizar Asaas:", err);
              }
            }
          }
        }
        
        processed++;
        setProgressValue((processed / editableFaturas.length) * 100);
      }

      toast.success(`${success} fatura(s) atualizada(s)!`);
      onActionComplete();
      setIsEditDialogOpen(false);
      setEditData({ novaDataVencimento: "", novoDiaVencimento: "" });
    } catch (error) {
      toast.error("Erro ao editar faturas");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleBulkParcelar = async () => {
    toast.info("Para parcelar faturas individualmente, use o menu de ações na tabela.");
    // Parcelamento em lote é complexo pois cada fatura pode ter valores diferentes
    // Direcionamos para edição individual
  };

  const paidCount = selectedFaturas.filter(f => f.status === "Paga").length;
  const editableCount = selectedFaturas.filter(f => f.status === "Aberta" || f.status === "Vencida").length;

  return (
    <>
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-primary/5 border-2 border-primary/20 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
            {selectedCount}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {selectedCount} fatura{selectedCount !== 1 && "s"} selecionada{selectedCount !== 1 && "s"}
            </span>
            <span className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalValue)} • {pendingCount} pendente{pendingCount !== 1 && "s"}
            </span>
          </div>
        </div>

        {isProcessing ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div className="flex-1 sm:flex-none sm:w-48">
              <span className="text-sm text-muted-foreground block mb-1">{progressMessage}</span>
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Dropdown Menu with all actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="h-9 gap-2">
                  Ações em Lote
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background">
                {/* Edição */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Edição
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setIsEditDialogOpen(true)}
                  disabled={editableCount === 0}
                  className="gap-2 cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  Editar Vencimento
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleBulkParcelar}
                  disabled={editableCount === 0}
                  className="gap-2 cursor-pointer"
                >
                  <SplitSquareVertical className="h-4 w-4" />
                  Parcelar
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Documentos
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleBulkDownloadPDF} className="gap-2 cursor-pointer">
                  <Download className="h-4 w-4" />
                  Baixar PDFs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGenerateCarne} className="gap-2 cursor-pointer">
                  <Printer className="h-4 w-4" />
                  Gerar Carnê
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Cobranças
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={handleGenerateAsaas} 
                  disabled={pendingCount === 0}
                  className="gap-2 cursor-pointer text-success"
                >
                  <QrCode className="h-4 w-4" />
                  Gerar PIX/Boleto
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleBulkGenerateStripeLinks}
                  disabled={pendingCount === 0}
                  className="gap-2 cursor-pointer"
                >
                  <Link className="h-4 w-4" />
                  Gerar Links Stripe
                </DropdownMenuItem>

                {paidCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      Recibos ({paidCount} paga{paidCount !== 1 && "s"})
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleBulkSendReceipts} className="gap-2 cursor-pointer">
                      <Mail className="h-4 w-4" />
                      Enviar Recibos por Email
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsCancelDialogOpen(true)}
                  disabled={pendingCount === 0}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Ban className="h-4 w-4" />
                  Cancelar Faturas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-background"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar {pendingCount} fatura(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As faturas selecionadas serão 
              marcadas como canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do cancelamento</Label>
            <Input
              id="motivo"
              placeholder="Informe o motivo..."
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancel}
              disabled={isProcessing || !cancelMotivo.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar {editableCount} fatura(s)
            </AlertDialogTitle>
            <AlertDialogDescription>
              Altere a data de vencimento das faturas selecionadas. 
              Escolha uma data específica ou um dia fixo do mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaData" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Nova Data de Vencimento
              </Label>
              <Input
                id="novaData"
                type="date"
                value={editData.novaDataVencimento}
                onChange={(e) => setEditData({ ...editData, novaDataVencimento: e.target.value, novoDiaVencimento: "" })}
              />
              <p className="text-xs text-muted-foreground">
                Aplica a mesma data para todas as faturas selecionadas
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novoDia">Dia Fixo de Vencimento</Label>
              <Select 
                value={editData.novoDiaVencimento} 
                onValueChange={(v) => setEditData({ ...editData, novoDiaVencimento: v, novaDataVencimento: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                    <SelectItem key={dia} value={String(dia)}>
                      Dia {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ajusta o dia mantendo o mês/ano de referência de cada fatura
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isProcessing}
              onClick={() => setEditData({ novaDataVencimento: "", novoDiaVencimento: "" })}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkEditVencimento}
              disabled={isProcessing || (!editData.novaDataVencimento && !editData.novoDiaVencimento)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Aplicar Alterações"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
