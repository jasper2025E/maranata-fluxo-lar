import jsPDF from "jspdf";
import { format } from "date-fns";
import { Fatura, getValorFinal, formatCurrency, meses } from "@/hooks/useFaturas";
import { generateITF25BarcodeDataUrl } from "@/lib/itf25Barcode";

interface EscolaInfo {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
}

// Professional Brazilian bank-style color palette
const COLORS = {
  primary: [0, 51, 102] as [number, number, number],      // Dark bank blue
  dark: [0, 0, 0] as [number, number, number],            // Pure black for text
  text: [33, 33, 33] as [number, number, number],         // Dark gray text
  muted: [102, 102, 102] as [number, number, number],     // Medium gray
  light: [245, 245, 245] as [number, number, number],     // Light gray bg
  white: [255, 255, 255] as [number, number, number],
  border: [180, 180, 180] as [number, number, number],    // Border gray
  line: [0, 0, 0] as [number, number, number],            // Black lines
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

async function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = dataUrl;
  });
}

function drawCell(
  doc: jsPDF, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  label: string, 
  value: string,
  options: { 
    fontSize?: number; 
    bold?: boolean; 
    align?: "left" | "center" | "right";
    labelColor?: [number, number, number];
    valueColor?: [number, number, number];
  } = {}
) {
  const { fontSize = 8, bold = false, align = "left", labelColor = COLORS.muted, valueColor = COLORS.dark } = options;
  
  // Draw cell border
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h);
  
  // Draw label
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...labelColor);
  doc.text(label, x + 1.5, y + 3.5);
  
  // Draw value
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setTextColor(...valueColor);
  
  const textX = align === "right" ? x + w - 1.5 : align === "center" ? x + w / 2 : x + 1.5;
  doc.text(value, textX, y + h - 2, { align });
}

