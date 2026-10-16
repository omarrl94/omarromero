/**
 * ColaboraFP · Envío de correos de la cuenta (verificación y restablecer contraseña).
 *
 * El correo del centro bloquea los mensajes externos (incluidos los de Firebase), así que los
 * enlaces los genera Firebase Admin y el mensaje sale desde un buzón del propio Microsoft 365
 * del centro mediante Microsoft Graph (OAuth de aplicación; no usa SMTP ni contraseñas).
 *
 * Proveedor de envío (el primero configurado), igual que la web de exámenes del centro:
 *   · SMTP: SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_FROM   ← Microsoft 365 del centro
 *   · Resend: RESEND_API_KEY, MAIL_FROM
 *   · Microsoft Graph: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MAIL_FROM
 *
 * Variables de entorno (Netlify → Project configuration → Environment variables):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY   datos de la cuenta de servicio
 *     (o FIREBASE_SERVICE_ACCOUNT con el JSON completo)
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET   registro de aplicación en Microsoft Entra
 *   MAIL_FROM                 buzón remitente del centro
 *   APP_URL                   https://colaborafp.netlify.app (opcional: por defecto, la dirección de la petición)
 *
 * GET  → { configured, from }
 * POST { action: 'verify' }  + Authorization: Bearer <ID token>  → reenvía la verificación
 * POST { action: 'reset', email }                                  → enlace para nueva contraseña
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';

// Lee una variable quitando comillas envolventes (como la web de exámenes: MAIL_FROM="Nombre <correo>")
const env = new Proxy(process.env, {
  get(target, k) {
    let v = String(target[k] ?? '').trim();
    if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1).trim();
    return v || undefined;
  },
});
const DOMAINS = String(env.TEACHER_EMAIL_DOMAINS || 'jrotero.es').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
const EXTRA = ['omar.rl14@gmail.com']; // ⚠ igual que TEACHER_EXTRA_EMAILS y las reglas de Firestore
const LOGIN = env.MS_LOGIN_BASE || 'https://login.microsoftonline.com';
const GRAPH = env.MS_GRAPH_BASE || 'https://graph.microsoft.com';
const MIN_GAP = 60 * 1000; // un correo por minuto
const MAX_PER_DAY = 10; // y diez al día, por destinatario

const isTeacherEmail = (email) => {
  const e = String(email || '').trim().toLowerCase();
  return EXTRA.includes(e) || DOMAINS.some((d) => e.endsWith('@' + d));
};
const provider = () => {
  if (env.MAIL_MODE === 'log') return 'log';
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return 'smtp';
  if (env.RESEND_API_KEY && env.MAIL_FROM) return 'resend';
  if (env.MS_TENANT_ID && env.MS_CLIENT_ID && env.MS_CLIENT_SECRET && env.MAIL_FROM) return 'graph';
  return null;
};
const fromHeader = () => env.MAIL_FROM || env.SMTP_USER;
/** Solo la dirección (sin el nombre) para mostrarla en la web. */
const fromAddress = () => (fromHeader()?.match(/<([^>]+)>/)?.[1] || fromHeader() || '').trim();
const configured = () => !!(serviceAccount() || env.FIREBASE_AUTH_EMULATOR_HOST) && !!provider();
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Credenciales de la cuenta de servicio: tres variables sueltas (recomendado) o el JSON completo. */
const projectId = () => env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_CONFIG?.match(/projectId["']?\s*:\s*["']([^"']+)/)?.[1];

function serviceAccount() {
  if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL && projectId())
    return { projectId: projectId(), clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') };
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.client_email && sa.private_key) return { projectId: sa.project_id || projectId(), clientEmail: sa.client_email, privateKey: sa.private_key };
    } catch {
      return null; // diagnose() explica el problema
    }
  }
  return null;
}

