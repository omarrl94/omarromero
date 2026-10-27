/**
 * ColaboraFP · Suscripción a un calendario de clase (iCalendar).
 *
 * https://<web>/ics/<CÓDIGO>.ics → Outlook (Microsoft 365), Google Calendar o el móvil se suscriben
 * y vuelven a consultar periódicamente, así que los cambios les llegan solos.
 *
 * Formato clásico de Netlify Functions: la respuesta sale completa y con Content-Length (el lector de
 * calendarios de Microsoft no acepta respuestas por trozos).
 *
 * Lee el código y las fechas con la cuenta de servicio (FIREBASE_SERVICE_ACCOUNT, la misma del correo)
 * y, si no está, con la API REST pública de Firestore y sus reglas. Nunca incluye quién añadió cada
 * fecha ni ningún otro dato del profesorado.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { toIcs } from '../../src/utils/calendar.js';

const env = process.env;
const CODE_RE = /^[2-9A-HJKMNP-Z]{6}$/;

const unquote = (v) => {
  const s = String(v ?? '').trim();
  return s.length >= 2 && (s[0] === '"' || s[0] === "'") && s.at(-1) === s[0] ? s.slice(1, -1) : s;
};

/** Cuenta de servicio: JSON completo o tres variables sueltas (igual que la función de correo). */
const serviceAccount = () => {
  try {
    if (env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(unquote(env.FIREBASE_SERVICE_ACCOUNT));
      if (sa.client_email && sa.private_key) return { projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key };
    }
  } catch {
    /* JSON incompleto: se prueba lo siguiente */
  }
  if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL)
    return { projectId: projectFromConfig(), clientEmail: unquote(env.FIREBASE_CLIENT_EMAIL), privateKey: unquote(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n') };
  return null;
};

const configValue = (k) => String(env.VITE_FIREBASE_CONFIG || '').match(new RegExp(`${k}["']?\\s*:\\s*["']([^"']+)`))?.[1];
const projectFromConfig = () => {
  if (env.FIREBASE_PROJECT_ID) return unquote(env.FIREBASE_PROJECT_ID);
  try {
    const sa = env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(unquote(env.FIREBASE_SERVICE_ACCOUNT)) : null;
    if (sa?.project_id) return sa.project_id;
  } catch {
    /* sigue */
  }
  return configValue('projectId');
};

// ---------- Lectura con la cuenta de servicio ----------
async function readWithAdmin(code) {
  const sa = serviceAccount();
  if (!sa?.projectId) return null;
  if (!getApps().length) initializeApp({ credential: cert(sa), projectId: sa.projectId });
  const db = getFirestore();
  const c = await db.doc(`calcodes/${code}`).get();
  if (!c.exists) return { found: false, via: 'cuenta de servicio' };
  const info = c.data();
  const snap = await db.collection(`calendars/${info.cal_id}/events`).get();
  return {
    found: true,
    via: 'cuenta de servicio',
    info: { ...info, expire_at: info.expire_at?.toMillis?.() ?? null },
    events: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}

// ---------- Lectura pública (API REST + reglas) ----------
const val = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  return null;
};
const fields = (doc) => Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, val(v)]));

async function readWithRest(code, origin) {
  const projectId = projectFromConfig();
  if (!projectId) throw new Error('Falta la configuración de Firebase (VITE_FIREBASE_CONFIG o FIREBASE_SERVICE_ACCOUNT).');
  const apiKey = configValue('apiKey');
  const base = `${env.FIRESTORE_REST_BASE || 'https://firestore.googleapis.com'}/v1/projects/${projectId}/databases/(default)/documents`;
  const get = async (url) => {
    let r = await fetch(url, { headers: { Accept: 'application/json' } });
    if ([400, 401, 403].includes(r.status) && apiKey)
      r = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`, { headers: { Accept: 'application/json', Referer: `${origin}/` } });
    return r;
  };
  const c = await get(`${base}/calcodes/${code}`);
  if (c.status === 404) return { found: false, via: 'lectura pública' };
  if (!c.ok) throw new Error(`Firestore respondió ${c.status} al leer el código: ${(await c.text()).slice(0, 200)}`);
  const info = fields(await c.json());
  const events = [];
  let pageToken = '';
  do {
    const r = await get(`${base}/calendars/${info.cal_id}/events?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
    if (!r.ok) throw new Error(`Firestore respondió ${r.status} al leer las fechas: ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    for (const d of data.documents || []) events.push({ id: d.name.split('/').pop(), ...fields(d) });
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return { found: true, via: 'lectura pública', info, events };
}

// ---------- Respuestas ----------
const reply = (statusCode, body, type = 'text/plain; charset=utf-8', extra = {}) => ({
  statusCode,
  headers: { 'Content-Type': type, 'Content-Length': String(Buffer.byteLength(body, 'utf8')), 'Cache-Control': 'no-store', ...extra },
  body,
});

export const handler = async (event) => {
  const q = event.queryStringParameters || {};
  const path = event.path || event.rawUrl || '';
  const code = String(q.code || path.split('/').pop() || '').replace(/\?.*$/, '').replace(/\.ics$/i, '').toUpperCase();
  const diag = 'diag' in q;
  const head = event.httpMethod === 'HEAD';
  if (!CODE_RE.test(code)) return reply(400, 'Código de calendario no válido.');
  const host = event.headers?.host || event.headers?.Host;
  const origin = unquote(env.APP_URL || env.URL || (host ? `https://${host}` : ''));

  const steps = { codigo: code, cuenta_de_servicio: serviceAccount() ? 'sí' : 'no', proyecto: projectFromConfig() || 'NO ENCONTRADO' };
  try {
    let data = null;
    try {
      data = await readWithAdmin(code);
    } catch (e) {
      steps.error_cuenta_de_servicio = e.message;
    }
    if (!data) data = await readWithRest(code, origin);
    steps.lectura = data.via;

    const expired = data.found && data.info.expire_at && data.info.expire_at <= Date.now();
    if (!data.found || !data.info.cal_id || expired) {
      return diag ? reply(200, JSON.stringify({ ...steps, encontrado: false, caducado: !!expired }, null, 2), 'application/json; charset=utf-8') : reply(404, 'Este calendario no existe o ya se ha borrado.');
    }
    const events = data.events
      .filter((e) => typeof e.date === 'string' && e.date)
      .map((e) => ({ id: e.id, title: e.title || '', type: e.type, date: e.date, end_date: e.end_date || null, time: e.time || null, description: e.description || '' }));
    if (diag) return reply(200, JSON.stringify({ ...steps, calendario: data.info.name, fechas: events.length, resultado: 'correcto' }, null, 2), 'application/json; charset=utf-8');

    const ics = toIcs({ name: data.info.name || 'Calendario de clase', course: data.info.course }, events);
    const res = reply(200, ics, 'text/calendar; charset=utf-8', {
      'Content-Disposition': `inline; filename="calendario-${code}.ics"`,
      // 5 minutos en la CDN: los programas de calendario consultan cada pocas horas
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    });
    if (head) res.body = '';
    return res;
  } catch (e) {
    console.error('[ics]', e);
    return diag ? reply(200, JSON.stringify({ ...steps, error: e.message }, null, 2), 'application/json; charset=utf-8') : reply(502, `No se pudo leer el calendario. ${e.message}`);
  }
};
