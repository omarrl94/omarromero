#!/usr/bin/env node
/**
 * Dibuja el icono de la app y la pantalla de carga a partir del logo.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/generar-iconos.mjs
 *
 * Deja resources/icon.png (1024) y resources/splash.png (2732). A partir
 * de ahí, los tamaños de cada plataforma los genera Capacitor:
 *   npx @capacitor/assets generate --iconBackgroundColor "#0C0C0D" \
 *     --splashBackgroundColor "#0C0C0D"
 */

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = await import(
    process.env["PLAYWRIGHT_MODULE"] ?? "playwright"
  ));
}

const LOGO = `
<svg viewBox="5 10 86 54" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57" fill="none"
        stroke="#FF2E88" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M30 49 C 33 60, 40 58, 52 57 L52 22 L68 43 L84 22 L84 57" fill="none"
        stroke="#C6FF3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 8"/>
  <path d="M9 20 h30 v28 a15 7 0 0 1 -30 0 z" fill="#F2ECDF" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="24" cy="20" rx="15" ry="7" fill="#F2ECDF" stroke="#000" stroke-width="3"/>
  <ellipse cx="24" cy="20" rx="5" ry="2.3" fill="#FFB800"/>
</svg>`;

const pagina = (escalaLogo, fondo) => `
<style>
  html,body{margin:0;height:100%;}
  body{background:${fondo};display:grid;place-items:center;}
  .marco{width:${escalaLogo}%;}
  svg{width:100%;height:auto;display:block;}
</style>
<div class="marco">${LOGO}</div>`;

const b = await chromium.launch();
for (const [nombre, lado, escala, fondo] of [
  // Icono normal (iOS recorta las esquinas, no el centro)
  ["icon", 1024, 84, "#0C0C0D"],
  // Android adaptativo: la máscara puede ser redonda, así que el logo va
  // más pequeño y sobre fondo transparente, con su capa de color aparte.
  ["icon-foreground", 1024, 58, "transparent"],
  ["icon-background", 1024, 0, "#0C0C0D"],
  // Pantalla de carga, cuadrada para que valga en cualquier orientación
  ["splash", 2732, 38, "#0C0C0D"],
  ["splash-dark", 2732, 38, "#0C0C0D"],
]) {
  const p = await b.newPage({
    viewport: { width: lado, height: lado },
    deviceScaleFactor: 1,
  });
  await p.setContent(pagina(escala, fondo));
  await p.waitForTimeout(150);
  await p.screenshot({
    path: `resources/${nombre}.png`,
    omitBackground: fondo === "transparent",
  });
  await p.close();
  console.log(`✓ resources/${nombre}.png (${lado}×${lado})`);
}
await b.close();
