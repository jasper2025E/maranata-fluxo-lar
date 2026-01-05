import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  FileText, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Download,
  Eye,
  Ban,
  Link,
  ExternalLink,
  Copy,
  Loader2,
  Mail,
  Send,
  Pencil,
  Percent,
  DollarSign,
  Calculator,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  SplitSquareVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, addDays, differenceInDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Fatura {
  id: string;
  aluno_id: string;
  curso_id: string;
  responsavel_id?: string | null;
  valor: number;
  valor_original?: number | null;
  valor_total?: number | null;
  mes_referencia: number;
  ano_referencia: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  payment_url?: string | null;
  stripe_checkout_session_id?: string | null;
  desconto_valor?: number | null;
  desconto_percentual?: number | null;
  desconto_motivo?: string | null;
  valor_desconto_aplicado?: number | null;
  juros?: number | null;
  multa?: number | null;
  juros_percentual_diario?: number | null;
  juros_percentual_mensal?: number | null;
  dias_atraso?: number | null;
  valor_juros_aplicado?: number | null;
  valor_multa_aplicado?: number | null;
  alunos?: { nome_completo: string; email_responsavel: string; responsavel_id?: string | null };
  cursos?: { nome: string };
  responsaveis?: { nome: string; email: string | null; telefone: string } | null;
}

interface Aluno {
  id: string;
  nome_completo: string;
  responsavel_id: string | null;
}

