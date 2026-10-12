#!/usr/bin/env node
/**
 * Graba el vídeo de presentación de Rollo Madrid recorriendo la app de
 * verdad: nada de maquetas, lo que sale es la aplicación funcionando.
 *
 *   1. En una terminal:  npm run dev
 *   2. En otra:          npm run demo          → 16:9, recorrido completo
 *                        npm run demo:reel     → 9:16, 30 segundos a golpes
 *
 * Deja el vídeo en demo/ (webm, y mp4 si hay ffmpeg).
 *
 * Necesita Playwright. Si no lo tienes:
 *   npm i -D playwright && npx playwright install chromium
 * o, si lo tienes instalado globalmente:
 *   PLAYWRIGHT_MODULE=$(npm root -g)/playwright/index.mjs npm run demo
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const URL_APP = process.env["DEMO_URL"] ?? "http://localhost:3000/";
const SALIDA = join(RAIZ, "demo");
const TEMPORAL = join(SALIDA, ".crudo");

/** Dos formatos: el recorrido largo y el reel vertical. */
const REEL = process.argv.includes("--reel");
const NOMBRE = REEL ? "rollo-madrid-reel" : "rollo-madrid-demo";
const ANCHO = REEL ? 540 : 1280;
const ALTO = REEL ? 960 : 720;
/** El reel se graba al doble para que salga a 1080x1920. */
const ESCALA = REEL ? 2 : 1;

// ── Carga de Playwright, esté donde esté ──────────────────────
async function cargarChromium() {
  const candidatos = [
    process.env["PLAYWRIGHT_MODULE"],
    "playwright",
    "@playwright/test",
  ].filter(Boolean);

  for (const candidato of candidatos) {
    try {
      const modulo = await import(candidato);
      if (modulo.chromium) return modulo.chromium;
    } catch {
      // Siguiente candidato.
    }
  }
  console.error(
    "\nNo encuentro Playwright. Instálalo con:\n" +
      "  npm i -D playwright && npx playwright install chromium\n",
  );
  process.exit(1);
}

// ── Utilidades de guion ───────────────────────────────────────
const esperar = (pagina, ms) => pagina.waitForTimeout(ms);

/** Mueve el cursor hasta el elemento y pulsa, para que se vea el gesto. */
async function clicar(pagina, localizador, { pausa = REEL ? 260 : 420 } = {}) {
  await localizador.scrollIntoViewIfNeeded();
  const caja = await localizador.boundingBox();
  if (!caja) throw new Error("No encuentro el elemento que iba a pulsar.");
  await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, {
    steps: REEL ? 16 : 28,
  });
  await esperar(pagina, REEL ? 130 : 220);
  await pagina.mouse.down();
  await esperar(pagina, 90);
  await pagina.mouse.up();
  await esperar(pagina, pausa);
}

const rotulo = (pagina, titulo, texto) =>
  pagina.evaluate(([t, x]) => window.__demo.rotulo(t, x), [titulo, texto]);

const quitarRotulo = (pagina) => pagina.evaluate(() => window.__demo.quitarRotulo());

const tarjeta = (pagina, titulo, texto) =>
  pagina.evaluate(([t, x]) => window.__demo.tarjeta(t, x), [titulo, texto]);

const quitarTarjeta = (pagina) => pagina.evaluate(() => window.__demo.quitarTarjeta());

const golpe = (pagina, texto, tono = "", abajo = false) =>
  pagina.evaluate(([t, x, a]) => window.__demo.golpe(t, x, a), [texto, tono, abajo]);

const quitarGolpe = (pagina) => pagina.evaluate(() => window.__demo.quitarGolpe());

const flash = (pagina) => pagina.evaluate(() => window.__demo.flash());

/** Corte seco: destello, cambia el rótulo y sigue. */
async function corte(pagina, texto, { tono = "", abajo = false, ms = 1300 } = {}) {
  await flash(pagina);
  await golpe(pagina, texto, tono, abajo);
  await esperar(pagina, ms);
  await quitarGolpe(pagina);
  await esperar(pagina, 160);
}

const cerrarFicha = (pagina) =>
  clicar(
    pagina,
    pagina.getByRole("dialog").getByRole("button", { name: /Cerrar/ }).first(),
    { pausa: REEL ? 260 : 600 },
  );

const irA = async (pagina, selector) => {
  await pagina.evaluate((s) => {
    const destino = document.querySelector(s);
    if (destino) destino.scrollIntoView({ behavior: "smooth", block: "center" });
  }, selector);
  await esperar(pagina, 900);
};

