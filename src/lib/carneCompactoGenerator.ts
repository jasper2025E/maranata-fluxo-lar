import jsPDF from "jspdf";
import { format } from "date-fns";
import { Fatura, formatCurrency, meses } from "@/hooks/useFaturas";

interface EscolaInfo {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

// Cores profissionais estilo bancário
const PRIMARY_COLOR: [number, number, number] = [0, 47, 108];
const DARK_COLOR: [number, number, number] = [17, 24, 39];
const MUTED_COLOR: [number, number, number] = [107, 114, 128];
const LIGHT_BG: [number, number, number] = [249, 250, 251];
const BORDER_COLOR: [number, number, number] = [209, 213, 219];
const PIX_GREEN: [number, number, number] = [0, 128, 85];

// A4 dimensions in mm
const A4_WIDTH = 210;

// Compact carnê dimensions (3 per A4 page)
const COMPACT_HEIGHT = 99;
const COMPACT_WIDTH = A4_WIDTH;
const MARGIN = 6;

/**
 * Draw a single compact carnê - Professional bank-style layout
 */
function drawCompactCarne(
  doc: jsPDF,
  fatura: Fatura,
  escola: EscolaInfo,
  responsavel: { nome: string; cpf?: string | null } | null,
  yOffset: number
): void {
  const contentWidth = COMPACT_WIDTH - (MARGIN * 2);
  const startX = MARGIN;
  let currentY = yOffset + 4;
  
  // ========== BORDER ==========
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN - 1, yOffset + 2, contentWidth + 2, COMPACT_HEIGHT - 4);
  
  // ========== HEADER - Beneficiário ==========
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(startX, currentY, contentWidth, 11, 'F');
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(escola.nome.toUpperCase(), startX + 3, currentY + 5);
  
