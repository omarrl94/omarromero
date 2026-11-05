/**
 * Genera la versión de demostración en UN solo archivo HTML (dist-demo/conecta-ffe-demo.html):
 * build con VITE_DEMO=true y todo incrustado (JS, CSS, fuentes y logo como data URI).
 * Sirve para enseñar la app sin servidor. NUNCA se despliega en Netlify.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist-demo';
execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { stdio: 'inherit', env: { ...process.env, VITE_DEMO: 'true' } });

const html = readFileSync(join(OUT, 'index.html'), 'utf8');
const leer = (ruta: string) => readFileSync(join(OUT, ruta.replace(/^\//, '')));
const dataUri = (ruta: string, tipo: string) => `data:${tipo};base64,${leer(ruta).toString('base64')}`;

const cssRuta = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)![1];
const jsRuta = html.match(/<script type="module"[^>]*src="([^"]+)"/)![1];
let css = leer(cssRuta).toString('utf8').replace(/url\((?:\.\/|\/assets\/)?([^)'"]+\.woff2)\)/g, (_, f) => `url(${dataUri(`assets/${f.replace(/^assets\//, '')}`, 'font/woff2')})`);
css = css.replace(/url\([^)]*\.woff\)/g, 'url()'); // solo woff2
let js = leer(jsRuta).toString('utf8');
js = js.replace(/(["`])\/logo-jrotero\.png\1/g, JSON.stringify(dataUri("logo-jrotero.png", "image/png")));
js = js.replace(/<\/script>/gi, '<\\/script>');

const favicon = dataUri('favicon.svg', 'image/svg+xml');
const salida = [
  '<title>Conecta FFE</title>',
  '<meta name="robots" content="noindex, nofollow">',
  `<link rel="icon" href="${favicon}">`,
  `<style>:root{color-scheme:light}${css}</style>`,
  '<div id="root"></div>',
  `<script type="module">${js}</script>`,
].join('\n');
writeFileSync(join(OUT, 'conecta-ffe-demo.html'), salida);
console.log(`✔ ${OUT}/conecta-ffe-demo.html (${Math.round(salida.length / 1024)} kB)`);