/** Capa de rótulos, tarjetas y cursor falso, inyectada en la página. */
async function montarEscenografia(pagina) {
  await pagina.addStyleTag({
    content: `
      #demo-capa, #demo-cursor { position: fixed; z-index: 2147483647; pointer-events: none; }
      #demo-capa { inset: 0; }
      #demo-rotulo {
        position: absolute; left: 36px; bottom: 36px; max-width: 560px;
        border: 3px solid #000; background: #0C0C0D; box-shadow: 8px 8px 0 #000;
        padding: 14px 18px; opacity: 0; transform: translateY(14px);
        transition: opacity 320ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      #demo-rotulo.visible { opacity: 1; transform: translateY(0); }
      #demo-rotulo b {
        display: block; font-family: var(--fuente-grito), sans-serif; text-transform: uppercase;
        font-size: 26px; line-height: 1; color: #C6FF3D; letter-spacing: 0.01em;
      }
      #demo-rotulo span {
        display: block; margin-top: 7px; font-family: var(--fuente-sans), sans-serif;
        font-size: 15px; line-height: 1.45; color: #F2ECDF;
      }
      #demo-rotulo i {
        position: absolute; left: -3px; top: -3px; bottom: -3px; width: 7px;
        background: #FF2E88; font-style: normal;
      }
      #demo-tarjeta {
        position: absolute; inset: 0; display: grid; place-content: center; justify-items: center;
        gap: 18px; background: #0C0C0D; opacity: 0; transition: opacity 420ms ease;
        text-align: center; padding: 0 40px;
      }
      #demo-tarjeta.visible { opacity: 1; }
      #demo-tarjeta svg { height: 120px; width: auto; }
      #demo-tarjeta b {
        font-family: var(--fuente-grito), sans-serif; text-transform: uppercase;
        font-size: 64px; line-height: 0.95; color: #F2ECDF; letter-spacing: 0.01em;
      }
      #demo-tarjeta b em { font-style: normal; color: #FF2E88; }
      #demo-tarjeta span {
        font-family: var(--fuente-mono), monospace; font-size: 15px; letter-spacing: 0.22em;
        text-transform: uppercase; color: #C6FF3D;
      }
      #demo-cursor {
        left: 0; top: 0; width: 22px; height: 22px; margin: -11px 0 0 -11px;
        border: 3px solid #C6FF3D; border-radius: 999px; background: rgba(198, 255, 61, 0.22);
        box-shadow: 0 0 0 2px #000; transition: transform 90ms linear;
      }
      #demo-cursor.pulsa { transform: scale(0.72); background: #FF2E88; border-color: #FF2E88; }

      /* Destello entre cortes */
      #demo-flash {
        position: fixed; inset: 0; z-index: 2147483646; pointer-events: none;
        background: #C6FF3D; opacity: 0; transition: opacity 90ms linear;
      }
      #demo-flash.visible { opacity: 0.92; transition: none; }

      /* Rótulo a lo bestia para el reel */
      #demo-golpe {
        position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
        display: grid; place-content: center; padding: 0 28px; text-align: center;
        opacity: 0; transform: scale(1.14);
        transition: opacity 160ms ease, transform 220ms cubic-bezier(0.18, 1.3, 0.4, 1);
      }
      #demo-golpe.visible { opacity: 1; transform: scale(1); }
      #demo-golpe.abajo { place-content: end center; padding-bottom: 92px; }
      #demo-golpe b {
        display: inline-block;
        font-family: var(--fuente-grito), sans-serif; text-transform: uppercase;
        font-size: 58px; line-height: 0.92; letter-spacing: 0.005em;
        color: #F2ECDF; background: #0C0C0D; border: 4px solid #000;
        box-shadow: 10px 10px 0 #000; padding: 10px 16px;
      }
      #demo-golpe b em { font-style: normal; color: #C6FF3D; }
      #demo-golpe b u { text-decoration: none; color: #FF2E88; }
      #demo-golpe.magenta b { background: #FF2E88; color: #0C0C0D; }
      #demo-golpe.acido b { background: #C6FF3D; color: #0A0E02; }
    `,
  });

  await pagina.evaluate(() => {
    const capa = document.createElement("div");
    capa.id = "demo-capa";
    capa.innerHTML =
      '<div id="demo-rotulo"><i></i><b></b><span></span></div>' +
      '<div id="demo-tarjeta"><b></b><span></span></div>';
    document.body.appendChild(capa);

    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    document.body.appendChild(cursor);

    // El cursor sigue al ratón de verdad: así el gesto se ve en vídeo.
    addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    addEventListener("mousedown", () => cursor.classList.add("pulsa"));
    addEventListener("mouseup", () => cursor.classList.remove("pulsa"));

    const flash = document.createElement("div");
    flash.id = "demo-flash";
    document.body.appendChild(flash);

    const golpe = document.createElement("div");
    golpe.id = "demo-golpe";
    golpe.innerHTML = "<b></b>";
    document.body.appendChild(golpe);

    const elRotulo = capa.querySelector("#demo-rotulo");
    const elTarjeta = capa.querySelector("#demo-tarjeta");

    window.__demo = {
      rotulo(titulo, texto) {
        elRotulo.querySelector("b").textContent = titulo;
        elRotulo.querySelector("span").textContent = texto;
        elRotulo.classList.add("visible");
      },
      quitarRotulo() {
        elRotulo.classList.remove("visible");
      },
      tarjeta(titulo, texto) {
        const logo = document.querySelector("header svg");
        elTarjeta.innerHTML =
          (logo ? logo.outerHTML : "") +
          `<b>${titulo}</b><span>${texto}</span>`;
        elTarjeta.classList.add("visible");
      },
      quitarTarjeta() {
        elTarjeta.classList.remove("visible");
      },
      /** Destello de corte, como un corte de montaje. */
      flash() {
        flash.classList.add("visible");
        setTimeout(() => flash.classList.remove("visible"), 70);
      },
      /** Rótulo de reel: entra de golpe y se va igual de rápido. */
      golpe(texto, tono = "", abajo = false) {
        golpe.querySelector("b").innerHTML = texto;
        golpe.className = `${tono} ${abajo ? "abajo" : ""} visible`;
      },
      quitarGolpe() {
        golpe.classList.remove("visible");
      },
    };
  });
}

