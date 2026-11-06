/**
 * Envío de correo desde el buzón del centro: el mismo sistema que ColaboraFP, la web de exámenes
 * y el curso. El correo del centro bloquea los mensajes externos (incluidos los de Firebase), así
 * que los enlaces los genera Firebase Admin y el mensaje sale desde un buzón propio.
 *
 * Proveedor (el primero configurado):
 *   · SMTP: SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_FROM   ← Microsoft 365 del centro
 *   · Resend: RESEND_API_KEY, MAIL_FROM
 *   · Microsoft Graph: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MAIL_FROM
 *   · MAIL_MODE=log: no envía; lo guarda en el registro (pruebas)
 */
import nodemailer from 'nodemailer';
import { createHash } from 'node:crypto';
import { almacen } from './almacen';
import { variable } from './entorno';

export interface Mensaje {
  para: string;
  asunto: string;
  texto: string;
  /** Clave para limitar repeticiones (p. ej. «verificacion:uid»). */
  clave: string;
}

export type Proveedor = 'smtp' | 'resend' | 'graph' | 'log';

export function proveedor(): Proveedor | null {
  if (variable('MAIL_MODE') === 'log') return 'log';
  if (variable('SMTP_HOST') && variable('SMTP_USER') && variable('SMTP_PASS')) return 'smtp';
  if (variable('RESEND_API_KEY') && variable('MAIL_FROM')) return 'resend';
  if (variable('MS_TENANT_ID') && variable('MS_CLIENT_ID') && variable('MS_CLIENT_SECRET') && variable('MAIL_FROM')) return 'graph';
  return null;
}

const remitente = () => {
  const v = (variable('MAIL_FROM') ?? variable('SMTP_USER') ?? '').replace(/^["']|["']$/g, '');
  return v || 'Conecta FFE <no-reply@jrotero.es>';
};
const direccion = (cabecera: string) => cabecera.match(/<([^>]+)>/)?.[1] ?? cabecera;

const MIN_ENTRE = 60_000; // un correo por minuto y clave
const MAX_DIA = 10; // diez al día por clave

/** Limita repeticiones por clave (no se guarda el destinatario en claro). */
async function permitido(clave: string): Promise<boolean> {
  const a = almacen('correo-limites');
  const k = createHash('sha256').update(clave).digest('hex').slice(0, 40);
  const ahora = Date.now();
  const dia = new Date(ahora).toISOString().slice(0, 10);
  const r = (await a.leer<{ ultimo: number; dia: string; n: number }>(k)) ?? { ultimo: 0, dia, n: 0 };
  const n = r.dia === dia ? r.n : 0;
  if (ahora - r.ultimo < MIN_ENTRE || n >= MAX_DIA) return false;
  await a.guardar(k, { ultimo: ahora, dia, n: n + 1 });
  return true;
}

export class ErrorCorreo extends Error {
  constructor(mensaje: string, public estado = 502) {
    super(mensaje);
  }
}

async function tokenGraph(): Promise<string> {
  const r = await fetch(`https://login.microsoftonline.com/${variable('MS_TENANT_ID')}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: variable('MS_CLIENT_ID')!,
      client_secret: variable('MS_CLIENT_SECRET')!,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  if (!r.ok) throw new ErrorCorreo(`Microsoft Graph rechazó las credenciales (${r.status})`);
  return ((await r.json()) as { access_token: string }).access_token;
}

/** Envía un correo de texto. Devuelve false si se ha frenado por el límite de repeticiones. */
export async function enviarCorreo(m: Mensaje, opciones: { ignorarLimite?: boolean } = {}): Promise<boolean> {
  const p = proveedor();
  if (!p) throw new ErrorCorreo('El envío de correo no está configurado en el servidor (SMTP_*, RESEND_API_KEY o MS_*).', 503);
  if (!opciones.ignorarLimite && !(await permitido(m.clave))) return false;

  if (p === 'log') {
    // Un registro por destinatario: evita que envíos simultáneos se pisen.
    const a = almacen('correos-enviados');
    const clave = `para-${m.para.toLowerCase()}`;
    const lista = (await a.leer<(Omit<Mensaje, 'clave'> & { fecha: string })[]>(clave)) ?? [];
    lista.push({ para: m.para, asunto: m.asunto, texto: m.texto, fecha: new Date().toISOString() });
    await a.guardar(clave, lista.slice(-50));
    console.log(`[correo:log] ${m.para} · ${m.asunto}`);
    return true;
  }
  if (p === 'smtp') {
    const t = nodemailer.createTransport({
      host: variable('SMTP_HOST'),
      port: Number(variable('SMTP_PORT') ?? 587),
      secure: Number(variable('SMTP_PORT') ?? 587) === 465,
      auth: { user: variable('SMTP_USER'), pass: variable('SMTP_PASS') },
    });
    try {
      await t.sendMail({ from: remitente(), to: m.para, subject: m.asunto, text: m.texto });
    } catch (e) {
      const msg = String((e as Error).message);
      throw new ErrorCorreo(/535|authentication/i.test(msg) ? 'El servidor de correo rechazó el usuario o la contraseña (535). En Microsoft 365, activa «SMTP autenticado» para ese buzón.' : `No se ha podido enviar el correo (${msg.slice(0, 120)})`);
    }
    return true;
  }
  if (p === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${variable('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: remitente(), to: [m.para], subject: m.asunto, text: m.texto }),
    });
    if (!r.ok) throw new ErrorCorreo(`Resend rechazó el envío (${r.status})`);
    return true;
  }
  const token = await tokenGraph();
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(direccion(remitente()))}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { subject: m.asunto, body: { contentType: 'Text', content: m.texto }, toRecipients: [{ emailAddress: { address: m.para } }] }, saveToSentItems: true }),
  });
  if (!r.ok) throw new ErrorCorreo(`Microsoft Graph rechazó el envío (${r.status})`);
  return true;
}

/** Solo pruebas: correos registrados con MAIL_MODE=log para un destinatario. */
export async function correosPara(para: string) {
  return (await almacen('correos-enviados').leer<{ para: string; asunto: string; texto: string; fecha: string }[]>(`para-${para.toLowerCase()}`)) ?? [];
}
