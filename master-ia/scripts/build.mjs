// Ensambla master-ia/index.html (archivo único ejecutable) a partir de src/
// y deja una copia lista para publicar en dist/ (index.html + _headers).
// Uso: npm run build
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = rel => readFileSync(join(root, rel), 'utf8');

// Orden del temario: programa, acogida, M1…M7 y Proyecto Final
const datos = ['modulos', 'acogida', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'pfm']
  .map(n => leer(`src/data/${n}.js`)).join('\n');
const app = readdirSync(join(root, 'src/app')).filter(f => f.endsWith('.js')).sort()
  .map(f => leer(`src/app/${f}`)).join('\n');

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
  .replace('/*__DATA__*/', () => datos.replace(/<\/script/gi, '<\\/script'))
  .replace('/*__APP__*/', () => app.replace(/<\/script/gi, '<\\/script'));

writeFileSync(join(root, 'index.html'), html);

// ---------- dist/: carpeta publicable (Netlify, GitHub Pages, nginx…) ----------
// CSP estricta para los scripts: solo los dos bloques incrustados (por hash) y highlight.js.
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => "'sha256-" + createHash('sha256').update(m[1], 'utf8').digest('base64') + "'");
const csp = ["default-src 'self'", "script-src 'self' " + hashes.join(' ') + ' https://cdnjs.cloudflare.com',
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data:", "connect-src 'self'",
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

console.log(`index.html generado: ${(html.length / 1024).toFixed(0)} KB · ${ctx.S.length} sesiones · ${ctx.M.length} bloques · ${horas} h`);
