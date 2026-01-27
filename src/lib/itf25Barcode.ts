// Geração de código de barras ITF-25 (Interleaved 2 of 5) no browser
// Usado para boletos brasileiros (44 dígitos) com alta fidelidade via bwip-js.

// @ts-ignore - bwip-js types
import bwipjs from "bwip-js";

const barcodeCache = new Map<string, string>();

function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Converte linha digitável (47 dígitos) para código de barras (44 dígitos).
 * Se já for 44 dígitos, retorna como está.
 */
export function normalizeBoletoBarcode(code: string): string {
  const clean = onlyDigits(code);
  if (clean.length === 44) return clean;

  if (clean.length === 47) {
    // campos: 1(9) + dv1(1) + 2(10) + dv2(1) + 3(10) + dv3(1) + dvGeral(1) + fator/valor(14)
    const campo1 = clean.slice(0, 10);
    const campo2 = clean.slice(10, 21);
    const campo3 = clean.slice(21, 32);
    const dvGeral = clean.slice(32, 33);
    const fatorValor = clean.slice(33, 47);

    return (
      campo1.slice(0, 4) +
      dvGeral +
      fatorValor +
      campo1.slice(4, 9) +
      campo2.slice(0, 10) +
      campo3.slice(0, 10)
    );
  }

  return clean;
}

/**
 * Gera um PNG (dataURL) do ITF-25 para o código informado.
 * Aceita 44 dígitos (barcode) ou 47 dígitos (linha digitável).
 */
export async function generateITF25BarcodeDataUrl(code: string): Promise<string | null> {
  try {
    const barcode = normalizeBoletoBarcode(code);
    if (!barcode) return null;

    const cached = barcodeCache.get(barcode);
    if (cached) return cached;

    // ITF requer número par de dígitos
    const padded = barcode.length % 2 === 0 ? barcode : `0${barcode}`;

    const canvas = document.createElement("canvas");
    bwipjs.toCanvas(canvas, {
      bcid: "interleaved2of5",
      text: padded,
      scale: 6,
      height: 14,
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
