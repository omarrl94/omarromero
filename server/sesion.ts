import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config/ffe.config';
import { variable } from './entorno';

export const COOKIE_SESION = 'cffe_sesion';

function secreto(): string {
  const s = variable('SESSION_SECRET');
  if (!s || s.length < 32) throw new Error('SESSION_SECRET no configurado o demasiado corto (mínimo 32 caracteres)');
  return s;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function iguales(a: string, b: string): boolean {
  // Se comparan los hashes para que la longitud no filtre información.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** ¿El código introducido coincide con ACCESS_CODE? Sin ACCESS_CODE configurado, nadie entra. */
export function codigoValido(codigo: string): boolean {
  const esperado = variable('ACCESS_CODE');
  if (!esperado) return false;
  return iguales(codigo.trim(), esperado);
}

export function crearToken(ahora = Date.now()): string {
  const carga = b64url(JSON.stringify({ exp: ahora + config.acceso.sesionHoras * 3600_000, v: 1 }));
  const firma = createHmac('sha256', secreto()).update(carga).digest('base64url');
  return `${carga}.${firma}`;
}

export function tokenValido(token: string | undefined, ahora = Date.now()): boolean {
  if (!token) return false;
  const [carga, firma] = token.split('.');
  if (!carga || !firma) return false;
  let esperada: string;
  try {
    esperada = createHmac('sha256', secreto()).update(carga).digest('base64url');
  } catch {
    return false;
  }
  if (!iguales(firma, esperada)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8')) as { exp: number };
    return typeof exp === 'number' && exp > ahora;
  } catch {
    return false;
  }
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

export function sesionActiva(req: Request): boolean {
  return tokenValido(leerCookie(req, COOKIE_SESION));
}
