import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
const PRIMARY_COLOR: [number, number, number] = [0, 47, 108]; // Azul escuro bancário
const DARK_COLOR: [number, number, number] = [17, 24, 39];
const MUTED_COLOR: [number, number, number] = [107, 114, 128];
const LIGHT_BG: [number, number, number] = [249, 250, 251];
const BORDER_COLOR: [number, number, number] = [209, 213, 219];
const PIX_GREEN: [number, number, number] = [0, 128, 85];

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// Compact carnê dimensions (3 per A4 page)
const COMPACT_HEIGHT = 99; // 297 / 3 = 99mm per carnê
const COMPACT_WIDTH = A4_WIDTH;
const MARGIN = 8;

/**
 * Draw a single compact carnê - Professional bank-style layout without stub
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
  let currentY = yOffset + MARGIN;
  
  // ========== BORDER ==========
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN - 2, yOffset + 2, COMPACT_WIDTH - (MARGIN * 2) + 4, COMPACT_HEIGHT - 4);
  
  // ========== HEADER - Beneficiário ==========
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(startX, currentY, contentWidth, 14, 'F');
  
  // Nome da escola (beneficiário)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(escola.nome.toUpperCase(), startX + 4, currentY + 6);
  
  // CNPJ
  if (escola.cnpj) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${escola.cnpj}`, startX + 4, currentY + 11);
  }
  
  // Nosso número no header
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Nosso Número: ${fatura.codigo_sequencial || fatura.id.substring(0, 10).toUpperCase()}`, contentWidth - 40, currentY + 8, { align: "right" });
  
  currentY += 18;
  
  // ========== LINHA DE DADOS PRINCIPAIS ==========
  const dataBoxHeight = 16;
  const boxWidth = contentWidth / 4;
  
  // Background cinza claro
  doc.setFillColor(...LIGHT_BG);
  doc.rect(startX, currentY, contentWidth, dataBoxHeight, 'F');
  
  // Bordas dos boxes
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  
  // Box 1: Vencimento
  doc.rect(startX, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", startX + 3, currentY + 4);
  doc.setFontSize(10);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), startX + 3, currentY + 11);
  
  // Box 2: Valor do Documento
  doc.rect(startX + boxWidth, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR DO DOCUMENTO", startX + boxWidth + 3, currentY + 4);
  doc.setFontSize(10);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(fatura.valor_total || fatura.valor), startX + boxWidth + 3, currentY + 11);
  
  // Box 3: Referência
  doc.rect(startX + boxWidth * 2, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("REFERÊNCIA", startX + boxWidth * 2 + 3, currentY + 4);
  doc.setFontSize(10);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(`${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`, startX + boxWidth * 2 + 3, currentY + 11);
  
  // Box 4: Espécie
  doc.rect(startX + boxWidth * 3, currentY, boxWidth, dataBoxHeight);
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("ESPÉCIE", startX + boxWidth * 3 + 3, currentY + 4);
  doc.setFontSize(10);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("R$", startX + boxWidth * 3 + 3, currentY + 11);
  
  currentY += dataBoxHeight + 4;
  
  // ========== PAGADOR E PIX LADO A LADO ==========
  const leftColWidth = contentWidth * 0.55;
  const rightColWidth = contentWidth * 0.45;
  
  // --- Coluna Esquerda: Pagador e Instruções ---
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("PAGADOR", startX, currentY + 3);
  
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  const pagadorNome = responsavel?.nome || fatura.responsaveis?.nome || "—";
  doc.text(pagadorNome.substring(0, 40), startX, currentY + 8);
  
  if (responsavel?.cpf) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`CPF: ${responsavel.cpf}`, startX, currentY + 12);
  }
  
  // Aluno e Curso
  currentY += 16;
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("ALUNO / CURSO", startX, currentY);
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "normal");
  const alunoInfo = `${fatura.alunos?.nome_completo || "—"} - ${fatura.cursos?.nome || ""}`;
  doc.text(alunoInfo.substring(0, 55), startX, currentY + 4);
  
  // Instruções
  currentY += 10;
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("INSTRUÇÕES DE PAGAMENTO", startX, currentY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  const instrucoes = [
    "• Após o vencimento, cobrar multa de 2% e juros de 1% ao mês.",
    "• Não receber após 30 dias do vencimento.",
    `• Até o vencimento, pagar: ${formatCurrency(fatura.valor_total || fatura.valor)}`
  ];
  instrucoes.forEach((line, i) => {
    doc.text(line, startX, currentY + 4 + (i * 3.5));
  });
  
  // --- Coluna Direita: PIX ---
  const pixStartX = startX + leftColWidth;
  let pixY = yOffset + MARGIN + 38;
  
  if (fatura.asaas_pix_qrcode) {
    // Box PIX com fundo verde claro
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...PIX_GREEN);
    doc.setLineWidth(0.5);
    doc.roundedRect(pixStartX, pixY - 2, rightColWidth - 4, 42, 2, 2, 'FD');
    
    // Título PIX
    doc.setFontSize(7);
    doc.setTextColor(...PIX_GREEN);
    doc.setFont("helvetica", "bold");
    doc.text("PAGUE COM PIX", pixStartX + (rightColWidth - 4) / 2, pixY + 4, { align: "center" });
    
    // QR Code
    const qrSize = 28;
    const qrX = pixStartX + ((rightColWidth - 4 - qrSize) / 2);
    
    try {
      let qrCodeData = fatura.asaas_pix_qrcode;
      if (!qrCodeData.startsWith('data:')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      doc.addImage(qrCodeData, 'PNG', qrX, pixY + 7, qrSize, qrSize);
    } catch (error) {
      console.error('Erro ao renderizar QR Code:', error);
      doc.setDrawColor(...MUTED_COLOR);
      doc.rect(qrX, pixY + 7, qrSize, qrSize);
      doc.setFontSize(5);
      doc.setTextColor(...MUTED_COLOR);
      doc.text("QR indisponível", qrX + qrSize/2, pixY + 20, { align: "center" });
    }
    
    // Texto "Escaneie e pague"
    doc.setFontSize(5);
    doc.setTextColor(...PIX_GREEN);
    doc.setFont("helvetica", "normal");
    doc.text("Escaneie com o app do seu banco", pixStartX + (rightColWidth - 4) / 2, pixY + 38, { align: "center" });
  }
  
  // ========== LINHA DIGITÁVEL (BOLETO) ==========
  const barcodeY = yOffset + COMPACT_HEIGHT - 18;
  
  if (fatura.asaas_boleto_barcode) {
    // Fundo amarelo claro para destaque
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(250, 204, 21);
    doc.setLineWidth(0.3);
    doc.rect(startX, barcodeY - 2, contentWidth, 14, 'FD');
    
    // Label
    doc.setFontSize(5);
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.text("LINHA DIGITÁVEL - COPIE E COLE NO SEU BANCO", startX + 3, barcodeY + 2);
    
    // Código de barras (linha digitável) em fonte mono
    doc.setFontSize(8);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont("courier", "bold");
    
    const barcode = fatura.asaas_boleto_barcode;
    // Formatar em grupos para melhor legibilidade
    const formattedBarcode = barcode.replace(/(.{5})/g, '$1 ').trim();
    doc.text(formattedBarcode.substring(0, 60), startX + 3, barcodeY + 8);
    if (formattedBarcode.length > 60) {
      doc.text(formattedBarcode.substring(60), startX + 3, barcodeY + 11);
    }
  } else {
    // Mensagem quando não há boleto
    doc.setFillColor(...LIGHT_BG);
    doc.rect(startX, barcodeY - 2, contentWidth, 14, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "italic");
    doc.text("Linha digitável não disponível - sincronize a fatura com o gateway", startX + contentWidth / 2, barcodeY + 5, { align: "center" });
  }
  
  // ========== MARCA D'ÁGUA PAGO ==========
  if (fatura.status.toLowerCase() === "paga") {
    doc.setFontSize(32);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    // Desenhar com rotação manual usando transformação
    const centerX = startX + contentWidth / 2;
    const centerY = yOffset + COMPACT_HEIGHT / 2;
    doc.text("PAGO", centerX, centerY, { align: "center", angle: 25 });
  }
  
  // ========== LINHA PONTILHADA DE CORTE ==========
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(0, yOffset + COMPACT_HEIGHT, COMPACT_WIDTH, yOffset + COMPACT_HEIGHT);
  doc.setLineDashPattern([], 0);
}

/**
 * Generate compact carnês - 3 per A4 page
 * Professional bank-style layout without logo and without stub
 */
export async function generateCarneCompacto(
  faturas: Fatura[],
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): Promise<void> {
  if (faturas.length === 0) {
    throw new Error("Nenhuma fatura para gerar carnê");
  }
  
  // Sort invoices chronologically
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
  
  let positionOnPage = 0; // 0, 1, or 2
  
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
