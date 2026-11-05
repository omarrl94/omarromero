import type { OfertaBruta } from '../../shared/ofertas';

export interface Fuente {
  id: string;
  nombre: string;
  /** false si faltan las variables de entorno necesarias. */
  configurada(): boolean;
  obtener(fetchImpl?: typeof fetch): Promise<OfertaBruta[]>;
}

export const AGENTE = 'ConectaFFE/1.0 (+https://www.jrotero.es; buscador de prácticas FP)';

export async function pedirJson<T>(url: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch, timeoutMs = 15_000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { ...init, signal: ctrl.signal, headers: { Accept: 'application/json', 'User-Agent': AGENTE, ...(init.headers ?? {}) } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error(`Tiempo de espera agotado (${timeoutMs / 1000} s)`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/** Quita claves de API de los mensajes de error antes de guardarlos o mostrarlos. */
export function sinSecretos(mensaje: string): string {
  return mensaje.replace(/(app_key|app_id|key|token|secret)=[^&\s]+/gi, '$1=***');
}
