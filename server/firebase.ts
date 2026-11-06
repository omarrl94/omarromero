/**
 * Firebase Admin (solo servidor). Credenciales en FIREBASE_SERVICE_ACCOUNT (JSON completo de la
 * cuenta de servicio) o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY. FIREBASE_PROJECT_ID o el
 * project_id de la cuenta de servicio identifican el proyecto.
 */
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import { variable } from './entorno';

interface Cuenta {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** Quita lo que se suele copiar de más desde el .json: comillas envolventes y coma final. */
export function limpiarValor(v: string | undefined): string | undefined {
  if (!v) return v;
  let r = v.trim().replace(/,$/, '').trim();
  if (r.length >= 2 && (r[0] === '"' || r[0] === "'") && r.at(-1) === r[0]) r = r.slice(1, -1);
  return r.trim() || undefined;
}

export function cuentaServicio(): Cuenta | null {
  const email = limpiarValor(variable('FIREBASE_CLIENT_EMAIL'));
  const clave = limpiarValor(variable('FIREBASE_PRIVATE_KEY'));
  if (email && clave) return { projectId: limpiarValor(variable('FIREBASE_PROJECT_ID')) ?? '', clientEmail: email, privateKey: clave.replace(/\\n/g, '\n') };
  const json = variable('FIREBASE_SERVICE_ACCOUNT');
  if (!json) return null;
  try {
    const sa = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
    if (sa.client_email && sa.private_key) return { projectId: sa.project_id ?? variable('FIREBASE_PROJECT_ID') ?? '', clientEmail: sa.client_email, privateKey: sa.private_key };
  } catch {
    /* JSON incompleto: se informa en el diagnóstico */
  }
  return null;
}

export function idProyecto(): string | undefined {
  return limpiarValor(variable('FIREBASE_PROJECT_ID')) ?? (cuentaServicio()?.projectId || undefined) ?? variable('VITE_FIREBASE_PROJECT_ID');
}

/** Error de configuración del servidor: se muestra tal cual (nunca contiene valores secretos). */
export class ErrorConfig extends Error {}

let app: App | null = null;

/**
 * Firebase Admin se carga bajo demanda: si la librería o las credenciales fallan, el error se
 * puede capturar y explicar (en lugar de tumbar la función con un 502).
 */
export async function adminApp(): Promise<App> {
  if (app) return app;
  const { cert, getApps, initializeApp } = await import('firebase-admin/app');
  if (getApps().length) return (app = getApps()[0]);
  const sa = cuentaServicio();
  const projectId = idProyecto();
  try {
    app = sa ? initializeApp({ credential: cert(sa), projectId: sa.projectId || projectId }) : initializeApp({ projectId });
  } catch (e) {
    throw new ErrorConfig(`El servidor no puede conectar con Firebase: ${explicarError(e)}`);
  }
  return app;
}

export async function adminAuth(): Promise<Auth> {
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(await adminApp());
}

/** Traduce errores habituales de credenciales a qué revisar (sin mostrar valores). */
export function explicarError(e: unknown): string {
  const m = String((e as Error)?.message ?? e);
  if (/private key|PEM|DECODER|asn1|invalid key/i.test(m)) return 'FIREBASE_PRIVATE_KEY no es válida: copia todo lo que va entre las comillas de "private_key", desde -----BEGIN PRIVATE KEY----- hasta -----END PRIVATE KEY-----\\n.';
  if (/client_email|client email/i.test(m)) return 'FIREBASE_CLIENT_EMAIL no es válido.';
  if (/project/i.test(m)) return 'Falta o no coincide FIREBASE_PROJECT_ID.';
  return m.slice(0, 200);
}

/** Qué falta para que funcionen las cuentas (solo nombres de variables, nunca valores). */
export function diagnosticoFirebase(): string[] {
  const p: string[] = [];
  if (!idProyecto()) p.push('Falta FIREBASE_PROJECT_ID (o FIREBASE_SERVICE_ACCOUNT)');
  if (!cuentaServicio()) p.push('Falta FIREBASE_SERVICE_ACCOUNT (necesaria para enviar los enlaces de verificación y borrar cuentas)');
  const sa = cuentaServicio();
  const web = variable('VITE_FIREBASE_PROJECT_ID');
  if (sa?.projectId && web && sa.projectId !== web) p.push(`FIREBASE_SERVICE_ACCOUNT es del proyecto «${sa.projectId}», pero la web usa «${web}»`);
  return p;
}
