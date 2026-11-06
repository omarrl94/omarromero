/** Doble factor por correo para tutores y superadmin: código de 6 dígitos enviado desde el buzón del centro. */
import { createHash, createHmac, randomInt } from 'node:crypto';
import { config } from '../config/ffe.config';
import { almacen } from './almacen';
import { enviarCorreo } from './correo';
import { iguales, leerCookie, secreto } from './sesion';

export const COOKIE_2FA = 'cffe_2fa';
const MAX_INTENTOS = 5;

interface Pendiente {
  hash: string;
  expira: number;
  intentos: number;
}

const hash = (uid: string, codigo: string) => createHash('sha256').update(`${uid}|${codigo}`).digest('hex');

export async function enviarCodigo(uid: string, email: string, nombre: string): Promise<boolean> {
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await almacen('doble-factor').guardar(uid, { hash: hash(uid, codigo), expira: Date.now() + config.cuentas.minutosCodigo * 60_000, intentos: 0 } satisfies Pendiente);
  return enviarCorreo(
    {
      para: email,
      clave: `2fa:${uid}`,
      asunto: `Tu código de acceso a Conecta FFE: ${codigo}`,
      texto: [
        `Hola${nombre ? `, ${nombre}` : ''}:`,
        '',
        `Tu código para entrar en Conecta FFE es: ${codigo}`,
        '',
        `Caduca en ${config.cuentas.minutosCodigo} minutos. Si no has intentado entrar, ignora este correo y avisa a la coordinación de FFE.`,
        '',
        `${config.centro.nombre}`,
      ].join('\n'),
    },
    { ignorarLimite: false },
  );
}

export type ResultadoCodigo = 'ok' | 'incorrecto' | 'caducado' | 'bloqueado';

export async function comprobarCodigo(uid: string, codigo: string): Promise<ResultadoCodigo> {
  const a = almacen('doble-factor');
  const p = await a.leer<Pendiente>(uid);
  if (!p || p.expira < Date.now()) return 'caducado';
  if (p.intentos >= MAX_INTENTOS) return 'bloqueado';
  if (!iguales(p.hash, hash(uid, codigo.replace(/\D/g, '')))) {
    await a.guardar(uid, { ...p, intentos: p.intentos + 1 });
    return p.intentos + 1 >= MAX_INTENTOS ? 'bloqueado' : 'incorrecto';
  }
  await a.guardar(uid, null);
  return 'ok';
}

export async function tokenDobleFactor(uid: string, ahora = Date.now()): Promise<string> {
  const carga = Buffer.from(JSON.stringify({ uid, exp: ahora + config.cuentas.horasDobleFactor * 3600_000 })).toString('base64url');
  return `${carga}.${createHmac('sha256', await secreto()).update(`2fa|${carga}`).digest('base64url')}`;
}

export async function dobleFactorValido(req: Request, uid: string, ahora = Date.now()): Promise<boolean> {
  const t = leerCookie(req, COOKIE_2FA);
  if (!t) return false;
  const [carga, firma] = t.split('.');
  if (!carga || !firma) return false;
  const esperada = createHmac('sha256', await secreto()).update(`2fa|${carga}`).digest('base64url');
  if (!iguales(firma, esperada)) return false;
  try {
    const d = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8')) as { uid: string; exp: number };
    return d.uid === uid && d.exp > ahora;
  } catch {
    return false;
  }
}

export function cookieDobleFactor(token: string, seguro: boolean): string {
  return [`${COOKIE_2FA}=${encodeURIComponent(token)}`, 'Path=/api', 'HttpOnly', 'SameSite=Strict', `Max-Age=${config.cuentas.horasDobleFactor * 3600}`, seguro ? 'Secure' : ''].filter(Boolean).join('; ');
}

export function cookieDobleFactorBorrada(seguro: boolean): string {
  return [`${COOKIE_2FA}=`, 'Path=/api', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', seguro ? 'Secure' : ''].filter(Boolean).join('; ');
}
