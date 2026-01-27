import jsPDF from "jspdf";
import { format } from "date-fns";
import { Fatura, formatCurrency, meses } from "@/hooks/useFaturas";
// @ts-ignore - bwip-js types
import bwipjs from "bwip-js";

interface EscolaInfo {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

// Cores profissionais minimalistas
const DARK: [number, number, number] = [20, 20, 20];
const GRAY_700: [number, number, number] = [55, 65, 81];
const GRAY_500: [number, number, number] = [107, 114, 128];
const GRAY_400: [number, number, number] = [156, 163, 175];
const GRAY_200: [number, number, number] = [229, 231, 235];
const WHITE: [number, number, number] = [255, 255, 255];

// A4 dimensions
const A4_WIDTH = 210;
const COMPACT_HEIGHT = 99;
const MARGIN = 6;

// Cache de códigos de barras gerados
const barcodeCache = new Map<string, string>();

async function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = dataUrl;
  });
}

function drawFittedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSizeStart = 7,
  fontSizeMin = 5
): void {
  let size = fontSizeStart;
  doc.setFontSize(size);
  while (size > fontSizeMin && doc.getTextWidth(text) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }

  doc.text(text, x, y);
}

/**
 * Converte linha digitável (47 dígitos) para código de barras (44 dígitos)
 * Formato linha digitável: AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
 * Formato código barras:   AAABKUUUUVVVVVVVVVVCCCCCDDDDDDDDDDEEEEEEEEEE
 */
function linhaDigitavelToBarcode(linhaDigitavel: string): string {
  const clean = linhaDigitavel.replace(/\D/g, '');
  
  // Se já tem 44 dígitos, já é código de barras
  if (clean.length === 44) {
    return clean;
  }
  
  // Se tem 47 dígitos, converter de linha digitável para código de barras
  if (clean.length === 47) {
    // Extrai os campos da linha digitável
    const campo1 = clean.slice(0, 10);   // AAABC.CCCCX (sem o X)
    const campo2 = clean.slice(10, 21);  // DDDDD.DDDDDY (sem o Y)
    const campo3 = clean.slice(21, 32);  // EEEEE.EEEEEZ (sem o Z)
    const campo4 = clean.slice(32, 33);  // K (DV geral)
    const campo5 = clean.slice(33, 47);  // UUUUVVVVVVVVVV
    
    // Monta o código de barras: AAABKUUUUVVVVVVVVVVCCCCCDDDDDDDDDDEEEEEEEEEE
    const barcode = 
      campo1.slice(0, 4) +      // AAAB (banco + moeda)
      campo4 +                   // K (DV geral)
      campo5 +                   // UUUUVVVVVVVVVV (fator vencimento + valor)
      campo1.slice(4, 9) +      // CCCCC (campo livre parte 1)
      campo2.slice(0, 10) +     // DDDDDDDDDD (campo livre parte 2)
      campo3.slice(0, 10);      // EEEEEEEEEE (campo livre parte 3)
    
    return barcode;
  }
  
  // Fallback: retorna o que tiver
  return clean;
}

/**
 * Gera código de barras ITF-25 real usando bwip-js
 * Retorna base64 da imagem PNG
 */
