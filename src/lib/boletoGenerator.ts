import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Fatura, getValorFinal, formatCurrency, meses } from "@/hooks/useFaturas";

interface EscolaInfo {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
}

// Professional color palette (institutional blue)
const COLORS = {
  primary: [30, 64, 124] as [number, number, number],      // Deep institutional blue
  primaryLight: [59, 130, 246] as [number, number, number], // Light blue
  dark: [17, 24, 39] as [number, number, number],           // Near black
  text: [55, 65, 81] as [number, number, number],           // Gray-700
  muted: [107, 114, 128] as [number, number, number],       // Gray-500
  light: [243, 244, 246] as [number, number, number],       // Gray-100
  white: [255, 255, 255] as [number, number, number],
  border: [209, 213, 219] as [number, number, number],      // Gray-300
  success: [16, 185, 129] as [number, number, number],      // Green
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

function drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, dashLength = 2, gapLength = 2) {
  const totalLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const dx = (x2 - x1) / totalLength;
  const dy = (y2 - y1) / totalLength;
  
  let currentLength = 0;
  let drawing = true;
  
  while (currentLength < totalLength) {
    const segmentLength = drawing ? dashLength : gapLength;
    const endLength = Math.min(currentLength + segmentLength, totalLength);
    
    if (drawing) {
      doc.line(
        x1 + dx * currentLength,
        y1 + dy * currentLength,
        x1 + dx * endLength,
        y1 + dy * endLength
      );
    }
    
    currentLength = endLength;
    drawing = !drawing;
  }
}

