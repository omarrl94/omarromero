/**
 * ColaboraFP · Envío de correos de la cuenta (verificación y restablecer contraseña).
 *
 * El correo del centro bloquea los mensajes externos (incluidos los de Firebase), así que los
 * enlaces los genera Firebase Admin y el mensaje sale desde un buzón del propio Microsoft 365
 * del centro mediante Microsoft Graph (OAuth de aplicación; no usa SMTP ni contraseñas).
 *
 * Variables de entorno (Netlify → Project configuration → Environment variables):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY   datos de la cuenta de servicio
 *     (o FIREBASE_SERVICE_ACCOUNT con el JSON completo)
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET   registro de aplicación en Microsoft Entra
 *   MAIL_FROM                 buzón remitente del centro
 *   APP_URL                   https://colaborafp.netlify.app (opcional: vuelve a la web tras el enlace)
 *
 * GET  → { configured, from }
 * POST { action: 'verify' }  + Authorization: Bearer <ID token>  → reenvía la verificación
 * POST { action: 'reset', email }                                  → enlace para nueva contraseña
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';

const env = process.env;
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
const configured = () => !!(serviceAccount() || env.FIREBASE_AUTH_EMULATOR_HOST) && !!(env.MS_TENANT_ID && env.MS_CLIENT_ID && env.MS_CLIENT_SECRET && env.MAIL_FROM);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Credenciales de la cuenta de servicio: tres variables sueltas (recomendado) o el JSON completo. */
function serviceAccount() {
  if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PROJECT_ID)
    return { projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') };
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    return { projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key };
  }
  return null;
}

function firebase() {
  if (!getApps().length) {
    const sa = serviceAccount();
    initializeApp(sa ? { credential: cert(sa), projectId: sa.projectId } : { projectId: env.FIREBASE_PROJECT_ID });
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

async function sendMail(to, subject, html) {
  const token = await graphToken();
  const res = await fetch(`${GRAPH}/v1.0/users/${encodeURIComponent(env.MAIL_FROM)}/sendMail`, {
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

/** Genera el enlace volviendo a la web si su dominio está autorizado en Firebase. */
async function link(fn, email) {
  if (env.APP_URL) {
    try {
      return await fn(email, { url: `${env.APP_URL.replace(/\/$/, '')}/login` });
    } catch (e) {
      if (!/continue|domain|allowlist|authorized/i.test(String(e?.code) + e?.message)) throw e;
    }
  }
  return fn(email);
}

export default async (req) => {
  if (req.method === 'GET') return json(200, { configured: configured(), from: configured() ? env.MAIL_FROM : null });
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' });
  if (!configured()) return json(501, { error: 'El envío de correo del centro no está configurado.' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Petición no válida.' });
  }
  const { auth, db } = firebase();

  try {
    if (body.action === 'verify') {
      const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!token) return json(401, { error: 'Falta la sesión.' });
      const decoded = await auth.verifyIdToken(token).catch(() => null);
      if (!decoded?.email) return json(401, { error: 'Sesión no válida. Vuelve a iniciar sesión.' });
      if (!isTeacherEmail(decoded.email)) return json(403, { error: 'Este correo no pertenece al profesorado del centro.' });
      const user = await auth.getUser(decoded.uid);
      if (user.emailVerified) return json(200, { sent: false, alreadyVerified: true, from: env.MAIL_FROM });
      const wait = await throttle(db, 'verify', user.email.toLowerCase());
      if (wait) return json(429, { error: wait });
      const url = await link((e, s) => auth.generateEmailVerificationLink(e, s), user.email);
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
      return json(200, { sent: true, from: env.MAIL_FROM });
    }

    if (body.action === 'reset') {
      const email = String(body.email || '').trim().toLowerCase();
      // Respuesta idéntica exista o no la cuenta (no revela qué correos están registrados)
      const ok = json(200, { sent: true, from: env.MAIL_FROM });
      if (!isTeacherEmail(email)) return ok;
      const user = await auth.getUserByEmail(email).catch(() => null);
      if (!user) return ok;
      const wait = await throttle(db, 'reset', email);
      if (wait) return json(429, { error: wait });
      const url = await link((e, s) => auth.generatePasswordResetLink(e, s), email);
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
