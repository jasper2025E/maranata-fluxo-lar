import { useState } from "react";
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
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Fatura {
  id: string;
  aluno_id: string;
  curso_id: string;
  valor: number;
  mes_referencia: number;
  ano_referencia: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  payment_url?: string | null;
  stripe_checkout_session_id?: string | null;
  alunos?: { nome_completo: string; email_responsavel: string };
  cursos?: { nome: string };
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Stat Card Component - Enterprise Style
function StatCard({ 
  title, 
  value, 
  total,
  icon: Icon, 
  variant 
}: { 
  title: string; 
  value: number;
  total?: number;
  icon: React.ElementType; 
  variant: "default" | "success" | "warning" | "destructive";
}) {
  const variants = {
    default: {
      bg: "bg-primary/5",
      icon: "text-primary bg-primary/10",
      text: "text-primary",
      border: "border-primary/10",
    },
    success: {
      bg: "bg-success/5",
      icon: "text-success bg-success/10",
      text: "text-success",
      border: "border-success/10",
    },
    warning: {
      bg: "bg-warning/5",
      icon: "text-warning bg-warning/10",
      text: "text-warning",
      border: "border-warning/10",
    },
    destructive: {
      bg: "bg-destructive/5",
      icon: "text-destructive bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/10",
    },
  };

  const style = variants[variant];

  return (
    <Card className={cn(
      "border shadow-card hover:shadow-card-hover transition-all duration-300",
      style.border
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-3xl font-bold tracking-tight", style.text)}>
              {value}
            </p>
            {total !== undefined && (
              <p className="text-xs text-muted-foreground">
                de {total} faturas
              </p>
            )}
          </div>
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center",
            style.icon
          )}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Table Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
        </div>
      ))}
    </div>
  );
}

