import jsPDF from "jspdf";
import { format } from "date-fns";
import { Fatura, getValorFinal, formatCurrency, meses } from "@/hooks/useFaturas";

interface EscolaInfo {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
}

// Professional color palette
const COLORS = {
  primary: [30, 64, 124] as [number, number, number],
  dark: [17, 24, 39] as [number, number, number],
  text: [55, 65, 81] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
};

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  doc.setLineDashPattern([2, 2], 0);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
}

export async function generateBoletoPDF(
  fatura: Fatura,
  escola: EscolaInfo,
  pixQrCode?: string,
  boletoBarcode?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Load logo
  let logoBase64: string | null = null;
  if (escola.logo_url) {
    logoBase64 = await loadImageAsBase64(escola.logo_url);
  }

  // Data
  const valorFinal = getValorFinal(fatura);
  const nossoNumero = fatura.codigo_sequencial || `FAT-${fatura.ano_referencia}-${String(fatura.id).slice(0, 6).toUpperCase()}`;
  const dataVencimento = format(new Date(fatura.data_vencimento), "dd/MM/yyyy");
  const mesReferencia = `${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`;
  const clienteNome = fatura.responsaveis?.nome || fatura.alunos?.nome_completo || "N/A";
  const alunoNome = fatura.alunos?.nome_completo || "Aluno";
  const cursoNome = fatura.cursos?.nome || "Mensalidade Escolar";

  let y = margin;

  // ═══════════════════════════════════════════════════════════════
  // HEADER - Blue bar with company info
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Logo or company name
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 4, 35, 20);
    } catch {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.white);
      doc.text(escola.nome, margin, 16);
    }
  } else {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(escola.nome, margin, 16);
  }

  // CNPJ on the right
  if (escola.cnpj) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.white);
    doc.text(`CNPJ: ${escola.cnpj}`, pageWidth - margin, 16, { align: "right" });
  }

  y = 38;

  // ═══════════════════════════════════════════════════════════════
  // MAIN BODY - Invoice details (NO DUPLICATION)
  // ═══════════════════════════════════════════════════════════════

  // Row 1: Nosso Número | Vencimento | Valor
  doc.setFillColor(...COLORS.light);
  doc.rect(margin, y, contentWidth, 22, "F");
  doc.setDrawColor(...COLORS.border);
  doc.rect(margin, y, contentWidth, 22, "S");

  const col1Width = contentWidth / 3;
  
  // Nosso Número
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("NOSSO NÚMERO", margin + 4, y + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(nossoNumero, margin + 4, y + 14);

  // Vencimento
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("VENCIMENTO", margin + col1Width + 4, y + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(dataVencimento, margin + col1Width + 4, y + 14);

  // Valor (highlighted)
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("VALOR DO DOCUMENTO", margin + col1Width * 2 + 4, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(formatCurrency(valorFinal), margin + col1Width * 2 + 4, y + 15);

  // Vertical separators
  doc.setDrawColor(...COLORS.border);
  doc.line(margin + col1Width, y, margin + col1Width, y + 22);
  doc.line(margin + col1Width * 2, y, margin + col1Width * 2, y + 22);

  y += 28;

  // Row 2: Cliente (Pagador)
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("PAGADOR", margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(clienteNome, margin, y);
  
  y += 10;

  // Row 3: Descrição do serviço
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("DESCRIÇÃO", margin, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.dark);
  doc.text(`${alunoNome} - ${cursoNome}`, margin, y);
  y += 4;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(`Referência: ${mesReferencia}`, margin, y);

  y += 12;

  // Row 4: Instruções
  doc.setFillColor(...COLORS.light);
  doc.rect(margin, y, contentWidth, 20, "F");
  doc.setDrawColor(...COLORS.border);
  doc.rect(margin, y, contentWidth, 20, "S");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.muted);
  doc.text("INSTRUÇÕES DE PAGAMENTO", margin + 4, y + 5);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text(`• Após ${dataVencimento}, cobrar multa de 2% e juros de 1% ao mês`, margin + 4, y + 11);
  doc.text("• Não receber após 30 dias do vencimento", margin + 4, y + 16);

  y += 28;

  // ═══════════════════════════════════════════════════════════════
  // PIX SECTION - Clean QR Code area
  // ═══════════════════════════════════════════════════════════════

  const pixSectionHeight = 75;
  
  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, y, contentWidth, pixSectionHeight, 3, 3, "FD");

  // "Pague com PIX" title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.success);
  doc.text("Pague com PIX", margin + 10, y + 12);

  // QR Code - Large and centered
  const qrSize = 50;
  const qrX = margin + 10;
  const qrY = y + 18;

  if (pixQrCode) {
    try {
      doc.addImage(pixQrCode, "PNG", qrX, qrY, qrSize, qrSize);
    } catch {
      doc.setFillColor(...COLORS.border);
      doc.rect(qrX, qrY, qrSize, qrSize, "F");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("QR Code", qrX + qrSize / 2, qrY + qrSize / 2 - 2, { align: "center" });
      doc.text("indisponível", qrX + qrSize / 2, qrY + qrSize / 2 + 4, { align: "center" });
    }
  } else {
    doc.setFillColor(...COLORS.border);
    doc.rect(qrX, qrY, qrSize, qrSize, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("QR Code", qrX + qrSize / 2, qrY + qrSize / 2 - 2, { align: "center" });
    doc.text("indisponível", qrX + qrSize / 2, qrY + qrSize / 2 + 4, { align: "center" });
  }

  // PIX instructions on the right
  const pixTextX = qrX + qrSize + 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text("1. Abra o app do seu banco", pixTextX, y + 25);
  doc.text("2. Escolha pagar via PIX", pixTextX, y + 32);
  doc.text("3. Escaneie o QR Code ao lado", pixTextX, y + 39);
  doc.text("4. Confirme o pagamento", pixTextX, y + 46);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("O pagamento é confirmado na hora!", pixTextX, y + 56);

  y += pixSectionHeight + 8;

  // ═══════════════════════════════════════════════════════════════
  // BARCODE SECTION
  // ═══════════════════════════════════════════════════════════════

  // Draw simulated barcode
  const barcodeHeight = 18;
  const bars = [3,1,2,1,1,2,3,1,2,1,1,3,2,1,1,2,1,3,2,1,1,2,3,1,2,1,1,2,1,3,2,1,1,2,1,3,2,1,1,2,3,1,2,1,1,2,1,3,2,1,1,2,3,1];
  let totalBarWidth = 0;
  bars.forEach(w => totalBarWidth += w + 1);
  const barScale = contentWidth / totalBarWidth;

  let barcodeX = margin;
  bars.forEach((width, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.dark);
      doc.rect(barcodeX, y, width * barScale, barcodeHeight, "F");
    }
    barcodeX += (width + 1) * barScale;
  });

  y += barcodeHeight + 4;

  // Linha digitável
  const linhaDigitavel = boletoBarcode || fatura.asaas_boleto_barcode || "00000.00000 00000.000000 00000.000000 0 00000000000000";
  doc.setFontSize(10);
  doc.setFont("courier", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(linhaDigitavel, pageWidth / 2, y, { align: "center" });

  y += 8;

  // Validity text
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Documento válido para pagamento até a data de vencimento", pageWidth / 2, y, { align: "center" });

  y += 15;

  // ═══════════════════════════════════════════════════════════════
  // RECIBO DO PAGADOR (Detachable - Simplified)
  // ═══════════════════════════════════════════════════════════════

  // Dashed cut line
  doc.setDrawColor(...COLORS.border);
  drawDashedLine(doc, margin, y, pageWidth - margin, y);

  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text("✂ RECORTE AQUI", pageWidth / 2, y - 2, { align: "center" });

  y += 10;

  // Receipt header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text("RECIBO DO PAGADOR", margin, y);

  y += 8;

  // Simplified receipt - only essential info (NO DUPLICATION of full details)
  const receiptData = [
    ["Nosso Número:", nossoNumero],
    ["Valor:", formatCurrency(valorFinal)],
    ["Vencimento:", dataVencimento],
    ["Pagador:", clienteNome],
  ];

  receiptData.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(value, margin + 35, y);
    y += 6;
  });

  y += 5;

  // Authentication box
  doc.setDrawColor(...COLORS.border);
  doc.rect(pageWidth - margin - 60, y - 25, 60, 20);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text("Autenticação Mecânica", pageWidth - margin - 30, y - 8, { align: "center" });

  // Save
  const filename = `boleto-${nossoNumero}.pdf`;
  doc.save(filename);
}

export async function generateBoletoForFatura(
  fatura: Fatura,
  escola: EscolaInfo
): Promise<void> {
  let pixQrCodeImage: string | undefined;

  if (fatura.asaas_pix_qrcode) {
    if (fatura.asaas_pix_qrcode.startsWith("data:")) {
      pixQrCodeImage = fatura.asaas_pix_qrcode;
    } else {
      pixQrCodeImage = await loadImageAsBase64(fatura.asaas_pix_qrcode) || undefined;
    }
  }

  await generateBoletoPDF(
    fatura,
    escola,
    pixQrCodeImage,
    fatura.asaas_boleto_barcode || undefined
  );
}
