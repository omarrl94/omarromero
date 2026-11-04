// Genera preview/cyberops-preview.html: el juego completo en UN solo fichero HTML
// (JavaScript, CSS y fuentes incrustados) que se abre con doble clic, sin servidor.
// Funciona en «modo local»: las cuentas y el progreso se guardan en el navegador.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const env = { ...process.env };
for (const k of Object.keys(env)) if (k.startsWith('VITE_FIREBASE')) delete env[k];
execSync('npx vite build --outDir dist-preview --emptyOutDir', { stdio: 'inherit', env });

const dir = 'dist-preview';
let html = readFileSync(join(dir, 'index.html'), 'utf8');
const assets = join(dir, 'assets');
const files = readdirSync(assets);

const mime = { woff2: 'font/woff2', woff: 'font/woff', svg: 'image/svg+xml', png: 'image/png' };
const dataUri = (name) => `data:${mime[name.split('.').pop()] || 'application/octet-stream'};base64,${readFileSync(join(assets, name)).toString('base64')}`;

// CSS con las fuentes incrustadas (solo latín; el resto de juegos de caracteres se descartan).
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (_, css) => {
  let code = readFileSync(join(assets, css), 'utf8');
  code = code.replace(/@font-face\{[^}]*\}/g, (block) => (/jetbrains-mono-latin-\d/.test(block) ? block : ''));
  code = code.replace(/url\(\.?\/?(?:assets\/)?([^)"']+\.(woff2?|svg|png))\)/g, (m, f) => (files.includes(f) ? `url(${dataUri(f)})` : m));
  return `<style>${code}</style>`;
});

// JavaScript principal incrustado como módulo.
html = html.replace(/<script type="module" crossorigin src="\.\/assets\/([^"]+\.js)"><\/script>/, (_, js) => {
  const code = readFileSync(join(assets, js), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${code}</script>`;
});
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${`data:image/svg+xml;base64,${readFileSync('public/favicon.svg').toString('base64')}`}">`);

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('Quedan referencias a ficheros externos en el HTML');
mkdirSync('preview', { recursive: true });
writeFileSync('preview/cyberops-preview.html', html);
console.log(`✓ preview/cyberops-preview.html (${(html.length / 1024).toFixed(0)} KB) — ábrelo con doble clic.`);
