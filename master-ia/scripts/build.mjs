// Ensambla master-ia/index.html (archivo único ejecutable) a partir de src/.
// Uso: node master-ia/scripts/build.mjs
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = rel => readFileSync(join(root, rel), 'utf8');

const datos = ['modulos', 'm0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6']
  .map(n => leer(`src/data/${n}.js`)).join('\n');
const app = leer('src/app.js');

// Comprobación de sintaxis y de integridad del temario antes de generar.
const ctx = {};
vm.createContext(ctx);
vm.runInContext(datos + '\nthis.__S = SESIONES; this.__M = MODULOS;', ctx);
new vm.Script(app);
const nums = ctx.__S.map(s => s.n).sort((a, b) => a - b);
if (nums.length !== 28 || nums.some((n, i) => n !== i + 1)) {
  throw new Error('El temario debe contener exactamente las Sesiones 1 a 28. Encontradas: ' + nums.join(','));
}
for (const s of ctx.__S) {
  for (const campo of ['titulo', 'corto', 'resumen', 'stack', 'teoria', 'taller', 'prompts', 'actividad', 'faq']) {
    if (!s[campo]) throw new Error(`Sesión ${s.n}: falta el campo ${campo}`);
  }
}

// Los estilos propios van entre components y utilities para que las utilidades
// responsive (lg:hidden…) prevalezcan sobre los componentes (.btn…).
const entradaCss = '@tailwind base;\n@tailwind components;\n' + leer('src/styles.css') + '\n@tailwind utilities;\n';
// Tailwind se compila aquí (solo las clases usadas) y se incrusta junto a los estilos propios.
const tmp = mkdtempSync(join(tmpdir(), 'master-ia-css-'));
writeFileSync(join(tmp, 'entrada.css'), entradaCss);
const tailwind = execFileSync(process.execPath,
  [join(root, 'node_modules/tailwindcss/lib/cli.js'), '-c', join(root, 'tailwind.config.js'), '-i', join(tmp, 'entrada.css'), '--minify'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
rmSync(tmp, { recursive: true, force: true });

const html = leer('src/template.html')
  .replace('/*__CSS__*/', () => tailwind)
  .replace('/*__DATA__*/', () => datos.replace(/<\/script/gi, '<\\/script'))
  .replace('/*__APP__*/', () => app.replace(/<\/script/gi, '<\\/script'));

writeFileSync(join(root, 'index.html'), html);
console.log(`index.html generado: ${(html.length / 1024).toFixed(0)} KB · ${ctx.__S.length} sesiones`);
