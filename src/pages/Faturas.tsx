import { useState, useEffect, useMemo } from "react";
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
  Calendar,
  Calculator,
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
import { format, isAfter, isBefore, addDays, differenceInDays } from "date-fns";
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
  // Desconto
  desconto_valor?: number | null;
  desconto_percentual?: number | null;
  desconto_motivo?: string | null;
  valor_desconto_aplicado?: number | null;
  // Juros e Multa
  juros?: number | null;
  multa?: number | null;
  juros_percentual_diario?: number | null;
  juros_percentual_mensal?: number | null;
  dias_atraso?: number | null;
  valor_juros_aplicado?: number | null;
  valor_multa_aplicado?: number | null;
  // Relacionamentos
  alunos?: { nome_completo: string; email_responsavel: string; responsavel_id?: string | null };
  cursos?: { nome: string };
  responsaveis?: { nome: string; email: string | null; telefone: string } | null;
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
  variant,
  valuePrefix,
}: { 
  title: string; 
  value: number | string;
  total?: number;
  icon: React.ElementType; 
  variant: "default" | "success" | "warning" | "destructive";
  valuePrefix?: string;
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
              {valuePrefix}{value}
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
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailToSend, setEmailToSend] = useState("");
  const [paymentData, setPaymentData] = useState({
    metodo: "",
    referencia: "",
  });

  // Estado para edição de fatura
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
          successUrl: `${window.location.origin}/pagamento/resultado?success=true&fatura_id=${faturaId}`,
          cancelUrl: `${window.location.origin}/pagamento/resultado?canceled=true&fatura_id=${faturaId}`,
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

  // Mutation para pagamento manual
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
      toast.success("Pagamento registrado com sucesso!");
      setIsPaymentOpen(false);
      setPaymentData({ metodo: "", referencia: "" });
    },
    onError: (error: Error) => {
      console.error("Erro ao registrar pagamento:", error);
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  // Mutation para editar fatura
  const editMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Fatura> }) => {
      const { error } = await supabase
        .from("faturas")
        .update(data.updates)
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      toast.success("Fatura atualizada com sucesso!");
      setIsEditOpen(false);
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar fatura:", error);
      toast.error(`Erro ao atualizar fatura: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faturas").update({ status: "Cancelada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Fatura cancelada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Erro ao cancelar fatura:", error);
      toast.error(`Erro ao cancelar fatura: ${error.message}`);
    },
  });

  // Função para calcular valor final
  const getValorFinal = (fatura: Fatura): number => {
    if (fatura.valor_total && fatura.valor_total > 0) {
      return fatura.valor_total;
    }
    
    const valorBase = fatura.valor_original || fatura.valor;
    let desconto = 0;
    
    if (fatura.desconto_percentual && fatura.desconto_percentual > 0) {
      desconto = valorBase * (fatura.desconto_percentual / 100);
    } else if (fatura.desconto_valor && fatura.desconto_valor > 0) {
      desconto = fatura.desconto_valor;
    }
    
    const juros = fatura.valor_juros_aplicado || fatura.juros || 0;
    const multa = fatura.valor_multa_aplicado || fatura.multa || 0;
    
    return Math.max(0, valorBase - desconto + juros + multa);
  };

  // Calcular dias de atraso
  const calcularDiasAtraso = (dataVencimento: string): number => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    if (hoje > vencimento) {
      return differenceInDays(hoje, vencimento);
    }
    return 0;
  };

  // Função para escapar HTML e prevenir XSS
  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const generateReceipt = (fatura: Fatura) => {
    supabase
      .from("pagamentos")
      .select("*")
      .eq("fatura_id", fatura.id)
      .order("data_pagamento", { ascending: false })
      .limit(1)
      .then(({ data: pagamentos }) => {
        const pagamento = pagamentos?.[0];
        const valorFinal = getValorFinal(fatura);
        
        const receiptContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Recibo de Pagamento</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
              .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { color: #3b82f6; font-size: 28px; margin-bottom: 8px; }
              .header p { color: #666; font-size: 14px; }
              .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
              .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .info-row:last-child { border-bottom: none; }
              .info-label { color: #666; }
              .info-value { font-weight: 600; color: #333; }
              .info-value.discount { color: #10b981; }
              .info-value.fee { color: #ef4444; }
              .amount { text-align: center; background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; }
              .amount-label { font-size: 14px; color: #666; margin-bottom: 5px; }
              .amount-value { font-size: 32px; font-weight: 700; color: #10b981; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
              .footer p { font-size: 12px; color: #888; }
              .footer .date { margin-top: 10px; font-size: 11px; }
              @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h1>📋 Recibo de Pagamento</h1>
                <p>Comprovante de quitação de mensalidade</p>
                <span class="badge">✓ PAGO</span>
              </div>
              
              <div class="section">
                <div class="section-title">Dados do Aluno</div>
                <div class="info-row">
                  <span class="info-label">Nome:</span>
                  <span class="info-value">${escapeHtml(fatura.alunos?.nome_completo) || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Curso:</span>
                  <span class="info-value">${escapeHtml(fatura.cursos?.nome) || 'N/A'}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Detalhes da Fatura</div>
                <div class="info-row">
                  <span class="info-label">Referência:</span>
                  <span class="info-value">${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Vencimento:</span>
                  <span class="info-value">${format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Nº Fatura:</span>
                  <span class="info-value">${fatura.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Valores</div>
                <div class="info-row">
                  <span class="info-label">Valor Original:</span>
                  <span class="info-value">${formatCurrency(fatura.valor_original || fatura.valor)}</span>
                </div>
                ${(fatura.valor_desconto_aplicado || 0) > 0 ? `
                <div class="info-row">
                  <span class="info-label">Desconto${fatura.desconto_motivo ? ` (${escapeHtml(fatura.desconto_motivo)})` : ''}:</span>
                  <span class="info-value discount">- ${formatCurrency(fatura.valor_desconto_aplicado || 0)}</span>
                </div>
                ` : ''}
                ${(fatura.valor_juros_aplicado || 0) > 0 ? `
                <div class="info-row">
                  <span class="info-label">Juros (${fatura.dias_atraso} dias):</span>
                  <span class="info-value fee">+ ${formatCurrency(fatura.valor_juros_aplicado || 0)}</span>
                </div>
                ` : ''}
                ${(fatura.valor_multa_aplicado || 0) > 0 ? `
                <div class="info-row">
                  <span class="info-label">Multa:</span>
                  <span class="info-value fee">+ ${formatCurrency(fatura.valor_multa_aplicado || 0)}</span>
                </div>
                ` : ''}
              </div>

              ${pagamento ? `
              <div class="section">
                <div class="section-title">Dados do Pagamento</div>
                <div class="info-row">
                  <span class="info-label">Data do Pagamento:</span>
                  <span class="info-value">${format(new Date(pagamento.data_pagamento), "dd/MM/yyyy")}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Método:</span>
                  <span class="info-value">${escapeHtml(pagamento.metodo)}</span>
                </div>
                ${pagamento.referencia ? `
                <div class="info-row">
                  <span class="info-label">Referência:</span>
                  <span class="info-value">${escapeHtml(pagamento.referencia)}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <div class="amount">
                <div class="amount-label">Valor Pago</div>
                <div class="amount-value">${formatCurrency(valorFinal)}</div>
              </div>
              
              <div class="footer">
                <p>Este documento é um comprovante de pagamento.</p>
                <p class="date">Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(receiptContent);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
          toast.success("Recibo gerado!");
        } else {
          toast.error("Não foi possível abrir a janela do recibo.");
        }
      });
  };

  const handleOpenEmailDialog = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    const email = fatura.responsaveis?.email || fatura.alunos?.email_responsavel || "";
    setEmailToSend(email);
    setIsEmailDialogOpen(true);
  };

  const handleSendReceiptEmail = async () => {
    if (!selectedFatura || !emailToSend) {
      toast.error("Email é obrigatório");
      return;
    }

    setIsSendingEmail(true);
    try {
      const recipientName = selectedFatura.responsaveis?.nome || 
        selectedFatura.alunos?.nome_completo?.split(" ")[0] || 
        "Responsável";

      const { error } = await supabase.functions.invoke("send-receipt-email", {
        body: {
          faturaId: selectedFatura.id,
          recipientEmail: emailToSend,
          recipientName: recipientName,
        },
      });

      if (error) throw error;

      toast.success("Recibo enviado por email com sucesso!");
      setIsEmailDialogOpen(false);
      setEmailToSend("");
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      if (error.message?.includes("non-2xx")) {
        toast.error("Erro: Configure um domínio verificado no Resend.");
      } else {
        toast.error(`Erro ao enviar email: ${error.message}`);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleOpenPayment = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsPaymentOpen(true);
  };

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

    const updates: Partial<Fatura> = {
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
    };

    editMutation.mutate({ id: selectedFatura.id, updates });
  };

  // Calcular preview do valor final na edição
  const calcularPreviewValorFinal = useMemo(() => {
    const valorBase = editData.valor_original;
    let desconto = 0;
    
    if (editData.desconto_tipo === "percentual") {
      desconto = valorBase * (editData.desconto_percentual / 100);
    } else {
      desconto = editData.desconto_valor;
    }
    
    desconto = Math.min(desconto, valorBase);
    
    const diasAtraso = calcularDiasAtraso(editData.data_vencimento);
    let juros = 0;
    
    if (diasAtraso > 0 && editData.status !== "Paga" && editData.status !== "Cancelada") {
      if (editData.juros_percentual_diario > 0) {
        juros = (valorBase - desconto) * (editData.juros_percentual_diario / 100) * diasAtraso;
      } else if (editData.juros_percentual_mensal > 0) {
        juros = (valorBase - desconto) * (editData.juros_percentual_mensal / 100) * (diasAtraso / 30);
      }
    }
    
    const multa = diasAtraso > 0 && editData.status !== "Paga" && editData.status !== "Cancelada" 
      ? editData.multa 
      : 0;
    
    return {
      valorBase,
      desconto,
      juros,
      multa,
      diasAtraso,
      total: Math.max(0, valorBase - desconto + juros + multa),
    };
  }, [editData]);

  const handleGeneratePaymentLink = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsGeneratingLink(fatura.id);
    
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
    toast.success("Link copiado!");
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
    .reduce((acc, f) => acc + getValorFinal(f), 0);

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
            Gerencie faturas com desconto, juros e multa por atraso
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
                    <p className="text-sm text-muted-foreground">Total a receber (com juros/multa)</p>
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
                    const valorFinal = getValorFinal(fatura);
                    const valorOriginal = fatura.valor_original || fatura.valor;
                    const temAlteracao = valorFinal !== valorOriginal;
                    
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
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground value-currency">
                              {formatCurrency(valorFinal)}
                            </span>
                            {temAlteracao && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(valorOriginal)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">
                              {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}
                            </span>
                            {fatura.dias_atraso && fatura.dias_atraso > 0 && fatura.status === "Vencida" && (
                              <span className="text-xs text-destructive">
                                {fatura.dias_atraso} dias de atraso
                              </span>
                            )}
                          </div>
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
                            <DropdownMenuContent align="end" className="w-52 rounded-xl">
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer"
                                onClick={() => {
                                  setSelectedFatura(fatura);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer"
                                onClick={() => handleOpenEdit(fatura)}
                              >
                                <Pencil className="h-4 w-4" />
                                Editar fatura
                              </DropdownMenuItem>
                              {(fatura.status === "Aberta" || fatura.status === "Vencida") && (
                                <>
                                  <DropdownMenuSeparator />
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
                                    Registrar pagamento
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
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer"
                                    onClick={() => generateReceipt(fatura)}
                                  >
                                    <Download className="h-4 w-4" />
                                    Baixar recibo
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="gap-2 cursor-pointer text-primary focus:text-primary"
                                    onClick={() => handleOpenEmailDialog(fatura)}
                                  >
                                    <Mail className="h-4 w-4" />
                                    Enviar recibo por email
                                  </DropdownMenuItem>
                                </>
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

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Editar Fatura
              </DialogTitle>
              <DialogDescription>
                Configure desconto, juros e multa para esta fatura.
              </DialogDescription>
            </DialogHeader>
            
            {selectedFatura && (
              <div className="space-y-6">
                {/* Info do Aluno */}
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {selectedFatura.alunos?.nome_completo.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">
                        {meses[selectedFatura.mes_referencia - 1]}/{selectedFatura.ano_referencia} • {selectedFatura.cursos?.nome}
                      </p>
                    </div>
                  </div>
                </div>

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
                          min="0"
                          value={editData.valor_original}
                          onChange={(e) => setEditData({ ...editData, valor_original: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={editData.status} 
                          onValueChange={(value) => setEditData({ ...editData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                      <Label>Data de Vencimento</Label>
                      <Input
                        type="date"
                        value={editData.data_vencimento}
                        onChange={(e) => setEditData({ ...editData, data_vencimento: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="desconto" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Tipo de Desconto</Label>
                      <Select 
                        value={editData.desconto_tipo} 
                        onValueChange={(value: "valor" | "percentual") => setEditData({ ...editData, desconto_tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="valor">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Valor Fixo (R$)
                            </div>
                          </SelectItem>
                          <SelectItem value="percentual">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Percentual (%)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editData.desconto_tipo === "valor" ? (
                      <div className="space-y-2">
                        <Label>Valor do Desconto (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editData.desconto_valor}
                          onChange={(e) => setEditData({ ...editData, desconto_valor: parseFloat(e.target.value) || 0 })}
                          placeholder="0,00"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Percentual do Desconto (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editData.desconto_percentual}
                          onChange={(e) => setEditData({ ...editData, desconto_percentual: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Motivo do Desconto (opcional)</Label>
                      <Textarea
                        value={editData.desconto_motivo}
                        onChange={(e) => setEditData({ ...editData, desconto_motivo: e.target.value })}
                        placeholder="Ex: Desconto por pontualidade, irmão matriculado, etc."
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="juros" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Juros Diário (%)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={editData.juros_percentual_diario}
                          onChange={(e) => setEditData({ ...editData, juros_percentual_diario: parseFloat(e.target.value) || 0 })}
                          placeholder="0,033"
                        />
                        <p className="text-xs text-muted-foreground">Aplicado por dia de atraso</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Juros Mensal (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editData.juros_percentual_mensal}
                          onChange={(e) => setEditData({ ...editData, juros_percentual_mensal: parseFloat(e.target.value) || 0 })}
                          placeholder="1"
                        />
                        <p className="text-xs text-muted-foreground">Usado se juros diário = 0</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Multa Fixa por Atraso (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.multa}
                        onChange={(e) => setEditData({ ...editData, multa: parseFloat(e.target.value) || 0 })}
                        placeholder="0,00"
                      />
                      <p className="text-xs text-muted-foreground">Cobrada uma única vez após o vencimento</p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Preview do Cálculo */}
                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="h-4 w-4" />
                    Preview do Cálculo
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Base:</span>
                      <span>{formatCurrency(calcularPreviewValorFinal.valorBase)}</span>
                    </div>
                    {calcularPreviewValorFinal.desconto > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(calcularPreviewValorFinal.desconto)}</span>
                      </div>
                    )}
                    {calcularPreviewValorFinal.juros > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Juros ({calcularPreviewValorFinal.diasAtraso}d):</span>
                        <span>+ {formatCurrency(calcularPreviewValorFinal.juros)}</span>
                      </div>
                    )}
                    {calcularPreviewValorFinal.multa > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Multa:</span>
                        <span>+ {formatCurrency(calcularPreviewValorFinal.multa)}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t flex justify-between font-semibold">
                    <span>Valor Final:</span>
                    <span className="text-primary text-lg">{formatCurrency(calcularPreviewValorFinal.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={editMutation.isPending}
              >
                {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                <div className="my-6 space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 border">
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
                  </div>

                  {/* Breakdown do Valor */}
                  <div className="p-4 rounded-xl border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Original:</span>
                      <span>{formatCurrency(selectedFatura.valor_original || selectedFatura.valor)}</span>
                    </div>
                    {(selectedFatura.valor_desconto_aplicado || 0) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(selectedFatura.valor_desconto_aplicado || 0)}</span>
                      </div>
                    )}
                    {(selectedFatura.valor_juros_aplicado || 0) > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Juros ({selectedFatura.dias_atraso}d):</span>
                        <span>+ {formatCurrency(selectedFatura.valor_juros_aplicado || 0)}</span>
                      </div>
                    )}
                    {(selectedFatura.valor_multa_aplicado || 0) > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Multa:</span>
                        <span>+ {formatCurrency(selectedFatura.valor_multa_aplicado || 0)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t flex justify-between font-semibold">
                      <span>Valor a Pagar:</span>
                      <span className="text-xl text-success">{formatCurrency(getValorFinal(selectedFatura))}</span>
                    </div>
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
                    {formatCurrency(getValorFinal(selectedFatura))}
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

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalhes da Fatura
              </DialogTitle>
              <DialogDescription>
                Informações completas da fatura selecionada.
              </DialogDescription>
            </DialogHeader>
            
            {selectedFatura && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {selectedFatura.alunos?.nome_completo.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedFatura.alunos?.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">{selectedFatura.cursos?.nome}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Referência</p>
                    <p className="font-medium">{meses[selectedFatura.mes_referencia - 1]}/{selectedFatura.ano_referencia}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "font-medium gap-1.5",
                        getStatusConfig(selectedFatura.status, selectedFatura.data_vencimento).className
                      )}
                    >
                      {selectedFatura.status}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Vencimento</p>
                    <p className="font-medium">{format(new Date(selectedFatura.data_vencimento), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Emissão</p>
                    <p className="font-medium">{format(new Date(selectedFatura.data_emissao), "dd/MM/yyyy")}</p>
                  </div>
                </div>

                {/* Breakdown Financeiro */}
                <div className="p-4 rounded-xl border space-y-2">
                  <p className="text-sm font-medium mb-3">Composição do Valor</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor Original:</span>
                    <span>{formatCurrency(selectedFatura.valor_original || selectedFatura.valor)}</span>
                  </div>
                  {(selectedFatura.valor_desconto_aplicado || 0) > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Desconto{selectedFatura.desconto_motivo ? ` (${selectedFatura.desconto_motivo})` : ''}:</span>
                      <span>- {formatCurrency(selectedFatura.valor_desconto_aplicado || 0)}</span>
                    </div>
                  )}
                  {(selectedFatura.valor_juros_aplicado || 0) > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Juros ({selectedFatura.dias_atraso} dias):</span>
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
                    <span className="text-primary">{formatCurrency(getValorFinal(selectedFatura))}</span>
                  </div>
                </div>

                {selectedFatura.responsaveis && (
                  <div className="p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">Responsável</p>
                    <p className="font-medium">{selectedFatura.responsaveis.nome}</p>
                    {selectedFatura.responsaveis.email && (
                      <p className="text-sm text-muted-foreground">{selectedFatura.responsaveis.email}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{selectedFatura.responsaveis.telefone}</p>
                  </div>
                )}

                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">ID da Fatura</p>
                  <p className="font-mono text-sm">{selectedFatura.id}</p>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Receipt Dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Enviar Recibo por Email
              </DialogTitle>
              <DialogDescription>
                O recibo será enviado para o email informado.
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
                  <span className="text-xl font-bold text-success value-currency">
                    {formatCurrency(getValorFinal(selectedFatura))}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-sm font-medium">Email do destinatário</Label>
              <Input
                type="email"
                value={emailToSend}
                onChange={(e) => setEmailToSend(e.target.value)}
                placeholder="email@exemplo.com"
                className="h-11"
              />
              {!emailToSend && (
                <p className="text-xs text-destructive">
                  Nenhum email cadastrado. Digite manualmente.
                </p>
              )}
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendReceiptEmail}
                disabled={isSendingEmail || !emailToSend}
                className="gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar recibo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
