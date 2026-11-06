import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config/ffe.config';
import { almacen } from './almacen';
import { variable } from './entorno';

export const COOKIE_SESION = 'cffe_sesion';

let claveEnMemoria: string | null = null;

/**
 * Clave para firmar las sesiones.
 * - Si SESSION_SECRET tiene 32 caracteres o más, se usa.
 * - Si no (falta o es corto), se genera una clave aleatoria de 256 bits la primera vez y se guarda
 *   en el almacén privado del proyecto (Netlify Blobs), así no depende de configurarla bien a mano.
 */
export async function secreto(): Promise<string> {
  const s = variable('SESSION_SECRET');
  if (s && s.length >= 32) return s;
  if (claveEnMemoria) return claveEnMemoria;
  const a = almacen('sistema');
  const guardada = await a.leer<{ clave: string }>('clave-sesion');
  if (guardada?.clave && guardada.clave.length >= 32) {
    claveEnMemoria = guardada.clave;
    return claveEnMemoria;
  }
  const nueva = randomBytes(32).toString('base64url');
  await a.guardar('clave-sesion', { clave: nueva, creada: new Date().toISOString() });
  // Si dos funciones la crearon a la vez, se queda la que quedó guardada.
  claveEnMemoria = (await a.leer<{ clave: string }>('clave-sesion'))?.clave ?? nueva;
  return claveEnMemoria;
}

/** Solo para pruebas. */
export function olvidarClaveEnMemoria() {
  claveEnMemoria = null;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function iguales(a: string, b: string): boolean {
  // Se comparan los hashes para que la longitud no filtre información.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export type Rol = 'alumno' | 'tutor';

/**
 * Rol que corresponde al código introducido:
 * - TUTOR_ACCESS_CODE → 'tutor' (directorio + sección de tutores)
 * - ACCESS_CODE → 'alumno'
 * Sin la variable configurada, ese rol no puede entrar.
 */
export function rolDeCodigo(codigo: string): Rol | null {
  const limpio = codigo.trim();
  const tutor = variable('TUTOR_ACCESS_CODE');
  if (tutor && iguales(limpio, tutor)) return 'tutor';
  const alumno = variable('ACCESS_CODE');
  if (alumno && iguales(limpio, alumno)) return 'alumno';
  return null;
}

/** Compatibilidad: ¿el código da acceso al directorio (alumno o tutor)? */
export function codigoValido(codigo: string): boolean {
  return rolDeCodigo(codigo) !== null;
}

export async function crearToken(ahora = Date.now(), rol: Rol = 'alumno'): Promise<string> {
  const carga = b64url(JSON.stringify({ exp: ahora + config.acceso.sesionHoras * 3600_000, v: 1, rol }));
  const firma = createHmac('sha256', await secreto()).update(carga).digest('base64url');
  return `${carga}.${firma}`;
}

/** Rol de un token firmado y vigente, o null. Los tokens antiguos sin rol cuentan como alumno. */
export async function rolDeToken(token: string | undefined, ahora = Date.now()): Promise<Rol | null> {
  if (!token) return null;
  const [carga, firma] = token.split('.');
  if (!carga || !firma) return null;
  let esperada: string;
  try {
    esperada = createHmac('sha256', await secreto()).update(carga).digest('base64url');
  } catch {
    return null;
  }
  if (!iguales(firma, esperada)) return null;
  try {
    const { exp, rol } = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8')) as { exp: number; rol?: Rol };
    if (typeof exp !== 'number' || exp <= ahora) return null;
    return rol === 'tutor' ? 'tutor' : 'alumno';
  } catch {
    return null;
  }
}

export async function tokenValido(token: string | undefined, ahora = Date.now()): Promise<boolean> {
  return (await rolDeToken(token, ahora)) !== null;
}

export function leerCookie(req: Request, nombre: string): string | undefined {
  const cabecera = req.headers.get('cookie') ?? '';
  for (const parte of cabecera.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export function cookieSesion(token: string, seguro: boolean): string {
  return [
    `${COOKIE_SESION}=${encodeURIComponent(token)}`,
    'Path=/api',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${config.acceso.sesionHoras * 3600}`,
    seguro ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function cookieBorrada(seguro: boolean): string {
  return [`${COOKIE_SESION}=`, 'Path=/api', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', seguro ? 'Secure' : ''].filter(Boolean).join('; ');
}

export async function sesionActiva(req: Request): Promise<boolean> {
  return tokenValido(leerCookie(req, COOKIE_SESION));
}

export async function rolSesion(req: Request): Promise<Rol | null> {
  return rolDeToken(leerCookie(req, COOKIE_SESION));
}
