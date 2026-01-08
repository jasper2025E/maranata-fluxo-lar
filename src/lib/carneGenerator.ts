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

// Cores
const PRIMARY_COLOR: [number, number, number] = [37, 99, 235]; // Blue-600
const DARK_COLOR: [number, number, number] = [15, 23, 42]; // Slate-900
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // Slate-500
const SUCCESS_COLOR: [number, number, number] = [22, 163, 74]; // Green-600
const WARNING_COLOR: [number, number, number] = [234, 179, 8]; // Yellow-500
const DANGER_COLOR: [number, number, number] = [220, 38, 38]; // Red-600

// Dimensões do carnê em mm (99mm x 210mm)
const CARNE_WIDTH = 99;
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

function drawCarneHeader(doc: jsPDF, escola: EscolaInfo, y: number): number {
  const centerX = CARNE_WIDTH / 2;
  
  // Header background
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, CARNE_WIDTH, 22, 'F');
  
  // Nome da escola
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(escola.nome || "Escola", centerX, 8, { align: "center" });
  
  // CNPJ
  if (escola.cnpj) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ: ${escola.cnpj}`, centerX, 13, { align: "center" });
  }
  
  // Endereço
  if (escola.endereco) {
    doc.setFontSize(5);
    const endereco = escola.endereco.length > 50 
      ? escola.endereco.substring(0, 47) + "..." 
      : escola.endereco;
    doc.text(endereco, centerX, 18, { align: "center" });
  }
  
  return 26;
}

function drawSeparator(doc: jsPDF, y: number): number {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(5, y, CARNE_WIDTH - 5, y);
  doc.setLineDashPattern([], 0);
  return y + 3;
}

function drawLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth?: number): number {
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text(label, x, y);
  
  doc.setFontSize(8);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  
  if (maxWidth) {
    const lines = doc.splitTextToSize(value, maxWidth);
    doc.text(lines[0] || value, x, y + 4);
    return y + 8 + (lines.length > 1 ? 3 : 0);
  }
  
  doc.text(value, x, y + 4);
  return y + 8;
}

function generateCarnePage(
  doc: jsPDF, 
  fatura: Fatura, 
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): void {
  const margin = 5;
  let y = drawCarneHeader(doc, escola, 0);
  
  // Título do documento
  doc.setFillColor(248, 250, 252);
  doc.rect(0, y - 3, CARNE_WIDTH, 10, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("CARNÊ DE PAGAMENTO", CARNE_WIDTH / 2, y + 3, { align: "center" });
  y += 12;
  
  // Status badge
  const statusColor = getStatusColor(fatura.status);
  doc.setFillColor(...statusColor);
  doc.roundedRect(CARNE_WIDTH - 28, y - 5, 23, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(fatura.status.toUpperCase(), CARNE_WIDTH - 16.5, y - 1, { align: "center" });
  
  // Código da fatura
  doc.setFontSize(7);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  const codigoFatura = fatura.codigo_sequencial || `FAT-${fatura.id.slice(0, 8).toUpperCase()}`;
  doc.text(codigoFatura, margin, y);
  y += 6;
  
  y = drawSeparator(doc, y);
  
  // Responsável
  const nomeResponsavel = responsavel?.nome || fatura.responsaveis?.nome || "Não informado";
  y = drawLabelValue(doc, "RESPONSÁVEL FINANCEIRO", nomeResponsavel, margin, y, CARNE_WIDTH - 10);
  
  // CPF
  const cpfResponsavel = responsavel?.cpf || "Não informado";
  y = drawLabelValue(doc, "CPF", cpfResponsavel, margin, y);
  
  y = drawSeparator(doc, y);
  
  // Aluno
  const nomeAluno = fatura.alunos?.nome_completo || "Não informado";
  y = drawLabelValue(doc, "ALUNO", nomeAluno, margin, y, CARNE_WIDTH - 10);
  
  // Curso
  const nomeCurso = fatura.cursos?.nome || "Não informado";
  y = drawLabelValue(doc, "CURSO", nomeCurso, margin, y, CARNE_WIDTH - 10);
  
  y = drawSeparator(doc, y);
  
  // Mês/Ano de referência
  const mesAno = `${meses[fatura.mes_referencia - 1]} / ${fatura.ano_referencia}`;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, y, CARNE_WIDTH - 10, 14, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("COMPETÊNCIA", margin + 3, y + 4);
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(mesAno, margin + 3, y + 11);
  y += 18;
  
  // Vencimento
  const dataVencimento = format(new Date(fatura.data_vencimento), "dd/MM/yyyy");
  doc.setFillColor(fatura.status === "Vencida" ? 254 : 248, fatura.status === "Vencida" ? 242 : 250, fatura.status === "Vencida" ? 242 : 252);
  doc.roundedRect(margin, y, CARNE_WIDTH - 10, 12, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.text("VENCIMENTO", margin + 3, y + 4);
  doc.setFontSize(10);
  const textColorVenc = fatura.status === "Vencida" ? DANGER_COLOR : DARK_COLOR;
  doc.setTextColor(textColorVenc[0], textColorVenc[1], textColorVenc[2]);
  doc.setFont("helvetica", "bold");
  doc.text(dataVencimento, margin + 3, y + 10);
  y += 16;
  
  y = drawSeparator(doc, y);
  
  // Valores
  const valorOriginal = fatura.valor_original || fatura.valor;
  const descontoAplicado = fatura.valor_desconto_aplicado || 0;
  const jurosAplicado = fatura.valor_juros_aplicado || 0;
  const multaAplicada = fatura.valor_multa_aplicado || 0;
  const valorFinal = getValorFinal(fatura);
  
  // Valor original
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Valor Original:", margin, y + 3);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(valorOriginal), CARNE_WIDTH - margin, y + 3, { align: "right" });
  y += 6;
  
  // Desconto
  if (descontoAplicado > 0) {
    doc.setFontSize(6);
    doc.setTextColor(...SUCCESS_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text("Desconto:", margin, y + 3);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${formatCurrency(descontoAplicado)}`, CARNE_WIDTH - margin, y + 3, { align: "right" });
    y += 6;
  }
  
  // Juros
  if (jurosAplicado > 0) {
    doc.setFontSize(6);
    doc.setTextColor(...DANGER_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text("Juros:", margin, y + 3);
    doc.setFont("helvetica", "bold");
    doc.text(`+ ${formatCurrency(jurosAplicado)}`, CARNE_WIDTH - margin, y + 3, { align: "right" });
    y += 6;
  }
  
  // Multa
  if (multaAplicada > 0) {
    doc.setFontSize(6);
    doc.setTextColor(...DANGER_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text("Multa:", margin, y + 3);
    doc.setFont("helvetica", "bold");
    doc.text(`+ ${formatCurrency(multaAplicada)}`, CARNE_WIDTH - margin, y + 3, { align: "right" });
    y += 6;
  }
  
  y += 2;
  
  // Linha separadora antes do total
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, y, CARNE_WIDTH - margin, y);
  y += 4;
  
  // Valor Final (destaque)
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, y, CARNE_WIDTH - 10, 16, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR A PAGAR", margin + 3, y + 5);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(valorFinal), CARNE_WIDTH - margin - 3, y + 12, { align: "right" });
  y += 20;
  
  y = drawSeparator(doc, y);
  
  // Código de pagamento / linha digitável
  doc.setFontSize(6);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("CÓDIGO DE PAGAMENTO", margin, y + 3);
  
  // Simular código de barras/linha digitável
  const codigoPagamento = `${fatura.id.replace(/-/g, '').substring(0, 20)}`;
  doc.setFontSize(7);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont("courier", "normal");
  doc.text(codigoPagamento, margin, y + 8);
  y += 12;
  
  // Área de autenticação bancária
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, CARNE_WIDTH - 10, 12);
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("AUTENTICAÇÃO MECÂNICA / RECIBO DO PAGADOR", CARNE_WIDTH / 2, y + 7, { align: "center" });
  y += 16;
  
  // Rodapé
  const footerY = CARNE_HEIGHT - 10;
  doc.setFontSize(5);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  if (escola.telefone) {
    doc.text(`Tel: ${escola.telefone}`, CARNE_WIDTH / 2, footerY, { align: "center" });
  }
  doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, CARNE_WIDTH / 2, footerY + 4, { align: "center" });
}

