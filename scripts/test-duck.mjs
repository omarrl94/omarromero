// Pruebas del servidor del pato con IA (sin red ni clave: cliente de Claude simulado).
import assert from 'node:assert/strict';
import { createHandler, sanitize, buildMessages, verifyFirebaseToken, SYSTEM_PROMPT } from '../netlify/lib/duck-core.mjs';
import { CHALLENGES } from '../src/curriculum/index.js';

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`✓ ${name}`); } catch (e) { failed++; console.log(`✗ ${name}\n   ${e.message}`); }
}

const mem = () => { const m = new Map(); return { get: async (k) => m.get(k), set: async (k, v) => { m.set(k, v); }, m }; };
const calls = [];
const fakeClient = (reply = { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '¿Qué valor tiene i en la última vuelta?' }] }) => ({
  beta: { messages: { create: async (p) => { calls.push(p); if (reply instanceof Error) throw reply; return reply; } } },
});
const ENV = { ANTHROPIC_API_KEY: 'sk-test', DUCK_DAILY_LIMIT: '3', DUCK_GLOBAL_DAILY_LIMIT: '5' };
const make = (over = {}) => {
  const store = over.store || mem();
  return { store, handler: createHandler({ env: { ...ENV, ...(over.env || {}) }, verifyToken: async (t) => (t === 'ok' ? 'uid1' : t === 'ok2' ? 'uid2' : null), store, getClient: async () => over.client || fakeClient(), now: () => Date.UTC(2026, 10, 11, 12) }) };
};
const body = (extra = {}) => ({ question: '¿Por qué falla mi bucle?', context: { title: 'Patrulla', lang: 'Python', code: 'for i in range(7):\n    waypoint(i, 1)', objective: 'Dibuja 6 balizas', passed: false, error: null, failing: [{ label: 'Cuenta de vueltas', detail: 'hay 7' }] }, ...extra });
const post = (h, b, token = 'ok', headers = {}) => h(new Request('https://x.test/api/duck', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body: JSON.stringify(b) }));