/** Qué falta para poder enviar (solo nombres de variables, nunca valores). */
function diagnose() {
  const problems = [];
  if (!serviceAccount() && !env.FIREBASE_AUTH_EMULATOR_HOST) {
    if (!env.FIREBASE_SERVICE_ACCOUNT && !env.FIREBASE_PRIVATE_KEY) problems.push('Falta FIREBASE_SERVICE_ACCOUNT');
    else if (env.FIREBASE_SERVICE_ACCOUNT) {
      let parsed = null;
      try {
        parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      } catch {
        problems.push(`FIREBASE_SERVICE_ACCOUNT no es un JSON completo (tiene ${env.FIREBASE_SERVICE_ACCOUNT.length} caracteres; debe empezar por { y acabar en })`);
      }
      if (parsed && !(parsed.client_email && parsed.private_key)) problems.push('FIREBASE_SERVICE_ACCOUNT no contiene client_email y private_key: usa el .json de «Cuentas de servicio»');
    } else problems.push('Faltan FIREBASE_CLIENT_EMAIL o FIREBASE_PROJECT_ID');
  }
  if (!provider()) {
    const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !env[k]);
    problems.push(`Falta configurar el envío: ${missing.join(', ')}`);
  }
  return problems;
}

function firebase() {
  if (!getApps().length) {
    const sa = serviceAccount();
    initializeApp(sa ? { credential: cert(sa), projectId: sa.projectId } : { projectId: projectId() });
  }
  return { auth: getAuth(), db: getFirestore() };
}

/** Límite de envíos por destinatario y tipo de correo (colección mail_log, inaccesible para los clientes). */
async function throttle(db, action, email) {
  const ref = db.collection('mail_log').doc(createHash('sha256').update(`${action}:${email}`).digest('hex'));
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  return db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data() || {};
    const count = d.day === day ? d.count || 0 : 0;
    if (d.last && now - d.last < MIN_GAP) return 'Espera un minuto antes de pedir otro correo.';
    if (count >= MAX_PER_DAY) return 'Has pedido demasiados correos hoy. Inténtalo mañana o pide al administrador que apruebe tu cuenta.';
    tx.set(ref, { last: now, day, count: count + 1 });
    return null;
  });
}

async function graphToken() {
  const res = await fetch(`${LOGIN}/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.MS_CLIENT_ID,
      client_secret: env.MS_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Microsoft rechazó las credenciales de la aplicación (${data.error || res.status}).`);
  return data.access_token;
}

let transport;
function smtp() {
  if (!transport) {
    const port = Number(env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transport;
}

const toText = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

async function sendMail(to, subject, html) {
  const p = provider();
  if (p === 'log') return console.log(`[MAIL_MODE=log] Para: ${to} · ${subject}`);
  if (p === 'smtp') {
    try {
      await smtp().sendMail({ from: fromHeader(), to, subject, html, text: toText(html) });
    } catch (e) {
      throw new Error(`El servidor de correo rechazó el envío (${e.responseCode || e.code || e.message}).`);
    }
    return;
  }
  if (p === 'resend') {
    const r = await fetch(env.RESEND_API_BASE || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromHeader(), to: [to], subject, html, text: toText(html) }),
    });
    if (!r.ok) throw new Error(`Resend rechazó el envío (${r.status}).`);
    return;
  }
  const token = await graphToken();
  const res = await fetch(`${GRAPH}/v1.0/users/${encodeURIComponent(fromAddress())}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: { subject, body: { contentType: 'HTML', content: html }, toRecipients: [{ emailAddress: { address: to } }] },
      saveToSentItems: false,
    }),
  });
  if (res.status !== 202) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Microsoft no pudo enviar el correo (${data.error?.code || res.status}).`);
  }
}

const escape = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const template = ({ name, title, text, button, link, note }) => `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f3ef;font-family:Arial,Helvetica,sans-serif;color:#1c1917">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="height:6px;background:#e39f7d"></td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 4px;font-size:13px;font-weight:bold;letter-spacing:1px;color:#b4593a;text-transform:uppercase">ColaboraFP</p>
<h1 style="margin:0 0 16px;font-size:22px">${escape(title)}</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.5">Hola${name ? ' ' + escape(name) : ''},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5">${text}</p>
<p style="margin:0 0 24px"><a href="${escape(link)}" style="display:inline-block;background:#e39f7d;color:#1c1917;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:10px">${escape(button)}</a></p>
<p style="margin:0 0 8px;font-size:12px;color:#57534e;line-height:1.5">Si el botón no funciona, copia este enlace en el navegador:<br><span style="word-break:break-all">${escape(link)}</span></p>
<p style="margin:16px 0 0;font-size:12px;color:#57534e;line-height:1.5">${note}</p>
</td></tr></table>
<p style="font-size:11px;color:#78716c;margin:16px 0 0">Centro de Formación Profesional José Ramón Otero · Mensaje automático, no respondas a este correo.</p>
</td></tr></table></body></html>`;

