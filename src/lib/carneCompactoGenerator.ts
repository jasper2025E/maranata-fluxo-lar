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

// Cores
const PRIMARY_COLOR: [number, number, number] = [79, 70, 229];
const DARK_COLOR: [number, number, number] = [15, 23, 42];
const MUTED_COLOR: [number, number, number] = [100, 116, 139];
const LIGHT_BG: [number, number, number] = [248, 250, 252];
const SUCCESS_COLOR: [number, number, number] = [16, 185, 129];
const WARNING_COLOR: [number, number, number] = [245, 158, 11];
const DANGER_COLOR: [number, number, number] = [239, 68, 68];
const PIX_GREEN: [number, number, number] = [0, 150, 100];

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// Compact carnê dimensions (3 per A4 page)
const COMPACT_HEIGHT = 99; // 297 / 3 = 99mm per carnê
const COMPACT_WIDTH = A4_WIDTH;
const COMPACT_MARGIN = 5;

// Helper function to load logo
async function loadLogoAsBase64(logoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(logoUrl);
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

function getStatusColor(status: string): [number, number, number] {
  switch (status.toLowerCase()) {
    case "paga": return SUCCESS_COLOR;
    case "vencida": return DANGER_COLOR;
    case "aberta": return WARNING_COLOR;
    default: return PRIMARY_COLOR;
  }
}

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "paga": return "PAGO";
    case "vencida": return "VENCIDO";
    case "aberta": return "EM ABERTO";
    default: return status.toUpperCase();
  }
}

/**
 * Draw a single compact carnê at the specified Y offset
 */
