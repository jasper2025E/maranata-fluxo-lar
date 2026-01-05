import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  FaturaKPIs, 
  FaturaTable, 
  FaturaDetails, 
  FaturaFilters, 
  CreateFaturaDialog 
} from "@/components/faturas";
import { 
  useFaturas, 
  useCancelarFatura, 
  Fatura 
} from "@/hooks/useFaturas";
import { toast } from "sonner";

type ViewMode = "list" | "status" | "aluno" | "mes";

const Faturas = () => {
  // View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [alunoFilter, setAlunoFilter] = useState("todos");
  const [cursoFilter, setCursoFilter] = useState("todos");
  const [periodoFilter, setPeriodoFilter] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  // Filtered data
  const filteredFaturas = useMemo(() => {
    return faturas.filter((fatura) => {
      const matchesSearch = !searchTerm || 
        fatura.alunos?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.responsaveis?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.codigo_sequencial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.cursos?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todas" || fatura.status.toLowerCase() === statusFilter;
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
    if (fatura.payment_url) {
      navigator.clipboard.writeText(fatura.payment_url);
      toast.success("Link copiado!");
    } else {
      toast.info("Gerando link de pagamento...");
      const response = await supabase.functions.invoke("create-checkout", {
        body: {
          faturaId: fatura.id,
          successUrl: `${window.location.origin}/pagamento/resultado?success=true&fatura_id=${fatura.id}`,
          cancelUrl: `${window.location.origin}/pagamento/resultado?canceled=true&fatura_id=${fatura.id}`,
        },
      });
      if (response.data?.url) {
        navigator.clipboard.writeText(response.data.url);
        toast.success("Link gerado e copiado!");
      }
    }
  };

  const handleParcelar = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  const handleCancel = (fatura: Fatura) => {
    if (confirm("Deseja realmente cancelar esta fatura?")) {
      cancelMutation.mutate({ id: fatura.id, motivo: "Cancelamento manual" });
    }
  };

  const handleSendReceipt = (fatura: Fatura) => {
    toast.info("Funcionalidade de envio de recibo em desenvolvimento");
  };

  const handleViewHistory = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
            <p className="text-muted-foreground text-sm">Sistema enterprise de gestão de faturas e cobrança</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Fatura
          </Button>
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
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
