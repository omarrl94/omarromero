import type { CacheOfertas, Empresa } from '../../shared/schemas';
import { auth } from './auth';

export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public estado: number,
    public datos: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await auth.token();
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'same-origin',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Comprueba tu red e inténtalo de nuevo.', 0);
  }
  let datos: Record<string, unknown> = {};
  try {
    datos = (await res.json()) as Record<string, unknown>;
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok) throw new ErrorApi(typeof datos.error === 'string' ? datos.error : `Error ${res.status}`, res.status, datos);
  return datos as T;
}

export const MODO_DEMO = import.meta.env.VITE_DEMO === 'true';

/** En la demostración (VITE_DEMO=true) se usa una API simulada con datos ficticios; en producción, nunca. */
async function demo<T>(fn: (d: typeof import('../demo/api-demo')['apiDemo']) => Promise<T>): Promise<T> {
  const m = await import('../demo/api-demo');
  try {
    return await fn(m.apiDemo);
  } catch (e) {
    if (e instanceof m.ErrorDemo) throw new ErrorApi(e.message, e.estado, e.datos);
    throw e;
  }
}

export type Rol = 'alumno' | 'tutor' | 'superadmin' | 'pendiente' | 'bloqueado';

export interface EstadoCuenta {
  email: string;
  verificado: boolean;
  tipo: 'alumno' | 'profesor' | null;
  rol: Rol | null;
  nombre: string;
  necesitaDobleFactor: boolean;
  dobleFactorOk: boolean;
  correoConfigurado: boolean;
}

export interface UsuarioAdmin {
  uid: string;
  email: string;
  nombre: string;
  tipo: 'alumno' | 'profesor';
  rol: Rol;
  creado: string;
  actualizado: string;
  fijo: boolean;
}

type Respuesta = { ok: boolean; [k: string]: unknown };

const post = <T = Respuesta,>(url: string, cuerpo: unknown) => pedir<T>(url, { method: 'POST', body: JSON.stringify(cuerpo) });

export const api = {
  cuenta: {
    estado: () => (MODO_DEMO ? demo((d) => d.estado()) : pedir<EstadoCuenta>('/api/cuenta')),
    accion: (accion: string, datos: Record<string, unknown> = {}) =>
      MODO_DEMO ? demo((d) => d.accion(accion, datos)) : post('/api/cuenta', { accion, ...datos }),
  },
  admin: {
    listar: () => (MODO_DEMO ? demo((d) => d.listarUsuarios()) : pedir<{ usuarios: UsuarioAdmin[] }>('/api/admin')),
    cambiarRol: (uid: string, rol: Rol) => (MODO_DEMO ? demo((d) => d.cambiarRol(uid, rol)) : post('/api/admin', { uid, rol })),
  },
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