export async function generateCarneFatura(
  fatura: Fatura,
  escola: EscolaInfo,
  responsavel?: { nome: string; cpf?: string | null } | null
): Promise<void> {
  // Criar PDF com tamanho de carnê (99mm x 210mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [CARNE_WIDTH, CARNE_HEIGHT],
  });
  
  generateCarnePage(doc, fatura, escola, responsavel);
  
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
  
  // Ordenar faturas cronologicamente (Jan → Dez, por ano)
  const faturasOrdenadas = [...faturas].sort((a, b) => {
    if (a.ano_referencia !== b.ano_referencia) {
      return a.ano_referencia - b.ano_referencia;
    }
    return a.mes_referencia - b.mes_referencia;
  });
  
  // Criar PDF com tamanho de carnê (99mm x 210mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [CARNE_WIDTH, CARNE_HEIGHT],
  });
  
  faturasOrdenadas.forEach((fatura, index) => {
    if (index > 0) {
      doc.addPage([CARNE_WIDTH, CARNE_HEIGHT]);
    }
    generateCarnePage(doc, fatura, escola, responsavel);
  });
  
  const primeiraFatura = faturasOrdenadas[0];
  const ultimaFatura = faturasOrdenadas[faturasOrdenadas.length - 1];
  const nomeResponsavel = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "responsavel")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .substring(0, 20);
  
  const filename = `carne-${nomeResponsavel}-${primeiraFatura.mes_referencia}-${primeiraFatura.ano_referencia}-a-${ultimaFatura.mes_referencia}-${ultimaFatura.ano_referencia}.pdf`;
  doc.save(filename);
}