async function generateITF25Barcode(linhaDigitavel: string): Promise<string | null> {
  try {
    // Converte linha digitável para código de barras de 44 dígitos
    const barcode = linhaDigitavelToBarcode(linhaDigitavel);
    
    // Verifica cache
    if (barcodeCache.has(barcode)) {
      return barcodeCache.get(barcode)!;
    }
    
    // ITF requer número par de dígitos (44 é par, ok)
    const paddedCode = barcode.length % 2 === 0 ? barcode : '0' + barcode;
    
    // Gera o código de barras como canvas
    const canvas = document.createElement('canvas');
    
    bwipjs.toCanvas(canvas, {
      bcid: 'interleaved2of5', // Tipo ITF-25 (boleto brasileiro)
      text: paddedCode,
      // Mais resolução = leitura mais confiável em apps bancários
      scale: 6,
      height: 14,
      includetext: false,
      backgroundcolor: 'ffffff',
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    barcodeCache.set(barcode, dataUrl);
    
    return dataUrl;
  } catch (error) {
    console.warn('Erro ao gerar código de barras ITF-25:', error);
    return null;
  }
}

/**
 * Formata a linha digitável no padrão brasileiro
 * Formato: XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXX
 */
function formatLinhaDigitavel(code: string): string {
  const clean = code.replace(/\D/g, '');
  
  if (clean.length === 47) {
    // Formato padrão de boleto com 47 dígitos
    return `${clean.slice(0,5)}.${clean.slice(5,10)} ${clean.slice(10,15)}.${clean.slice(15,21)} ${clean.slice(21,26)}.${clean.slice(26,32)} ${clean.slice(32,33)} ${clean.slice(33,47)}`;
  } else if (clean.length === 44) {
    // Código de barras com 44 dígitos (sem dígitos verificadores)
    return `${clean.slice(0,5)}.${clean.slice(5,10)} ${clean.slice(10,15)}.${clean.slice(15,20)} ${clean.slice(20,25)}.${clean.slice(25,30)} ${clean.slice(30,31)} ${clean.slice(31,44)}`;
  }
  
  // Fallback: agrupa em blocos de 5
  return clean.replace(/(.{5})/g, '$1 ').trim();
}

/**
 * Draw professional bank-style carnê
 */
async function drawCompactCarne(
  doc: jsPDF,
  fatura: Fatura,
  escola: EscolaInfo,
  responsavel: { nome: string; cpf?: string | null } | null,
  yOffset: number,
  barcodeImage: string | null
): Promise<void> {
  const contentWidth = A4_WIDTH - (MARGIN * 2);
  const startX = MARGIN;
  let y = yOffset + 4;
  
  // ========== BORDA EXTERNA ==========
  doc.setDrawColor(...GRAY_200);
  doc.setLineWidth(0.4);
  doc.rect(startX, yOffset + 2, contentWidth, COMPACT_HEIGHT - 5);
  
  // ========== HEADER ==========
  doc.setFillColor(...DARK);
  doc.rect(startX, y, contentWidth, 10, 'F');
  
  // Nome da instituição
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(escola.nome.toUpperCase(), startX + 4, y + 6);
  
  // CNPJ
  if (escola.cnpj) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(`CNPJ ${escola.cnpj}`, startX + 4, y + 9);
  }
  
  // Nosso Número à direita
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const nossoNumero = fatura.codigo_sequencial || `${fatura.id.substring(0, 8).toUpperCase()}`;
  doc.text(nossoNumero, contentWidth, y + 6, { align: "right" });
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("NOSSO NÚMERO", contentWidth, y + 9, { align: "right" });
  
  y += 12;
  
  // ========== GRID DE DADOS ==========
  const cellHeight = 11;
  const cellWidth = contentWidth / 4;
  
  // Bordas do grid
  doc.setDrawColor(...GRAY_200);
  doc.setLineWidth(0.2);
  doc.rect(startX, y, contentWidth, cellHeight);
  for (let i = 1; i < 4; i++) {
    doc.line(startX + cellWidth * i, y, startX + cellWidth * i, y + cellHeight);
  }
  
  // Célula 1: Vencimento
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_500);
  doc.setFont("helvetica", "normal");
  doc.text("VENCIMENTO", startX + 3, y + 3.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(format(new Date(fatura.data_vencimento), "dd/MM/yyyy"), startX + 3, y + 8.5);
  
  // Célula 2: Valor
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_500);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR", startX + cellWidth + 3, y + 3.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(formatCurrency(fatura.valor_total || fatura.valor), startX + cellWidth + 3, y + 8.5);
  
  // Célula 3: Referência
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_500);
  doc.setFont("helvetica", "normal");
  doc.text("REFERÊNCIA", startX + cellWidth * 2 + 3, y + 3.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(`${meses[fatura.mes_referencia - 1]}/${fatura.ano_referencia}`, startX + cellWidth * 2 + 3, y + 8.5);
  
  // Célula 4: Espécie
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_500);
  doc.setFont("helvetica", "normal");
  doc.text("ESPÉCIE", startX + cellWidth * 3 + 3, y + 3.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("R$", startX + cellWidth * 3 + 3, y + 8.5);
  
  y += cellHeight + 2;
  
  // ========== CONTEÚDO PRINCIPAL ==========
  const leftWidth = contentWidth * 0.60;
  const rightWidth = contentWidth * 0.40;
  
  // --- PAGADOR ---
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_500);
  doc.setFont("helvetica", "normal");
  doc.text("PAGADOR", startX + 3, y + 3);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  const pagadorNome = responsavel?.nome || fatura.responsaveis?.nome || "—";
  doc.text(pagadorNome.substring(0, 35), startX + 3, y + 7);
  
  if (responsavel?.cpf) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_700);
    doc.text(`CPF: ${responsavel.cpf}`, startX + 3, y + 11);
  }
  
  // --- DESCRIÇÃO ---
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_500);
  doc.setFont("helvetica", "normal");
  doc.text("DESCRIÇÃO", startX + 3, y + 15);
  
  doc.setFontSize(7);
  doc.setTextColor(...DARK);
  const alunoNome = fatura.alunos?.nome_completo || "";
  const cursoNome = fatura.cursos?.nome || "";
  doc.text(`${alunoNome.substring(0, 30)} • ${cursoNome.substring(0, 20)}`, startX + 3, y + 19);
  
  // Instruções
  doc.setFontSize(5);
  doc.setTextColor(...GRAY_400);
  doc.text("Após vencimento: multa 2% + juros 1% a.m.", startX + 3, y + 24);
  
  // --- QR CODE PIX (sem fundo) ---
  const qrX = startX + leftWidth + 5;
  const qrY = y - 1;
  
  if (fatura.asaas_pix_qrcode) {
    // Título PIX simples
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_700);
    doc.setFont("helvetica", "bold");
    doc.text("PIX", qrX + (rightWidth - 10) / 2, qrY + 3, { align: "center" });
    
    // QR Code limpo
    const qrSize = 22;
    const qrPosX = qrX + ((rightWidth - 10 - qrSize) / 2);
    
    try {
      let qrCodeData = fatura.asaas_pix_qrcode;
      if (!qrCodeData.startsWith('data:')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      doc.addImage(qrCodeData, 'PNG', qrPosX, qrY + 5, qrSize, qrSize);
    } catch (error) {
      doc.setDrawColor(...GRAY_400);
      doc.setLineWidth(0.3);
      doc.rect(qrPosX, qrY + 5, qrSize, qrSize);
    }
  }
  
  // ========== CÓDIGO DE BARRAS E LINHA DIGITÁVEL ==========
  const barcodeAreaY = yOffset + COMPACT_HEIGHT - 24;
  
  // Linha separadora
  doc.setDrawColor(...GRAY_200);
  doc.setLineWidth(0.3);
  doc.line(startX, barcodeAreaY - 2, startX + contentWidth, barcodeAreaY - 2);
  
  if (fatura.asaas_boleto_barcode) {
    // Código de barras REAL (ITF-25)
    if (barcodeImage) {
      try {
        // Evita distorção (distorção = leitura inválida em apps bancários)
        const maxW = contentWidth * 0.88;
        const targetH = 12; // mm (altura típica para leitura)

        const { w, h } = await getImageDimensions(barcodeImage);
        const ratio = w > 0 && h > 0 ? w / h : 8;

        let widthMm = targetH * ratio;
        let heightMm = targetH;

        if (widthMm > maxW) {
          widthMm = maxW;
          heightMm = widthMm / ratio;
        }

        const x = startX + (contentWidth - widthMm) / 2;
        const yImg = barcodeAreaY;

        // Quiet zone (margem branca) melhora leitura
        doc.setFillColor(255, 255, 255);
        doc.rect(x - 1, yImg - 1, widthMm + 2, heightMm + 2, 'F');
        // Evita compressão que pode “borrar” barras finas
        doc.addImage(barcodeImage, 'PNG', x, yImg, widthMm, heightMm, undefined, 'NONE');
      } catch (error) {
        console.warn('Erro ao inserir código de barras:', error);
      }
    }
    
    // Linha digitável formatada corretamente
    doc.setFontSize(5);
    doc.setTextColor(...GRAY_500);
    doc.setFont("helvetica", "normal");
    doc.text("LINHA DIGITÁVEL", startX + 3, barcodeAreaY + 12);
    
    doc.setTextColor(...DARK);
    doc.setFont("courier", "bold");
    // Usa formatação correta para linha digitável
    const formatted = formatLinhaDigitavel(fatura.asaas_boleto_barcode);
    // Garante que NUNCA seja cortada no PDF (isso causa erro ao digitar no banco)
    drawFittedText(doc, formatted, startX + 3, barcodeAreaY + 17, contentWidth - 6, 7, 5);
  } else {
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_400);
    doc.setFont("helvetica", "italic");
    doc.text("Código de barras não disponível", startX + contentWidth / 2, barcodeAreaY + 8, { align: "center" });
  }
  
  // ========== MARCA D'ÁGUA PAGO ==========
  if (fatura.status.toLowerCase() === "paga") {
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.text("PAGO", startX + contentWidth / 2, yOffset + COMPACT_HEIGHT / 2, { align: "center", angle: 15 });
  }
  
  // ========== LINHA DE CORTE ==========
  doc.setDrawColor(...GRAY_400);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setLineWidth(0.15);
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
    
    // Gera código de barras real para cada fatura
    let barcodeImage: string | null = null;
    if (faturasOrdenadas[i].asaas_boleto_barcode) {
      barcodeImage = await generateITF25Barcode(faturasOrdenadas[i].asaas_boleto_barcode);
    }
    
    await drawCompactCarne(doc, faturasOrdenadas[i], escola, responsavel || null, yOffset, barcodeImage);
    
    positionOnPage++;
    if (positionOnPage >= 3) {
      positionOnPage = 0;
    }
  }
  
  const primeiraFatura = faturasOrdenadas[0];
  const nomeResp = (responsavel?.nome || primeiraFatura.responsaveis?.nome || "resp")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 15);
  
  const filename = `carne-${nomeResp}-${meses[primeiraFatura.mes_referencia - 1]}-${primeiraFatura.ano_referencia}.pdf`;
  doc.save(filename);
}
