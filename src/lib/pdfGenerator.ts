import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Fatura, FaturaItem, Pagamento, getValorFinal, formatCurrency, meses } from "@/hooks/useFaturas";

interface EscolaInfo {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
}

const PRIMARY_COLOR: [number, number, number] = [59, 130, 246]; // Blue
const DARK_COLOR: [number, number, number] = [30, 41, 59]; // Slate-800
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate-500
const SUCCESS_COLOR: [number, number, number] = [34, 197, 94]; // Green

function addHeader(doc: jsPDF, escola: EscolaInfo, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(escola.nome || "Escola", 15, 18);
  
  // School details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (escola.cnpj) {
    doc.text(`CNPJ: ${escola.cnpj}`, 15, 26);
  }
  if (escola.endereco) {
    doc.text(escola.endereco, 15, 32);
  }
  
  // Document title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth - 15, 22, { align: "right" });
  
  return 45;
}

function addFooter(doc: jsPDF, escola: EscolaInfo) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer line
  doc.setDrawColor(...MUTED_COLOR);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
  
  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  
  const footerText = [
    escola.telefone && `Tel: ${escola.telefone}`,
    escola.email && `Email: ${escola.email}`,
  ].filter(Boolean).join(" | ");
  
  doc.text(footerText || "", pageWidth / 2, pageHeight - 12, { align: "center" });
  doc.text(`Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, pageHeight - 7, { align: "center" });
}

function addInfoBox(doc: jsPDF, x: number, y: number, width: number, title: string, lines: string[]) {
  // Box background
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(x, y, width, 8 + lines.length * 5, 3, 3, 'FD');
  
  // Title
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(title, x + 4, y + 6);
  
  // Lines
  doc.setFontSize(10);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "normal");
  lines.forEach((line, i) => {
    doc.text(line, x + 4, y + 12 + i * 5);
  });
  
  return y + 12 + lines.length * 5;
}

export async function generateFaturaPDF(
  fatura: Fatura,
  escola: EscolaInfo,
  itens?: FaturaItem[]
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, escola, "FATURA");
  
  // Fatura info
  doc.setFontSize(11);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(`Fatura: ${fatura.codigo_sequencial || fatura.id.slice(0, 8).toUpperCase()}`, 15, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Competência: ${meses[fatura.mes_referencia - 1]} de ${fatura.ano_referencia}`, 15, y + 6);
  
  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    Paga: SUCCESS_COLOR,
    Vencida: [239, 68, 68], // Red
    Aberta: PRIMARY_COLOR,
    Cancelada: MUTED_COLOR,
  };
  const statusColor = statusColors[fatura.status] || PRIMARY_COLOR;
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 45, y - 5, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(fatura.status.toUpperCase(), pageWidth - 30, y, { align: "center" });
  
  y += 15;
  
  // Two column layout for info boxes
  const boxWidth = (pageWidth - 40) / 2;
  
  // Aluno box
  addInfoBox(doc, 15, y, boxWidth, "ALUNO", [
    fatura.alunos?.nome_completo || "N/A",
    fatura.cursos?.nome || "",
  ]);
  
  // Responsável box
  addInfoBox(doc, 20 + boxWidth, y, boxWidth, "RESPONSÁVEL FINANCEIRO", [
    fatura.responsaveis?.nome || "Não vinculado",
    fatura.responsaveis?.email || "",
  ]);
  
  y += 30;
  
  // Dates info
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Emissão:", 15, y);
  doc.text("Vencimento:", pageWidth / 2, y);
  
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(format(new Date(fatura.data_emissao), "dd/MM/yyyy"), 40, y);
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), pageWidth / 2 + 30, y);
  
  y += 12;
  
  // Items table
  if (itens && itens.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Qtd", "Valor Unit.", "Desconto", "Total"]],
      body: itens.map(item => [
        item.descricao,
        item.quantidade.toString(),
        formatCurrency(item.valor_unitario),
        item.desconto_aplicado > 0 ? formatCurrency(item.desconto_aplicado) : "-",
        formatCurrency(item.valor_final),
      ]),
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: DARK_COLOR,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    // Simple description
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, pageWidth - 30, 20, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text(`Mensalidade - ${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`, 20, y + 8);
    doc.text(`${fatura.cursos?.nome || "Curso"}`, 20, y + 15);
    
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(fatura.valor_original || fatura.valor), pageWidth - 20, y + 12, { align: "right" });
    
    y += 28;
  }
  
  // Summary box
  const valorOriginal = fatura.valor_original || fatura.valor;
  const valorFinal = getValorFinal(fatura);
  const desconto = fatura.valor_desconto_aplicado || 0;
  const juros = fatura.valor_juros_aplicado || 0;
  const multa = fatura.valor_multa_aplicado || 0;
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - 85, y, 70, 50, 3, 3, 'FD');
  
  let summaryY = y + 8;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  
  doc.text("Subtotal:", pageWidth - 80, summaryY);
  doc.setTextColor(...DARK_COLOR);
  doc.text(formatCurrency(valorOriginal), pageWidth - 20, summaryY, { align: "right" });
  
  if (desconto > 0) {
    summaryY += 6;
    doc.setTextColor(34, 197, 94); // Green
    doc.text("Desconto:", pageWidth - 80, summaryY);
    doc.text(`-${formatCurrency(desconto)}`, pageWidth - 20, summaryY, { align: "right" });
  }
  
  if (juros > 0) {
    summaryY += 6;
    doc.setTextColor(239, 68, 68); // Red
    doc.text("Juros:", pageWidth - 80, summaryY);
    doc.text(`+${formatCurrency(juros)}`, pageWidth - 20, summaryY, { align: "right" });
  }
  
  if (multa > 0) {
    summaryY += 6;
    doc.setTextColor(239, 68, 68); // Red
    doc.text("Multa:", pageWidth - 80, summaryY);
    doc.text(`+${formatCurrency(multa)}`, pageWidth - 20, summaryY, { align: "right" });
  }
  
  // Total
  doc.setDrawColor(226, 232, 240);
  doc.line(pageWidth - 80, summaryY + 4, pageWidth - 20, summaryY + 4);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_COLOR);
  doc.text("TOTAL:", pageWidth - 80, summaryY + 12);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(formatCurrency(valorFinal), pageWidth - 20, summaryY + 12, { align: "right" });
  
  addFooter(doc, escola);
  
  // Save
  const filename = `fatura-${fatura.codigo_sequencial || fatura.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}

export async function generateReciboPDF(
  fatura: Fatura,
  pagamento: Pagamento,
  escola: EscolaInfo
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, escola, "RECIBO DE PAGAMENTO");
  
  // Recibo number and date
  doc.setFontSize(11);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(`Recibo Nº: ${pagamento.id.slice(0, 8).toUpperCase()}`, 15, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Data: ${format(new Date(pagamento.data_pagamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 15, y + 6);
  
  // Paid badge
  doc.setFillColor(...SUCCESS_COLOR);
  doc.roundedRect(pageWidth - 45, y - 5, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PAGO", pageWidth - 30, y, { align: "center" });
  
  y += 20;
  
  // Main content box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, pageWidth - 30, 80, 3, 3, 'FD');
  
  // Recebemos de
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Recebemos de:", 20, y + 10);
  
  doc.setFontSize(14);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(fatura.responsaveis?.nome || fatura.alunos?.nome_completo || "N/A", 20, y + 20);
  
  // Referente
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Referente a:", 20, y + 35);
  
  doc.setFontSize(11);
  doc.setTextColor(...DARK_COLOR);
  doc.text(`Fatura ${fatura.codigo_sequencial || fatura.id.slice(0, 8)}`, 20, y + 43);
  doc.text(`${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia} - ${fatura.cursos?.nome || ""}`, 20, y + 50);
  doc.text(`Aluno: ${fatura.alunos?.nome_completo || "N/A"}`, 20, y + 57);
  
  // Valor
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("A importância de:", 20, y + 68);
  
  doc.setFontSize(18);
  doc.setTextColor(...SUCCESS_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(pagamento.valor), 20, y + 77);
  
  // Payment method
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Forma de pagamento:", pageWidth - 70, y + 68);
  
  doc.setFontSize(11);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(pagamento.metodo, pageWidth - 70, y + 77);
  
  if (pagamento.referencia) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text(`Ref: ${pagamento.referencia}`, pageWidth - 70, y + 83);
  }
  
  y += 95;
  
  // Payment details table
  const valorOriginal = pagamento.valor_original || fatura.valor;
  const desconto = pagamento.desconto_aplicado || 0;
  const juros = pagamento.juros_aplicado || 0;
  const multa = pagamento.multa_aplicada || 0;
  
  if (desconto > 0 || juros > 0 || multa > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Valor"]],
      body: [
        ["Valor Original", formatCurrency(valorOriginal)],
        ...(desconto > 0 ? [["Desconto", `-${formatCurrency(desconto)}`]] : []),
        ...(juros > 0 ? [["Juros", `+${formatCurrency(juros)}`]] : []),
        ...(multa > 0 ? [["Multa", `+${formatCurrency(multa)}`]] : []),
        ["Valor Pago", formatCurrency(pagamento.valor)],
      ],
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: DARK_COLOR,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 40, halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Signature line
  doc.setDrawColor(...MUTED_COLOR);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, y + 20, pageWidth / 2 + 40, y + 20);
  
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Assinatura / Carimbo", pageWidth / 2, y + 26, { align: "center" });
  
  addFooter(doc, escola);
  
  // Save
  const filename = `recibo-${pagamento.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
