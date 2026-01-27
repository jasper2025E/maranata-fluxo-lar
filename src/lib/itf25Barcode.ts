// Geração de código de barras ITF-25 (Interleaved 2 of 5) no browser.
// IMPORTANT: por requisito de compliance bancária, esta função só aceita o
// barCode oficial (44 dígitos) retornado pelo ASAAS. Não converte linha digitável.

// @ts-ignore - bwip-js types
import bwipjs from "bwip-js";

const barcodeCache = new Map<string, string>();

function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Gera um PNG (dataURL) do ITF-25 para o código informado.
 * Aceita EXCLUSIVAMENTE 44 dígitos (barCode oficial do ASAAS).
 */
export async function generateITF25BarcodeDataUrl(code: string): Promise<string | null> {
  try {
    const barcode = onlyDigits(code);
    // Compliance: não converter linha digitável (47) para barCode (44)
    if (!barcode || barcode.length !== 44) return null;

    const cached = barcodeCache.get(barcode);
    if (cached) return cached;

    // ITF requer número par de dígitos (44 é par)
    const padded = barcode;

    const canvas = document.createElement("canvas");
    // Evita suavização (pode “borrar” barras finas quando o PDF redimensiona a imagem)
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.imageSmoothingEnabled = false;
    bwipjs.toCanvas(canvas, {
      bcid: "interleaved2of5",
      text: padded,
      // Mais densidade = melhor leitura em apps bancários
      scale: 8,
      height: 18,
      includetext: false,
      backgroundcolor: "ffffff",
    });

    const dataUrl = canvas.toDataURL("image/png");
    barcodeCache.set(barcode, dataUrl);
    return dataUrl;
  } catch (e) {
    console.warn("Falha ao gerar ITF-25:", e);
    return null;
  }
}