/**
 * Genera el enlace y lo dirige a la página /accion de la propia web (confirmar el correo o elegir
 * contraseña, en español y con el diseño de ColaboraFP) en vez de a la página genérica de Firebase.
 */
async function link(fn, email, origin) {
  const raw = await fn(email);
  const base = (env.APP_URL || origin || '').replace(/\/$/, '');
  if (!base) return raw;
  const src = new URL(raw).searchParams;
  const out = new URL(`${base}/accion`);
  for (const k of ['mode', 'oobCode']) out.searchParams.set(k, src.get(k));
  return out.toString();
}

export default async (req) => {
  if (req.method === 'GET') {
    const problems = diagnose();
    return json(200, {
      configured: configured(),
      from: configured() ? fromAddress() : null,
      provider: provider(),
      ...(problems.length && {
        problems,
        hint: 'Netlify → Project configuration → Environment variables: comprueba el nombre exacto, que el ámbito (scope) incluya «Functions» y que valga para todos los contextos de despliegue; después vuelve a desplegar.',
      }),
    });
  }
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' });
  if (!configured()) return json(501, { error: 'El envío de correo del centro no está configurado.' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Petición no válida.' });
  }
  const { auth, db } = firebase();
  const origin = /^https?:\/\//.test(req.url) ? new URL(req.url).origin : null;

  try {
    if (body.action === 'verify') {
      const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!token) return json(401, { error: 'Falta la sesión.' });
      const decoded = await auth.verifyIdToken(token).catch(() => null);
      if (!decoded?.email) return json(401, { error: 'Sesión no válida. Vuelve a iniciar sesión.' });
      if (!isTeacherEmail(decoded.email)) return json(403, { error: 'Este correo no pertenece al profesorado del centro.' });
      const user = await auth.getUser(decoded.uid);
      if (user.emailVerified) return json(200, { sent: false, alreadyVerified: true, from: fromAddress() });
      const wait = await throttle(db, 'verify', user.email.toLowerCase());
      if (wait) return json(429, { error: wait });
      const url = await link((e, s) => auth.generateEmailVerificationLink(e, s), user.email, origin);
      await sendMail(
        user.email,
        'Activa tu cuenta de ColaboraFP',
        template({
          name: user.displayName,
          title: 'Activa tu cuenta',
          text: 'Has creado una cuenta de profesorado en ColaboraFP. Pulsa el botón para confirmar que este es tu correo del centro.',
          button: 'Confirmar mi correo',
          link: url,
          note: 'Si no has creado esta cuenta, ignora este mensaje.',
        }),
      );
      return json(200, { sent: true, from: fromAddress() });
    }

    if (body.action === 'reset') {
      const email = String(body.email || '').trim().toLowerCase();
      // Respuesta idéntica exista o no la cuenta (no revela qué correos están registrados)
      const ok = json(200, { sent: true, from: fromAddress() });
      if (!isTeacherEmail(email)) return ok;
      const user = await auth.getUserByEmail(email).catch(() => null);
      if (!user) return ok;
      const wait = await throttle(db, 'reset', email);
      if (wait) return json(429, { error: wait });
      const url = await link((e, s) => auth.generatePasswordResetLink(e, s), email, origin);
      await sendMail(
        email,
        'Restablece tu contraseña de ColaboraFP',
        template({
          name: user.displayName,
          title: 'Nueva contraseña',
          text: 'Hemos recibido una solicitud para cambiar la contraseña de tu cuenta de ColaboraFP. Pulsa el botón para elegir una nueva.',
          button: 'Elegir nueva contraseña',
          link: url,
          note: 'Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambiará.',
        }),
      );
      return ok;
    }

    return json(400, { error: 'Acción no válida.' });
  } catch (e) {
    console.error('[correo]', e);
    return json(502, { error: e.message || 'No se pudo enviar el correo.' });
  }
};
