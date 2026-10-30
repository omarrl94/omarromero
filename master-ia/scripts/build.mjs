// Ensambla master-ia/index.html (archivo único ejecutable) a partir de src/
// y deja una copia lista para publicar en dist/, además de firebase.json.
//
// Modos (se decide en la build):
//   - Firebase: existe firebase.config.json → Authentication + Firestore (producción).
//   - Emuladores: FIREBASE_EMULADORES=1 → Firebase contra los emuladores locales.
//   - Demostración: sin configuración (o MODO=demo) → datos en el navegador.
// Uso: npm run build | npm run build:emuladores | MODO=demo npm run build
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = rel => readFileSync(join(root, rel), 'utf8');

// Orden del temario: programa, acogida, M1…M7 y Proyecto Final
const datos = ['modulos', 'acogida', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'pfm']
  .map(n => leer(`src/data/${n}.js`)).join('\n');
// ---------- Modo y configuración de Firebase ----------
const EMULADORES = process.env.FIREBASE_EMULADORES === '1';
let firebaseConfig = null;
if (EMULADORES) {
  firebaseConfig = { apiKey: 'demo-clave', authDomain: 'demo-master-ia.firebaseapp.com', projectId: 'demo-master-ia' };
} else if (process.env.MODO !== 'demo' && existsSync(join(root, 'firebase.config.json'))) {
  firebaseConfig = JSON.parse(leer('firebase.config.json'));
  for (const k of ['apiKey', 'authDomain', 'projectId', 'appId']) {
    if (!firebaseConfig[k] || String(firebaseConfig[k]).includes('PEGA_AQUI')) throw new Error('firebase.config.json: falta el campo ' + k + ' (cópialo de la consola de Firebase).');
  }
}
if (process.env.REQUIERE_FIREBASE === '1' && !firebaseConfig) {
  throw new Error('No hay firebase.config.json: cópialo de firebase.config.example.json y rellénalo con los datos de la consola de Firebase (ver DESPLIEGUE.md).');
}
const modo = EMULADORES ? 'emuladores' : firebaseConfig ? 'firebase' : 'demostración';

const app = 'const FIREBASE_CONFIG = ' + JSON.stringify(firebaseConfig) + ';\nconst FIREBASE_EMULADORES = ' + EMULADORES + ';\n' +
  readdirSync(join(root, 'src/app')).filter(f => f.endsWith('.js')).sort().map(f => leer(`src/app/${f}`)).join('\n');

// SDK de Firebase empaquetado (solo Authentication y Firestore) e incrustado en el HTML
const sdk = firebaseConfig ? buildSync({
  entryPoints: [join(root, 'src/firebase/sdk.js')], bundle: true, minify: true, format: 'iife',
  target: 'es2020', write: false, legalComments: 'none', logLevel: 'error'
}).outputFiles[0].text : '';

// ---------- Comprobaciones de integridad antes de generar ----------
const ctx = {};
vm.createContext(ctx);
vm.runInContext(datos + '\nthis.S = SESIONES; this.M = MODULOS; this.E = EVALUACION;', ctx);
new vm.Script(app);                                         // sintaxis de la aplicación
const nums = ctx.S.map(s => s.n);
if (nums.some((n, i) => n !== i)) throw new Error('Las sesiones deben numerarse de forma consecutiva desde 0: ' + nums.join(','));
for (const s of ctx.S) {
  for (const campo of ['titulo', 'corto', 'semana', 'fechas', 'resumen', 'stack', 'teoria', 'taller', 'prompts', 'actividad', 'faq']) {
    if (!s[campo]) throw new Error(`Sesión ${s.n}: falta el campo ${campo}`);
  }
  if (!['semanal', 'proyecto', 'pfm'].includes(s.actividad.tipo)) throw new Error(`Sesión ${s.n}: tipo de actividad no válido`);
  const pesos = s.actividad.rubrica.reduce((a, r) => a + r[1], 0);
  if (pesos !== 100) throw new Error(`Sesión ${s.n}: la rúbrica suma ${pesos} %, no 100 %`);
  if (!ctx.M.some(m => s.n >= m.sesiones[0] && s.n <= m.sesiones[1])) throw new Error(`Sesión ${s.n}: no pertenece a ningún módulo`);
}
const horas = ctx.M.reduce((a, m) => a + m.horas, 0) + 10;   // + 10 h de seminarios
if (horas !== 300) throw new Error('La carga lectiva debe sumar 300 horas y suma ' + horas);
for (const m of ctx.M.filter(m => m.computa)) {
  if (!ctx.S.some(s => s.n >= m.sesiones[0] && s.n <= m.sesiones[1] && s.actividad.tipo === 'proyecto')) throw new Error(`${m.id}: falta la sesión con el proyecto del módulo`);
}
const pesosPFM = ctx.E.tribunalPFM.reduce((a, t) => a + t[2], 0);
if (Math.abs(pesosPFM - 1) > 1e-9) throw new Error('Los criterios del tribunal del PFM deben sumar 100 %');