// ── Guion del reel: 9:16, treinta segundos a golpes ───────────
async function guionReel(pagina) {
  // 1 · Gancho
  await pagina.evaluate(() =>
    window.__demo.tarjeta("¿Entras<br>o <em>aguantas</em>?", "Rollo Madrid"),
  );
  await esperar(pagina, 1500);
  await pagina.evaluate(() => window.__demo.quitarTarjeta());
  await flash(pagina);
  await esperar(pagina, 380);

  // 2 · De qué va
  await corte(pagina, "El mapa de los<br><em>baños de Madrid</em>", { ms: 1250 });

  // 3 · El mapa, que es la cara de la app
  await irA(pagina, "#mapa");
  await corte(pagina, "Todo el centro,<br><u>por colores</u>", {
    tono: "magenta",
    ms: 1300,
  });
  await pagina.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await esperar(pagina, 700);

  // 4 · Modo urgencia
  await clicar(pagina, pagina.getByRole("button", { name: /Modo urgencia/ }), {
    pausa: 420,
  });
  await flash(pagina);
  await golpe(pagina, "El más decente,<br><em>ahora</em>", "acido", true);
  await esperar(pagina, 1250);
  await quitarGolpe(pagina);

  // 4 · Lo que se puntúa
  await corte(pagina, "Limpieza · espacio<br>intimidad · papel", {
    ms: 950,
    abajo: true,
  });
  await cerrarFicha(pagina);

  // 5 · La lista negra
  await irA(pagina, "#ranking");
  await corte(pagina, "Podio y<br><u>lista negra</u>", { tono: "acido", ms: 1000 });
  await clicar(pagina, pagina.getByRole("button", { name: /El Tigre/ }).first(), {
    pausa: 420,
  });
  await corte(pagina, "«Ni de coña»", { tono: "magenta", abajo: true, ms: 1200 });

  // 6 · Entrar y puntuar
  await clicar(
    pagina,
    pagina.getByRole("button", { name: /Entra para contar lo tuyo/ }),
    { pausa: 420 },
  );
  await golpe(pagina, "Entra y <em>canta</em>", "", true);
  const alias = pagina.getByLabel("Tu alias");
  await clicar(pagina, alias, { pausa: 100 });
  await alias.pressSequentially("Vermutero", { delay: 70 });
  await clicar(pagina, pagina.getByRole("dialog").locator('button[type="submit"]'), {
    pausa: 560,
  });
  await quitarGolpe(pagina);

  await clicar(pagina, pagina.getByRole("button", { name: /Yo he estado ahí dentro/ }), {
    pausa: 260,
  });
  await golpe(pagina, "Cuatro toques", "acido", true);
  for (const [criterio, nota] of [
    ["Limpieza", 1],
    ["Espacio", 2],
    ["Intimidad", 1],
    ["Suministros", 1],
  ]) {
    await clicar(
      pagina,
      pagina.getByRole("radio", { name: new RegExp(`${nota} de 5 en ${criterio}`) }),
      { pausa: 190 },
    );
  }
  await quitarGolpe(pagina);
  await esperar(pagina, 420);

  // 7 · Publicado
  await clicar(pagina, pagina.getByRole("button", { name: /Publicar el parte/ }), {
    pausa: 700,
  });
  await corte(pagina, "Tu parte,<br><em>firmado</em>", { ms: 1350, abajo: true });

  // 8 · Cierre
  await flash(pagina);
  await pagina.evaluate(() =>
    window.__demo.tarjeta("Rollo <em>Madrid</em>", "Mira la nota antes de entrar"),
  );
  await esperar(pagina, 2000);
}