export async function generateBoletoPDF(
  fatura: Fatura,
  escola: EscolaInfo,
  pixQrCode?: string,
  boletoBarcode?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Layout dimensions (3 columns)
  const leftColumnWidth = 55;
  const centerColumnWidth = 140;
  const rightColumnWidth = pageWidth - leftColumnWidth - centerColumnWidth - 20;
  const margin = 10;
  
  // Load logo if available
  let logoBase64: string | null = null;
  if (escola.logo_url) {
    logoBase64 = await loadImageAsBase64(escola.logo_url);
  }

  // Calculate values
  const valorFinal = getValorFinal(fatura);
  const nossoNumero = fatura.codigo_sequencial || `FAT-${fatura.ano_referencia}-${String(fatura.id).slice(0, 6).toUpperCase()}`;
  const dataVencimento = format(new Date(fatura.data_vencimento), "dd/MM/yyyy");
  const mesReferencia = `${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`;

  // ═══════════════════════════════════════════════════════════════
  // LEFT COLUMN - Canhoto (Stub)
  // ═══════════════════════════════════════════════════════════════
  
  const leftX = margin;
  let y = margin;
  
  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", leftX, y, 50, 20);
      y += 25;
    } catch {
      y += 5;
    }
  } else {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(escola.nome.substring(0, 15), leftX, y + 10);
    y += 20;
  }

  // Stub fields
  const stubFields = [
    { label: "BENEFICIÁRIO", value: nossoNumero },
    { label: "VENCIMENTO", value: dataVencimento },
    { label: "VALOR DO BOLETO", value: formatCurrency(valorFinal), highlight: true },
    { label: "CLIENTE", value: fatura.responsaveis?.nome || fatura.alunos?.nome_completo || "N/A" },
  ];

  stubFields.forEach((field) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(field.label, leftX, y);
    y += 4;
    
    doc.setFontSize(field.highlight ? 14 : 10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    
    const maxWidth = leftColumnWidth - 5;
    const lines = doc.splitTextToSize(field.value, maxWidth);
    doc.text(lines, leftX, y);
    y += field.highlight ? 10 : (lines.length * 4 + 6);
  });

  // City/Location
  if (escola.endereco) {
    const city = escola.endereco.split(",").pop()?.trim() || escola.endereco.substring(0, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(city, leftX, y);
  }

  // Dashed separator line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  drawDashedLine(doc, leftColumnWidth + margin, margin, leftColumnWidth + margin, pageHeight - margin - 25);

  // ═══════════════════════════════════════════════════════════════
  // CENTER COLUMN - Main Invoice Body
  // ═══════════════════════════════════════════════════════════════
  
  const centerX = leftColumnWidth + margin + 5;
  y = margin;

  // Header with blue background
  doc.setFillColor(...COLORS.primary);
  doc.rect(centerX, y, centerColumnWidth - 10, 12, "F");
  
  // Company name in header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(escola.nome, centerX + 5, y + 8);
  
  // CNPJ in header (right aligned)
  if (escola.cnpj) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ ${escola.cnpj}`, centerX + centerColumnWidth - 15, y + 8, { align: "right" });
  }
  
  y += 18;

  // Beneficiary section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("BENEFICIÁRIO", centerX, y);
  y += 5;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(escola.nome.toUpperCase(), centerX, y);
  y += 5;
  
  if (escola.cnpj) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(`CNPJ: ${escola.cnpj}`, centerX, y);
    y += 8;
  }

  // Instructions section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("INSTRUÇÕES", centerX, y);
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  
  const instructions = [
    `Caso não pago até ${dataVencimento}, cobrar multa de 2% e juros de 1% ao mês.`,
    "Não receber após 30 dias do vencimento.",
    "",
    `Até ${dataVencimento}, pagar ${formatCurrency(valorFinal)}.`,
  ];
  
  instructions.forEach((line) => {
    if (line) {
      if (line.includes("pagar")) {
        const parts = line.split(formatCurrency(valorFinal));
        doc.text(parts[0], centerX, y);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(valorFinal), centerX + doc.getTextWidth(parts[0]), y);
        doc.setFont("helvetica", "normal");
      } else {
        doc.text(line, centerX, y);
      }
    }
    y += 4;
  });
  
  y += 2;
  
  // Student/Service description
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(`${fatura.alunos?.nome_completo?.toUpperCase() || "ALUNO"} - ${mesReferencia}`, centerX, y);
  y += 5;
  
  const cursoNome = fatura.cursos?.nome || "Mensalidade Escolar";
  const cursoNivel = (fatura.cursos as any)?.nivel || "Educação";
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text(`${cursoNome} - ${cursoNivel}`, centerX, y);
  y += 10;

  // Client section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("CLIENTE", centerX, y);
  y += 5;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.dark);
  doc.text(fatura.responsaveis?.nome || fatura.alunos?.nome_completo || "N/A", centerX, y);

  // ═══════════════════════════════════════════════════════════════
  // PIX SECTION (inside center column, right side)
  // ═══════════════════════════════════════════════════════════════
  
  const pixBoxX = centerX + 95;
  const pixBoxY = margin + 18;
  const pixBoxWidth = 55;
  const pixBoxHeight = 65;
  
  // PIX box with light border
  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(pixBoxX, pixBoxY, pixBoxWidth, pixBoxHeight, 2, 2, "FD");
  
  // "Pague com Pix" header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.success);
  doc.text("Pague com Pix", pixBoxX + pixBoxWidth / 2, pixBoxY + 7, { align: "center" });
  
  // QR Code
  if (pixQrCode) {
    try {
      const qrSize = 35;
      const qrX = pixBoxX + (pixBoxWidth - qrSize) / 2;
      doc.addImage(pixQrCode, "PNG", qrX, pixBoxY + 10, qrSize, qrSize);
    } catch (e) {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("QR Code indisponível", pixBoxX + pixBoxWidth / 2, pixBoxY + 30, { align: "center" });
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("QR Code indisponível", pixBoxX + pixBoxWidth / 2, pixBoxY + 30, { align: "center" });
  }
  
  // PIX payload (truncated)
  if (fatura.asaas_pix_payload) {
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    const truncatedPayload = fatura.asaas_pix_payload.substring(0, 60) + "...";
    const payloadLines = doc.splitTextToSize(truncatedPayload, pixBoxWidth - 4);
    doc.text(payloadLines, pixBoxX + 2, pixBoxY + 50);
  }

  // ═══════════════════════════════════════════════════════════════
  // BARCODE SECTION (Bottom of center column)
  // ═══════════════════════════════════════════════════════════════
  
  const barcodeY = pageHeight - margin - 22;
  
  // Barcode placeholder (visual representation)
  doc.setFillColor(...COLORS.dark);
  const barcodeWidth = centerColumnWidth - 10;
  const barcodeHeight = 12;
  
  // Draw barcode lines pattern
  let barcodeX = centerX;
  const bars = [3,1,2,1,1,2,3,1,2,1,1,3,2,1,1,2,1,3,2,1,1,2,3,1,2,1,1,2,1,3,2,1,1,2,1,3,2,1,1,2,3,1,2,1,1,2,1,3];
  let totalBarWidth = 0;
  bars.forEach(w => totalBarWidth += w + 1);
  const barScale = barcodeWidth / totalBarWidth;
  
  bars.forEach((width, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.dark);
      doc.rect(barcodeX, barcodeY, width * barScale, barcodeHeight, "F");
    }
    barcodeX += (width + 1) * barScale;
  });
  
  // Linha digitável
  const linhaDigitavel = boletoBarcode || fatura.asaas_boleto_barcode || "00000.00000 00000.000000 00000.000000 0 00000000000000";
  doc.setFontSize(10);
  doc.setFont("courier", "normal");
  doc.setTextColor(...COLORS.dark);
  doc.text(linhaDigitavel, centerX, barcodeY + barcodeHeight + 5);
  
  // Document validity text
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Documento válido para pagamento até a data de vencimento", centerX, barcodeY + barcodeHeight + 10);

  // Dashed separator line before right column
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  drawDashedLine(doc, leftColumnWidth + centerColumnWidth + margin, margin, leftColumnWidth + centerColumnWidth + margin, pageHeight - margin);

  // ═══════════════════════════════════════════════════════════════
  // RIGHT COLUMN - Recibo do Pagador (Payer Receipt)
  // ═══════════════════════════════════════════════════════════════
  
  const rightX = leftColumnWidth + centerColumnWidth + margin + 5;
  y = margin;
  
  // Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text("RECIBO DO PAGADOR", rightX, y + 5);
  y += 15;
  
  // Receipt fields (simplified - no duplication)
  const receiptFields = [
    { label: "NOSSO NÚMERO", value: nossoNumero },
    { label: "VENCIMENTO", value: dataVencimento },
    { label: "VALOR DO BOLETO", value: formatCurrency(valorFinal), highlight: true },
    { label: "CLIENTE", value: fatura.responsaveis?.nome || fatura.alunos?.nome_completo || "N/A" },
  ];
  
  receiptFields.forEach((field) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(field.label, rightX, y);
    y += 4;
    
    doc.setFontSize(field.highlight ? 12 : 9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    
    const maxWidth = rightColumnWidth - 10;
    const lines = doc.splitTextToSize(field.value, maxWidth);
    doc.text(lines, rightX, y);
    y += field.highlight ? 10 : (lines.length * 4 + 6);
  });
  
  y += 5;
  
  // Authentication area
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Autenticação", rightX, y);
  doc.text("Mecânica", rightX, y + 4);
  y += 15;
  
  // Authentication box
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(rightX, y, rightColumnWidth - 10, 15);
  
  // Subtle authentication placeholder
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.border);
  doc.text("FI  F - IBS: AJBBIT6BSAVC", rightX + 2, y + 5);
  
  y += 20;
  
  // Final authentication label
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Autenticação Mecânica", rightX, y);

  // Save PDF
  const filename = `boleto-${nossoNumero}.pdf`;
  doc.save(filename);
}

export async function generateBoletoForFatura(
  fatura: Fatura,
  escola: EscolaInfo
): Promise<void> {
  // Prepare QR Code image from base64 or URL
  let pixQrCodeImage: string | undefined;
  
  if (fatura.asaas_pix_qrcode) {
    // If it's already a data URL or base64
    if (fatura.asaas_pix_qrcode.startsWith("data:")) {
      pixQrCodeImage = fatura.asaas_pix_qrcode;
    } else {
      // Try to load from URL
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
