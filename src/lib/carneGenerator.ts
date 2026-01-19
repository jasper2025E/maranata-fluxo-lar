import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Fatura, getValorFinal, formatCurrency, meses } from "@/hooks/useFaturas";

interface EscolaInfo {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

// Cores modernas
const PRIMARY_COLOR: [number, number, number] = [79, 70, 229]; // Indigo-600
const PRIMARY_LIGHT: [number, number, number] = [129, 140, 248]; // Indigo-400
const DARK_COLOR: [number, number, number] = [15, 23, 42]; // Slate-900
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate-500
const LIGHT_BG: [number, number, number] = [248, 250, 252]; // Slate-50
const SUCCESS_COLOR: [number, number, number] = [16, 185, 129]; // Emerald-500
const WARNING_COLOR: [number, number, number] = [245, 158, 11]; // Amber-500
const DANGER_COLOR: [number, number, number] = [239, 68, 68]; // Red-500
const PIX_GREEN: [number, number, number] = [0, 150, 100]; // Verde PIX

// Dimensões do carnê em mm (105mm x 210mm) - formato padrão
const CARNE_WIDTH = 105;
const CARNE_HEIGHT = 210;

function getStatusColor(status: string): [number, number, number] {
  switch (status.toLowerCase()) {
    case "paga": return SUCCESS_COLOR;
    case "vencida": return DANGER_COLOR;
    case "aberta": return WARNING_COLOR;
    case "cancelada": return MUTED_COLOR;
    default: return PRIMARY_COLOR;
  }
}

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "paga": return "PAGO";
    case "vencida": return "VENCIDO";
    case "aberta": return "EM ABERTO";
    case "cancelada": return "CANCELADO";
    default: return status.toUpperCase();
  }
}

// Função para carregar logo como base64
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

// Header moderno com gradiente e logo
async function drawModernHeader(doc: jsPDF, escola: EscolaInfo, logoBase64: string | null): Promise<number> {
  const centerX = CARNE_WIDTH / 2;
  
  // Fundo com gradiente simulado (duas faixas)
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, CARNE_WIDTH, 28, 'F');
  
  // Faixa decorativa superior
  doc.setFillColor(...PRIMARY_LIGHT);
  doc.rect(0, 0, CARNE_WIDTH, 3, 'F');
  
  // Logo da escola
  let logoEndX = 8;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 6, 6, 16, 16);
      logoEndX = 24;
    } catch {
      // Se falhar, continua sem logo
    }
  }
  
  // Nome da escola
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const nomeEscola = escola.nome || "Escola";
  const nomeMaxWidth = logoBase64 ? CARNE_WIDTH - 32 : CARNE_WIDTH - 12;
  const nomeLines = doc.splitTextToSize(nomeEscola, nomeMaxWidth);
  doc.text(nomeLines[0], logoBase64 ? logoEndX + 2 : centerX, 12, { align: logoBase64 ? "left" : "center" });
  
  // CNPJ
  if (escola.cnpj) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 255);
    doc.text(`CNPJ: ${escola.cnpj}`, logoBase64 ? logoEndX + 2 : centerX, 18, { align: logoBase64 ? "left" : "center" });
  }
  
  // Endereço
  if (escola.endereco) {
    doc.setFontSize(6);
    doc.setTextColor(180, 180, 230);
    const endereco = escola.endereco.length > 45 
      ? escola.endereco.substring(0, 42) + "..." 
      : escola.endereco;
    doc.text(endereco, logoBase64 ? logoEndX + 2 : centerX, 23, { align: logoBase64 ? "left" : "center" });
  }
  
  return 32;
}

// Título elegante
function drawDocumentTitle(doc: jsPDF, y: number): number {
  const centerX = CARNE_WIDTH / 2;
  
  // Fundo do título
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, y, CARNE_WIDTH, 12, 'F');
  
  // Linhas decorativas
  doc.setDrawColor(...PRIMARY_LIGHT);
  doc.setLineWidth(0.5);
  doc.line(10, y + 6, 30, y + 6);
  doc.line(CARNE_WIDTH - 30, y + 6, CARNE_WIDTH - 10, y + 6);
  
  // Título
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("CARNÊ DE PAGAMENTO", centerX, y + 8, { align: "center" });
  
  return y + 16;
}

