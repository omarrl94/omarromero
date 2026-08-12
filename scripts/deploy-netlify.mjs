#!/usr/bin/env node
/**
 * Despliegue de Hipster Bingo en Netlify desde la terminal.
 *
 *   npm run deploy            → publica en producción
 *   npm run deploy:preview    → publica una URL de preview
 *
 * Escrito en Node puro (sin dependencias) para que funcione igual en
 * Windows (cmd y PowerShell), macOS y Linux.
 *
 * Es idempotente: la primera vez pide credenciales y crea el sitio;
 * las siguientes solo compila y sube.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = join(ROOT, ".env.local");
const PREVIEW = process.argv.includes("--preview");

process.chdir(ROOT);

// ── Estilo de salida ──────────────────────────────────────────
// Se desactiva el color si la salida no es un terminal (o con NO_COLOR),
// así los logs redirigidos a un archivo quedan limpios.
const useColor = output.isTTY && !process.env["NO_COLOR"];
const c = (code, text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
const bold = (t) => c("1", t);
const dim = (t) => c("2", t);

const step = (msg) => console.log(`\n${c("36", bold("▸ " + msg))}`);
const ok = (msg) => console.log(`${c("32", "✓")} ${msg}`);
const warn = (msg) => console.log(`${c("33", "!")} ${msg}`);

function fail(msg) {
  console.error(`\n${c("31", bold("✗ " + msg))}\n`);
  process.exit(1);
}

// ── Ejecución de comandos ─────────────────────────────────────
// shell:true es obligatorio en Windows para invocar npx/npm, que allí
// son archivos .cmd. Por eso los argumentos se entrecomillan a mano;
// todos los valores dinámicos pasan antes una validación estricta de
// caracteres, así que no hay riesgo de inyección.
function quote(arg) {
  return `"${arg}"`;
}

function run(command, args, { capture = false } = {}) {
  const line = [command, ...args.map(quote)].join(" ");
  const result = spawnSync(line, {
    stdio: capture ? "pipe" : "inherit",
    shell: true,
    encoding: "utf8",
  });
  return result;
}

const netlify = (args, options) =>
  run("npx", ["--yes", "netlify-cli@latest", ...args], options);

// ── Validación de credenciales ────────────────────────────────
// Formatos reales de Supabase: URL del proyecto y JWT (base64url).
const URL_RE = /^https:\/\/[A-Za-z0-9.-]+$/;
const KEY_RE = /^[A-Za-z0-9._-]{30,}$/;

const isValidUrl = (v) =>
  typeof v === "string" && URL_RE.test(v) && !v.includes("TU-PROYECTO");
const isValidKey = (v) =>
  typeof v === "string" && KEY_RE.test(v) && !v.includes("tu-anon-key");

/** Lee un valor de .env.local sin ejecutar el archivo. */
function readEnvValue(key) {
  if (!existsSync(ENV_FILE)) return null;
  const lines = readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  let found = null;
  for (const line of lines) {
    const match = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`));
    if (match) found = match[1] ?? "";
  }
  if (found === null) return null;
  return found.trim().replace(/^["']|["']$/g, "");
}

async function main() {
  console.log(`\n${bold("🎵 Hipster Bingo → Netlify")}`);
  console.log(dim(ROOT));

  // ── 1. Requisitos ───────────────────────────────────────────
  step("Comprobando requisitos");
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 18) {
    fail(
      `Necesitas Node.js 18 o superior (tienes la ${nodeMajor}). Actualiza desde https://nodejs.org`
    );
  }
  ok(`Node.js v${process.versions.node}`);

  // ── 2. Credenciales de Supabase ─────────────────────────────
  step("Credenciales de Supabase");
  let url = readEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  let key = readEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (isValidUrl(url) && isValidKey(key)) {
    ok("Leídas de .env.local");
  } else {
    console.log(
      dim(
        "\nNecesito las dos claves de tu proyecto Supabase." +
          "\nLas encuentras en: Project Settings → API" +
          "\n(Plan gratuito, sin base de datos ni tablas.)\n"
      )
    );
    if (!input.isTTY) {
      fail(
        "No hay terminal interactiva para pedirte las credenciales.\n" +
          "  Crea un archivo .env.local en la raíz del proyecto con estas dos líneas:\n\n" +
          "    NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co\n" +
          "    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-anon-key\n\n" +
          "  y vuelve a ejecutar el comando."
      );
    }

    const rl = createInterface({ input, output });
    // Si stdin se cierra (Ctrl+D o entrada redirigida), question() nunca
    // resolvería: la carrera contra 'close' evita que el script se cuelgue.
    const ask = async (prompt) => {
      const answer = await Promise.race([
        rl.question(prompt),
        new Promise((resolve) => rl.once("close", () => resolve(null))),
      ]);
      if (answer === null) {
        rl.close();
        fail("Entrada cancelada. Vuelve a ejecutar el comando cuando quieras.");
      }
      return answer.trim();
    };

    try {
      while (!isValidUrl(url)) {
        url = await ask("  Project URL (https://xxxx.supabase.co): ");
        if (!isValidUrl(url)) warn("Debe ser una URL https:// válida — inténtalo de nuevo.");
      }
      while (!isValidKey(key)) {
        key = await ask("  anon public key (eyJ...): ");
        if (!isValidKey(key)) warn("Esa clave no parece válida — inténtalo de nuevo.");
      }
    } finally {
      rl.close();
    }

    writeFileSync(
      ENV_FILE,
      `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\n`,
      "utf8"
    );
    ok("Guardadas en .env.local (ignorado por git)");
  }

  // El build local las incrusta en el bundle del navegador.
  process.env["NEXT_PUBLIC_SUPABASE_URL"] = url;
  process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = key;

  // ── 3. Dependencias ─────────────────────────────────────────
  step("Instalando dependencias");
  if (existsSync(join(ROOT, "node_modules"))) {
    ok("Ya estaban instaladas");
  } else {
    const install = run("npm", ["install", "--no-audit", "--no-fund"]);
    if (install.status !== 0) fail("Falló la instalación de dependencias.");
    ok("Dependencias instaladas");
  }

  // ── 4. Sesión de Netlify ────────────────────────────────────
  step("Sesión de Netlify");
  warn("Si es tu primera vez se abrirá el navegador para autorizar.");
  const login = netlify(["login"]);
  if (login.status !== 0) fail("No se pudo iniciar sesión en Netlify.");
  ok("Sesión iniciada");

  // ── 5. Vincular o crear el sitio ────────────────────────────
  step("Sitio de Netlify");
  if (existsSync(join(ROOT, ".netlify", "state.json"))) {
    ok("Esta carpeta ya está vinculada a un sitio");
  } else {
    console.log(
      dim(
        '\nElige "Create & configure a new site" para crear uno nuevo,' +
          '\no "Link this directory to an existing site" si ya lo tienes.\n'
      )
    );
    const init = netlify(["init"]);
    if (init.status !== 0) fail("No se pudo crear ni vincular el sitio.");
    ok("Sitio vinculado");
  }

  // ── 6. Variables de entorno en Netlify ──────────────────────
  step("Configurando variables de entorno en Netlify");
  for (const [name, value] of [
    ["NEXT_PUBLIC_SUPABASE_URL", url],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", key],
  ]) {
    const res = netlify(["env:set", name, value], { capture: true });
    if (res.status !== 0) {
      fail(
        `No se pudo configurar ${name} en Netlify.\n${res.stderr ?? ""}`.trim()
      );
    }
  }
  ok("Variables configuradas (persisten para los próximos despliegues)");

  // ── 7. Compilar y publicar ──────────────────────────────────
  step(
    PREVIEW
      ? "Compilando y publicando URL de preview"
      : "Compilando y publicando en producción"
  );
  const deployArgs = ["deploy", "--build"];
  if (!PREVIEW) deployArgs.push("--prod");
  const deploy = netlify(deployArgs);
  if (deploy.status !== 0) fail("El despliegue falló. Revisa el error de arriba.");

  console.log(`\n${c("32", bold("✓ Despliegue completado"))}`);
  console.log(
    dim('Abre la URL de arriba y comprueba que el indicador dice "En directo" en verde.\n')
  );
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
