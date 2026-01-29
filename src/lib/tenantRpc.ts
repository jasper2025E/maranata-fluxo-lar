/**
 * Normaliza retornos de RPCs que podem vir como:
 * - objeto único
 * - array (lista com 0/1 itens)
 *
 * Isso evita crashes do tipo: "Cannot read properties of undefined".
 */
export function firstRow<T>(data: unknown): T | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  return data as T;
}
