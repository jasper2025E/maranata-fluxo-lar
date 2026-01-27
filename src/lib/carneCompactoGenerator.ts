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

// Cores profissionais - Estilo Banco moderno
const BANK_BLUE: [number, number, number] = [0, 51, 102];
const BANK_BLUE_LIGHT: [number, number, number] = [230, 240, 250];
const DARK_TEXT: [number, number, number] = [30, 30, 30];
const GRAY_TEXT: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];
const BORDER_GRAY: [number, number, number] = [200, 200, 200];
const PIX_GREEN: [number, number, number] = [0, 150, 57];
const PIX_GREEN_BG: [number, number, number] = [232, 250, 238];
const YELLOW_BG: [number, number, number] = [255, 250, 230];
const YELLOW_BORDER: [number, number, number] = [255, 200, 50];

// A4 dimensions
const A4_WIDTH = 210;
const COMPACT_HEIGHT = 99;
const MARGIN = 5;

/**
 * Draw professional bank-style carnê
 */
function drawCompactCarne(
  doc: jsPDF,
  fatura: Fatura,
  escola: EscolaInfo,
  responsavel: { nome: string; cpf?: string | null } | null,
  yOffset: number
): void {
  const contentWidth = A4_WIDTH - (MARGIN * 2);
  const startX = MARGIN;
  let y = yOffset + 3;
  
  // ========== BORDA EXTERNA ELEGANTE ==========
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, yOffset + 1, contentWidth, COMPACT_HEIGHT - 3, 2, 2);
  
  // ========== HEADER INSTITUCIONAL ==========
  // Linha azul fina no topo
  doc.setFillColor(...BANK_BLUE);
  doc.rect(startX, y, contentWidth, 1.5, 'F');
  y += 3;
  
  // Nome da instituição
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BANK_BLUE);
  doc.text(escola.nome.toUpperCase(), startX + 3, y + 4);
  
  // CNPJ à direita
  if (escola.cnpj) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`CNPJ: ${escola.cnpj}`, contentWidth - 3, y + 4, { align: "right" });
  }
  
  // Nosso Número - destaque
  y += 7;
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("NOSSO NÚMERO", startX + 3, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BANK_BLUE);
  const nossoNumero = fatura.codigo_sequencial || `FAT-${fatura.id.substring(0, 8).toUpperCase()}`;
  doc.text(nossoNumero, startX + 3, y + 4);
  
  // Linha separadora fina
  y += 7;
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.2);
  doc.line(startX + 2, y, startX + contentWidth - 2, y);
  y += 2;
  
  // ========== GRID DE INFORMAÇÕES PRINCIPAIS ==========
  const gridY = y;
  const cellHeight = 14;
  const cellWidth = contentWidth / 4;
  
  // Fundo alternado suave
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(startX, gridY, cellWidth, cellHeight, 'F');
  doc.rect(startX + cellWidth * 2, gridY, cellWidth, cellHeight, 'F');
  
  // Bordas do grid
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.15);
  for (let i = 0; i <= 4; i++) {
    doc.line(startX + cellWidth * i, gridY, startX + cellWidth * i, gridY + cellHeight);
  }
  doc.line(startX, gridY, startX + contentWidth, gridY);
  doc.line(startX, gridY + cellHeight, startX + contentWidth, gridY + cellHeight);
  
  // Célula 1: Vencimento
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", startX + cellWidth * 0 + 3, gridY + 4);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), startX + cellWidth * 0 + 3, gridY + 10);
  
  // Célula 2: Valor
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR DO DOCUMENTO", startX + cellWidth * 1 + 3, gridY + 4);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(formatCurrency(fatura.valor_total || fatura.valor), startX + cellWidth * 1 + 3, gridY + 10);
  
  // Célula 3: Referência
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("REFERÊNCIA", startX + cellWidth * 2 + 3, gridY + 4);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text(`${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`, startX + cellWidth * 2 + 3, gridY + 10);
  
  // Célula 4: Espécie
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("MOEDA", startX + cellWidth * 3 + 3, gridY + 4);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text("R$", startX + cellWidth * 3 + 3, gridY + 10);
  
  y = gridY + cellHeight + 3;
  
  // ========== ÁREA DE CONTEÚDO: PAGADOR + PIX ==========
  const leftWidth = contentWidth * 0.56;
  const rightWidth = contentWidth * 0.44;
  const contentHeight = 32;
  
  // --- COLUNA ESQUERDA: Pagador e Descrição ---
  // Pagador
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("PAGADOR", startX + 3, y + 3);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  const pagadorNome = responsavel?.nome || fatura.responsaveis?.nome || "—";
  doc.text(pagadorNome.substring(0, 32), startX + 3, y + 8);
  
  if (responsavel?.cpf) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`CPF: ${responsavel.cpf}`, startX + 3, y + 12);
  }
  
  // Descrição
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("DESCRIÇÃO", startX + 3, y + 17);
  
  doc.setFontSize(7);
  doc.setTextColor(...DARK_TEXT);
  doc.setFont("helvetica", "normal");
  const alunoNome = fatura.alunos?.nome_completo || "";
  const cursoNome = fatura.cursos?.nome || "";
  doc.text(`Aluno: ${alunoNome.substring(0, 28)}`, startX + 3, y + 21);
  doc.text(`Curso: ${cursoNome.substring(0, 28)}`, startX + 3, y + 25);
  
  // Instruções compactas
  doc.setFontSize(4.5);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Após vencimento: multa 2% + juros 1% a.m. • Não receber após 30 dias", startX + 3, y + 30);
  
  // --- COLUNA DIREITA: PIX ---
  const pixX = startX + leftWidth;
  const pixY = y - 1;
  
  if (fatura.asaas_pix_qrcode) {
    // Container PIX
    doc.setFillColor(...PIX_GREEN_BG);
    doc.setDrawColor(...PIX_GREEN);
    doc.setLineWidth(0.5);
    doc.roundedRect(pixX, pixY, rightWidth - 3, contentHeight + 2, 2, 2, 'FD');
    
    // Badge PIX
    doc.setFillColor(...PIX_GREEN);
    doc.roundedRect(pixX + (rightWidth - 3) / 2 - 12, pixY + 1, 24, 5, 1, 1, 'F');
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("PAGUE COM PIX", pixX + (rightWidth - 3) / 2, pixY + 4.5, { align: "center" });
    
    // QR Code
    const qrSize = 22;
    const qrX = pixX + ((rightWidth - 3 - qrSize) / 2);
    
    try {
      let qrCodeData = fatura.asaas_pix_qrcode;
      if (!qrCodeData.startsWith('data:')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      doc.addImage(qrCodeData, 'PNG', qrX, pixY + 7, qrSize, qrSize);
    } catch (error) {
      console.error('Erro QR:', error);
      doc.setDrawColor(...GRAY_TEXT);
      doc.rect(qrX, pixY + 7, qrSize, qrSize);
    }
    
    // Texto inferior
    doc.setFontSize(4);
    doc.setTextColor(...PIX_GREEN);
    doc.setFont("helvetica", "normal");
    doc.text("Escaneie com o app do seu banco", pixX + (rightWidth - 3) / 2, pixY + 31, { align: "center" });
  } else {
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(pixX, pixY, rightWidth - 3, contentHeight + 2, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("PIX indisponível", pixX + (rightWidth - 3) / 2, pixY + 16, { align: "center" });
  }
  
  y += contentHeight + 4;
  
  // ========== LINHA DIGITÁVEL ==========
  const barcodeHeight = 13;
  const barcodeY = yOffset + COMPACT_HEIGHT - barcodeHeight - 4;
  
  if (fatura.asaas_boleto_barcode) {
    // Container amarelo
    doc.setFillColor(...YELLOW_BG);
    doc.setDrawColor(...YELLOW_BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(startX, barcodeY, contentWidth, barcodeHeight, 1.5, 1.5, 'FD');
    
    // Ícone de código de barras (simulado com linhas)
    const iconX = startX + 4;
    const iconY = barcodeY + 3;
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.4);
    for (let i = 0; i < 6; i++) {
      const lineWidth = i % 2 === 0 ? 0.6 : 0.3;
      doc.setLineWidth(lineWidth);
      doc.line(iconX + i * 1.2, iconY, iconX + i * 1.2, iconY + 6);
    }
    
    // Label
    doc.setFontSize(4.5);
    doc.setTextColor(120, 80, 0);
    doc.setFont("helvetica", "bold");
    doc.text("LINHA DIGITÁVEL", startX + 14, barcodeY + 4);
    
    // Código formatado
    doc.setFontSize(8);
    doc.setTextColor(...DARK_TEXT);
    doc.setFont("courier", "bold");
    const barcode = fatura.asaas_boleto_barcode.replace(/\s/g, '');
    // Formatar para melhor legibilidade
    const formatted = barcode.replace(/(.{5})/g, '$1 ').trim();
    doc.text(formatted, startX + 14, barcodeY + 10);
  } else {
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(startX, barcodeY, contentWidth, barcodeHeight, 1.5, 1.5, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Linha digitável não disponível", startX + contentWidth / 2, barcodeY + 7, { align: "center" });
  }
  
  // ========== MARCA D'ÁGUA PAGO ==========
  if (fatura.status.toLowerCase() === "paga") {
    doc.setFontSize(26);
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.text("PAGO", startX + contentWidth / 2, yOffset + COMPACT_HEIGHT / 2, { align: "center", angle: 15 });
  }
  
  // ========== LINHA DE CORTE ==========
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([2, 1], 0);
  doc.setLineWidth(0.2);
  doc.line(0, yOffset + COMPACT_HEIGHT, A4_WIDTH, yOffset + COMPACT_HEIGHT);
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
  const nomeResp = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "resp")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 15);
  
  const filename = `carne-${nomeResp}-${meses[primeiraFatura.mes_referencia - 1]}-${primeiraFatura.ano_referencia}.pdf`;
  doc.save(filename);
}
