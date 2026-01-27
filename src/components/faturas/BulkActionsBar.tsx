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
  Calendar,
  DollarSign,
  FileText,
  Percent,
  CreditCard,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generateCarneCompacto } from "@/lib/carneCompactoGenerator";
import { generateFaturaPDF } from "@/lib/pdfGenerator";
import { Fatura, formatCurrency, useCancelarFatura, useDeleteFatura } from "@/hooks/useFaturas";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  
  // Edit dialog state - matching individual edit fields
  const [editData, setEditData] = useState({
    editMode: "vencimento" as "vencimento" | "emissao" | "referencia" | "valor" | "desconto" | "pagamento",
    novaDataVencimento: "",
    novoDiaVencimento: "",
    novaDataEmissao: "",
    novoMesReferencia: "",
    novoAnoReferencia: "",
    novoValor: "",
    // Discount fields
    descontoTipo: "manual" as "convenio" | "bolsa" | "campanha" | "pontualidade" | "manual",
    descontoDescricao: "",
    descontoValor: "",
    descontoPercentual: "",
    descontoIsPercentual: false,
    // Payment fields
    pagamentoMetodo: "",
    pagamentoReferencia: "",
  });
  
  const { createPayment } = useAsaas();
  const cancelMutation = useCancelarFatura();
  const deleteMutation = useDeleteFatura();


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
      // 1) Recriar cobranças inválidas (billingType UNDEFINED não gera boleto pagável em apps bancários)
      const faturasToRecreate = pendingFaturas.filter(
        f =>
          (f.status === "Aberta" || f.status === "Vencida") &&
          !!f.asaas_payment_id &&
          (f.asaas_billing_type === "UNDEFINED" || !f.asaas_billing_type)
      );

      // 2) Criar cobranças no gateway para faturas que ainda não têm
      const faturasWithoutPayment = pendingFaturas.filter(
        f => !f.asaas_payment_id && (f.status === "Aberta" || f.status === "Vencida")
      );

      const totalCreateOps = faturasToRecreate.length + faturasWithoutPayment.length;
      let processedCreate = 0;

      if (totalCreateOps > 0) {
        setProgressMessage(`Preparando cobranças (0/${totalCreateOps})...`);

        // Recria primeiro: deleta apenas no Asaas (preserva status local) e cria nova como BOLETO
        for (const fatura of faturasToRecreate) {
          try {
            // Usa a nova função que apenas deleta no Asaas sem mudar status local
            await supabase.functions.invoke("asaas-delete-remote-payment", {
              body: { faturaId: fatura.id },
            });
          } catch (err) {
            console.warn(`Erro ao deletar cobrança remota para fatura ${fatura.id}:`, err);
          }

          try {
            await createPayment(fatura.id, "BOLETO");
          } catch (err) {
            console.warn(`Erro ao recriar cobrança para fatura ${fatura.id}:`, err);
          }

          processedCreate++;
          setProgressMessage(`Preparando cobranças (${processedCreate}/${totalCreateOps})...`);
          setProgressValue((processedCreate / totalCreateOps) * 40);
        }

        // Depois cria as que faltam
        for (const fatura of faturasWithoutPayment) {
          try {
            await createPayment(fatura.id, "BOLETO");
          } catch (err) {
            console.warn(`Erro ao criar cobrança para fatura ${fatura.id}:`, err);
          }
          processedCreate++;
          setProgressMessage(`Preparando cobranças (${processedCreate}/${totalCreateOps})...`);
          setProgressValue((processedCreate / totalCreateOps) * 40);
        }
      }

      // Sincronizar dados de pagamento (PIX/Boleto) para faturas que já têm cobrança
      setProgressMessage("Sincronizando dados de pagamento...");
      const faturasToSync = pendingFaturas.filter(
        f =>
          f.asaas_payment_id &&
          (
            !f.asaas_pix_qrcode ||
            !f.asaas_boleto_barcode ||
            // novo campo: barCode oficial (44 dígitos) usado no carnê
            !f.asaas_boleto_bar_code
          )
      );
      
      if (faturasToSync.length > 0) {
        for (let i = 0; i < faturasToSync.length; i++) {
          const fatura = faturasToSync[i];
          setProgressMessage(`Sincronizando ${i + 1}/${faturasToSync.length}...`);
          try {
            await supabase.functions.invoke("gateway-sync-payment", {
              body: { faturaId: fatura.id, action: "sync" }
            });
          } catch (err) {
            console.warn(`Erro ao sincronizar fatura ${fatura.id}:`, err);
          }
          setProgressValue(40 + ((i + 1) / faturasToSync.length) * 30);
        }
      }

      // Buscar faturas atualizadas com dados do gateway
      setProgressMessage("Buscando dados atualizados...");
      setProgressValue(75);
      
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

      setProgressMessage("Gerando PDF do carnê (3 por página A4)...");
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
      toast.success(`Carnê gerado com ${updatedFaturas.length} fatura(s) - 3 por página A4!`);
      onClearSelection();
    } catch (error: any) {
      console.error("Erro ao gerar carnê:", error);
      toast.error(error.message || "Erro ao gerar carnê");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleGeneratePayments = async () => {
    const faturasWithoutPayment = selectedFaturas.filter(
      f => !f.asaas_payment_id && (f.status === "Aberta" || f.status === "Vencida")
    );

    if (faturasWithoutPayment.length === 0) {
      toast.info("Todas as faturas selecionadas já têm cobrança gerada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;
    let success = 0;

    try {
      for (const fatura of faturasWithoutPayment) {
        setProgressMessage(`Gerando cobrança ${processed + 1} de ${faturasWithoutPayment.length}...`);
        
        try {
          await createPayment(fatura.id, "BOLETO");
          success++;
        } catch (err) {
          console.warn(`Erro na fatura ${fatura.id}:`, err);
        }
        
        processed++;
        setProgressValue((processed / faturasWithoutPayment.length) * 100);
      }

      toast.success(`${success} cobrança(s) gerada(s)!`);
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

  const handleBulkDelete = async () => {
    if (selectedFaturas.length === 0) {
      toast.error("Nenhuma fatura selecionada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let deleted = 0;
    let errors = 0;

    try {
      for (const fatura of selectedFaturas) {
        setProgressMessage(`Excluindo ${deleted + 1} de ${selectedFaturas.length}...`);
        
        try {
          await deleteMutation.mutateAsync(fatura.id);
          deleted++;
        } catch (err) {
          console.warn(`Erro ao excluir fatura ${fatura.id}:`, err);
          errors++;
        }
        
        setProgressValue(((deleted + errors) / selectedFaturas.length) * 100);
      }

      if (errors === 0) {
        toast.success(`${deleted} fatura(s) excluída(s) permanentemente!`);
      } else {
        toast.warning(`${deleted} excluída(s), ${errors} com erro`);
      }
      
      onClearSelection();
      onActionComplete();
    } catch (error) {
      toast.error("Erro ao excluir faturas");
    } finally {
      setIsProcessing(false);
      setIsDeleteDialogOpen(false);
      setProgressMessage("");
    }
  };

  const handleBulkEdit = async () => {
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
        
        const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        
        // Processar baseado no modo de edição
        switch (editData.editMode) {
          case "vencimento":
            if (editData.novaDataVencimento) {
              updateData.data_vencimento = editData.novaDataVencimento;
            } else if (editData.novoDiaVencimento) {
              const dia = parseInt(editData.novoDiaVencimento);
              const ano = fatura.ano_referencia;
              const mes = fatura.mes_referencia - 1;
              updateData.data_vencimento = new Date(ano, mes, dia).toISOString().split('T')[0];
            }
            break;
          
          case "emissao":
            if (editData.novaDataEmissao) {
              updateData.data_emissao = editData.novaDataEmissao;
            }
            break;
          
          case "referencia":
            if (editData.novoMesReferencia) {
              updateData.mes_referencia = parseInt(editData.novoMesReferencia);
            }
            if (editData.novoAnoReferencia) {
              updateData.ano_referencia = parseInt(editData.novoAnoReferencia);
            }
            break;
          
          case "valor":
            if (editData.novoValor) {
              const novoValor = parseFloat(editData.novoValor);
              updateData.valor = novoValor;
              updateData.valor_original = novoValor;
              updateData.valor_total = novoValor;
              updateData.saldo_restante = novoValor;
            }
            break;

          case "desconto":
            // Desconto é tratado separadamente pois insere em outra tabela
            break;

          case "pagamento":
            // Pagamento é tratado separadamente pois insere em outra tabela
            break;
        }
        
        // Handle desconto separately - inserts into fatura_descontos table
        if (editData.editMode === "desconto") {
          const valorBase = fatura.valor || 0;
          const valorAplicado = editData.descontoIsPercentual
            ? valorBase * (parseFloat(editData.descontoPercentual) / 100)
            : parseFloat(editData.descontoValor);

          if (valorAplicado > 0) {
            const { error: descontoError } = await supabase
              .from("fatura_descontos")
              .insert({
                fatura_id: fatura.id,
                tipo: editData.descontoTipo,
                descricao: editData.descontoDescricao,
                valor: editData.descontoIsPercentual ? 0 : parseFloat(editData.descontoValor),
                percentual: editData.descontoIsPercentual ? parseFloat(editData.descontoPercentual) : 0,
                valor_aplicado: valorAplicado,
              });

            if (!descontoError) {
              // Recalculate totals
              const { data: allDescontos } = await supabase
                .from("fatura_descontos")
                .select("valor_aplicado")
                .eq("fatura_id", fatura.id);
              
              const totalDescontos = (allDescontos || []).reduce((sum, d) => sum + Number(d.valor_aplicado), 0);
              const novoValorTotal = Math.max(0, valorBase - totalDescontos);
              
              await supabase
                .from("faturas")
                .update({
                  valor_total: novoValorTotal,
                  valor_desconto_aplicado: totalDescontos,
                  saldo_restante: novoValorTotal,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", fatura.id);

              success++;

              // Sync with gateway
              if (fatura.asaas_payment_id) {
                try {
                  await supabase.functions.invoke("gateway-sync-payment", {
                    body: { faturaId: fatura.id, action: "sync" },
                  });
                } catch (err) {
                  console.warn("Erro ao atualizar gateway:", err);
                }
              }
            }
          }
        } 
        // Handle pagamento separately - inserts into pagamentos table
        else if (editData.editMode === "pagamento") {
          const valorPagar = fatura.valor_total || fatura.valor || 0;
          
          if (valorPagar > 0) {
            // Insert payment
            const { error: pagamentoError } = await supabase
              .from("pagamentos")
              .insert({
                fatura_id: fatura.id,
                valor: valorPagar,
                metodo: editData.pagamentoMetodo,
                referencia: editData.pagamentoReferencia || null,
                data_pagamento: new Date().toISOString(),
                tipo: "total",
              });

            if (!pagamentoError) {
              // Update fatura status to Paga
              await supabase
                .from("faturas")
                .update({
                  status: "Paga",
                  saldo_restante: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", fatura.id);

              success++;
            }
          }
        } 
        else if (Object.keys(updateData).length > 1) {
          const { error } = await supabase
            .from("faturas")
            .update(updateData)
            .eq("id", fatura.id);
          
          if (!error) {
            success++;
            
            // Se tem cobrança, atualizar no gateway
            if (fatura.asaas_payment_id && (editData.editMode === "vencimento" || editData.editMode === "valor")) {
              try {
                await supabase.functions.invoke("gateway-sync-payment", {
                  body: { faturaId: fatura.id, action: "sync" },
                });
              } catch (err) {
                console.warn("Erro ao atualizar gateway:", err);
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
      resetEditData();
    } catch (error) {
      toast.error("Erro ao editar faturas");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const resetEditData = () => {
    setEditData({
      editMode: "vencimento",
      novaDataVencimento: "",
      novoDiaVencimento: "",
      novaDataEmissao: "",
      novoMesReferencia: "",
      novoAnoReferencia: "",
      novoValor: "",
      descontoTipo: "manual",
      descontoDescricao: "",
      descontoValor: "",
      descontoPercentual: "",
      descontoIsPercentual: false,
      pagamentoMetodo: "",
      pagamentoReferencia: "",
    });
  };

  const paidCount = selectedFaturas.filter(f => f.status === "Paga").length;
  const editableCount = selectedFaturas.filter(f => f.status === "Aberta" || f.status === "Vencida").length;

  return (
    <>
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-background border border-border rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Left side - Selection info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md">
            {selectedCount}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {selectedCount} fatura{selectedCount !== 1 && "s"} selecionada{selectedCount !== 1 && "s"}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formatCurrency(totalValue)}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{pendingCount} pendente{pendingCount !== 1 && "s"}</span>
              {paidCount > 0 && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-success">{paidCount} paga{paidCount !== 1 && "s"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isProcessing ? (
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1 sm:flex-none sm:w-56">
              <span className="text-sm font-medium text-foreground block mb-1.5">{progressMessage}</span>
              <Progress value={progressValue} className="h-2.5" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Main Action Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="default" 
                  className="h-10 gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Ações em Lote
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-background border shadow-xl rounded-xl p-1">
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
                  Editar Faturas
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Documentos
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={handleGenerateCarne} 
                  className="gap-2 cursor-pointer group transition-colors hover:bg-primary/10"
                >
                  <Printer className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Imprimir Carnê</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Cobranças
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={handleGeneratePayments} 
                  disabled={pendingCount === 0}
                  className="gap-2 cursor-pointer text-success"
                >
                  <QrCode className="h-4 w-4" />
                  Gerar Cobranças
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
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close Button - Shopify style */}
            <Button
              variant="outline"
              size="icon"
              onClick={onClearSelection}
              className="h-10 w-10 rounded-xl border-border hover:bg-muted transition-colors"
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

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Excluir {selectedCount} fatura(s) permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong className="text-destructive">ATENÇÃO:</strong> Esta ação é irreversível!
              </p>
              <p>
                As {selectedCount} fatura(s) selecionadas serão excluídas permanentemente do sistema 
                e do gateway de pagamento.
              </p>
              <p>
                Todos os dados relacionados (itens, descontos, pagamentos, histórico) serão removidos.
              </p>
              {selectedFaturas.some(f => f.status === "Paga") && (
                <p className="text-destructive font-medium">
                  ⚠️ Algumas faturas selecionadas já estão PAGAS. Os registros de pagamento também serão excluídos.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog - Shopify Style */}
      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="max-w-xl rounded-2xl">
          <AlertDialogHeader className="pb-4 border-b">
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                <Pencil className="h-5 w-5" />
              </div>
              Editar {editableCount} fatura{editableCount !== 1 && "s"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-1">
              Selecione o tipo de alteração que deseja aplicar nas faturas selecionadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Edit Mode Selector - Shopify Tab Style */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "vencimento", icon: Calendar, label: "Vencimento" },
                { mode: "emissao", icon: FileText, label: "Emissão" },
                { mode: "referencia", icon: Calendar, label: "Período" },
                { mode: "valor", icon: DollarSign, label: "Valor" },
                { mode: "desconto", icon: Percent, label: "Desconto" },
                { mode: "pagamento", icon: CreditCard, label: "Pagamento" },
              ].map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  variant={editData.editMode === mode ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 h-11 rounded-xl transition-all duration-200 ${
                    editData.editMode === mode 
                      ? "shadow-md" 
                      : "hover:bg-muted hover:border-primary/30"
                  }`}
                  onClick={() => setEditData({ ...editData, editMode: mode as typeof editData.editMode })}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </Button>
              ))}
            </div>

            {/* Vencimento Mode - Enhanced */}
            {editData.editMode === "vencimento" && (
              <div className="space-y-5 p-4 bg-muted/30 rounded-xl border animate-in fade-in duration-200">
                <div className="space-y-3">
                  <Label htmlFor="novaData" className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4 text-primary" />
                    Data Específica
                  </Label>
                  <Input
                    id="novaData"
                    type="date"
                    value={editData.novaDataVencimento}
                    onChange={(e) => setEditData({ ...editData, novaDataVencimento: e.target.value, novoDiaVencimento: "" })}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aplica a mesma data para todas as faturas selecionadas
                  </p>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-muted/30 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">ou</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="novoDia" className="text-sm font-semibold">Dia Fixo no Mês</Label>
                  <Select 
                    value={editData.novoDiaVencimento} 
                    onValueChange={(v) => setEditData({ ...editData, novoDiaVencimento: v, novaDataVencimento: "" })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
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
                    Mantém o mês/ano de referência de cada fatura
                  </p>
                </div>
              </div>
            )}

            {/* Emissão Mode - Enhanced */}
            {editData.editMode === "emissao" && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl border animate-in fade-in duration-200">
                <Label htmlFor="novaEmissao" className="text-sm font-semibold">Nova Data de Emissão</Label>
                <Input
                  id="novaEmissao"
                  type="date"
                  value={editData.novaDataEmissao}
                  onChange={(e) => setEditData({ ...editData, novaDataEmissao: e.target.value })}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Altera a data de emissão de todas as faturas selecionadas
                </p>
              </div>
            )}

            {/* Referência Mode - Enhanced */}
            {editData.editMode === "referencia" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border animate-in fade-in duration-200">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Mês</Label>
                  <Select 
                    value={editData.novoMesReferencia} 
                    onValueChange={(v) => setEditData({ ...editData, novoMesReferencia: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Ano</Label>
                  <Select 
                    value={editData.novoAnoReferencia} 
                    onValueChange={(v) => setEditData({ ...editData, novoAnoReferencia: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Valor Mode - Enhanced */}
            {editData.editMode === "valor" && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl border animate-in fade-in duration-200">
                <Label htmlFor="novoValor" className="text-sm font-semibold">Novo Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input
                    id="novoValor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={editData.novoValor}
                    onChange={(e) => setEditData({ ...editData, novoValor: e.target.value })}
                    className="h-11 rounded-xl pl-10 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Aplica o mesmo valor em todas as faturas selecionadas
                </p>
              </div>
            )}

            {/* Desconto Mode - Enhanced */}
            {editData.editMode === "desconto" && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <Select 
                    value={editData.descontoTipo} 
                    onValueChange={(v: typeof editData.descontoTipo) => setEditData({ ...editData, descontoTipo: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
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
                      variant={!editData.descontoIsPercentual ? "default" : "outline"}
                      size="sm"
                      className="flex-1 h-11 rounded-xl font-semibold"
                      type="button"
                      onClick={() => setEditData({ ...editData, descontoIsPercentual: false })}
                    >
                      R$
                    </Button>
                    <Button
                      variant={editData.descontoIsPercentual ? "default" : "outline"}
                      size="sm"
                      className="flex-1 h-11 rounded-xl font-semibold"
                      type="button"
                      onClick={() => setEditData({ ...editData, descontoIsPercentual: true })}
                    >
                      %
                    </Button>
                  </div>
                </div>
                
                <Input
                  placeholder="Descrição do desconto"
                  value={editData.descontoDescricao}
                  onChange={(e) => setEditData({ ...editData, descontoDescricao: e.target.value })}
                  className="h-11 rounded-xl"
                />
                
                <Input
                  type="number"
                  step="0.01"
                  placeholder={editData.descontoIsPercentual ? "Percentual (%)" : "Valor (R$)"}
                  value={editData.descontoIsPercentual ? editData.descontoPercentual : editData.descontoValor}
                  onChange={(e) => setEditData({
                    ...editData,
                    [editData.descontoIsPercentual ? "descontoPercentual" : "descontoValor"]: e.target.value,
                  })}
                  className="h-11 rounded-xl text-lg font-semibold"
                />
                
                <p className="text-xs text-muted-foreground">
                  {editData.descontoIsPercentual 
                    ? "Percentual aplicado sobre o valor de cada fatura" 
                    : "Valor fixo aplicado em cada fatura"}
                </p>
              </div>
            )}

            {/* Pagamento Mode - Enhanced */}
            {editData.editMode === "pagamento" && (
              <div className="space-y-4 p-4 bg-success/5 rounded-xl border border-success/20 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-success" />
                    Método de Pagamento
                  </Label>
                  <Select 
                    value={editData.pagamentoMetodo} 
                    onValueChange={(v) => setEditData({ ...editData, pagamentoMetodo: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">💵 Dinheiro</SelectItem>
                      <SelectItem value="PIX">⚡ PIX</SelectItem>
                      <SelectItem value="Cartão Crédito">💳 Cartão Crédito</SelectItem>
                      <SelectItem value="Cartão Débito">💳 Cartão Débito</SelectItem>
                      <SelectItem value="Boleto">📄 Boleto</SelectItem>
                      <SelectItem value="Transferência">🏦 Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Referência (opcional)</Label>
                  <Input
                    placeholder="Ex: Número do comprovante"
                    value={editData.pagamentoReferencia}
                    onChange={(e) => setEditData({ ...editData, pagamentoReferencia: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <p className="text-sm text-success font-medium">
                    {editableCount} fatura{editableCount !== 1 && "s"} será{editableCount !== 1 && "ão"} marcada{editableCount !== 1 && "s"} como paga{editableCount !== 1 && "s"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="pt-4 border-t">
            <AlertDialogCancel 
              disabled={isProcessing}
              onClick={resetEditData}
              className="h-11 rounded-xl"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkEdit}
              disabled={isProcessing || (
                (editData.editMode === "vencimento" && !editData.novaDataVencimento && !editData.novoDiaVencimento) ||
                (editData.editMode === "emissao" && !editData.novaDataEmissao) ||
                (editData.editMode === "referencia" && !editData.novoMesReferencia && !editData.novoAnoReferencia) ||
                (editData.editMode === "valor" && !editData.novoValor) ||
                (editData.editMode === "desconto" && (!editData.descontoDescricao || (!editData.descontoValor && !editData.descontoPercentual))) ||
                (editData.editMode === "pagamento" && !editData.pagamentoMetodo)
              )}
              className="h-11 rounded-xl font-semibold shadow-md"
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