interface Curso {
  id: string;
  nome: string;
  mensalidade: number;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  total,
  icon: Icon, 
  variant,
}: { 
  title: string; 
  value: number | string;
  total?: number;
  icon: React.ElementType; 
  variant: "default" | "success" | "warning" | "destructive";
}) {
  const variants = {
    default: {
      icon: "text-primary bg-primary/10",
      text: "text-primary",
      border: "border-primary/10",
    },
    success: {
      icon: "text-success bg-success/10",
      text: "text-success",
      border: "border-success/10",
    },
    warning: {
      icon: "text-warning bg-warning/10",
      text: "text-warning",
      border: "border-warning/10",
    },
    destructive: {
      icon: "text-destructive bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/10",
    },
  };

  const style = variants[variant];

  return (
    <Card className={cn("border shadow-card hover:shadow-card-hover transition-all duration-300", style.border)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold tracking-tight", style.text)}>{value}</p>
            {total !== undefined && (
              <p className="text-xs text-muted-foreground">de {total}</p>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", style.icon)}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

type ViewMode = "list" | "status" | "aluno" | "mes";

const Faturas = () => {
  const queryClient = useQueryClient();
  
  // View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [alunoFilter, setAlunoFilter] = useState("todos");
  const [cursoFilter, setCursoFilter] = useState("todos");
  const [periodoFilter, setPeriodoFilter] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialog State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPaymentLinkOpen, setIsPaymentLinkOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isParcelamentoOpen, setIsParcelamentoOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailToSend, setEmailToSend] = useState("");
  const [paymentData, setPaymentData] = useState({ metodo: "", referencia: "" });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Create Invoice State
  const [createData, setCreateData] = useState({
    aluno_id: "",
    curso_id: "",
    valor: 0,
    data_vencimento: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    mes_referencia: new Date().getMonth() + 1,
    ano_referencia: new Date().getFullYear(),
    desconto_tipo: "valor" as "valor" | "percentual",
    desconto_valor: 0,
    desconto_percentual: 0,
    desconto_motivo: "",
    tipo: "avulsa" as "avulsa" | "recorrente",
    meses_recorrencia: 12,
  });

  // Parcelamento State
  const [parcelamentoData, setParcelamentoData] = useState({
    numero_parcelas: 2,
    valor_entrada: 0,
  });

  // Edit State
  const [editData, setEditData] = useState({
    valor_original: 0,
    data_vencimento: "",
    status: "",
    desconto_tipo: "valor" as "valor" | "percentual",
    desconto_valor: 0,
    desconto_percentual: 0,
    desconto_motivo: "",
    multa: 0,
    juros_percentual_diario: 0.033,
    juros_percentual_mensal: 1,
  });

  // Queries
  const { data: faturas = [], isLoading } = useQuery({
    queryKey: ["faturas"],
    queryFn: async () => {
      await supabase.rpc("atualizar_status_faturas");
      const { data, error } = await supabase
        .from("faturas")
        .select("*, alunos(nome_completo, email_responsavel, responsavel_id), cursos(nome), responsaveis(nome, email, telefone)")
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Fatura[];
    },
  });

  const { data: alunos = [] } = useQuery({
    queryKey: ["alunos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, responsavel_id")
        .eq("status_matricula", "ativo")
        .order("nome_completo");
      if (error) throw error;
      return data as Aluno[];
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
      return data as Curso[];
    },
  });

  const { data: configCobranca } = useQuery({
    queryKey: ["config-cobranca"],
    queryFn: async () => {
      const { data } = await supabase
        .from("escola")
        .select("juros_percentual_diario_padrao, juros_percentual_mensal_padrao, multa_fixa_padrao, multa_percentual_padrao")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Mutations
  const generatePaymentLinkMutation = useMutation({
    mutationFn: async (faturaId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) throw new Error("Usuário não autenticado");
      
      const response = await supabase.functions.invoke("create-checkout", {
        body: {
          faturaId,
          successUrl: `${window.location.origin}/pagamento/resultado?success=true&fatura_id=${faturaId}`,
          cancelUrl: `${window.location.origin}/pagamento/resultado?canceled=true&fatura_id=${faturaId}`,
        },
      });
      if (response.error) throw new Error(response.error.message || "Erro ao gerar link");
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      setPaymentUrl(data.url);
      setIsPaymentLinkOpen(true);
      setIsGeneratingLink(null);
      toast.success(data.existing ? "Link recuperado" : "Link gerado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
      setIsGeneratingLink(null);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { fatura: Fatura; metodo: string; referencia: string }) => {
      const valorFinal = getValorFinal(data.fatura);
      
      const { error: paymentError } = await supabase.from("pagamentos").insert({
        fatura_id: data.fatura.id,
        valor: valorFinal,
        valor_original: data.fatura.valor_original || data.fatura.valor,
        desconto_aplicado: data.fatura.valor_desconto_aplicado || 0,
        juros_aplicado: data.fatura.valor_juros_aplicado || 0,
        multa_aplicada: data.fatura.valor_multa_aplicado || 0,
        metodo: data.metodo,
        referencia: data.referencia || null,
      });
      if (paymentError) throw paymentError;

      const { error: faturaError } = await supabase
        .from("faturas")
        .update({ status: "Paga" })
        .eq("id", data.fatura.id);
      if (faturaError) throw faturaError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Pagamento registrado!");
      setIsPaymentOpen(false);
      setPaymentData({ metodo: "", referencia: "" });
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const aluno = alunos.find(a => a.id === createData.aluno_id);
      const faturasToCreate = [];
      
      const baseData = {
        aluno_id: createData.aluno_id,
        curso_id: createData.curso_id,
        valor: createData.valor,
        valor_original: createData.valor,
        desconto_valor: createData.desconto_tipo === "valor" ? createData.desconto_valor : 0,
        desconto_percentual: createData.desconto_tipo === "percentual" ? createData.desconto_percentual : 0,
        desconto_motivo: createData.desconto_motivo || null,
        responsavel_id: aluno?.responsavel_id || null,
        juros_percentual_diario: configCobranca?.juros_percentual_diario_padrao || 0.033,
        juros_percentual_mensal: configCobranca?.juros_percentual_mensal_padrao || 1,
        multa: configCobranca?.multa_fixa_padrao || 0,
      };

      if (createData.tipo === "avulsa") {
        faturasToCreate.push({
          ...baseData,
          data_vencimento: createData.data_vencimento,
          mes_referencia: createData.mes_referencia,
          ano_referencia: createData.ano_referencia,
        });
      } else {
        // Faturas recorrentes
        for (let i = 0; i < createData.meses_recorrencia; i++) {
          const date = new Date(createData.ano_referencia, createData.mes_referencia - 1 + i, 10);
          faturasToCreate.push({
            ...baseData,
            data_vencimento: format(date, "yyyy-MM-dd"),
            mes_referencia: date.getMonth() + 1,
            ano_referencia: date.getFullYear(),
          });
        }
      }

      const { error } = await supabase.from("faturas").insert(faturasToCreate);
      if (error) throw error;
      return faturasToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`${count} fatura(s) criada(s)!`);
      setIsCreateOpen(false);
      resetCreateData();
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Fatura> }) => {
      const { error } = await supabase.from("faturas").update(data.updates).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Fatura atualizada!");
      setIsEditOpen(false);
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });

  const parcelamentoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFatura) throw new Error("Fatura não selecionada");
      
      const valorTotal = getValorFinal(selectedFatura);
      const valorRestante = valorTotal - parcelamentoData.valor_entrada;
      const valorParcela = valorRestante / parcelamentoData.numero_parcelas;
      const aluno = alunos.find(a => a.id === selectedFatura.aluno_id);
      
      const parcelas = [];
      for (let i = 0; i < parcelamentoData.numero_parcelas; i++) {
        const date = addDays(new Date(selectedFatura.data_vencimento), 30 * (i + 1));
        parcelas.push({
          aluno_id: selectedFatura.aluno_id,
          curso_id: selectedFatura.curso_id,
          valor: valorParcela,
          valor_original: valorParcela,
          data_vencimento: format(date, "yyyy-MM-dd"),
          mes_referencia: date.getMonth() + 1,
          ano_referencia: date.getFullYear(),
          responsavel_id: aluno?.responsavel_id || null,
          desconto_motivo: `Parcela ${i + 1}/${parcelamentoData.numero_parcelas} - Ref: ${selectedFatura.id.slice(0, 8)}`,
        });
      }

      // Cancelar fatura original
      await supabase.from("faturas").update({ status: "Cancelada" }).eq("id", selectedFatura.id);
      
      // Criar parcelas
      const { error } = await supabase.from("faturas").insert(parcelas);
      if (error) throw error;

      // Se tiver entrada, registrar pagamento
      if (parcelamentoData.valor_entrada > 0) {
        await supabase.from("pagamentos").insert({
          fatura_id: selectedFatura.id,
          valor: parcelamentoData.valor_entrada,
          metodo: "Entrada Parcelamento",
          referencia: `Entrada do parcelamento em ${parcelamentoData.numero_parcelas}x`,
        });
      }

      return parcelamentoData.numero_parcelas;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      toast.success(`Fatura parcelada em ${count}x!`);
      setIsParcelamentoOpen(false);
      setParcelamentoData({ numero_parcelas: 2, valor_entrada: 0 });
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faturas").update({ status: "Cancelada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Fatura cancelada");
    },
    onError: (error: Error) => toast.error(`Erro: ${error.message}`),
  });

  // Helpers
  const getValorFinal = (fatura: Fatura): number => {
    if (fatura.valor_total && fatura.valor_total > 0) return fatura.valor_total;
    const valorBase = fatura.valor_original || fatura.valor;
    let desconto = fatura.desconto_percentual && fatura.desconto_percentual > 0
      ? valorBase * (fatura.desconto_percentual / 100)
      : (fatura.desconto_valor || 0);
    const juros = fatura.valor_juros_aplicado || fatura.juros || 0;
    const multa = fatura.valor_multa_aplicado || fatura.multa || 0;
    return Math.max(0, valorBase - desconto + juros + multa);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const getStatusConfig = (status: string, dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const vencendoEm7Dias = isAfter(vencimento, hoje) && isBefore(vencimento, addDays(hoje, 7));

    if (status === "Paga") return { label: "Paga", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 };
    if (status === "Vencida") return { label: "Vencida", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle };
    if (status === "Cancelada") return { label: "Cancelada", className: "bg-muted text-muted-foreground border-border", icon: XCircle };
    if (vencendoEm7Dias) return { label: "Vencendo", className: "bg-warning/10 text-warning border-warning/20", icon: Clock };
    return { label: "Aberta", className: "bg-primary/10 text-primary border-primary/20", icon: FileText };
  };

  const resetCreateData = () => {
    setCreateData({
      aluno_id: "",
      curso_id: "",
      valor: 0,
      data_vencimento: format(addDays(new Date(), 10), "yyyy-MM-dd"),
      mes_referencia: new Date().getMonth() + 1,
      ano_referencia: new Date().getFullYear(),
      desconto_tipo: "valor",
      desconto_valor: 0,
      desconto_percentual: 0,
      desconto_motivo: "",
      tipo: "avulsa",
      meses_recorrencia: 12,
    });
  };

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  // Filtered data
  const filteredFaturas = useMemo(() => {
    return faturas.filter((fatura) => {
      const matchesSearch = !searchTerm || 
        fatura.alunos?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.cursos?.nome.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Grouped data
  const groupedByStatus = useMemo(() => {
    const groups: Record<string, Fatura[]> = { Vencida: [], Aberta: [], Paga: [], Cancelada: [] };
    filteredFaturas.forEach(f => {
      const status = f.status;
      if (!groups[status]) groups[status] = [];
      groups[status].push(f);
    });
    return groups;
  }, [filteredFaturas]);

  const groupedByAluno = useMemo(() => {
    const groups: Record<string, { nome: string; faturas: Fatura[] }> = {};
    filteredFaturas.forEach(f => {
      const key = f.aluno_id;
      if (!groups[key]) {
        groups[key] = { nome: f.alunos?.nome_completo || "Sem aluno", faturas: [] };
      }
      groups[key].faturas.push(f);
    });
    return groups;
  }, [filteredFaturas]);

  const groupedByMes = useMemo(() => {
    const groups: Record<string, Fatura[]> = {};
    filteredFaturas.forEach(f => {
      const key = `${f.ano_referencia}-${String(f.mes_referencia).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredFaturas]);

  const stats = {
    total: faturas.length,
    abertas: faturas.filter(f => f.status === "Aberta").length,
    pagas: faturas.filter(f => f.status === "Paga").length,
    vencidas: faturas.filter(f => f.status === "Vencida").length,
  };

  const valorTotal = faturas.filter(f => f.status === "Aberta" || f.status === "Vencida")
    .reduce((acc, f) => acc + getValorFinal(f), 0);

  // Event handlers
  const handleOpenEdit = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setEditData({
      valor_original: fatura.valor_original || fatura.valor,
      data_vencimento: fatura.data_vencimento,
      status: fatura.status,
      desconto_tipo: (fatura.desconto_percentual && fatura.desconto_percentual > 0) ? "percentual" : "valor",
      desconto_valor: fatura.desconto_valor || 0,
      desconto_percentual: fatura.desconto_percentual || 0,
      desconto_motivo: fatura.desconto_motivo || "",
      multa: fatura.multa || 0,
      juros_percentual_diario: fatura.juros_percentual_diario || 0.033,
      juros_percentual_mensal: fatura.juros_percentual_mensal || 1,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedFatura) return;
    editMutation.mutate({
      id: selectedFatura.id,
      updates: {
        valor_original: editData.valor_original,
        valor: editData.valor_original,
        data_vencimento: editData.data_vencimento,
        status: editData.status,
        desconto_valor: editData.desconto_tipo === "valor" ? editData.desconto_valor : 0,
        desconto_percentual: editData.desconto_tipo === "percentual" ? editData.desconto_percentual : 0,
        desconto_motivo: editData.desconto_motivo || null,
        multa: editData.multa,
        juros_percentual_diario: editData.juros_percentual_diario,
        juros_percentual_mensal: editData.juros_percentual_mensal,
      },
    });
  };

  const handleCursoSelect = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    setCreateData(prev => ({
      ...prev,
      curso_id: cursoId,
      valor: curso?.mensalidade || 0,
    }));
  };

  // Render functions
  const renderFaturaRow = (fatura: Fatura) => {
    const statusConfig = getStatusConfig(fatura.status, fatura.data_vencimento);
    const StatusIcon = statusConfig.icon;
    const valorFinal = getValorFinal(fatura);
    const valorOriginal = fatura.valor_original || fatura.valor;
    const temAlteracao = valorFinal !== valorOriginal;

    return (
      <TableRow key={fatura.id} className="hover:bg-muted/30 transition-colors">
        <TableCell className="pl-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {fatura.alunos?.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{fatura.alunos?.nome_completo}</p>
              <p className="text-xs text-muted-foreground">{fatura.cursos?.nome}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {meses[fatura.mes_referencia - 1]?.slice(0, 3)}/{fatura.ano_referencia}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{formatCurrency(valorFinal)}</span>
            {temAlteracao && (
              <span className="text-xs text-muted-foreground line-through">{formatCurrency(valorOriginal)}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">{format(new Date(fatura.data_vencimento), "dd/MM/yy")}</span>
            {fatura.dias_atraso && fatura.dias_atraso > 0 && fatura.status === "Vencida" && (
              <span className="text-xs text-destructive">{fatura.dias_atraso}d atraso</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("font-medium gap-1 px-2 py-0.5 text-xs", statusConfig.className)}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </TableCell>
        <TableCell className="text-right pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => { setSelectedFatura(fatura); setIsDetailsOpen(true); }}>
                <Eye className="h-4 w-4 mr-2" />Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(fatura)}>
                <Pencil className="h-4 w-4 mr-2" />Editar
              </DropdownMenuItem>
              {(fatura.status === "Aberta" || fatura.status === "Vencida") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSelectedFatura(fatura); setIsGeneratingLink(fatura.id); fatura.payment_url ? (setPaymentUrl(fatura.payment_url), setIsPaymentLinkOpen(true), setIsGeneratingLink(null)) : generatePaymentLinkMutation.mutate(fatura.id); }}>
                    <Link className="h-4 w-4 mr-2" />{fatura.payment_url ? "Ver link" : "Gerar link"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedFatura(fatura); setIsPaymentOpen(true); }} className="text-success">
                    <CreditCard className="h-4 w-4 mr-2" />Registrar pagamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedFatura(fatura); setIsParcelamentoOpen(true); }}>
                    <SplitSquareVertical className="h-4 w-4 mr-2" />Parcelar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => cancelMutation.mutate(fatura.id)} className="text-destructive">
                    <Ban className="h-4 w-4 mr-2" />Cancelar
                  </DropdownMenuItem>
                </>
              )}
              {fatura.status === "Paga" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSelectedFatura(fatura); setEmailToSend(fatura.responsaveis?.email || fatura.alunos?.email_responsavel || ""); setIsEmailDialogOpen(true); }}>
                    <Mail className="h-4 w-4 mr-2" />Enviar recibo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  const renderGroupedByStatus = () => (
    <div className="space-y-4">
      {Object.entries(groupedByStatus).map(([status, items]) => {
        if (items.length === 0) return null;
        const isExpanded = expandedGroups.has(status) || expandedGroups.size === 0;
        const config = getStatusConfig(status, new Date().toISOString());
        
        return (
          <Collapsible key={status} open={isExpanded} onOpenChange={() => toggleGroup(status)}>
            <Card className="border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <Badge variant="outline" className={cn("font-medium", config.className)}>
                        {status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{items.length} fatura(s)</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(items.reduce((sum, f) => sum + getValorFinal(f), 0))}</span>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>{items.map(renderFaturaRow)}</TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );

  const renderGroupedByAluno = () => (
    <div className="space-y-4">
      {Object.entries(groupedByAluno).map(([alunoId, { nome, faturas: items }]) => {
        const isExpanded = expandedGroups.has(alunoId);
        const valorTotal = items.reduce((sum, f) => sum + (f.status !== "Paga" && f.status !== "Cancelada" ? getValorFinal(f) : 0), 0);
        
        return (
          <Collapsible key={alunoId} open={isExpanded} onOpenChange={() => toggleGroup(alunoId)}>
            <Card className="border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{nome}</p>
                        <p className="text-xs text-muted-foreground">{items.length} fatura(s)</p>
                      </div>
                    </div>
                    {valorTotal > 0 && <span className="font-semibold text-destructive">{formatCurrency(valorTotal)} pendente</span>}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>{items.map(renderFaturaRow)}</TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );

  const renderGroupedByMes = () => (
    <div className="space-y-4">
      {groupedByMes.map(([key, items]) => {
        const [ano, mes] = key.split("-");
        const isExpanded = expandedGroups.has(key);
        
        return (
          <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleGroup(key)}>
            <Card className="border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{meses[parseInt(mes) - 1]} {ano}</span>
                      <span className="text-sm text-muted-foreground">({items.length})</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(items.reduce((sum, f) => sum + getValorFinal(f), 0))}</span>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>{items.map(renderFaturaRow)}</TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
            <p className="text-muted-foreground text-sm">Gerencie faturas, pagamentos e cobranças</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Fatura
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Abertas" value={stats.abertas} total={stats.total} icon={FileText} variant="default" />
          <StatCard title="Vencidas" value={stats.vencidas} icon={AlertCircle} variant="destructive" />
          <StatCard title="Pagas" value={stats.pagas} icon={CheckCircle2} variant="success" />
          <div className="col-span-2">
            <Card className="border-primary/20 bg-primary/5 h-full">
              <CardContent className="p-4 flex items-center justify-between h-full">
                <div>
                  <p className="text-xs text-muted-foreground">Total a Receber</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/50" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters & View Modes */}
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno ou curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos</SelectItem>
                    <SelectItem value="aberta">Abertas</SelectItem>
                    <SelectItem value="vencida">Vencidas</SelectItem>
                    <SelectItem value="paga">Pagas</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={cn(showFilters && "bg-primary/10")}>
                  <Filter className="h-4 w-4" />
                </Button>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg overflow-hidden">
                  <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode("list")}>
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "status" ? "secondary" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode("status")}>
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "aluno" ? "secondary" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode("aluno")}>
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "mes" ? "secondary" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode("mes")}>
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <Select value={alunoFilter} onValueChange={setAlunoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os alunos</SelectItem>
                    {alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={cursoFilter} onValueChange={setCursoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cursos</SelectItem>
                    {cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {periodoFilter.start ? format(periodoFilter.start, "dd/MM/yy") : "Período"}
                      {periodoFilter.end && ` - ${format(periodoFilter.end, "dd/MM/yy")}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: periodoFilter.start || undefined, to: periodoFilter.end || undefined }}
                      onSelect={(range) => setPeriodoFilter({ start: range?.from || null, end: range?.to || null })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <Card><TableSkeleton /></Card>
        ) : filteredFaturas.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">Nenhuma fatura encontrada</h3>
              <p className="text-sm text-muted-foreground">Ajuste os filtros ou crie uma nova fatura</p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <Card className="border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Aluno</TableHead>
                  <TableHead>Ref.</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{filteredFaturas.map(renderFaturaRow)}</TableBody>
            </Table>
            <CardContent className="border-t py-3 text-center text-sm text-muted-foreground">
              {filteredFaturas.length} de {faturas.length} faturas
            </CardContent>
          </Card>
        ) : viewMode === "status" ? renderGroupedByStatus()
          : viewMode === "aluno" ? renderGroupedByAluno()
          : renderGroupedByMes()
        }

        {/* Create Invoice Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Nova Fatura
              </DialogTitle>
              <DialogDescription>Crie faturas avulsas ou recorrentes</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Tipo */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={createData.tipo === "avulsa" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setCreateData({ ...createData, tipo: "avulsa" })}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Avulsa
                </Button>
                <Button
                  type="button"
                  variant={createData.tipo === "recorrente" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setCreateData({ ...createData, tipo: "recorrente" })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recorrente
                </Button>
              </div>

              {/* Aluno */}
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select value={createData.aluno_id} onValueChange={(v) => setCreateData({ ...createData, aluno_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Curso */}
              <div className="space-y-2">
                <Label>Curso *</Label>
                <Select value={createData.curso_id} onValueChange={handleCursoSelect}>
                  <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                  <SelectContent>
                    {cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} - {formatCurrency(c.mensalidade)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor */}
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createData.valor}
                    onChange={(e) => setCreateData({ ...createData, valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Vencimento ou Meses */}
                {createData.tipo === "avulsa" ? (
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={createData.data_vencimento}
                      onChange={(e) => setCreateData({ ...createData, data_vencimento: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Quantidade de meses</Label>
                    <Select value={String(createData.meses_recorrencia)} onValueChange={(v) => setCreateData({ ...createData, meses_recorrencia: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[3, 6, 12, 24].map(n => <SelectItem key={n} value={String(n)}>{n} meses</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Referência */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês Referência</Label>
                  <Select value={String(createData.mes_referencia)} onValueChange={(v) => setCreateData({ ...createData, mes_referencia: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {meses.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano Referência</Label>
                  <Select value={String(createData.ano_referencia)} onValueChange={(v) => setCreateData({ ...createData, ano_referencia: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desconto */}
              <div className="space-y-2">
                <Label>Desconto (opcional)</Label>
                <div className="flex gap-2">
                  <Select value={createData.desconto_tipo} onValueChange={(v: "valor" | "percentual") => setCreateData({ ...createData, desconto_tipo: v })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valor">R$</SelectItem>
                      <SelectItem value="percentual">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={createData.desconto_tipo === "valor" ? createData.desconto_valor : createData.desconto_percentual}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCreateData({ ...createData, [createData.desconto_tipo === "valor" ? "desconto_valor" : "desconto_percentual"]: val });
                    }}
                    className="flex-1"
                  />
                </div>
                <Input
                  placeholder="Motivo do desconto (opcional)"
                  value={createData.desconto_motivo}
                  onChange={(e) => setCreateData({ ...createData, desconto_motivo: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetCreateData(); }}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !createData.aluno_id || !createData.curso_id}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Criar {createData.tipo === "recorrente" ? `${createData.meses_recorrencia} Faturas` : "Fatura"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Parcelamento Dialog */}
        <Dialog open={isParcelamentoOpen} onOpenChange={setIsParcelamentoOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SplitSquareVertical className="h-5 w-5 text-primary" />
                Parcelar Fatura
              </DialogTitle>
              <DialogDescription>Divida esta fatura em várias parcelas</DialogDescription>
            </DialogHeader>

            {selectedFatura && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                  <p className="text-sm text-muted-foreground">{meses[selectedFatura.mes_referencia - 1]}/{selectedFatura.ano_referencia}</p>
                  <p className="text-lg font-bold mt-2">{formatCurrency(getValorFinal(selectedFatura))}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Parcelas</Label>
                    <Select value={String(parcelamentoData.numero_parcelas)} onValueChange={(v) => setParcelamentoData({ ...parcelamentoData, numero_parcelas: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 10, 12].map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Entrada (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={parcelamentoData.valor_entrada}
                      onChange={(e) => setParcelamentoData({ ...parcelamentoData, valor_entrada: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-primary/5">
                  <p className="text-sm text-muted-foreground mb-2">Simulação:</p>
                  <div className="flex justify-between text-sm">
                    <span>Valor Total:</span>
                    <span>{formatCurrency(getValorFinal(selectedFatura))}</span>
                  </div>
                  {parcelamentoData.valor_entrada > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Entrada:</span>
                      <span>- {formatCurrency(parcelamentoData.valor_entrada)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                    <span>{parcelamentoData.numero_parcelas}x de:</span>
                    <span className="text-primary">
                      {formatCurrency((getValorFinal(selectedFatura) - parcelamentoData.valor_entrada) / parcelamentoData.numero_parcelas)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsParcelamentoOpen(false)}>Cancelar</Button>
              <Button onClick={() => parcelamentoMutation.mutate()} disabled={parcelamentoMutation.isPending}>
                {parcelamentoMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirmar Parcelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Editar Fatura
              </DialogTitle>
            </DialogHeader>

            {selectedFatura && (
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="desconto">Desconto</TabsTrigger>
                  <TabsTrigger value="juros">Juros/Multa</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Base (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.valor_original}
                        onChange={(e) => setEditData({ ...editData, valor_original: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aberta">Aberta</SelectItem>
                          <SelectItem value="Paga">Paga</SelectItem>
                          <SelectItem value="Vencida">Vencida</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={editData.data_vencimento}
                      onChange={(e) => setEditData({ ...editData, data_vencimento: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="desconto" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Select value={editData.desconto_tipo} onValueChange={(v: "valor" | "percentual") => setEditData({ ...editData, desconto_tipo: v })}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valor">R$</SelectItem>
                        <SelectItem value="percentual">%</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.desconto_tipo === "valor" ? editData.desconto_valor : editData.desconto_percentual}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditData({ ...editData, [editData.desconto_tipo === "valor" ? "desconto_valor" : "desconto_percentual"]: val });
                      }}
                      className="flex-1"
                    />
                  </div>
                  <Textarea
                    placeholder="Motivo do desconto"
                    value={editData.desconto_motivo}
                    onChange={(e) => setEditData({ ...editData, desconto_motivo: e.target.value })}
                    rows={2}
                  />
                </TabsContent>

                <TabsContent value="juros" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Juros Diário (%)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={editData.juros_percentual_diario}
                        onChange={(e) => setEditData({ ...editData, juros_percentual_diario: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Multa (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.multa}
                        onChange={(e) => setEditData({ ...editData, multa: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={editMutation.isPending}>
                {editMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={(e) => { e.preventDefault(); selectedFatura && paymentMutation.mutate({ fatura: selectedFatura, ...paymentData }); }}>
              <DialogHeader>
                <DialogTitle>Registrar Pagamento</DialogTitle>
              </DialogHeader>

              {selectedFatura && (
                <div className="my-4 p-4 rounded-lg border bg-muted/30">
                  <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                  <p className="text-2xl font-bold text-success mt-2">{formatCurrency(getValorFinal(selectedFatura))}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Método *</Label>
                  <Select value={paymentData.metodo} onValueChange={(v) => setPaymentData({ ...paymentData, metodo: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referência (opcional)</Label>
                  <Input
                    value={paymentData.referencia}
                    onChange={(e) => setPaymentData({ ...paymentData, referencia: e.target.value })}
                    placeholder="Código do comprovante"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={!paymentData.metodo || paymentMutation.isPending} className="bg-success hover:bg-success/90">
                  {paymentMutation.isPending ? "Processando..." : "Confirmar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Link Dialog */}
        <Dialog open={isPaymentLinkOpen} onOpenChange={setIsPaymentLinkOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                Link de Pagamento
              </DialogTitle>
            </DialogHeader>

            {paymentUrl && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={paymentUrl} readOnly className="bg-muted text-sm" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(paymentUrl); toast.success("Copiado!"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full gap-2" onClick={() => window.open(paymentUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                  Abrir página
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentLinkOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalhes da Fatura
              </DialogTitle>
            </DialogHeader>

            {selectedFatura && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Aluno</p>
                    <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Curso</p>
                    <p className="font-medium">{selectedFatura.cursos?.nome}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Referência</p>
                    <p className="font-medium">{meses[selectedFatura.mes_referencia - 1]}/{selectedFatura.ano_referencia}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="font-medium">{format(new Date(selectedFatura.data_vencimento), "dd/MM/yyyy")}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor Original:</span>
                    <span>{formatCurrency(selectedFatura.valor_original || selectedFatura.valor)}</span>
                  </div>
                  {(selectedFatura.valor_desconto_aplicado || 0) > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Desconto:</span>
                      <span>- {formatCurrency(selectedFatura.valor_desconto_aplicado || 0)}</span>
                    </div>
                  )}
                  {(selectedFatura.valor_juros_aplicado || 0) > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Juros ({selectedFatura.dias_atraso}d):</span>
                      <span>+ {formatCurrency(selectedFatura.valor_juros_aplicado || 0)}</span>
                    </div>
                  )}
                  {(selectedFatura.valor_multa_aplicado || 0) > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Multa:</span>
                      <span>+ {formatCurrency(selectedFatura.valor_multa_aplicado || 0)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t flex justify-between font-semibold">
                    <span>Valor Final:</span>
                    <span className="text-primary text-lg">{formatCurrency(getValorFinal(selectedFatura))}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-sm">{selectedFatura.id}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Enviar Recibo
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={emailToSend}
                onChange={(e) => setEmailToSend(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancelar</Button>
              <Button
                disabled={isSendingEmail || !emailToSend}
                onClick={async () => {
                  if (!selectedFatura) return;
                  setIsSendingEmail(true);
                  try {
                    await supabase.functions.invoke("send-receipt-email", {
                      body: { faturaId: selectedFatura.id, recipientEmail: emailToSend, recipientName: selectedFatura.responsaveis?.nome || selectedFatura.alunos?.nome_completo },
                    });
                    toast.success("Recibo enviado!");
                    setIsEmailDialogOpen(false);
                  } catch (e: any) {
                    toast.error(e.message);
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
              >
                {isSendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
