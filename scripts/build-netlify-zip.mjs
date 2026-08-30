/**
 * Empaqueta el sitio construido para subirlo a mano a Netlify.
 *
 * Un despliegue manual (arrastrar a app.netlify.com/drop) NO lee netlify.toml:
 * ese fichero solo se aplica cuando Netlify construye desde el repositorio. Por
 * eso aquí se escriben `_redirects` y `_headers` dentro del propio paquete, que
 * sí se leen desde la carpeta publicada. Así el despliegue manual se comporta
 * igual que el automático, con su caché y su regla de SPA.
 *
 * Uso:  npm run build:netlify
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const zip = join(raiz, 'orientafp-netlify.zip');

if (!existsSync(join(dist, 'index.html'))) {
  throw new Error('No hay build en dist/. Ejecuta "npm run build" antes.');
}

// El fichero único es otro entregable distinto: no debe viajar dentro del sitio.
const standalone = join(dist, 'orientafp-standalone.html');
if (existsSync(standalone)) rmSync(standalone);

// --- Equivalente de netlify.toml para despliegues manuales ---
writeFileSync(
  join(dist, '_redirects'),
  `# La app enruta por hash (#/comparador), así que todas las URLs ya resuelven a
# index.html. Esta regla es una red de seguridad para rutas inventadas.
/*  /index.html  200
`,
);

writeFileSync(
  join(dist, '_headers'),
  `# Vite pone un hash en el nombre de cada asset: su contenido nunca cambia bajo
# el mismo nombre, así que se pueden cachear para siempre.
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# El HTML cambia en cada despliegue y debe revalidarse siempre.
/index.html
  Cache-Control: public, max-age=0, must-revalidate

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`,
);

// --- Empaquetado: el contenido va en la raíz del zip, que es lo que espera Netlify ---
rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, '.'], { cwd: dist });

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
const ficheros = [];
const recorrer = (dir, prefijo = '') => {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) recorrer(ruta, `${prefijo}${entrada}/`);
    else ficheros.push(`${prefijo}${entrada}`);
  }
};
recorrer(dist);

console.log(`Paquete listo: ${zip} (${kb(statSync(zip).size)})`);
console.log(`Contenido (${ficheros.length} ficheros):`);
for (const f of ficheros.sort()) console.log(`  ${f}`);
console.log('\nSuéltalo en https://app.netlify.com/drop');
