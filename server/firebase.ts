/**
 * Firebase Admin (solo servidor). Credenciales en FIREBASE_SERVICE_ACCOUNT (JSON completo de la
 * cuenta de servicio) o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY. FIREBASE_PROJECT_ID o el
 * project_id de la cuenta de servicio identifican el proyecto.
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

let app: App | null = null;
export function adminApp(): App {
  if (app) return app;
  if (getApps().length) return (app = getApps()[0]);
  const sa = cuentaServicio();
  const projectId = idProyecto();
  app = sa ? initializeApp({ credential: cert(sa), projectId: sa.projectId || projectId }) : initializeApp({ projectId });
  return app;
}

export const adminAuth = () => getAuth(adminApp());

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