// ── Guion ─────────────────────────────────────────────────────
async function grabar(chromium) {
  rmSync(TEMPORAL, { recursive: true, force: true });
  mkdirSync(TEMPORAL, { recursive: true });

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: { width: ANCHO, height: ALTO },
    deviceScaleFactor: ESCALA,
    recordVideo: {
      dir: TEMPORAL,
      size: { width: ANCHO * ESCALA, height: ALTO * ESCALA },
    },
    reducedMotion: "no-preference",
  });
  const pagina = await contexto.newPage();

  console.log(`▸ Abriendo ${URL_APP}`);
  await pagina.goto(URL_APP, { waitUntil: "networkidle" });
  await montarEscenografia(pagina);
  await pagina.mouse.move(ANCHO / 2, ALTO / 2);

  if (REEL) {
    await guionReel(pagina);
    await contexto.close();
    await navegador.close();
    return;
  }

  // 1 · Cartel de entrada
  await tarjeta(
    pagina,
    "Rollo <em>Madrid</em>",
    "El mapa callejero de los baños de Madrid",
  );
  await esperar(pagina, 2600);
  await quitarTarjeta(pagina);
  await esperar(pagina, 700);

  // 2 · El titular y las cifras
  await rotulo(
    pagina,
    "Antes de entrar, mira la nota",
    "Cuatro criterios por baño: limpieza, espacio, intimidad y suministros. La media manda.",
  );
  await esperar(pagina, 3200);
  await quitarRotulo(pagina);

  // 3 · Modo urgencia
  await rotulo(
    pagina,
    "Modo urgencia",
    "Un botón, el baño más decente que hay fichado y su ficha abierta.",
  );
  await clicar(pagina, pagina.getByRole("button", { name: /Modo urgencia/ }), {
    pausa: 900,
  });
  await esperar(pagina, 2200);
  await rotulo(
    pagina,
    "El parte técnico",
    "Media por criterio, cuántos la suspenden y los comentarios de quien estuvo dentro.",
  );
  await esperar(pagina, 3000);
  await quitarRotulo(pagina);
  await cerrarFicha(pagina);

  // 4 · Buscador
  await rotulo(
    pagina,
    "Los bares no se inventan",
    "Se buscan y se adoptan de Google Places con su place_id: sin duplicados ni nombres mal escritos.",
  );
  const busca = pagina.getByRole("searchbox", { name: /Buscar un bar/ });
  await clicar(pagina, busca, { pausa: 200 });
  await busca.pressSequentially("casa", { delay: 190 });
  await esperar(pagina, 1800);
  await quitarRotulo(pagina);
  await clicar(pagina, pagina.getByRole("button", { name: /Casa Labra/ }).first(), {
    pausa: 900,
  });

  // 5 · Hace falta cuenta
  await rotulo(
    pagina,
    "Leer es libre, firmar no",
    "Para publicar hace falta cuenta. Con Supabase son cuentas de verdad; aquí va en modo local.",
  );
  await esperar(pagina, 2600);
  await clicar(
    pagina,
    pagina.getByRole("button", { name: /Entra para contar lo tuyo/ }),
    { pausa: 800 },
  );
  await quitarRotulo(pagina);
  const alias = pagina.getByLabel("Tu alias");
  await clicar(pagina, alias, { pausa: 200 });
  await alias.pressSequentially("Vermutero", { delay: 150 });
  await esperar(pagina, 600);
  await clicar(
    pagina,
    pagina.getByRole("dialog").locator('button[type="submit"]'),
    { pausa: 1200 },
  );

  // 6 · Publicar un parte
  await rotulo(
    pagina,
    "Puntúa de 1 a 5 rollos",
    "Cada nota tiene nombre: de Infierno a Gloria. El veredicto se recalcula mientras puntúas.",
  );
  await clicar(pagina, pagina.getByRole("button", { name: /Yo he estado ahí dentro/ }));
  for (const [criterio, nota] of [
    ["Limpieza", 4],
    ["Espacio", 2],
    ["Intimidad", 5],
    ["Suministros", 3],
  ]) {
    await clicar(
      pagina,
      pagina.getByRole("radio", { name: new RegExp(`${nota} de 5 en ${criterio}`) }),
      { pausa: 520 },
    );
  }
  await esperar(pagina, 900);
  await quitarRotulo(pagina);

  const aviso = pagina.getByLabel("El aviso para el siguiente");
  await clicar(pagina, aviso, { pausa: 200 });
  await aviso.pressSequentially("Lleva papel de casa: el dispensador es decorativo.", {
    delay: 38,
  });
  await rotulo(
    pagina,
    "El aviso para el siguiente",
    "Lo que de verdad salva la noche: el comentario de quien entró antes.",
  );
  await esperar(pagina, 1800);
  await quitarRotulo(pagina);
  await clicar(pagina, pagina.getByRole("button", { name: /Publicar el parte/ }), {
    pausa: 1400,
  });

  await rotulo(
    pagina,
    "Tu parte, firmado",
    "La media del bar y su veredicto cambian al instante. Un voto por persona y bar: el segundo corrige al primero.",
  );
  await esperar(pagina, 3400);
  await quitarRotulo(pagina);
  await cerrarFicha(pagina);

  // 7 · Rankings
  await irA(pagina, "#ranking");
  await rotulo(
    pagina,
    "El podio y la lista negra",
    "Los tres que salvan la noche y los tres en los que no conviene entrar.",
  );
  await esperar(pagina, 3200);
  await quitarRotulo(pagina);

  // 8 · El mapa
  await irA(pagina, "#mapa");
  await rotulo(
    pagina,
    "El mapa",
    "Una chapa por bar: nota, veredicto y color. Esta grabación va sin clave de API, así que el mapa es el esquema de reserva; con clave, lo mismo sobre Google Maps en oscuro.",
  );
  await esperar(pagina, 4400);
  await quitarRotulo(pagina);

  // 9 · Cartel de salida
  await tarjeta(
    pagina,
    "Rollo <em>Madrid</em>",
    "Busca el bar · mira la nota · cuéntalo para el siguiente",
  );
  await esperar(pagina, 2800);

  await contexto.close();
  await navegador.close();
}

