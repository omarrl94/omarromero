/**
 * ColaboraFP · Suscripción a un calendario de clase (iCalendar).
 *
 * https://<web>/ics/<CÓDIGO>.ics → Outlook (Microsoft 365), Google Calendar o el móvil se suscriben
 * y vuelven a consultar periódicamente, así que los cambios les llegan solos.
 *
 * Lee lo mismo que ve el alumnado con el código (calcodes/{código} y sus eventos), mediante la API
 * REST pública de Firestore y sus reglas: no necesita credenciales. Nunca incluye quién añadió cada
 * fecha ni ningún otro dato del profesorado.
 */
import { toIcs } from '../../src/utils/calendar.js';

const env = process.env;
const CODE_RE = /^[2-9A-HJKMNP-Z]{6}$/;

/** ID del proyecto y clave web: de VITE_FIREBASE_CONFIG o, si no llega a las funciones, de la cuenta de servicio. */
const firebaseConfig = () => {
  const raw = String(env.VITE_FIREBASE_CONFIG || '');
  const pick = (k) => raw.match(new RegExp(`${k}["']?\\s*:\\s*["']([^"']+)`))?.[1];
  let saProject = null;
  try {
    saProject = env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT).project_id : null;
  } catch {
    /* JSON incompleto: se ignora */
  }
  return { apiKey: pick('apiKey'), projectId: env.FIREBASE_PROJECT_ID || pick('projectId') || saProject };
};

/**
 * Lectura pública de Firestore. Primero sin clave (las reglas permiten leer el código y los eventos);
 * si Google la exige, se repite con la clave web y la dirección de la web como origen, por si la clave
 * está restringida a ese dominio.
 */
const firestoreGet = async (url, apiKey, origin) => {
  let r = await fetch(url, { headers: { Accept: 'application/json' } });
  if ((r.status === 400 || r.status === 401 || r.status === 403) && apiKey) {
    const sep = url.includes('?') ? '&' : '?';
    r = await fetch(`${url}${sep}key=${encodeURIComponent(apiKey)}`, { headers: { Accept: 'application/json', Referer: `${origin}/` } });
  }
  return r;
};

/** Valor de la API REST de Firestore → JavaScript. */
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

const json = (body) => new Response(JSON.stringify(body, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const text = (status, body, extra = {}) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });

export default async (req) => {
  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || url.pathname.split('/').pop() || '').replace(/\.ics$/i, '').toUpperCase();
  const diag = url.searchParams.has('diag');
  if (!CODE_RE.test(code)) return text(400, 'Código de calendario no válido.');

  const { apiKey, projectId } = firebaseConfig();
  const origin = env.APP_URL || env.URL || `${url.protocol}//${url.host}`;
  const steps = { codigo: code, proyecto: projectId || 'NO ENCONTRADO', clave_web: apiKey ? 'sí' : 'no' };
  if (!projectId) return diag ? json(steps) : text(500, 'Falta la configuración de Firebase (VITE_FIREBASE_CONFIG o FIREBASE_SERVICE_ACCOUNT).');
  const base = `${env.FIRESTORE_REST_BASE || 'https://firestore.googleapis.com'}/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    const c = await firestoreGet(`${base}/calcodes/${code}`, apiKey, origin);
    steps.lectura_codigo = c.status;
    if (c.status === 404) return diag ? json(steps) : text(404, 'Este calendario no existe o ya se ha borrado.');
    if (!c.ok) throw new Error(`Firestore respondió ${c.status} al leer el código: ${(await c.text()).slice(0, 200)}`);
    const info = fields(await c.json());
    if (!info.cal_id || (info.expire_at && info.expire_at <= Date.now())) return diag ? json({ ...steps, caducado: true }) : text(404, 'Este calendario ya se ha borrado (fin de curso).');

    const events = [];
    let pageToken = '';
    do {
      const r = await firestoreGet(`${base}/calendars/${info.cal_id}/events?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, apiKey, origin);
      steps.lectura_eventos = r.status;
      if (!r.ok) throw new Error(`Firestore respondió ${r.status} al leer las fechas: ${(await r.text()).slice(0, 200)}`);
      const data = await r.json();
      for (const d of data.documents || []) {
        const f = fields(d);
        events.push({
          id: d.name.split('/').pop(),
          title: f.title || '',
          type: f.type,
          date: f.date,
          end_date: f.end_date || null,
          time: f.time || null,
          description: f.description || '',
        });
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    if (diag) return json({ ...steps, calendario: info.name, fechas: events.length, resultado: 'correcto' });
    const ics = toIcs({ name: info.name || 'Calendario de clase', course: info.course }, events.filter((e) => e.date));
    return new Response(req.method === 'HEAD' ? null : ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="calendario-${code}.ics"`,
        // Copia en la CDN de 5 minutos: los programas de calendario consultan cada pocas horas
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[ics]', e);
    return diag ? json({ ...steps, error: e.message }) : text(502, `No se pudo leer el calendario. ${e.message}`);
  }
};