  if (escola.cnpj) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${escola.cnpj}`, startX + 3, currentY + 9);
  }
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const nossoNumero = fatura.codigo_sequencial || fatura.id.substring(0, 10).toUpperCase();
  doc.text(`Nosso Número: ${nossoNumero}`, contentWidth - 2, currentY + 7, { align: "right" });
  
  currentY += 13;
  
  // ========== LINHA DE DADOS PRINCIPAIS ==========
  const dataBoxHeight = 12;
  const boxWidth = contentWidth / 4;
  
  doc.setFillColor(...LIGHT_BG);
  doc.rect(startX, currentY, contentWidth, dataBoxHeight, 'F');
  
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.2);
  
  // Box 1: Vencimento
  doc.rect(startX, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", startX + 2, currentY + 3);
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), startX + 2, currentY + 9);
  
  // Box 2: Valor do Documento
  doc.rect(startX + boxWidth, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR DO DOCUMENTO", startX + boxWidth + 2, currentY + 3);
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(fatura.valor_total || fatura.valor), startX + boxWidth + 2, currentY + 9);
  
  // Box 3: Referência
  doc.rect(startX + boxWidth * 2, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("REFERÊNCIA", startX + boxWidth * 2 + 2, currentY + 3);
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(`${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`, startX + boxWidth * 2 + 2, currentY + 9);
  
  // Box 4: Espécie
  doc.rect(startX + boxWidth * 3, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("ESPÉCIE", startX + boxWidth * 3 + 2, currentY + 3);
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("R$", startX + boxWidth * 3 + 2, currentY + 9);
  
  currentY += dataBoxHeight + 2;
  
  // ========== ÁREA PRINCIPAL: PAGADOR (esquerda) + PIX (direita) ==========
  const leftColWidth = contentWidth * 0.58;
  const rightColWidth = contentWidth * 0.42;
  const pixStartX = startX + leftColWidth;
  
  // --- Coluna Esquerda: Pagador ---
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("PAGADOR", startX, currentY + 3);
  
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  const pagadorNome = responsavel?.nome || fatura.responsaveis?.nome || "—";
  doc.text(pagadorNome.substring(0, 35), startX, currentY + 7);
  
  if (responsavel?.cpf) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(`CPF: ${responsavel.cpf}`, startX, currentY + 11);
  }
  
  // Aluno e Curso
  let infoY = currentY + 14;
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("ALUNO / CURSO", startX, infoY);
  doc.setFontSize(7);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "normal");
  const alunoNome = fatura.alunos?.nome_completo || "—";
  const cursoNome = fatura.cursos?.nome || "";
  doc.text(alunoNome.substring(0, 30), startX, infoY + 4);
  doc.text(cursoNome.substring(0, 30), startX, infoY + 8);
  
  // Instruções compactas
  infoY += 13;
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("INSTRUÇÕES", startX, infoY);
  doc.setFontSize(5);
  doc.setTextColor(...DARK_COLOR);
  doc.text("• Após vencimento: multa 2% + juros 1% a.m.", startX, infoY + 3);
  doc.text("• Não receber após 30 dias do vencimento.", startX, infoY + 6);
  
  // --- Coluna Direita: PIX ---
  const pixBoxHeight = 38;
  const pixY = currentY;
  
  if (fatura.asaas_pix_qrcode) {
    // Box PIX
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(...PIX_GREEN);
    doc.setLineWidth(0.4);
    doc.roundedRect(pixStartX + 2, pixY, rightColWidth - 4, pixBoxHeight, 1.5, 1.5, 'FD');
    
    // Título PIX
    doc.setFontSize(6);
    doc.setTextColor(...PIX_GREEN);
    doc.setFont("helvetica", "bold");
    doc.text("PAGUE COM PIX", pixStartX + (rightColWidth / 2), pixY + 4, { align: "center" });
    
    // QR Code
    const qrSize = 26;
    const qrX = pixStartX + ((rightColWidth - qrSize) / 2);
    
    try {
      let qrCodeData = fatura.asaas_pix_qrcode;
      if (!qrCodeData.startsWith('data:')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      doc.addImage(qrCodeData, 'PNG', qrX, pixY + 6, qrSize, qrSize);
    } catch (error) {
      console.error('Erro ao renderizar QR Code:', error);
      doc.setDrawColor(...MUTED_COLOR);
      doc.rect(qrX, pixY + 6, qrSize, qrSize);
      doc.setFontSize(5);
      doc.setTextColor(...MUTED_COLOR);
      doc.text("QR indisponível", qrX + qrSize/2, pixY + 18, { align: "center" });
    }
    
    // Texto inferior
    doc.setFontSize(4);
    doc.setTextColor(...PIX_GREEN);
    doc.setFont("helvetica", "normal");
    doc.text("Escaneie com seu banco", pixStartX + (rightColWidth / 2), pixY + 35, { align: "center" });
  } else {
    // Sem PIX disponível
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(pixStartX + 2, pixY, rightColWidth - 4, pixBoxHeight, 1.5, 1.5, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "italic");
    doc.text("PIX não disponível", pixStartX + (rightColWidth / 2), pixY + 20, { align: "center" });
  }
  
  // ========== LINHA DIGITÁVEL (BOLETO) ==========
  const barcodeY = yOffset + COMPACT_HEIGHT - 16;
  
  if (fatura.asaas_boleto_barcode) {
    // Fundo amarelo claro
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(250, 204, 21);
    doc.setLineWidth(0.3);
    doc.rect(startX, barcodeY, contentWidth, 12, 'FD');
    
    // Label
    doc.setFontSize(4);
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.text("LINHA DIGITÁVEL - COPIE E COLE NO SEU BANCO", startX + 2, barcodeY + 3);
    
    // Código de barras formatado
    doc.setFontSize(7);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont("courier", "bold");
    
    const barcode = fatura.asaas_boleto_barcode;
    // Formatar em grupos de 5 para melhor legibilidade
    const formattedBarcode = barcode.replace(/\s/g, '').replace(/(.{5})/g, '$1 ').trim();
    doc.text(formattedBarcode, startX + 2, barcodeY + 9);
  } else {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(startX, barcodeY, contentWidth, 12, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "italic");
    doc.text("Linha digitável não disponível", startX + contentWidth / 2, barcodeY + 7, { align: "center" });
  }
  
  // ========== MARCA D'ÁGUA PAGO ==========
  if (fatura.status.toLowerCase() === "paga") {
    doc.setFontSize(28);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    const centerX = startX + contentWidth / 2;
    const centerY = yOffset + COMPACT_HEIGHT / 2;
    doc.text("PAGO", centerX, centerY, { align: "center", angle: 20 });
  }
  
  // ========== LINHA PONTILHADA DE CORTE ==========
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(0, yOffset + COMPACT_HEIGHT, COMPACT_WIDTH, yOffset + COMPACT_HEIGHT);
  doc.setLineDashPattern([], 0);
}

/**
 * Generate compact carnês - 3 per A4 page
 */
export async function generateCarneCompacto(
  faturas: Fatura[],
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): Promise<void> {
  if (faturas.length === 0) {
    throw new Error("Nenhuma fatura para gerar carnê");
  }
  
  const faturasOrdenadas = [...faturas].sort((a, b) => {
    if (a.ano_referencia !== b.ano_referencia) {
      return a.ano_referencia - b.ano_referencia;
    }
    return a.mes_referencia - b.mes_referencia;
  });
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  let positionOnPage = 0;
  
  for (let i = 0; i < faturasOrdenadas.length; i++) {
    if (positionOnPage === 0 && i > 0) {
      doc.addPage();
    }
    
    const yOffset = positionOnPage * COMPACT_HEIGHT;
    drawCompactCarne(doc, faturasOrdenadas[i], escola, responsavel || null, yOffset);
    
    positionOnPage++;
    if (positionOnPage >= 3) {
      positionOnPage = 0;
    }
  }
  
  const primeiraFatura = faturasOrdenadas[0];
  const ultimaFatura = faturasOrdenadas[faturasOrdenadas.length - 1];
  const nomeResponsavel = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "responsavel")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 20);
  
  const filename = `carne-${nomeResponsavel}-${primeiraFatura.mes_referencia}-${primeiraFatura.ano_referencia}-a-${ultimaFatura.mes_referencia}-${ultimaFatura.ano_referencia}.pdf`;
  doc.save(filename);
}
