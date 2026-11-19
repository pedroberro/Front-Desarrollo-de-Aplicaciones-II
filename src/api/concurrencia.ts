import axios from 'axios';

/**
 * ETags of the resources this tab has read. Changing one of them sends its ETag back as If-Match:
 * if someone else changed it in between, the API answers 412 and nothing is overwritten.
 */
const etags = new Map<string, string>();

export function recordarEtag(recurso: string, headers: Record<string, unknown>): void {
  const etag = headers['etag'];
  if (typeof etag === 'string') etags.set(recurso, etag);
}

export function ifMatch(recurso: string): Record<string, string> {
  const etag = etags.get(recurso);
  return etag ? { 'If-Match': etag } : {};
}

/**
 * Idempotency-Key per operation: a retry of the same operation (double click, network error)
 * reuses the key, so the API returns the first answer instead of creating the resource twice.
 * Once the API answered, the next operation gets a new key.
 */
const claves = new Map<string, string>();

function nuevaClave(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export async function conIdempotencia<T>(operacion: unknown, pedido: (clave: string) => Promise<T>): Promise<T> {
  const huella = JSON.stringify(operacion);
  const clave = claves.get(huella) ?? nuevaClave();
  claves.set(huella, clave);
  try {
    const resultado = await pedido(clave);
    claves.delete(huella);
    return resultado;
  } catch (error) {
    // Without an answer (network down, timeout) the same key is kept for the retry.
    if (axios.isAxiosError(error) && error.response) claves.delete(huella);
    throw error;
  }
}