await test('responde con el texto del pato y los usos que quedan', async () => {
  const { handler } = make(); const r = await post(handler, body()); const j = await r.json();
  assert.equal(r.status, 200); assert.match(j.text, /última vuelta/); assert.equal(j.remaining, 2);
});
await test('sin sesión → 401 y no llama a la IA', async () => {
  calls.length = 0; const { handler } = make();
  assert.equal((await post(handler, body(), null)).status, 401); assert.equal((await post(handler, body(), 'falso')).status, 401); assert.equal(calls.length, 0);
});
await test('sin clave configurada → 503', async () => {
  const { handler } = make({ env: { ANTHROPIC_API_KEY: '' } }); assert.equal((await post(handler, body())).status, 503);
});
await test('límite diario por jugador (3) → 429 al cuarto; otro jugador no se ve afectado', async () => {
  const { handler } = make();
  for (let i = 0; i < 3; i++) assert.equal((await post(handler, body())).status, 200);
  const r = await post(handler, body()); assert.equal(r.status, 429); assert.equal((await r.json()).error, 'quota');
  assert.equal((await post(handler, body(), 'ok2')).status, 200);
});
await test('límite global diario → 429 aunque el jugador no haya llegado al suyo', async () => {
  const { handler } = make({ env: { DUCK_DAILY_LIMIT: '100', DUCK_GLOBAL_DAILY_LIMIT: '2' } });
  await post(handler, body()); await post(handler, body('ok2') && body(), 'ok2');
  const r = await post(handler, body()); assert.equal(r.status, 429); assert.equal((await r.json()).error, 'busy');
});
await test('si la IA falla no se gasta un uso del jugador', async () => {
  const store = mem(); const { handler } = make({ store, client: fakeClient(Object.assign(new Error('boom'), { status: 500 })) });
  const r = await post(handler, body()); assert.equal(r.status, 502); assert.equal(await store.get('u:uid1:2026-11-11'), '0');
});
await test('refusal → refused:true (el cliente usa el pato local)', async () => {
  const { handler } = make({ client: fakeClient({ stop_reason: 'refusal', content: [] }) }); const j = await (await post(handler, body())).json(); assert.equal(j.refused, true);
});
await test('la petición a Claude lleva modelo, effort bajo, fallbacks y el system prompt socrático', async () => {
  calls.length = 0; const { handler } = make(); await post(handler, body()); const p = calls[0];
  assert.equal(p.model, 'claude-opus-5-5'); assert.equal(p.output_config.effort, 'low'); assert.equal(p.fallbacks, 'default'); assert.ok(p.betas.includes('server-side-fallback-2026-07-01'));
  assert.equal(p.system, SYSTEM_PROMPT); assert.match(p.system, /NUNCA escribas la solución/); assert.equal(p.thinking, undefined); assert.equal(p.temperature, undefined);
});
await test('DUCK_MODEL cambia de modelo (p. ej. haiku para gastar menos)', async () => {
  calls.length = 0; const { handler } = make({ env: { DUCK_MODEL: 'claude-haiku-5-5' } }); await post(handler, body()); assert.equal(calls[0].model, 'claude-haiku-5-5');
});
await test('recorta pregunta, código e historial a los máximos y descarta basura', () => {
  const s = sanitize({ question: 'a'.repeat(9000), context: { code: 'x'.repeat(99999), failing: Array(50).fill({ label: 'l'.repeat(999) }) }, history: [{ who: 'hacker', text: 'x' }, ...Array(20).fill({ who: 'me', text: 'h'.repeat(5000) })] });
  assert.equal(s.question.length, 500); assert.equal(s.context.code.length, 6000); assert.equal(s.context.failing.length, 8); assert.equal(s.history.length, 6); assert.equal(s.history[0].text.length, 600);
  assert.equal(sanitize({ question: '   ' }), null); assert.equal(sanitize(null), null); assert.equal(sanitize('hola'), null);
});
await test('los mensajes empiezan por el jugador, alternan roles y marcan código y pregunta como datos', () => {
  const s = sanitize({ ...body(), history: [{ who: 'duck', text: 'hola' }, { who: 'me', text: 'q1' }, { who: 'duck', text: 'a1' }, { who: 'me', text: 'q2' }] });
  const m = buildMessages(s); assert.equal(m[0].role, 'user');
  for (let i = 1; i < m.length; i++) assert.notEqual(m[i].role, m[i - 1].role);
  assert.match(m.at(-1).content, /<codigo>[\s\S]*waypoint[\s\S]*<\/codigo>/); assert.match(m.at(-1).content, /<pregunta>/);
});
await test('NUNCA se envía la solución: ninguna misión filtra su solución en el contexto del servidor', () => {
  const ch = CHALLENGES[0]; const s = sanitize({ question: 'ayuda', context: { title: ch.title, lang: 'Python', code: ch.starter.python } });
  const all = JSON.stringify(buildMessages(s)) + SYSTEM_PROMPT; const sol = ch.solution.python.split('\n').find((l) => l.trim().length > 12 && !ch.starter.python.includes(l));
  assert.ok(!sol || !all.includes(sol));
});
await test('CORS: orígenes de la app permitidos; otros, no', async () => {
  const { handler } = make();
  const ok = await handler(new Request('https://x.test/api/duck', { method: 'OPTIONS', headers: { origin: 'https://localhost' } })); assert.equal(ok.headers.get('access-control-allow-origin'), 'https://localhost');
  const bad = await handler(new Request('https://x.test/api/duck', { method: 'OPTIONS', headers: { origin: 'https://malo.example' } })); assert.equal(bad.headers.get('access-control-allow-origin'), null);
  assert.equal((await handler(new Request('https://x.test/api/duck'))).status, 405);
});
await test('verifyFirebaseToken: devuelve el uid, rechaza tokens inválidos o cuentas deshabilitadas', async () => {
  const f = (status, data) => async () => ({ ok: status === 200, json: async () => data });
  assert.equal(await verifyFirebaseToken('t', 'key', f(200, { users: [{ localId: 'abc' }] })), 'abc');
  assert.equal(await verifyFirebaseToken('t', 'key', f(400, {})), null);
  assert.equal(await verifyFirebaseToken('t', 'key', f(200, { users: [{ localId: 'abc', disabled: true }] })), null);
  assert.equal(await verifyFirebaseToken('t', '', f(200, { users: [{ localId: 'abc' }] })), null);
});

console.log(`\n${passed}/${passed + failed} pruebas del pato IA`);
process.exit(failed ? 1 : 0);
