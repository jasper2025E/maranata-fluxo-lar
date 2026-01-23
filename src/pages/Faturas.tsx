import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
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
  queryKeys,
  Fatura 
} from "@/hooks/useFaturas";
import { generateFaturaPDF, generateReciboPDF } from "@/lib/pdfGenerator";
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

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCarneOpen, setIsCarneOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAsaasOpen, setIsAsaasOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
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

  const handleAsaasSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("invoices.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("invoices.description")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCarneOpen(true)} className="gap-2">
              <Printer className="h-4 w-4" />
              {t("invoices.printCarne")}
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
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
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
