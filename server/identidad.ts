/**
 * Identidad del usuario a partir del token de Firebase (cabecera «Authorization: Bearer <ID token>»).
 * En modo de pruebas (solo fuera de Netlify) se aceptan tokens «prueba.<base64>» generados por el
 * proveedor de pruebas del cliente; en producción nunca.
 */
import { createHash } from 'node:crypto';
import { adminAuth } from './firebase';
import { modoPruebas } from './entorno';
import { almacen } from './almacen';

export interface Identidad {
  uid: string;
  email: string;
  verificado: boolean;
  nombre?: string;
}

export function uidPrueba(email: string): string {
  return 'p' + createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 27);
}

function tokenDe(req: Request): string | null {
  const h = req.headers.get('authorization') ?? '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function identificar(req: Request): Promise<Identidad | null> {
  const token = tokenDe(req);
  if (!token) return null;
  if (token.startsWith('prueba.')) {
    if (!modoPruebas()) return null;
    try {
      const { email, nombre } = JSON.parse(Buffer.from(token.slice(7), 'base64url').toString('utf8')) as { email: string; nombre?: string };
      const uid = uidPrueba(email);
      const verificado = Boolean(await almacen('verificados-prueba').leer<boolean>(uid));
      return { uid, email: email.toLowerCase(), verificado, nombre };
    } catch {
      return null;
    }
  }
  try {
    const d = await adminAuth().verifyIdToken(token);
    if (!d.email) return null;
    return { uid: d.uid, email: d.email.toLowerCase(), verificado: Boolean(d.email_verified), nombre: typeof d.name === 'string' ? d.name : undefined };
  } catch {
    return null;
  }
}
