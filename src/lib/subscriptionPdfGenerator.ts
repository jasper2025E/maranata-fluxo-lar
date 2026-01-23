import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EscolaInfo {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

interface SubscriptionInvoice {
  id: string;
  event_type: string;
  amount: number | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  new_status: string | null;
}

interface TenantInfo {
  nome: string;
  plano: string;
  email?: string;
  cnpj?: string;
}

const PRIMARY_COLOR: [number, number, number] = [124, 58, 237]; // Violet
const DARK_COLOR: [number, number, number] = [30, 41, 59];
const MUTED_COLOR: [number, number, number] = [100, 116, 139];
const SUCCESS_COLOR: [number, number, number] = [34, 197, 94];

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 15, 18);
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 15, 28);
  }
  
  // Logo placeholder
  doc.setFontSize(12);
  doc.text("Sistema de Gestão Escolar", pageWidth - 15, 22, { align: "right" });
  
  return 45;
}

function addFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(...MUTED_COLOR);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
  
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, pageHeight - 10, { align: "center" });
}

const planLabels: Record<string, string> = {
  basic: "Básico",
  pro: "Profissional",
  enterprise: "Enterprise",
};

const eventLabels: Record<string, string> = {
  created: "Conta Criada",
  activated: "Assinatura Ativada",
  payment_received: "Pagamento Recebido",
  payment_failed: "Falha no Pagamento",
  subscription_updated: "Plano Atualizado",
  subscription_cancelled: "Assinatura Cancelada",
  suspended: "Assinatura Suspensa",
  reactivated: "Assinatura Reativada",
  checkout_started: "Checkout Iniciado",
  trial_started: "Período de Teste",
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export async function generateSubscriptionInvoicePDF(
  invoice: SubscriptionInvoice,
  tenant: TenantInfo,
  escola?: EscolaInfo
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, "RECIBO DE ASSINATURA", `Nº ${invoice.id.slice(0, 8).toUpperCase()}`);
  
  // Status badge
  doc.setFillColor(...SUCCESS_COLOR);
  doc.roundedRect(pageWidth - 45, 45, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PAGO", pageWidth - 30, 50, { align: "center" });
  
  y += 10;
  
  // Main info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, pageWidth - 30, 60, 3, 3, 'FD');
  
  // School info
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Recebemos de:", 20, y + 10);
  
  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(escola?.nome || tenant.nome, 20, y + 20);
  
  if (escola?.cnpj || tenant.cnpj) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${escola?.cnpj || tenant.cnpj}`, 20, y + 27);
  }
  
  // Plan info
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Referente a:", 20, y + 40);
  
  doc.setFontSize(12);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(`Assinatura Plano ${planLabels[tenant.plano] || tenant.plano}`, 20, y + 48);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(invoice.created_at), "MMMM 'de' yyyy", { locale: ptBR }), 20, y + 55);
  
  // Amount
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Valor:", pageWidth - 70, y + 40);
  
  doc.setFontSize(20);
  doc.setTextColor(...SUCCESS_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(invoice.amount || 0), pageWidth - 70, y + 52);
  
  y += 75;
  
  // Details table
  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Detalhes"]],
    body: [
      ["Tipo de Evento", eventLabels[invoice.event_type] || invoice.event_type],
      ["Data", format(new Date(invoice.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
      ["Plano", planLabels[tenant.plano] || tenant.plano],
      ["Valor Mensal", formatCurrency(invoice.amount || 0)],
      ["ID da Transação", invoice.id],
    ],
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: DARK_COLOR,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    margin: { left: 15, right: 15 },
  });
  
  y = (doc as any).lastAutoTable.finalY + 20;
  
  // Terms
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Este documento é um comprovante de pagamento da assinatura do sistema.", 15, y);
  doc.text("Para dúvidas ou suporte, entre em contato com nossa equipe.", 15, y + 6);
  
  addFooter(doc);
  
  const filename = `recibo-assinatura-${format(new Date(invoice.created_at), "yyyy-MM")}.pdf`;
  doc.save(filename);
}

export async function generateSubscriptionHistoryPDF(
  invoices: SubscriptionInvoice[],
  tenant: TenantInfo,
  escola?: EscolaInfo
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, "HISTÓRICO DE ASSINATURA", escola?.nome || tenant.nome);
  
  // Summary box
  const totalPago = invoices
    .filter(i => i.event_type === "payment_received" || i.event_type === "activated")
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, pageWidth - 30, 35, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Plano Atual:", 20, y + 12);
  doc.text("Total Pago:", pageWidth / 2, y + 12);
  doc.text("Eventos:", pageWidth - 60, y + 12);
  
  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(planLabels[tenant.plano] || tenant.plano, 20, y + 25);
  
  doc.setTextColor(...SUCCESS_COLOR);
  doc.text(formatCurrency(totalPago), pageWidth / 2, y + 25);
  
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(invoices.length.toString(), pageWidth - 60, y + 25);
  
  y += 45;
  
  // History table
  const tableData = invoices.map(inv => [
    format(new Date(inv.created_at), "dd/MM/yyyy", { locale: ptBR }),
    eventLabels[inv.event_type] || inv.event_type,
    inv.amount ? formatCurrency(inv.amount) : "-",
    inv.new_status || "-",
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [["Data", "Evento", "Valor", "Status"]],
    body: tableData,
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK_COLOR,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
  });
  
  addFooter(doc);
  
  const filename = `historico-assinatura-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
}