// ---------- Tailwind compilado e incrustado ----------
// Los estilos propios van entre components y utilities para que las utilidades
// responsive (lg:hidden…) prevalezcan sobre los componentes (.btn…).
const entradaCss = '@tailwind base;\n@tailwind components;\n' + leer('src/styles.css') + '\n@tailwind utilities;\n';
const tmp = mkdtempSync(join(tmpdir(), 'master-ia-css-'));
writeFileSync(join(tmp, 'entrada.css'), entradaCss);
const tailwind = execFileSync(process.execPath,
  [join(root, 'node_modules/tailwindcss/lib/cli.js'), '-c', join(root, 'tailwind.config.js'), '-i', join(tmp, 'entrada.css'), '--minify'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, { BROWSERSLIST_IGNORE_OLD_DATA: '1' }) });
rmSync(tmp, { recursive: true, force: true });

const html = leer('src/template.html')
  .replace('/*__CSS__*/', () => tailwind)
  .replace('/*__SDK__*/', () => sdk ? '<script>' + sdk.replace(/<\/script/gi, '<\\/script') + '</script>' : '')
  .replace('/*__DATA__*/', () => datos.replace(/<\/script/gi, '<\\/script'))
  .replace('/*__APP__*/', () => app.replace(/<\/script/gi, '<\\/script'));

writeFileSync(join(root, 'index.html'), html);

// ---------- dist/: carpeta publicable (Netlify, GitHub Pages, nginx…) ----------
// CSP estricta para los scripts: solo los dos bloques incrustados (por hash) y highlight.js.
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => "'sha256-" + createHash('sha256').update(m[1], 'utf8').digest('base64') + "'");
const csp = ["default-src 'self'", "script-src 'self' " + hashes.join(' ') + ' https://cdnjs.cloudflare.com',
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data:",
  "connect-src 'self'" + (firebaseConfig ? ' https://*.googleapis.com https://*.firebaseio.com' : '') + (EMULADORES ? ' http://127.0.0.1:9099 http://127.0.0.1:8085' : ''),
  "frame-src" + (firebaseConfig ? ' https://*.firebaseapp.com' : " 'none'"),
  "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
writeFileSync(join(dist, 'index.html'), html);
writeFileSync(join(dist, '_headers'), leer('deploy/_headers').replaceAll('{{CSP}}', csp));
writeFileSync(join(dist, 'nginx-headers.conf'), [
  ['Content-Security-Policy', csp], ['X-Content-Type-Options', 'nosniff'], ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'], ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()']
].map(([k, v]) => 'add_header ' + k + ' "' + v + '" always;').join('\n') + '\n');
if (existsSync(join(root, 'public/logo-jrotero.png'))) copyFileSync(join(root, 'public/logo-jrotero.png'), join(dist, 'logo-jrotero.png'));

// ---------- firebase.json (Hosting + reglas de Firestore + emuladores) ----------
const cabeceras = [
  ['Content-Security-Policy', csp], ['X-Content-Type-Options', 'nosniff'], ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'], ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains']
];
writeFileSync(join(root, 'firebase.json'), JSON.stringify({
  hosting: {
    public: 'dist',
    ignore: ['firebase.json', '**/.*', '**/node_modules/**', '_headers', 'nginx-headers.conf'],
    rewrites: [{ source: '**', destination: '/index.html' }],
    headers: [
      { source: '**', headers: cabeceras.map(([key, value]) => ({ key, value })) },
      { source: '/index.html', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] }
    ]
  },
  firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
  emulators: {
    auth: { host: '127.0.0.1', port: 9099 },
    firestore: { host: '127.0.0.1', port: 8085 },
    hosting: { host: '127.0.0.1', port: 5002 },
    ui: { enabled: true, port: 4000 },
    singleProjectMode: true
  }
}, null, 2) + '\n');

console.log(`Modo ${modo} · index.html generado: ${(html.length / 1024).toFixed(0)} KB · ${ctx.S.length} sesiones · ${ctx.M.length} bloques · ${horas} h`);
