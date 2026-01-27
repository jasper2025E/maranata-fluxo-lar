import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Printer, ChevronRight, FileText, Users, Download, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  FaturaKPIs, 
  FaturaTable, 
  FaturaDetails, 
  FaturaFilters, 
  CreateFaturaDialog,
  CarneDialog,
  AsaasPaymentDialog,
  SendReceiptDialog,
  BulkActionsBar,
} from "@/components/faturas";
import { 
  useFaturas, 
  useCancelarFatura,
  useDeleteFatura,
  useReabrirFatura,
  queryKeys,
  Fatura 
} from "@/hooks/useFaturas";
import { syncFaturaAsaasData, createAsaasPaymentWithFullSync } from "@/hooks/useFaturaAsaasSync";
import { generateFaturaPDF, generateReciboPDF } from "@/lib/pdfGenerator";
import { generateCarneCompacto } from "@/lib/carneCompactoGenerator";
import { waitForAsaasBoletoReady } from "@/lib/asaasBoleto";
import { toast } from "sonner";

type ViewMode = "list" | "status" | "aluno" | "mes";

const Faturas = () => {
  const { t } = useTranslation();
  
  // View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [alunoFilter, setAlunoFilter] = useState("todos");
  const [cursoFilter, setCursoFilter] = useState("todos");
  const [periodoFilter, setPeriodoFilter] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  // Selection State
  const [selectedFaturasIds, setSelectedFaturasIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCarneOpen, setIsCarneOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAsaasOpen, setIsAsaasOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [reopenStatus, setReopenStatus] = useState<'Aberta' | 'Vencida'>('Aberta');
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);

  // Queries
  const { data: faturas = [], isLoading } = useFaturas();

  const { data: alunos = [] } = useQuery({
    queryKey: ["alunos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, responsavel_id")
        .eq("status_matricula", "ativo")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  const { data: cursos = [] } = useQuery({
    queryKey: ["cursos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, nome, mensalidade")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const cancelMutation = useCancelarFatura();
  const deleteMutation = useDeleteFatura();
  const reopenMutation = useReabrirFatura();
  const queryClient = useQueryClient();
  const { data: escola } = useQuery({
    queryKey: ['escola-info'],
    queryFn: async () => {
      const { data } = await supabase.from('escola').select('*').limit(1).maybeSingle();
      return data;
    },
  });
  
  const filteredFaturas = useMemo(() => {
    return faturas.filter((fatura) => {
      const matchesSearch = !searchTerm || 
        fatura.alunos?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.responsaveis?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.codigo_sequencial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.cursos?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todas" || fatura.status?.toLowerCase() === statusFilter;
      const matchesAluno = alunoFilter === "todos" || fatura.aluno_id === alunoFilter;
      const matchesCurso = cursoFilter === "todos" || fatura.curso_id === cursoFilter;
      
      let matchesPeriodo = true;
      if (periodoFilter.start) {
        const venc = new Date(fatura.data_vencimento);
        matchesPeriodo = venc >= periodoFilter.start;
        if (periodoFilter.end) {
          matchesPeriodo = matchesPeriodo && venc <= periodoFilter.end;
        }
      }
      
      return matchesSearch && matchesStatus && matchesAluno && matchesCurso && matchesPeriodo;
    });
  }, [faturas, searchTerm, statusFilter, alunoFilter, cursoFilter, periodoFilter]);

  // Event handlers
  const handleViewDetails = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  const handleEdit = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  const handlePayment = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  const handlePaymentLink = async (fatura: Fatura) => {
    // Links de pagamento são gerados via Asaas
    if (fatura.payment_url) {
      navigator.clipboard.writeText(fatura.payment_url);
      toast.success(t("invoices.linkCopied"));
    } else if (fatura.asaas_payment_id) {
      // Buscar link do Asaas
      toast.info(t("invoices.generatingLink"));
      try {
        const response = await supabase.functions.invoke("asaas-get-payment", {
          body: { paymentId: fatura.asaas_payment_id },
        });
        if (response.error) {
          throw new Error(response.error.message || t("invoices.linkError"));
        }
        const paymentUrl = response.data?.invoiceUrl || response.data?.bankSlipUrl;
        if (paymentUrl) {
          navigator.clipboard.writeText(paymentUrl);
          toast.success(t("invoices.linkGenerated"));
        } else {
          toast.error(t("invoices.noPaymentLink"));
        }
      } catch (error: any) {
        toast.error(error.message || t("invoices.linkError"));
      }
    } else {
      toast.error(t("invoices.generateAsaasFirst"));
    }
  };

  const handleParcelar = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  const handleCancel = (fatura: Fatura) => {
    const motivo = prompt(t("invoices.cancelReason"));
    if (motivo && motivo.trim()) {
      cancelMutation.mutate({ id: fatura.id, motivo: motivo.trim() });
    }
  };

  const handleSendReceipt = (fatura: Fatura) => {
    if (fatura.status.toLowerCase() !== "paga") {
      toast.error(t("invoices.receiptOnlyPaid"));
      return;
    }
    setSelectedFatura(fatura);
    setIsReceiptOpen(true);
  };

  const handleViewHistory = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  const handleDownloadPDF = async (fatura: Fatura) => {
    if (!escola) {
      toast.error(t("invoices.schoolNotFound"));
      return;
    }
    try {
      const { data: itens } = await supabase
        .from("fatura_itens")
        .select("*")
        .eq("fatura_id", fatura.id)
        .order("ordem");
      
      await generateFaturaPDF(fatura, escola, itens || undefined);
      toast.success(t("invoices.pdfGenerated"));
    } catch (error) {
      toast.error(t("invoices.pdfError"));
    }
  };

  const handleAsaasPayment = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsAsaasOpen(true);
  };

  const handleDownloadReceipt = async (fatura: Fatura) => {
    if (!escola) {
      toast.error(t("invoices.schoolNotFound"));
      return;
    }
    if (fatura.status.toLowerCase() !== "paga") {
      toast.error(t("invoices.receiptOnlyPaid"));
      return;
    }
    try {
      const { data: pagamentos, error } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("fatura_id", fatura.id)
        .order("data_pagamento", { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (!pagamentos || pagamentos.length === 0) {
        toast.error(t("invoices.paymentNotFound"));
        return;
      }
      
      await generateReciboPDF(fatura, pagamentos[0], escola);
      toast.success(t("invoices.receiptGenerated"));
    } catch (error) {
      console.error("Erro ao gerar recibo:", error);
      toast.error(t("invoices.receiptError"));
    }
  };

  const handleDownloadBoleto = async (fatura: Fatura) => {
    if (!escola) {
      toast.error(t("invoices.schoolNotFound"));
      return;
    }
    try {
      // Garantir dados oficiais (linha digitável 47 + barCode 44) antes de gerar
      if (fatura.asaas_payment_id) {
        toast.info("Sincronizando dados do boleto...");
        const ready = await waitForAsaasBoletoReady(fatura.id);
        if (!ready.success) {
          toast.error(ready.error || "Boleto ainda não está pronto para impressão.");
          return;
        }
      }

      // Buscar apenas os campos de pagamento atualizados e mesclar com o objeto atual
      const { data: paymentFields } = await supabase
        .from("faturas")
        .select("asaas_pix_qrcode, asaas_pix_payload, asaas_boleto_barcode, asaas_boleto_bar_code")
        .eq("id", fatura.id)
        .maybeSingle();

      const faturaForPrint = (paymentFields ? ({ ...fatura, ...paymentFields } as Fatura) : fatura);

      // Usar o gerador compacto (3 por A4)
      await generateCarneCompacto(
        [faturaForPrint],
        {
          nome: escola.nome,
          cnpj: escola.cnpj,
          endereco: escola.endereco,
          telefone: escola.telefone,
          email: escola.email,
          logo_url: escola.logo_url,
        },
        fatura.responsaveis ? { nome: fatura.responsaveis.nome, cpf: null } : null
      );
      toast.success("Boleto gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar boleto:", error);
      toast.error("Erro ao gerar boleto");
    }
  };

  const handleAsaasSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
  };

  // Exclusão permanente de fatura
  const handleDeleteFatura = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFatura = async () => {
    if (!selectedFatura) return;
    
    try {
      await deleteMutation.mutateAsync(selectedFatura.id);
      setIsDeleteDialogOpen(false);
      setSelectedFatura(null);
    } catch (error) {
      console.error("Erro ao excluir fatura:", error);
    }
  };

  // Reabrir fatura paga
  const handleReopenFatura = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setReopenStatus('Aberta');
    setIsReopenDialogOpen(true);
  };

  const confirmReopenFatura = async () => {
    if (!selectedFatura) return;
    
    try {
      await reopenMutation.mutateAsync({ 
        id: selectedFatura.id, 
        novoStatus: reopenStatus,
        deletarPagamentos: false,
      });
      setIsReopenDialogOpen(false);
      setSelectedFatura(null);
    } catch (error) {
      console.error("Erro ao reabrir fatura:", error);
    }
  };

  // Sincronização em lote com gateway (paralelo)
  const handleBulkSyncAsaas = async () => {
    // Determinar quais faturas sincronizar
    const faturasParaSincronizar = selectedFaturasIds.size > 0
      ? filteredFaturas.filter(f => selectedFaturasIds.has(f.id))
      : filteredFaturas;
    
    // Filtrar apenas faturas pendentes (não pagas/canceladas)
    const faturasPendentes = faturasParaSincronizar.filter(
      f => f.status !== 'Paga' && f.status !== 'Cancelada'
    );
    
    if (faturasPendentes.length === 0) {
      toast.info("Nenhuma fatura pendente para sincronizar");
      return;
    }
    
    setIsSyncing(true);
    const toastId = toast.loading(`Sincronizando ${faturasPendentes.length} faturas...`);
    
    // Processar em lotes paralelos de 5 para não sobrecarregar API
    const BATCH_SIZE = 5;
    let successCount = 0;
    let errorCount = 0;
    let processed = 0;
    
    for (let i = 0; i < faturasPendentes.length; i += BATCH_SIZE) {
      const batch = faturasPendentes.slice(i, i + BATCH_SIZE);
      
      toast.loading(`Sincronizando ${Math.min(i + BATCH_SIZE, faturasPendentes.length)}/${faturasPendentes.length}...`, { id: toastId });
      
      // Processar lote em paralelo
      const results = await Promise.allSettled(
        batch.map(async (fatura) => {
          if (fatura.asaas_payment_id) {
            return syncFaturaAsaasData(fatura.id);
          } else {
            return createAsaasPaymentWithFullSync(fatura.id, 3);
          }
        })
      );
      
      // Contar resultados
      results.forEach(result => {
        processed++;
        if (result.status === 'fulfilled' && result.value?.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      // Delay mínimo entre lotes
      if (i + BATCH_SIZE < faturasPendentes.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    setIsSyncing(false);
    
    if (errorCount === 0) {
      toast.success(`${successCount} faturas sincronizadas!`, { id: toastId });
    } else {
      toast.warning(`${successCount} sincronizadas, ${errorCount} com erro`, { id: toastId });
    }
    
    queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            
            
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkSyncAsaas}
              disabled={isSyncing}
              className={`group gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                isSyncing 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'hover:bg-primary/5 hover:border-primary/50'
              }`}
            >
              <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-90'}`} />
              <span className="font-medium">
                {isSyncing ? 'Sincronizando...' : selectedFaturasIds.size > 0 ? `Sincronizar (${selectedFaturasIds.size})` : 'Sincronizar'}
              </span>
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("invoices.newInvoice")}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <FaturaKPIs />

        {/* Filters */}
        <FaturaFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          alunoFilter={alunoFilter}
          onAlunoChange={setAlunoFilter}
          cursoFilter={cursoFilter}
          onCursoChange={setCursoFilter}
          periodoFilter={periodoFilter}
          onPeriodoChange={setPeriodoFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          alunos={alunos}
          cursos={cursos}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedIds={selectedFaturasIds}
          faturas={filteredFaturas}
          onClearSelection={() => setSelectedFaturasIds(new Set())}
          onActionComplete={() => queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all })}
        />

        {/* Table */}
        <FaturaTable
          faturas={filteredFaturas}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onPayment={handlePayment}
          onPaymentLink={handlePaymentLink}
          onParcelar={handleParcelar}
          onCancel={handleCancel}
          onSendReceipt={handleSendReceipt}
          onViewHistory={handleViewHistory}
          onDownloadPDF={handleDownloadPDF}
          onAsaasPayment={handleAsaasPayment}
          onDownloadReceipt={handleDownloadReceipt}
          onDownloadBoleto={handleDownloadBoleto}
          onDelete={handleDeleteFatura}
          onReopen={handleReopenFatura}
          selectedFaturas={selectedFaturasIds}
          onSelectionChange={setSelectedFaturasIds}
        />

        {/* Dialogs */}
        <CreateFaturaDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          alunos={alunos}
          cursos={cursos}
        />

        <FaturaDetails
          fatura={selectedFatura}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />

        <CarneDialog
          open={isCarneOpen}
          onOpenChange={setIsCarneOpen}
        />

        <AsaasPaymentDialog
          open={isAsaasOpen}
          onOpenChange={setIsAsaasOpen}
          fatura={selectedFatura}
          onSuccess={handleAsaasSuccess}
        />

        <SendReceiptDialog
          open={isReceiptOpen}
          onOpenChange={setIsReceiptOpen}
          fatura={selectedFatura}
        />

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir fatura permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedFatura?.status === "Paga" ? (
                  <>
                    <strong className="text-destructive">Atenção:</strong> Esta fatura já foi paga. 
                    O registro de pagamento será removido e a cobrança será excluída do gateway de pagamento.
                    <br /><br />
                  </>
                ) : null}
                A fatura <strong>{selectedFatura?.codigo_sequencial}</strong> e todos os dados relacionados 
                (itens, descontos, pagamentos, histórico) serão excluídos permanentemente do sistema
                {selectedFatura?.asaas_payment_id ? " e do ASAAS" : ""}.
                <br /><br />
                <strong className="text-destructive">Esta ação NÃO pode ser desfeita.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteFatura}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de reabrir fatura */}
        <AlertDialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reabrir fatura?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Você está prestes a reverter o status da fatura <strong>{selectedFatura?.codigo_sequencial}</strong> de "Paga" para outro status.
                </p>
                <p>
                  O saldo restante será restaurado para o valor total da fatura. 
                  Os registros de pagamento serão mantidos (você pode estorná-los depois se necessário).
                </p>
                
                <div className="pt-2">
                  <label className="text-sm font-medium">Novo status:</label>
                  <Select value={reopenStatus} onValueChange={(v) => setReopenStatus(v as 'Aberta' | 'Vencida')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aberta">Aberta</SelectItem>
                      <SelectItem value="Vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmReopenFatura}
                disabled={reopenMutation.isPending}
              >
                {reopenMutation.isPending ? "Reabrindo..." : "Reabrir fatura"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