// ── Codificación ──────────────────────────────────────────────
function buscarFfmpeg() {
  const delEntorno = process.env["FFMPEG_PATH"];
  if (delEntorno && existsSync(delEntorno)) return delEntorno;

  const cual = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
  if (cual.status === 0) return cual.stdout.trim();

  // Playwright trae el suyo; sirve igual.
  const base = process.env["PLAYWRIGHT_BROWSERS_PATH"] ?? "/opt/pw-browsers";
  if (!existsSync(base)) return null;
  const carpeta = readdirSync(base).find((n) => n.startsWith("ffmpeg"));
  if (!carpeta) return null;
  const binario = join(base, carpeta, "ffmpeg-linux");
  return existsSync(binario) ? binario : null;
}

function recogerVideo() {
  const crudos = readdirSync(TEMPORAL).filter((n) => n.endsWith(".webm"));
  if (crudos.length === 0) throw new Error("Playwright no ha dejado ningún vídeo.");
  const webm = join(SALIDA, `${NOMBRE}.webm`);
  renameSync(join(TEMPORAL, crudos[0]), webm);
  rmSync(TEMPORAL, { recursive: true, force: true });
  return webm;
}

function aMp4(webm) {
  const ffmpeg = buscarFfmpeg();
  if (!ffmpeg) {
    console.log("! Sin ffmpeg a mano: te quedas con el .webm (se ve en cualquier navegador).");
    return null;
  }
  const mp4 = webm.replace(/\.webm$/, ".mp4");
  const resultado = spawnSync(
    ffmpeg,
    ["-y", "-i", webm, "-c:v", "libx264", "-preset", "slow", "-crf", "23",
     "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", mp4],
    { stdio: "ignore" },
  );
  return resultado.status === 0 ? mp4 : null;
}

const chromium = await cargarChromium();
mkdirSync(SALIDA, { recursive: true });
await grabar(chromium);
const webm = recogerVideo();
console.log(`✓ ${webm}`);
const mp4 = aMp4(webm);
if (mp4) console.log(`✓ ${mp4}`);
