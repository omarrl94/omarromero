/**
 * Genera una version de OrientaFP en un unico fichero HTML.
 *
 * Sirve para publicar una vista previa donde no se pueden servir varios
 * ficheros (un Artifact de Claude, un adjunto, un USB). Inlinea el JS, el CSS
 * y el logo, y adapta el arranque del tema al contenedor donde se incruste.
 *
 * Uso:  npm run build && node scripts/build-standalone.mjs [destino.html]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const destino = process.argv[2] ?? join(dist, 'orientafp-standalone.html');

// --- Localiza los assets de ESTA build ---
// Se leen los nombres que referencia dist/index.html en lugar de listar la
// carpeta: el proyecto construye con `emptyOutDir: false`, asi que dist/assets
// conserva los ficheros de builds anteriores y elegir "el primer .js" cogeria
// uno caducado sin dar ningun error.
const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');

const nombreJs = indexHtml.match(/src="\/assets\/([^"]+\.js)"/)?.[1];
const nombreCss = indexHtml.match(/href="\/assets\/([^"]+\.css)"/)?.[1];

if (!nombreJs || !nombreCss) {
  throw new Error(
    'No se han podido leer los assets desde dist/index.html. ¿Has ejecutado "npm run build"?',
  );
}

const css = readFileSync(join(dist, 'assets', nombreCss), 'utf8');
let js = readFileSync(join(dist, 'assets', nombreJs), 'utf8');
const logo = readFileSync(join(raiz, 'public', 'logo.svg'), 'utf8');

// --- El logo pasa a data URI: en un solo fichero no hay rutas absolutas ---
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logo, 'utf8').toString('base64')}`;
const usosLogo = (js.match(/"\/logo\.svg"/g) ?? []).length;
js = js.replaceAll('"/logo.svg"', JSON.stringify(logoDataUri));

// --- Evita que una cadena "</script>" dentro del bundle cierre la etiqueta ---
const escaparScript = (codigo) => codigo.replaceAll('</script', '<\\/script');

const html = `<title>OrientaFP</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">

<style>
${css}
</style>

<script>
/**
 * Arranque del tema antes del primer pintado, para evitar el parpadeo blanco.
 *
 * La app usa la clase .dark en <html>, pero el contenedor que la incrusta puede
 * imponer su propio tema con data-theme en la raiz. Prioridad:
 *   1. La preferencia que el usuario haya elegido con el interruptor de la app.
 *   2. El data-theme del contenedor, si lo hay.
 *   3. La preferencia del sistema operativo.
 */
(function () {
  var raiz = document.documentElement;

  function preferenciaGuardada() {
    try {
      var v = localStorage.getItem('orientafp.theme');
      return v === 'dark' || v === 'light' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function aplicar() {
    var guardada = preferenciaGuardada();
    var delContenedor = raiz.getAttribute('data-theme');
    var oscuro;

    if (guardada) {
      oscuro = guardada === 'dark';
    } else if (delContenedor === 'dark' || delContenedor === 'light') {
      oscuro = delContenedor === 'dark';
    } else {
      oscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    raiz.classList.toggle('dark', !!oscuro);
  }

  aplicar();

  // El contenedor puede cambiar de tema mientras la pagina esta abierta.
  if (window.MutationObserver) {
    new MutationObserver(aplicar).observe(raiz, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var alCambiar = function () {
      if (!preferenciaGuardada()) aplicar();
    };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
    else if (mq.addListener) mq.addListener(alCambiar);
  }
})();
</script>

<div id="root"></div>

<script type="module">
${escaparScript(js)}
</script>
`;

writeFileSync(destino, html, 'utf8');

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`Fichero unico generado: ${destino}`);
console.log(`  Assets de origen: ${nombreJs} + ${nombreCss}`);
console.log(`  CSS inlineado : ${kb(css.length)}`);
console.log(`  JS inlineado  : ${kb(js.length)}`);
console.log(`  Logo          : data URI (${usosLogo} referencias sustituidas)`);
console.log(`  Total         : ${kb(html.length)}`);
