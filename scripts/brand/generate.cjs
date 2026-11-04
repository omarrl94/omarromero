// Genera los iconos y las pantallas de arranque de Android, y el material de Google Play.
// Uso: node scripts/brand/generate.cjs   (necesita Playwright con Chromium)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const RES = path.join(ROOT, 'android/app/src/main/res');
const STORE = path.join(ROOT, 'store/google-play');
const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

(async () => {
  const art = await import(path.join(__dirname, 'art.mjs'));
  const { mark, background, svg } = art;
  const FONT_DIR = path.join(ROOT, 'node_modules/@fontsource/jetbrains-mono/files');
  const fontFace = [500, 600, 700, 800].map((w) => {
    const f = path.join(FONT_DIR, `jetbrains-mono-latin-${w}-normal.woff2`);
    return fs.existsSync(f) ? `@font-face{font-family:'JetBrains Mono';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2')}` : '';
  }).join('');
  const b = await chromium.launch();
  const page = await b.newPage();
  const render = async (file, w, h, html, transparent = false) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<!doctype html><html><head><style>${fontFace}html,body{margin:0;padding:0;background:${transparent ? 'transparent' : '#05060a'};overflow:hidden}svg{display:block}</style></head><body>${html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  };

  // Icono: capas adaptativas (108 dp) y versiones clásicas (48 dp) por densidad.
  for (const [d, k] of Object.entries(DENS)) {
    const dir = path.join(RES, `mipmap-${d}`);
    const L = Math.round(108 * k);
    const S = Math.round(48 * k);
    await render(path.join(dir, 'ic_launcher_foreground.png'), L, L, svg(L, L, mark()), true);
    await render(path.join(dir, 'ic_launcher_background.png'), L, L, svg(L, L, background()));
    await render(path.join(dir, 'ic_launcher_monochrome.png'), L, L, svg(L, L, mark({ mono: true })), true);
    // Clásico: recorte del centro (como haría el lanzador) con esquinas redondeadas / círculo.
    const legacy = (shape) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="15 15 78 78"><defs><clipPath id="c">${shape}</clipPath></defs><g clip-path="url(#c)">${background()}${mark()}</g></svg>`;
    await render(path.join(dir, 'ic_launcher.png'), S, S, legacy('<rect x="15" y="15" width="78" height="78" rx="17"/>'), true);
    await render(path.join(dir, 'ic_launcher_round.png'), S, S, legacy('<circle cx="54" cy="54" r="39"/>'), true);
  }

  // Pantallas de arranque (Android 11 o anterior; en 12+ el sistema usa el icono sobre fondo oscuro).
  const splash = (w, h) => {
    const s = Math.min(w, h) * 0.42;
    return `<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%, rgba(34,228,255,.16), rgba(5,6,10,0) 55%), #05060a">
      ${svg(s, s, mark())}
      <div style="font:800 ${Math.round(s * 0.2)}px 'JetBrains Mono',monospace;color:#fff;letter-spacing:-1px;margin-top:${Math.round(s * 0.02)}px">Code<span style="color:#22e4ff">Forge</span></div>
      <div style="font:600 ${Math.round(s * 0.065)}px 'JetBrains Mono',monospace;color:#ff3df0;letter-spacing:.35em;margin-top:${Math.round(s * 0.04)}px">THE LIVING ENGINE</div></div>`;
  };
  const PORT = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
  for (const [d, [w, h]] of Object.entries(PORT)) {
    await render(path.join(RES, `drawable-port-${d}/splash.png`), w, h, splash(w, h));
    await render(path.join(RES, `drawable-land-${d}/splash.png`), h, w, splash(h, w));
  }
  await render(path.join(RES, 'drawable/splash.png'), 480, 320, splash(480, 320));

  // Google Play: icono de 512×512 y gráfico destacado de 1024×500.
  await render(path.join(STORE, 'icono-512.png'), 512, 512, `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="15 15 78 78">${background()}${mark()}</svg>`);
  await render(path.join(STORE, 'grafico-destacado-1024x500.png'), 1024, 500, `
    <div style="position:relative;width:1024px;height:500px;overflow:hidden;background:
      radial-gradient(700px 380px at 18% 30%, rgba(34,228,255,.18), transparent 60%),
      radial-gradient(600px 360px at 95% 90%, rgba(255,61,240,.16), transparent 60%),
      linear-gradient(rgba(34,228,255,.05) 1px, transparent 1px) 0 0/32px 32px,
      linear-gradient(90deg, rgba(34,228,255,.05) 1px, transparent 1px) 0 0/32px 32px, #05060a;font-family:'JetBrains Mono',monospace">
      <div style="position:absolute;left:60px;top:95px">${svg(300, 300, mark())}</div>
      <div style="position:absolute;left:380px;top:120px;right:50px">
        <div style="font:800 76px 'JetBrains Mono',monospace;color:#fff;letter-spacing:-2px">Code<span style="color:#22e4ff;text-shadow:0 0 24px #22e4ff">Forge</span></div>
        <div style="font:700 19px 'JetBrains Mono',monospace;color:#ff3df0;letter-spacing:.38em;margin-top:6px">THE LIVING ENGINE</div>
        <div style="font:500 25px/1.45 'JetBrains Mono',monospace;color:#d6dcff;margin-top:28px">Aprende a programar construyendo<br>un motor de juego. <span style="color:#a3ff3d">9 lenguajes.</span></div>
      </div></div>`);
  await b.close();
  console.log('Iconos, splash y material de Google Play generados.');
})();
