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

export const api = {
  estadoAcceso: () => pedir<{ autenticado: boolean }>('/api/acceso'),
  entrar: (codigo: string) => pedir<{ autenticado: boolean }>('/api/acceso', { method: 'POST', body: JSON.stringify({ codigo }) }),
  salir: () => pedir<{ autenticado: boolean }>('/api/acceso', { method: 'DELETE' }),
  empresas: () => pedir<{ empresas: Empresa[]; total: number }>('/api/empresas'),
  ofertas: () => pedir<CacheOfertas>('/api/ofertas'),
};

/** Envía la solicitud de retirada a Netlify Forms. */
export async function enviarRetirada(datos: { empresa: string; email: string; motivo: string }): Promise<void> {
  const cuerpo = new URLSearchParams({ 'form-name': 'retirada', ...datos, web: '' });
  const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: cuerpo.toString() });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