// Separador elegante
function drawElegantSeparator(doc: jsPDF, y: number): number {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(8, y, CARNE_WIDTH - 8, y);
  return y + 4;
}

// Campo de informação estilizado
function drawInfoField(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth?: number): number {
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text(label, x, y);
  
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  
  if (maxWidth) {
    const lines = doc.splitTextToSize(value, maxWidth);
    doc.text(lines[0] || value, x, y + 5);
    return y + 10 + (lines.length > 1 ? 4 : 0);
  }
  
  doc.text(value, x, y + 5);
  return y + 10;
}

// Status badge moderno
function drawStatusBadge(doc: jsPDF, status: string, x: number, y: number): void {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const badgeWidth = statusLabel.length * 2.5 + 8;
  
  // Fundo com bordas arredondadas
  doc.setFillColor(...statusColor);
  doc.roundedRect(x - badgeWidth, y, badgeWidth, 8, 2, 2, 'F');
  
  // Texto
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(statusLabel, x - badgeWidth / 2, y + 5.5, { align: "center" });
}

// Card de valor com design moderno
function drawValueCard(doc: jsPDF, fatura: Fatura, y: number): number {
  const margin = 8;
  const cardWidth = CARNE_WIDTH - 16;
  const valorFinal = getValorFinal(fatura);
  const valorOriginal = fatura.valor_original || fatura.valor;
  const descontoAplicado = fatura.valor_desconto_aplicado || 0;
  const jurosAplicado = fatura.valor_juros_aplicado || 0;
  const multaAplicada = fatura.valor_multa_aplicado || 0;
  
  // Card background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, cardWidth, 38, 3, 3, 'FD');
  
  let innerY = y + 6;
  
  // Valor original
  doc.setFontSize(7);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Valor Original:", margin + 4, innerY);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(valorOriginal), CARNE_WIDTH - margin - 4, innerY, { align: "right" });
  innerY += 6;
  
  // Desconto
  if (descontoAplicado > 0) {
    doc.setFontSize(6);
    doc.setTextColor(...SUCCESS_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text("Desconto:", margin + 4, innerY);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${formatCurrency(descontoAplicado)}`, CARNE_WIDTH - margin - 4, innerY, { align: "right" });
    innerY += 5;
  }
  
  // Juros
  if (jurosAplicado > 0) {
    doc.setFontSize(6);
    doc.setTextColor(...DANGER_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text("Juros:", margin + 4, innerY);
    doc.setFont("helvetica", "bold");
    doc.text(`+ ${formatCurrency(jurosAplicado)}`, CARNE_WIDTH - margin - 4, innerY, { align: "right" });
    innerY += 5;
  }
  
  // Multa
  if (multaAplicada > 0) {
    doc.setFontSize(6);
    doc.setTextColor(...DANGER_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text("Multa:", margin + 4, innerY);
    doc.setFont("helvetica", "bold");
    doc.text(`+ ${formatCurrency(multaAplicada)}`, CARNE_WIDTH - margin - 4, innerY, { align: "right" });
    innerY += 5;
  }
  
  // Linha separadora
  doc.setDrawColor(...PRIMARY_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, y + 26, CARNE_WIDTH - margin - 4, y + 26);
  
  // Valor a pagar (destaque)
  doc.setFontSize(7);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR A PAGAR", margin + 4, y + 31);
  
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(valorFinal), CARNE_WIDTH - margin - 4, y + 34, { align: "right" });
  
  return y + 44;
}

// Seção PIX moderna
function drawPixSection(doc: jsPDF, fatura: Fatura, y: number): number {
  const margin = 8;
  const cardWidth = CARNE_WIDTH - 16;
  
  // Card do PIX
  doc.setFillColor(240, 253, 244); // Verde claro
  doc.setDrawColor(...PIX_GREEN);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, cardWidth, 65, 3, 3, 'FD');
  
  // Header do PIX
  doc.setFillColor(...PIX_GREEN);
  doc.roundedRect(margin, y, cardWidth, 10, 3, 3, 'F');
  doc.rect(margin, y + 5, cardWidth, 5, 'F'); // Corrigir cantos inferiores
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("💰 PAGUE COM PIX", CARNE_WIDTH / 2, y + 7, { align: "center" });
  
  // QR Code
  const qrSize = 38;
  const qrX = (CARNE_WIDTH - qrSize) / 2;
  
  if (fatura.asaas_pix_qrcode) {
    try {
      doc.addImage(fatura.asaas_pix_qrcode, 'PNG', qrX, y + 14, qrSize, qrSize);
    } catch {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(qrX, y + 14, qrSize, qrSize);
      doc.setFontSize(7);
      doc.setTextColor(...MUTED_COLOR);
      doc.text("QR Code PIX", CARNE_WIDTH / 2, y + 14 + qrSize / 2, { align: "center" });
    }
  }
  
  // Instrução
  doc.setFontSize(6);
  doc.setTextColor(...PIX_GREEN);
  doc.setFont("helvetica", "normal");
  doc.text("Escaneie o QR Code acima com seu app bancário", CARNE_WIDTH / 2, y + 58, { align: "center" });
  
  return y + 70;
}

// Seção PIX Copia e Cola
function drawPixCopySection(doc: jsPDF, fatura: Fatura, y: number): number {
  if (!fatura.asaas_pix_payload) return y;
  
  const margin = 8;
  const cardWidth = CARNE_WIDTH - 16;
  
  // Card
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, cardWidth, 18, 2, 2, 'FD');
  
  // Label
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("PIX COPIA E COLA", margin + 4, y + 5);
  
  // Código
  const pixCode = fatura.asaas_pix_payload.substring(0, 55) + "...";
  doc.setFontSize(5);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("courier", "normal");
  const lines = doc.splitTextToSize(pixCode, cardWidth - 8);
  doc.text(lines.slice(0, 2), margin + 4, y + 10);
  
  return y + 22;
}

// Seção do Boleto
function drawBoletoSection(doc: jsPDF, fatura: Fatura, y: number): number {
  if (!fatura.asaas_boleto_barcode) return y;
  
  const margin = 8;
  const cardWidth = CARNE_WIDTH - 16;
  
  // Card
  doc.setFillColor(254, 249, 195); // Amarelo claro
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, cardWidth, 20, 2, 2, 'FD');
  
  // Label
  doc.setFontSize(6);
  doc.setTextColor(146, 64, 14);
  doc.setFont("helvetica", "bold");
  doc.text("📄 LINHA DIGITÁVEL DO BOLETO", margin + 4, y + 5);
  
  // Código de barras
  doc.setFontSize(6);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("courier", "normal");
  const lines = doc.splitTextToSize(fatura.asaas_boleto_barcode, cardWidth - 8);
  doc.text(lines.slice(0, 2), margin + 4, y + 11);
  
  return y + 24;
}

// Área de autenticação
function drawAuthenticationArea(doc: jsPDF, y: number): number {
  const margin = 8;
  const cardWidth = CARNE_WIDTH - 16;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(margin, y, cardWidth, 12);
  doc.setLineDashPattern([], 0);
  
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("AUTENTICAÇÃO MECÂNICA / RECIBO DO PAGADOR", CARNE_WIDTH / 2, y + 7, { align: "center" });
  
  return y + 16;
}

// Marca d'água PAGO
function drawPaidWatermark(doc: jsPDF): void {
  // Salvar estado atual
  const currentTextColor = doc.getTextColor();
  
  // Configurar marca d'água
  doc.setTextColor(16, 185, 129); // Verde success com transparência simulada
  doc.setFontSize(50);
  doc.setFont("helvetica", "bold");
  
  // Rotacionar e posicionar no centro
  const centerX = CARNE_WIDTH / 2;
  const centerY = CARNE_HEIGHT / 2;
  
  // Desenhar texto rotacionado
  doc.saveGraphicsState();
  
  // Criar efeito de marca d'água com opacidade
  doc.setGState(doc.GState({ opacity: 0.15 }));
  
  // Rotacionar -30 graus
  const angle = -30 * Math.PI / 180;
  const text = "PAGO";
  
  // Calcular posição rotacionada
  doc.text(text, centerX, centerY, { 
    align: "center",
    angle: -30
  });
  
  doc.restoreGraphicsState();
  
  // Adicionar selo circular
  doc.setGState(doc.GState({ opacity: 0.2 }));
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(2);
  doc.circle(centerX, centerY, 28);
  doc.circle(centerX, centerY, 25);
  
  doc.restoreGraphicsState();
}

// Rodapé moderno
function drawModernFooter(doc: jsPDF, escola: EscolaInfo): void {
  const footerY = CARNE_HEIGHT - 12;
  
  // Linha decorativa
  doc.setDrawColor(...PRIMARY_LIGHT);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 2, CARNE_WIDTH - 20, footerY - 2);
  
  // Informações de contato
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  
  let contactInfo = [];
  if (escola.telefone) contactInfo.push(`📞 ${escola.telefone}`);
  if (escola.email) contactInfo.push(`✉️ ${escola.email}`);
  
  if (contactInfo.length > 0) {
    doc.text(contactInfo.join("  |  "), CARNE_WIDTH / 2, footerY, { align: "center" });
  }
  
  doc.setFontSize(4);
  doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, CARNE_WIDTH / 2, footerY + 4, { align: "center" });
}

// ============ PÁGINA DO CARNÊ PADRÃO ============
async function generateCarnePageModern(
  doc: jsPDF, 
  fatura: Fatura, 
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null,
  logoBase64?: string | null
): Promise<void> {
  const margin = 8;
  let y = await drawModernHeader(doc, escola, logoBase64 || null);
  
  y = drawDocumentTitle(doc, y);
  
  // Status badge
  drawStatusBadge(doc, fatura.status, CARNE_WIDTH - margin, y);
  
  // Código da fatura
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  const codigoFatura = fatura.codigo_sequencial || `FAT-${fatura.id.slice(0, 8).toUpperCase()}`;
  doc.text(codigoFatura, margin, y + 5);
  y += 12;
  
  y = drawElegantSeparator(doc, y);
  
  // Responsável
  const nomeResponsavel = responsavel?.nome || fatura.responsaveis?.nome || "Não informado";
  y = drawInfoField(doc, "RESPONSÁVEL FINANCEIRO", nomeResponsavel, margin, y, CARNE_WIDTH - 16);
  
  // CPF
  const cpfResponsavel = responsavel?.cpf || "Não informado";
  y = drawInfoField(doc, "CPF", cpfResponsavel, margin, y);
  
  y = drawElegantSeparator(doc, y);
  
  // Aluno
  const nomeAluno = fatura.alunos?.nome_completo || "Não informado";
  y = drawInfoField(doc, "ALUNO", nomeAluno, margin, y, CARNE_WIDTH - 16);
  
  // Curso
  const nomeCurso = fatura.cursos?.nome || "Não informado";
  y = drawInfoField(doc, "CURSO", nomeCurso, margin, y, CARNE_WIDTH - 16);
  
  y = drawElegantSeparator(doc, y);
  
  // Cards de Competência e Vencimento lado a lado
  const mesAno = `${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`;
  const dataVencimento = format(new Date(fatura.data_vencimento), "dd/MM/yyyy");
  const cardWidth = (CARNE_WIDTH - 20) / 2;
  
  // Competência
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, y, cardWidth, 16, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("COMPETÊNCIA", margin + 4, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(mesAno, margin + 4, y + 12);
  
  // Vencimento
  const isVencida = fatura.status.toLowerCase() === "vencida";
  doc.setFillColor(isVencida ? 254 : 248, isVencida ? 242 : 250, isVencida ? 242 : 252);
  doc.roundedRect(margin + cardWidth + 4, y, cardWidth, 16, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", margin + cardWidth + 8, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(isVencida ? DANGER_COLOR[0] : DARK_COLOR[0], isVencida ? DANGER_COLOR[1] : DARK_COLOR[1], isVencida ? DANGER_COLOR[2] : DARK_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.text(dataVencimento, margin + cardWidth + 8, y + 12);
  y += 22;
  
  // Card de valores
  y = drawValueCard(doc, fatura, y);
  
  // Área de autenticação
  y = drawAuthenticationArea(doc, y);
  
  // Marca d'água PAGO se a fatura estiver paga
  if (fatura.status.toLowerCase() === "paga") {
    drawPaidWatermark(doc);
  }
  
  // Rodapé
  drawModernFooter(doc, escola);
}

// ============ PÁGINA DO CARNÊ COM ASAAS ============
async function generateCarnePageAsaasModern(
  doc: jsPDF, 
  fatura: Fatura, 
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null,
  logoBase64?: string | null
): Promise<void> {
  const margin = 8;
  let y = await drawModernHeader(doc, escola, logoBase64 || null);
  
  y = drawDocumentTitle(doc, y);
  
  // Status badge
  drawStatusBadge(doc, fatura.status, CARNE_WIDTH - margin, y);
  
  // Código da fatura
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  const codigoFatura = fatura.codigo_sequencial || `FAT-${fatura.id.slice(0, 8).toUpperCase()}`;
  doc.text(codigoFatura, margin, y + 5);
  y += 12;
  
  y = drawElegantSeparator(doc, y);
  
  // Responsável (compacto)
  const nomeResponsavel = responsavel?.nome || fatura.responsaveis?.nome || "Não informado";
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("RESPONSÁVEL", margin, y);
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  const nomeResp = nomeResponsavel.length > 35 ? nomeResponsavel.substring(0, 32) + "..." : nomeResponsavel;
  doc.text(nomeResp, margin, y + 5);
  y += 10;
  
  // Aluno (compacto)
  const nomeAluno = fatura.alunos?.nome_completo || "Não informado";
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("ALUNO", margin, y);
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  const alunoText = nomeAluno.length > 35 ? nomeAluno.substring(0, 32) + "..." : nomeAluno;
  doc.text(alunoText, margin, y + 5);
  y += 10;
  
  y = drawElegantSeparator(doc, y);
  
  // Cards de Competência e Vencimento lado a lado
  const mesAno = `${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`;
  const dataVencimento = format(new Date(fatura.data_vencimento), "dd/MM/yyyy");
  const cardWidth = (CARNE_WIDTH - 20) / 2;
  
  // Competência
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, y, cardWidth, 14, 2, 2, 'F');
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("COMPETÊNCIA", margin + 4, y + 4);
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(mesAno, margin + 4, y + 10);
  
  // Vencimento
  const isVencida = fatura.status.toLowerCase() === "vencida";
  doc.setFillColor(isVencida ? 254 : 248, isVencida ? 242 : 250, isVencida ? 242 : 252);
  doc.roundedRect(margin + cardWidth + 4, y, cardWidth, 14, 2, 2, 'F');
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", margin + cardWidth + 8, y + 4);
  doc.setFontSize(10);
  doc.setTextColor(isVencida ? DANGER_COLOR[0] : DARK_COLOR[0], isVencida ? DANGER_COLOR[1] : DARK_COLOR[1], isVencida ? DANGER_COLOR[2] : DARK_COLOR[2]);
  doc.setFont("helvetica", "bold");
  doc.text(dataVencimento, margin + cardWidth + 8, y + 10);
  y += 18;
  
  // Valor a pagar destacado
  const valorFinal = getValorFinal(fatura);
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(margin, y, CARNE_WIDTH - 16, 16, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 255);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR A PAGAR", margin + 6, y + 5);
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(valorFinal), CARNE_WIDTH - margin - 6, y + 12, { align: "right" });
  y += 20;
  
  // Seção PIX (se disponível e não paga)
  if (fatura.asaas_pix_qrcode && fatura.status.toLowerCase() !== "paga") {
    y = drawPixSection(doc, fatura, y);
    y = drawPixCopySection(doc, fatura, y);
  } else if (fatura.asaas_boleto_barcode) {
    y = drawBoletoSection(doc, fatura, y);
  }
  
  // Link de pagamento
  if (fatura.asaas_invoice_url && fatura.status.toLowerCase() !== "paga") {
    doc.setFontSize(6);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text("🔗 Acesse: asaas.com/pay", CARNE_WIDTH / 2, y + 2, { align: "center" });
  }
  
  // Marca d'água PAGO se a fatura estiver paga
  if (fatura.status.toLowerCase() === "paga") {
    drawPaidWatermark(doc);
  }
  
  // Rodapé
  drawModernFooter(doc, escola);
}

// ============ FUNÇÕES DE EXPORTAÇÃO ============

export async function generateCarneFatura(
  fatura: Fatura,
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [CARNE_WIDTH, CARNE_HEIGHT],
  });
  
  // Carregar logo se disponível
  let logoBase64: string | null = null;
  if (escola.logo_url) {
    logoBase64 = await loadLogoAsBase64(escola.logo_url);
  }
  
  await generateCarnePageModern(doc, fatura, escola, responsavel, logoBase64);
  
  const mesRef = meses[fatura.mes_referencia - 1];
  const filename = `carne-${fatura.codigo_sequencial || fatura.id.slice(0, 8)}-${mesRef}-${fatura.ano_referencia}.pdf`;
  doc.save(filename);
}

export async function generateCarneCompleto(
  faturas: Fatura[],
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): Promise<void> {
  if (faturas.length === 0) {
    throw new Error("Nenhuma fatura para gerar carnê");
  }
  
  // Carregar logo uma vez
  let logoBase64: string | null = null;
  if (escola.logo_url) {
    logoBase64 = await loadLogoAsBase64(escola.logo_url);
  }
  
  // Ordenar faturas cronologicamente
  const faturasOrdenadas = [...faturas].sort((a, b) => {
    if (a.ano_referencia !== b.ano_referencia) {
      return a.ano_referencia - b.ano_referencia;
    }
    return a.mes_referencia - b.mes_referencia;
  });
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [CARNE_WIDTH, CARNE_HEIGHT],
  });
  
  for (let i = 0; i < faturasOrdenadas.length; i++) {
    if (i > 0) {
      doc.addPage([CARNE_WIDTH, CARNE_HEIGHT]);
    }
    await generateCarnePageModern(doc, faturasOrdenadas[i], escola, responsavel, logoBase64);
  }
  
  const primeiraFatura = faturasOrdenadas[0];
  const ultimaFatura = faturasOrdenadas[faturasOrdenadas.length - 1];
  const nomeResponsavel = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "responsavel")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 20);
  
  const filename = `carne-${nomeResponsavel}-${primeiraFatura.mes_referencia}-${primeiraFatura.ano_referencia}-a-${ultimaFatura.mes_referencia}-${ultimaFatura.ano_referencia}.pdf`;
  doc.save(filename);
}

export async function generateCarneCompletoAsaas(
  faturas: Fatura[],
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): Promise<void> {
  if (faturas.length === 0) {
    throw new Error("Nenhuma fatura para gerar carnê");
  }
  
  // Carregar logo uma vez
  let logoBase64: string | null = null;
  if (escola.logo_url) {
    logoBase64 = await loadLogoAsBase64(escola.logo_url);
  }
  
  // Ordenar faturas cronologicamente
  const faturasOrdenadas = [...faturas].sort((a, b) => {
    if (a.ano_referencia !== b.ano_referencia) {
      return a.ano_referencia - b.ano_referencia;
    }
    return a.mes_referencia - b.mes_referencia;
  });
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [CARNE_WIDTH, CARNE_HEIGHT],
  });
  
  for (let i = 0; i < faturasOrdenadas.length; i++) {
    if (i > 0) {
      doc.addPage([CARNE_WIDTH, CARNE_HEIGHT]);
    }
    const fatura = faturasOrdenadas[i];
    // Usar versão Asaas para faturas com dados do Asaas
    if (fatura.asaas_payment_id || fatura.asaas_pix_qrcode) {
      await generateCarnePageAsaasModern(doc, fatura, escola, responsavel, logoBase64);
    } else {
      await generateCarnePageModern(doc, fatura, escola, responsavel, logoBase64);
    }
  }
  
  const primeiraFatura = faturasOrdenadas[0];
  const ultimaFatura = faturasOrdenadas[faturasOrdenadas.length - 1];
  const nomeResponsavel = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "responsavel")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 20);
  
  const filename = `carne-asaas-${nomeResponsavel}-${primeiraFatura.mes_referencia}-${primeiraFatura.ano_referencia}-a-${ultimaFatura.mes_referencia}-${ultimaFatura.ano_referencia}.pdf`;
  doc.save(filename);
}
