import type { CacheOfertas, Empresa } from '../../shared/schemas';

export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public estado: number,
  ) {
    super(mensaje);
  }
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Comprueba tu red e inténtalo de nuevo.', 0);
  }
  let datos: unknown = null;
  try {
    datos = await res.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok) throw new ErrorApi((datos as { error?: string })?.error ?? `Error ${res.status}`, res.status);
  return datos as T;
}

export const MODO_DEMO = import.meta.env.VITE_DEMO === 'true';

/** En la demostración (VITE_DEMO=true) se usa una API simulada con datos ficticios; en producción, nunca. */
async function demo<T>(fn: (d: typeof import('../demo/api-demo')['apiDemo']) => Promise<T>): Promise<T> {
  const m = await import('../demo/api-demo');
  try {
    return await fn(m.apiDemo);
  } catch (e) {
    if (e instanceof m.ErrorDemo) throw new ErrorApi(e.message, e.estado);
    throw e;
  }
}

export const api = {
  estadoAcceso: () => (MODO_DEMO ? demo((d) => d.estadoAcceso()) : pedir<{ autenticado: boolean }>('/api/acceso')),
  entrar: (codigo: string) =>
    MODO_DEMO ? demo((d) => d.entrar(codigo)) : pedir<{ autenticado: boolean }>('/api/acceso', { method: 'POST', body: JSON.stringify({ codigo }) }),
  salir: () => (MODO_DEMO ? demo((d) => d.salir()) : pedir<{ autenticado: boolean }>('/api/acceso', { method: 'DELETE' })),
  empresas: () => (MODO_DEMO ? demo((d) => d.empresas()) : pedir<{ empresas: Empresa[]; total: number }>('/api/empresas')),
  ofertas: () => (MODO_DEMO ? demo((d) => d.ofertas()) : pedir<CacheOfertas>('/api/ofertas')),
};

/** Envía la solicitud de retirada a Netlify Forms. */
export async function enviarRetirada(datos: { empresa: string; email: string; motivo: string }): Promise<void> {
  if (MODO_DEMO) return demo((d) => d.retirada());
  const cuerpo = new URLSearchParams({ 'form-name': 'retirada', ...datos, web: '' });
  const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: cuerpo.toString() });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
