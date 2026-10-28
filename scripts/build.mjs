#!/usr/bin/env node
/**
 * Genera dist/ listo para Netlify o Firebase Hosting:
 *   - app.js (+ chunks/) empaquetado con esbuild; Firebase solo se descarga si está configurado
 *   - styles.css compilado con Tailwind (sin CDN en producción)
 *   - fuentes Inter y JetBrains Mono alojadas en la propia web
 *   - config.js con la configuración web de Firebase, sacada de variables de entorno
 *
 * La configuración sale de firebase.web.json o de variables FIREBASE_*; con --demo se genera
 * el modo demostración (datos en el navegador).
 * Con --produccion (o en Netlify) el modo demostración solo se permite con PERMITIR_DEMO=1.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");

// .env local opcional (en Netlify las variables vienen del panel)
const envLocal = join(raiz, ".env");
if (existsSync(envLocal)) {
  for (const linea of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const env = process.env;
// Configuración web del proyecto (pública por diseño). Las variables FIREBASE_* la sustituyen;
// FIREBASE_EMULADOR=1 sin variables usa el modo demostración para no tocar el proyecto real.
const ficheroWeb = join(raiz, "firebase.web.json");
const usarFichero = existsSync(ficheroWeb) && !env.FIREBASE_API_KEY && env.FIREBASE_EMULADOR !== "1" && !process.argv.includes("--demo");
const base = usarFichero ? JSON.parse(readFileSync(ficheroWeb, "utf8")) : {};
const firebase = {
  apiKey: env.FIREBASE_API_KEY || base.apiKey,
  authDomain: env.FIREBASE_AUTH_DOMAIN || base.authDomain,
  projectId: env.FIREBASE_PROJECT_ID || base.projectId,
  appId: env.FIREBASE_APP_ID || base.appId,
  storageBucket: env.FIREBASE_STORAGE_BUCKET || base.storageBucket,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || base.messagingSenderId
};
const obligatorias = ["apiKey", "authDomain", "projectId", "appId"];
const puestas = obligatorias.filter(k => firebase[k]);
if (puestas.length && puestas.length < obligatorias.length) {
  const faltan = obligatorias.filter(k => !firebase[k]).map(k => "FIREBASE_" + k.replace(/[A-Z]/g, c => "_" + c).toUpperCase());
  console.error(`✖ Configuración de Firebase incompleta. Faltan: ${faltan.join(", ")}`);
  process.exit(1);
}
const conFirebase = puestas.length === obligatorias.length;
const produccion = process.argv.includes("--produccion") || env.NETLIFY === "true";
if (produccion && !conFirebase && env.PERMITIR_DEMO !== "1") {
  console.error("✖ Despliegue sin Firebase: se publicaría el modo demostración, en el que cualquiera entra como profesor.");
  console.error("  Define FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID y FIREBASE_APP_ID (ver DESPLIEGUE.md)");
  console.error("  o, si de verdad quieres publicar la demo, PERMITIR_DEMO=1.");
  process.exit(1);
}
for (const k of Object.keys(firebase)) if (!firebase[k]) delete firebase[k];

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "fonts"), { recursive: true });

// 1. JavaScript
await build({
  entryPoints: [join(raiz, "src/app.js")],
  outdir: dist,
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true,
  sourcemap: true,
  target: ["es2020"],
  chunkNames: "chunks/[name]-[hash]",
  legalComments: "linked",
  logLevel: "warning"
});

// 2. CSS con Tailwind
const tailwind = join(raiz, "node_modules/.bin", process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss");
execFileSync(tailwind, ["-c", join(raiz, "tailwind.config.js"), "-i", join(raiz, "src/styles.css"), "-o", join(dist, "styles.css"), "--minify"],
  { stdio: ["ignore", "ignore", "ignore"], shell: process.platform === "win32", env: { ...env, BROWSERSLIST_IGNORE_OLD_DATA: "1" } });

// 3. HTML, imágenes y fuentes
cpSync(join(raiz, "src/index.html"), join(dist, "index.html"));
cpSync(join(raiz, "public"), dist, { recursive: true });
const fuentes = [
  ["@fontsource/inter", "inter", [400, 500, 600, 700, 800]],
  ["@fontsource/jetbrains-mono", "jetbrains-mono", [400, 600]]
];
for (const [paquete, nombre, pesos] of fuentes) {
  for (const p of pesos) {
    const f = `${nombre}-latin-${p}-normal.woff2`;
    cpSync(join(raiz, "node_modules", paquete, "files", f), join(dist, "fonts", f));
  }
}

// 4. Configuración pública (la configuración web de Firebase no es secreta: la protegen las reglas)
const config = conFirebase ? { firebase, emulador: env.FIREBASE_EMULADOR === "1" } : {};
writeFileSync(join(dist, "config.js"), `window.JRO_CONFIG = ${JSON.stringify(config, null, 2)};\n`);

console.log(`✔ dist/ generado en modo ${conFirebase ? `Firebase (proyecto ${firebase.projectId}${config.emulador ? ", emuladores locales" : ""})` : "demostración"}`);
