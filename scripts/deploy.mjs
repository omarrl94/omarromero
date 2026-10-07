#!/usr/bin/env node
/**
 * Publica en Netlify:   npm run deploy   ·   npm run deploy:preview
 * Necesita NETLIFY_AUTH_TOKEN y NETLIFY_SITE_ID en el entorno
 * (o haber hecho `npx netlify-cli login` + `npx netlify-cli link`).
 */
import { spawnSync } from "node:child_process";

const preview = process.argv.includes("--preview");
const args = ["--yes", "netlify-cli@17", "deploy", "--dir=public", "--functions=netlify/functions"];
if (!preview) args.push("--prod");
if (process.env.NETLIFY_SITE_ID) args.push(`--site=${process.env.NETLIFY_SITE_ID}`);

const r = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
process.exit(r.status ?? 1);
