// Cliente de patOmar, el tutor con IA. Habla con la función de Netlify (/api/duck); la clave de
// Anthropic nunca está en el navegador. Si algo falla, el pato local sigue funcionando.
import { backend } from './accounts.js';
import { getFirebase } from './firebase.js';
import { objectiveOf } from '../curriculum/index.js';
import { LANGUAGES } from '../core/languages.js';

const URL_BASE = (import.meta.env && import.meta.env.VITE_DUCK_API_URL) || '/api/duck';

/** La IA solo está disponible con cuentas en la nube (así se conoce al jugador y se limita el uso). */
export const aiPossible = backend === 'firebase';

export class DuckAIError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const MESSAGES = {
  quota: 'Hoy ya has usado todas tus preguntas a patOmar. Mañana tendrás más: mientras tanto, el pato clásico sigue ayudándote.',
  busy: 'patOmar está muy solicitado ahora mismo. Inténtalo en unos minutos.',
  auth: 'Vuelve a iniciar sesión para hablar con patOmar.',
  not_configured: 'patOmar (el tutor con IA) no está activado en este sitio.',
};

/** Resume el estado de la misión para el tutor: nunca incluye la solución. */
export function contextFor({ ch, lang, code, evaluation }) {
  const ev = evaluation || null;
  return {
    title: ch.title,
    objective: objectiveOf(ch, lang),
    lang: LANGUAGES[lang].name,
    code,
    passed: !!(ev && ev.passed),
    error: ev && ev.error ? { message: ev.error.message, line: ev.error.line, hint: ev.error.hint } : null,
    failing: ev ? ev.checks.filter((c) => !c.ok).map((c) => ({ label: c.label, detail: c.detail || '' })) : [],
  };
}

/**
 * Pregunta al tutor. Devuelve { text, remaining } o lanza DuckAIError (el llamador usa el pato local).
 * `refused` (la IA rechazó la petición) se devuelve como { refused: true }.
 */
export async function askTutor({ ch, lang, code, evaluation, question, history = [] }) {
  if (!aiPossible) throw new DuckAIError('local', 'IA no disponible en modo local');
  let token;
  try {
    const { auth } = await getFirebase();
    token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch { token = null; }
  if (!token) throw new DuckAIError('auth', MESSAGES.auth);
  let res;
  try {
    res = await fetch(URL_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question, history, context: contextFor({ ch, lang, code, evaluation }) }),
    });
  } catch {
    throw new DuckAIError('offline', 'Sin conexión con patOmar.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* respuesta sin JSON */ }
  if (!res.ok) {
    const code = data.error === 'quota' || data.error === 'busy' || data.error === 'auth' ? data.error : res.status === 503 || res.status === 404 ? 'not_configured' : 'upstream';
    throw new DuckAIError(code, MESSAGES[code] || 'patOmar no responde ahora mismo.');
  }
  return data;
}
