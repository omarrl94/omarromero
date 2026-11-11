// Función de Netlify: pato tutor con IA. Ruta pública: /api/duck (ver netlify.toml).
// Variables de entorno (Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY (obligatoria, marcada como secreta) · DUCK_MODEL · DUCK_EFFORT
//   DUCK_DAILY_LIMIT · DUCK_GLOBAL_DAILY_LIMIT · DUCK_ALLOWED_ORIGINS
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import { createHandler, verifyFirebaseToken } from '../lib/duck-core.mjs';

const env = process.env;
let client;

export default createHandler({
  env,
  verifyToken: (t) => verifyFirebaseToken(t, env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY),
  store: (() => {
    const s = getStore('duck-usage');
    return { get: (k) => s.get(k), set: (k, v) => s.set(k, v) };
  })(),
  getClient: () => (client ||= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })),
});