const Faturas = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPaymentLinkOpen, setIsPaymentLinkOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState({
    metodo: "",
    referencia: "",
  });

  const { data: faturas = [], isLoading } = useQuery({
    queryKey: ["faturas"],
    queryFn: async () => {
      await supabase.rpc("atualizar_status_faturas");
      
      const { data, error } = await supabase
        .from("faturas")
        .select("*, alunos(nome_completo, email_responsavel), cursos(nome)")
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Fatura[];
    },
  });

  // Mutation para gerar link de pagamento Stripe
  const generatePaymentLinkMutation = useMutation({
    mutationFn: async (faturaId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await supabase.functions.invoke("create-checkout", {
        body: {
          faturaId,
          successUrl: `${window.location.origin}/faturas?success=true&fatura_id=${faturaId}`,
          cancelUrl: `${window.location.origin}/faturas?canceled=true`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao gerar link de pagamento");
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      setPaymentUrl(data.url);
      setIsPaymentLinkOpen(true);
      setIsGeneratingLink(null);
      if (data.existing) {
        toast.info("Link de pagamento recuperado");
      } else {
        toast.success("Link de pagamento gerado com sucesso!");
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao gerar link de pagamento:", error);
      toast.error(`Erro: ${error.message}`);
      setIsGeneratingLink(null);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { fatura: Fatura; metodo: string; referencia: string }) => {
      const { error: paymentError } = await supabase.from("pagamentos").insert({
        fatura_id: data.fatura.id,
        valor: data.fatura.valor,
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
      toast.success("Pagamento registrado com sucesso!");
      setIsPaymentOpen(false);
      setPaymentData({ metodo: "", referencia: "" });
    },
    onError: (error: Error) => {
      console.error("Erro ao registrar pagamento:", error);
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faturas").update({ status: "Cancelada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      toast.success("Fatura cancelada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Erro ao cancelar fatura:", error);
      toast.error(`Erro ao cancelar fatura: ${error.message}`);
    },
  });

  const handleOpenPayment = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsPaymentOpen(true);
  };

  const handleGeneratePaymentLink = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsGeneratingLink(fatura.id);
    
    // Se já tem URL, mostrar direto
    if (fatura.payment_url) {
      setPaymentUrl(fatura.payment_url);
      setIsPaymentLinkOpen(true);
      setIsGeneratingLink(null);
      return;
    }
    
    generatePaymentLinkMutation.mutate(fatura.id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFatura) {
      paymentMutation.mutate({
        fatura: selectedFatura,
        metodo: paymentData.metodo,
        referencia: paymentData.referencia,
      });
    }
  };

  const getStatusConfig = (status: string, dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const vencendoEm7Dias = isAfter(vencimento, hoje) && isBefore(vencimento, addDays(hoje, 7));

    if (status === "Paga") {
      return {
        label: "Paga",
        variant: "success" as const,
        className: "bg-success/10 text-success border-success/20 hover:bg-success/15",
        icon: CheckCircle2,
      };
    }
    if (status === "Vencida") {
      return {
        label: "Vencida",
        variant: "destructive" as const,
        className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
        icon: AlertCircle,
      };
    }
    if (status === "Cancelada") {
      return {
        label: "Cancelada",
        variant: "secondary" as const,
        className: "bg-muted text-muted-foreground border-border hover:bg-muted",
        icon: XCircle,
      };
    }
    if (vencendoEm7Dias) {
      return {
        label: "Vencendo",
        variant: "warning" as const,
        className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
        icon: Clock,
      };
    }
    return {
      label: "Aberta",
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
      icon: FileText,
    };
  };

  const filteredFaturas = faturas.filter((fatura) => {
    const matchesSearch =
      fatura.alunos?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatura.cursos?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todas" || fatura.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: faturas.length,
    abertas: faturas.filter((f) => f.status === "Aberta").length,
    pagas: faturas.filter((f) => f.status === "Paga").length,
    vencidas: faturas.filter((f) => f.status === "Vencida").length,
    vencendo: faturas.filter((f) => {
      const hoje = new Date();
      const vencimento = new Date(f.data_vencimento);
      return f.status === "Aberta" && isAfter(vencimento, hoje) && isBefore(vencimento, addDays(hoje, 7));
    }).length,
  };

  const valorTotal = faturas.filter(f => f.status === "Aberta" || f.status === "Vencida")
    .reduce((acc, f) => acc + f.valor, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Faturas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as faturas e acompanhe os pagamentos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <StatCard 
            title="Abertas" 
            value={stats.abertas} 
            total={stats.total}
            icon={FileText} 
            variant="default" 
          />
          <StatCard 
            title="Pagas" 
            value={stats.pagas}
            total={stats.total} 
            icon={CheckCircle2} 
            variant="success" 
          />
          <StatCard 
            title="Vencendo" 
            value={stats.vencendo}
            icon={Clock} 
            variant="warning" 
          />
          <StatCard 
            title="Vencidas" 
            value={stats.vencidas}
            icon={AlertCircle} 
            variant="destructive" 
          />
        </div>

        {/* Value Summary */}
        {valorTotal > 0 && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent animate-fade-in">
            <CardContent className="py-4 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total a receber</p>
                    <p className="text-2xl font-bold text-foreground value-currency">
                      {formatCurrency(valorTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table Card */}
        <Card className="border shadow-card rounded-2xl overflow-hidden animate-fade-in">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Lista de Faturas</CardTitle>
                <CardDescription className="text-sm">
                  {filteredFaturas.length} fatura(s) encontrada(s)
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 h-10 bg-background"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 h-10 bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="aberta">Abertas</SelectItem>
                    <SelectItem value="paga">Pagas</SelectItem>
                    <SelectItem value="vencida">Vencidas</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredFaturas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Nenhuma fatura encontrada
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchTerm 
                    ? "Tente ajustar os filtros de busca." 
                    : "As faturas aparecerão aqui quando forem geradas."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="font-semibold text-foreground pl-6">Aluno</TableHead>
                    <TableHead className="font-semibold text-foreground">Curso</TableHead>
                    <TableHead className="font-semibold text-foreground">Referência</TableHead>
                    <TableHead className="font-semibold text-foreground">Valor</TableHead>
                    <TableHead className="font-semibold text-foreground">Vencimento</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="text-right font-semibold text-foreground pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaturas.map((fatura) => {
                    const statusConfig = getStatusConfig(fatura.status, fatura.data_vencimento);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={fatura.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {fatura.alunos?.nome_completo.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">
                              {fatura.alunos?.nome_completo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fatura.cursos?.nome}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {meses[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground value-currency">
                            {formatCurrency(fatura.valor)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium gap-1.5 px-2.5 py-1",
                              statusConfig.className
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              {(fatura.status === "Aberta" || fatura.status === "Vencida") && (
                                <>
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer text-primary focus:text-primary"
                                    onClick={() => handleGeneratePaymentLink(fatura)}
                                    disabled={isGeneratingLink === fatura.id}
                                  >
                                    {isGeneratingLink === fatura.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Link className="h-4 w-4" />
                                    )}
                                    {fatura.payment_url ? "Ver link de pagamento" : "Gerar link de pagamento"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer text-success focus:text-success"
                                    onClick={() => handleOpenPayment(fatura)}
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Registrar pagamento manual
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => cancelMutation.mutate(fatura.id)}
                                  >
                                    <Ban className="h-4 w-4" />
                                    Cancelar fatura
                                  </DropdownMenuItem>
                                </>
                              )}
                              {fatura.status === "Paga" && (
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                  <Download className="h-4 w-4" />
                                  Baixar recibo
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <form onSubmit={handleSubmitPayment}>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Registrar Pagamento</DialogTitle>
                <DialogDescription>
                  Confirme os dados do pagamento abaixo.
                </DialogDescription>
              </DialogHeader>
              
              {selectedFatura && (
                <div className="my-6 p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {selectedFatura.alunos?.nome_completo.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">
                        {meses[selectedFatura.mes_referencia - 1]}/{selectedFatura.ano_referencia}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Valor</span>
                    <span className="text-xl font-bold text-success value-currency">
                      {formatCurrency(selectedFatura.valor)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Método de Pagamento</Label>
                  <Select 
                    value={paymentData.metodo} 
                    onValueChange={(value) => setPaymentData({ ...paymentData, metodo: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão de Crédito/Débito</SelectItem>
                      <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Referência/Comprovante (opcional)</Label>
                  <Input
                    value={paymentData.referencia}
                    onChange={(e) => setPaymentData({ ...paymentData, referencia: e.target.value })}
                    placeholder="Código do comprovante ou observação"
                    className="h-11"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!paymentData.metodo || paymentMutation.isPending}
                  className="bg-success hover:bg-success/90"
                >
                  {paymentMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Link Dialog */}
        <Dialog open={isPaymentLinkOpen} onOpenChange={setIsPaymentLinkOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                Link de Pagamento
              </DialogTitle>
              <DialogDescription>
                Compartilhe este link com o responsável para pagamento online.
              </DialogDescription>
            </DialogHeader>
            
            {selectedFatura && (
              <div className="my-4 p-4 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {selectedFatura.alunos?.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">
                      {meses[selectedFatura.mes_referencia - 1]}/{selectedFatura.ano_referencia}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <span className="text-xl font-bold text-primary value-currency">
                    {formatCurrency(selectedFatura.valor)}
                  </span>
                </div>
              </div>
            )}

            {paymentUrl && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Link de pagamento:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={paymentUrl} 
                    readOnly 
                    className="flex-1 text-sm bg-muted"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(paymentUrl)}
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O responsável pode acessar este link para pagar com cartão de crédito ou boleto.
                </p>
              </div>
            )}

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setIsPaymentLinkOpen(false)}>
                Fechar
              </Button>
              {paymentUrl && (
                <Button 
                  onClick={() => window.open(paymentUrl, "_blank")}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir página de pagamento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