export async function generateBoletoPDF(
  fatura: Fatura,
  escola: EscolaInfo,
  pixQrCode?: string,
  boletoBarcode?: string,
  boletoBarCode?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Data preparation
  const valorFinal = getValorFinal(fatura);
  const nossoNumero = fatura.codigo_sequencial || `${fatura.ano_referencia}${String(fatura.mes_referencia).padStart(2, '0')}${String(fatura.id).slice(0, 8).toUpperCase()}`;
  const dataVencimento = format(new Date(fatura.data_vencimento), "dd/MM/yyyy");
  const dataDocumento = format(new Date(fatura.data_emissao), "dd/MM/yyyy");
  const mesReferencia = `${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`;
  const sacadoNome = fatura.responsaveis?.nome || fatura.alunos?.nome_completo || "N/A";
  const alunoNome = fatura.alunos?.nome_completo || "Aluno";
  const cursoNome = fatura.cursos?.nome || "Mensalidade";
  const linhaDigitavel = boletoBarcode || fatura.asaas_boleto_barcode || "00000.00000 00000.000000 00000.000000 0 00000000000000";

  let y = margin;

  // ═══════════════════════════════════════════════════════════════
  // FICHA DE COMPENSAÇÃO (Main Boleto)
  // ═══════════════════════════════════════════════════════════════

  // Header with bank logo area and linha digitável
  const headerHeight = 12;
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, headerHeight);

  // Bank/Institution name on left
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(escola.nome.substring(0, 25), margin + 3, y + 7.5);

  // Separator line
  doc.setLineWidth(0.5);
  doc.line(margin + 50, y, margin + 50, y + headerHeight);

  // Linha digitável on right (monospace style)
  doc.setFontSize(10);
  doc.setFont("courier", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(linhaDigitavel, margin + 52, y + 7.5);

  y += headerHeight;

  // Row 1: Local de Pagamento | Vencimento
  const row1Height = 10;
  drawCell(doc, margin, y, contentWidth - 40, row1Height, "Local de Pagamento", "PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO");
  drawCell(doc, margin + contentWidth - 40, y, 40, row1Height, "Vencimento", dataVencimento, { fontSize: 10, bold: true, align: "right" });
  y += row1Height;

  // Row 2: Cedente | Agência/Código Cedente
  const row2Height = 10;
  const cedenteInfo = escola.cnpj ? `${escola.nome} - CNPJ: ${escola.cnpj}` : escola.nome;
  drawCell(doc, margin, y, contentWidth - 40, row2Height, "Cedente", cedenteInfo);
  drawCell(doc, margin + contentWidth - 40, y, 40, row2Height, "Agência/Código Cedente", "-", { align: "right" });
  y += row2Height;

  // Row 3: Data Documento | Nº Documento | Espécie Doc | Aceite | Data Process | Nosso Número
  const row3Height = 10;
  const col3Width = contentWidth / 6;
  drawCell(doc, margin, y, col3Width, row3Height, "Data Documento", dataDocumento);
  drawCell(doc, margin + col3Width, y, col3Width, row3Height, "Nº Documento", nossoNumero.substring(0, 10));
  drawCell(doc, margin + col3Width * 2, y, col3Width * 0.7, row3Height, "Espécie Doc", "DM");
  drawCell(doc, margin + col3Width * 2.7, y, col3Width * 0.5, row3Height, "Aceite", "N");
  drawCell(doc, margin + col3Width * 3.2, y, col3Width * 0.8, row3Height, "Data Process.", dataDocumento);
  drawCell(doc, margin + col3Width * 4, y, col3Width * 2, row3Height, "Nosso Número", nossoNumero, { fontSize: 9, bold: true, align: "right" });
  y += row3Height;

  // Row 4: Uso do Banco | Carteira | Espécie | Quantidade | xValor | (=) Valor Documento
  const row4Height = 10;
  drawCell(doc, margin, y, col3Width, row4Height, "Uso do Banco", "");
  drawCell(doc, margin + col3Width, y, col3Width * 0.6, row4Height, "Carteira", "SR");
  drawCell(doc, margin + col3Width * 1.6, y, col3Width * 0.6, row4Height, "Espécie", "R$");
  drawCell(doc, margin + col3Width * 2.2, y, col3Width * 0.8, row4Height, "Quantidade", "-");
  drawCell(doc, margin + col3Width * 3, y, col3Width, row4Height, "x Valor", "-");
  drawCell(doc, margin + col3Width * 4, y, col3Width * 2, row4Height, "(=) Valor Documento", formatCurrency(valorFinal), { fontSize: 10, bold: true, align: "right" });
  y += row4Height;

  // Row 5: Instruções (left) | Deduções / Acréscimos / Valor Cobrado (right)
  const row5Height = 40;
  
  // Instruções box (left, tall)
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth - 40, row5Height);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Instruções (Texto de responsabilidade do Cedente)", margin + 1.5, y + 3.5);
  
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.dark);
  doc.text(`• NÃO RECEBER APÓS ${dataVencimento}`, margin + 2, y + 9);
  doc.text(`• Após vencimento cobrar multa de 2% e juros de 1% ao mês`, margin + 2, y + 13);
  doc.text(`• Referência: ${mesReferencia} - ${alunoNome}`, margin + 2, y + 17);
  doc.text(`• Curso: ${cursoNome}`, margin + 2, y + 21);
  
  // Right side stacked cells
  const rightX = margin + contentWidth - 40;
  const smallCellHeight = row5Height / 4;
  drawCell(doc, rightX, y, 40, smallCellHeight, "(-) Desconto/Abatimento", fatura.desconto_valor ? formatCurrency(fatura.desconto_valor) : "-", { align: "right" });
  drawCell(doc, rightX, y + smallCellHeight, 40, smallCellHeight, "(-) Outras Deduções", "-", { align: "right" });
  drawCell(doc, rightX, y + smallCellHeight * 2, 40, smallCellHeight, "(+) Mora/Multa", fatura.juros ? formatCurrency(fatura.juros) : "-", { align: "right" });
  drawCell(doc, rightX, y + smallCellHeight * 3, 40, smallCellHeight, "(=) Valor Cobrado", "", { fontSize: 10, bold: true, align: "right" });
  
  y += row5Height;

  // Row 6: Sacado
  const row6Height = 18;
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, row6Height);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text("Sacado", margin + 1.5, y + 3.5);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(sacadoNome, margin + 2, y + 9);
  
  // Note: endereco field may not be available in the current type definition
  
  y += row6Height;

  // Row 7: Sacador/Avalista | Autenticação Mecânica
  const row7Height = 8;
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth - 50, row7Height);
  doc.rect(margin + contentWidth - 50, y, 50, row7Height);
  
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text("Sacador/Avalista", margin + 1.5, y + 3.5);
  doc.text("Autenticação Mecânica - Ficha de Compensação", margin + contentWidth - 48, y + 5);
  
  y += row7Height;

  // ═══════════════════════════════════════════════════════════════
  // BARCODE
  // ═══════════════════════════════════════════════════════════════
  
  y += 3;
  const barcodeHeight = 14;
  const barcodeWidth = contentWidth - 50;

  // Código de barras REAL (ITF-25) - escaneável em apps bancários
  const barcodeSource =
    (fatura as any).asaas_boleto_bar_code ||
    boletoBarCode;

  const barcodeImage = barcodeSource ? await generateITF25BarcodeDataUrl(barcodeSource) : null;

  if (barcodeImage) {
    try {
      // Mantém proporção para evitar distorção (distorção = leitura inválida)
      const maxW = barcodeWidth;
      const targetH = barcodeHeight;

      const { w, h } = await getImageDimensions(barcodeImage);
      const ratio = w > 0 && h > 0 ? w / h : 8;
      let widthMm = targetH * ratio;
      let heightMm = targetH;
      if (widthMm > maxW) {
        widthMm = maxW;
        heightMm = widthMm / ratio;
      }

      const x = margin + (barcodeWidth - widthMm) / 2;
      const yImg = y;

      // Quiet zone melhora leitura
      doc.setFillColor(...COLORS.white);
      doc.rect(x - 1, yImg - 1, widthMm + 2, heightMm + 2, "F");

      // Evita compressão que pode borrar as barras
      doc.addImage(barcodeImage, "PNG", x, yImg, widthMm, heightMm, undefined, "NONE");
    } catch {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("Código de barras indisponível", margin, y + 9);
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("Código de barras indisponível", margin, y + 9);
  }
  
  y += barcodeHeight + 8;

  // ═══════════════════════════════════════════════════════════════
  // CUT LINE
  // ═══════════════════════════════════════════════════════════════
  
  doc.setDrawColor(...COLORS.border);
  drawDashedLine(doc, margin, y, pageWidth - margin, y);
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text("✂ RECORTE AQUI", pageWidth / 2, y - 2, { align: "center" });
  
  y += 10;

  // ═══════════════════════════════════════════════════════════════
  // RECIBO DO PAGADOR (Detachable receipt)
  // ═══════════════════════════════════════════════════════════════

  // Header
  doc.setFillColor(...COLORS.light);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 8);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("RECIBO DO PAGADOR", margin + 3, y + 5.5);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.dark);
  doc.text(escola.nome, pageWidth - margin - 3, y + 5.5, { align: "right" });
  
  y += 8;

  // Receipt grid
  const receiptRowHeight = 8;
  const col2 = contentWidth / 2;
  
  // Row 1: Cedente | Vencimento
  drawCell(doc, margin, y, col2, receiptRowHeight, "Cedente", escola.nome);
  drawCell(doc, margin + col2, y, col2, receiptRowHeight, "Vencimento", dataVencimento, { bold: true });
  y += receiptRowHeight;
  
  // Row 2: Sacado | Valor
  drawCell(doc, margin, y, col2, receiptRowHeight, "Sacado", sacadoNome);
  drawCell(doc, margin + col2, y, col2, receiptRowHeight, "Valor", formatCurrency(valorFinal), { fontSize: 10, bold: true });
  y += receiptRowHeight;
  
  // Row 3: Nosso Número | Referência
  drawCell(doc, margin, y, col2, receiptRowHeight, "Nosso Número", nossoNumero);
  drawCell(doc, margin + col2, y, col2, receiptRowHeight, "Referência", `${mesReferencia} - ${alunoNome}`);
  y += receiptRowHeight;
  
  // Row 4: Linha Digitável
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, receiptRowHeight + 2);
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text("Linha Digitável", margin + 1.5, y + 3.5);
  doc.setFontSize(9);
  doc.setFont("courier", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(linhaDigitavel, margin + contentWidth / 2, y + 7.5, { align: "center" });
  
  y += receiptRowHeight + 8;

  // ═══════════════════════════════════════════════════════════════
  // PIX SECTION (Optional, if available)
  // ═══════════════════════════════════════════════════════════════
  
  if (pixQrCode || fatura.asaas_pix_qrcode) {
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, y, contentWidth, 55, 2, 2, "FD");
    
    // Title
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 128, 0); // Green for PIX
    doc.text("💠 PAGUE COM PIX", margin + 5, y + 8);
    
    // QR Code
    const qrSize = 40;
    const qrX = margin + 5;
    const qrY = y + 12;
    
    const qrCodeImage = pixQrCode || fatura.asaas_pix_qrcode;
    if (qrCodeImage) {
      try {
        if (qrCodeImage.startsWith("data:")) {
          doc.addImage(qrCodeImage, "PNG", qrX, qrY, qrSize, qrSize);
        } else {
          const loaded = await loadImageAsBase64(qrCodeImage);
          if (loaded) {
            doc.addImage(loaded, "PNG", qrX, qrY, qrSize, qrSize);
          }
        }
      } catch {
        doc.setFillColor(...COLORS.border);
        doc.rect(qrX, qrY, qrSize, qrSize, "F");
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text("QR Code", qrX + qrSize / 2, qrY + qrSize / 2, { align: "center" });
      }
    }
    
    // Instructions
    const instrX = qrX + qrSize + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text("1. Abra o app do seu banco", instrX, y + 20);
    doc.text("2. Escolha pagar via PIX", instrX, y + 26);
    doc.text("3. Escaneie o QR Code ao lado", instrX, y + 32);
    doc.text("4. Confirme o pagamento", instrX, y + 38);
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("Pagamento confirmado na hora!", instrX, y + 48);
  }

  // Save
  const filename = `boleto-${nossoNumero.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
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
    fatura.asaas_boleto_barcode || undefined,
    (fatura as any).asaas_boleto_bar_code || undefined
  );
}