function drawCompactCarne(
  doc: jsPDF,
  fatura: Fatura,
  escola: EscolaInfo,
  responsavel: { nome: string; cpf?: string | null } | null,
  yOffset: number,
  logoBase64: string | null
): void {
  const leftColWidth = 45;
  const middleColWidth = 100;
  const rightColWidth = COMPACT_WIDTH - leftColWidth - middleColWidth;
  
  // Draw border for this carnê section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(0, yOffset, COMPACT_WIDTH, COMPACT_HEIGHT);
  
  // Draw vertical dividers
  doc.line(leftColWidth, yOffset, leftColWidth, yOffset + COMPACT_HEIGHT);
  doc.line(leftColWidth + middleColWidth, yOffset, leftColWidth + middleColWidth, yOffset + COMPACT_HEIGHT);
  
  // ========== LEFT COLUMN (Recibo do Pagador) ==========
  const leftX = COMPACT_MARGIN;
  let leftY = yOffset + 8;
  
  // Logo/School name
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', leftX, leftY, 35, 10);
    } catch {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text(escola.nome.substring(0, 15), leftX, leftY + 7);
    }
  } else {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(escola.nome.substring(0, 15), leftX, leftY + 7);
  }
  
  leftY += 15;
  
  // Nosso Número
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("NOSSO NÚMERO", leftX, leftY);
  doc.setFontSize(7);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(fatura.codigo_sequencial || fatura.id.substring(0, 8), leftX, leftY + 4);
  
  leftY += 12;
  
  // Vencimento
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", leftX, leftY);
  doc.setFontSize(7);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), leftX, leftY + 4);
  
  leftY += 12;
  
  // Valor do Doc
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR DO DOC.", leftX, leftY);
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(fatura.valor_total || fatura.valor), leftX, leftY + 4);
  
  leftY += 14;
  
  // Cliente
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("CLIENTE", leftX, leftY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  const clienteNome = (responsavel?.nome || fatura.responsaveis?.nome || "").substring(0, 18);
  doc.text(clienteNome, leftX, leftY + 4);
  
  leftY += 16;
  
  // Recibo do Pagador
  doc.setDrawColor(200, 200, 200);
  doc.line(leftX, leftY, leftColWidth - COMPACT_MARGIN, leftY);
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Recibo do Pagador", leftX, leftY + 5);
  
  // ========== MIDDLE COLUMN (Main content) ==========
  const midX = leftColWidth + COMPACT_MARGIN;
  let midY = yOffset + 5;
  
  // Bank header bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(leftColWidth, yOffset, middleColWidth, 12, 'F');
  
  // School name in header (text only, logo is already in left column)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(escola.nome.substring(0, 25), midX, midY + 6);
  
  // CNPJ in header
  if (escola.cnpj) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(`CNPJ: ${escola.cnpj}`, midX + 50, midY + 6);
  }
  
  midY = yOffset + 16;
  
  // Beneficiário
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("BENEFICIÁRIO", midX, midY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(escola.nome, midX, midY + 4);
  if (escola.cnpj) {
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${escola.cnpj}`, midX, midY + 8);
  }
  
  midY += 14;
  
  // Instruções
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("INSTRUÇÕES", midX, midY);
  doc.setFontSize(5);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "normal");
  
  const instrucoes = [
    "Após o vencimento, cobrar multa de 2% e juros de 1% ao mês.",
    "Não receber após 30 dias do vencimento.",
    `Até ${format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}, cobrar ${formatCurrency(fatura.valor_total || fatura.valor)}.`,
    `${fatura.alunos?.nome_completo || ''} - ${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`,
    fatura.cursos?.nome || ''
  ];
  
  let instrY = midY + 4;
  instrucoes.forEach(line => {
    if (line) {
      doc.text(line.substring(0, 70), midX, instrY);
      instrY += 3.5;
    }
  });
  
  midY = instrY + 2;
  
  // PIX QR Code (if available)
  const qrSize = 25;
  const qrX = leftColWidth + middleColWidth - qrSize - 8;
  const qrY = yOffset + 16;
  
  if (fatura.asaas_pix_qrcode) {
    // PIX label
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(qrX - 2, qrY - 3, qrSize + 4, qrSize + 18, 2, 2, 'F');
    
    doc.setFontSize(5);
    doc.setTextColor(...PIX_GREEN);
    doc.setFont("helvetica", "bold");
    doc.text("Pagar via PIX", qrX + qrSize/2, qrY, { align: "center" });
    
    try {
      // Garantir formato correto do base64
      let qrCodeData = fatura.asaas_pix_qrcode;
      if (!qrCodeData.startsWith('data:')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      doc.addImage(qrCodeData, 'PNG', qrX, qrY + 2, qrSize, qrSize);
    } catch (error) {
      console.error('Erro ao renderizar QR Code:', error);
      doc.setDrawColor(...MUTED_COLOR);
      doc.rect(qrX, qrY + 2, qrSize, qrSize);
      doc.setFontSize(4);
      doc.setTextColor(...MUTED_COLOR);
      doc.text("QR indisponível", qrX + qrSize/2, qrY + qrSize/2 + 2, { align: "center" });
    }
    
    // PIX Copia e Cola (truncated)
    if (fatura.asaas_pix_payload) {
      doc.setFontSize(3);
      doc.setTextColor(...PIX_GREEN);
      doc.setFont("helvetica", "normal");
      const pixTruncated = fatura.asaas_pix_payload.substring(0, 30) + "...";
      doc.text(pixTruncated, qrX + qrSize/2, qrY + qrSize + 6, { align: "center" });
    }
  }
  
  // Cliente section
  midY = yOffset + 55;
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("CLIENTE", midX, midY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(responsavel?.nome || fatura.responsaveis?.nome || "", midX, midY + 4);
  
  if (escola.endereco) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(escola.endereco.substring(0, 60), midX, midY + 8);
  }
  
  // Barcode area - Linha digitável do boleto
  midY = yOffset + COMPACT_HEIGHT - 20;
  
  if (fatura.asaas_boleto_barcode) {
    // Background para linha digitável
    doc.setFillColor(255, 251, 235); // Amarelo claro
    doc.roundedRect(midX - 2, midY - 2, middleColWidth - 6, 16, 1, 1, 'F');
    
    // Label
    doc.setFontSize(4);
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.text("LINHA DIGITÁVEL DO BOLETO", midX, midY + 2);
    
    // Código de barras (linha digitável)
    doc.setFontSize(5);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont("courier", "normal");
    // Quebrar em duas linhas se necessário
    const barcode = fatura.asaas_boleto_barcode;
    if (barcode.length > 47) {
      doc.text(barcode.substring(0, 47), midX, midY + 7);
      doc.text(barcode.substring(47), midX, midY + 11);
    } else {
      doc.text(barcode, midX, midY + 8);
    }
  }
  
  // ========== RIGHT COLUMN (Canhoto) ==========
  const rightX = leftColWidth + middleColWidth + COMPACT_MARGIN;
  let rightY = yOffset + 8;
  
  // Nosso Número
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("NOSSO NÚMERO", rightX, rightY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(fatura.codigo_sequencial || fatura.id.substring(0, 8), rightX, rightY + 4);
  
  rightY += 12;
  
  // Vencimento
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", rightX, rightY);
  doc.setFontSize(7);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), rightX, rightY + 4);
  
  rightY += 12;
  
  // Valor do Doc
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("(=) VALOR DO DOC.", rightX, rightY);
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(fatura.valor_total || fatura.valor), rightX, rightY + 4);
  
  rightY += 12;
  
  // Multa/Juros
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("(+) MULTA/JUROS", rightX, rightY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.text("_____________", rightX, rightY + 4);
  
  rightY += 12;
  
  // Valor a Pagar
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("VALOR A PAGAR", rightX, rightY);
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.text("_____________", rightX, rightY + 4);
  
  rightY += 16;
  
  // Autenticação
  doc.setDrawColor(200, 200, 200);
  doc.line(rightX, rightY, rightX + rightColWidth - 10, rightY);
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Autenticação", rightX, rightY + 4);
  doc.text("Mecânica", rightX, rightY + 8);
  
  // Status watermark if paid
  if (fatura.status.toLowerCase() === "paga") {
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text("PAGO", leftColWidth + middleColWidth/2, yOffset + COMPACT_HEIGHT/2, {
      align: "center",
      angle: 30
    });
  }
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
  
  // Load logo once
  let logoBase64: string | null = null;
  if (escola.logo_url) {
    logoBase64 = await loadLogoAsBase64(escola.logo_url);
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
  
  let currentPage = 0;
  let positionOnPage = 0; // 0, 1, or 2
  
  for (let i = 0; i < faturasOrdenadas.length; i++) {
    if (positionOnPage === 0 && i > 0) {
      doc.addPage();
    }
    
    const yOffset = positionOnPage * COMPACT_HEIGHT;
    drawCompactCarne(doc, faturasOrdenadas[i], escola, responsavel || null, yOffset, logoBase64);
    
    positionOnPage++;
    if (positionOnPage >= 3) {
      positionOnPage = 0;
      currentPage++;
    }
  }
  
  const primeiraFatura = faturasOrdenadas[0];
  const ultimaFatura = faturasOrdenadas[faturasOrdenadas.length - 1];
  const nomeResponsavel = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "responsavel")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 20);
  
  const filename = `carne-economico-${nomeResponsavel}-${primeiraFatura.mes_referencia}-${primeiraFatura.ano_referencia}-a-${ultimaFatura.mes_referencia}-${ultimaFatura.ano_referencia}.pdf`;
  doc.save(filename);
}
