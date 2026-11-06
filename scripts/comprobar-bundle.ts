/**
 * Comprueba que el bundle público (dist/) no contiene:
 *  - correos de empresas (ni del directorio, ni de las candidatas, ni de los datos ficticios);
 *  - ningún correo salvo los del centro configurados en config/ffe.config.ts;
 *  - valores de secretos presentes en el entorno ni nombres de variables secretas.
 * Sale con código 1 si encuentra algo.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config/ffe.config';

const PERMITIDOS = new Set(
  [config.centro.contactoPrivacidad, ...Object.values(config.tutores).flatMap((t) => (t ? [t.email] : []))].map((e) => e.toLowerCase()),
);
const SECRETOS = ['SESSION_SECRET', 'FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_PRIVATE_KEY', 'SMTP_PASS', 'RESEND_API_KEY', 'MS_CLIENT_SECRET', 'ADZUNA_APP_KEY', 'ADZUNA_APP_ID', 'INFOJOBS_CLIENT_SECRET', 'INFOJOBS_CLIENT_ID'];
const RE_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;

async function archivos(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await archivos(p)));
    else out.push(p);
  }
  return out;
}

async function correosDe(ruta: string): Promise<string[]> {
  try {
    return [...(await readFile(ruta, 'utf8')).matchAll(RE_EMAIL)].map((m) => m[0].toLowerCase());
  } catch {
    return [];
  }
}

async function main() {
  const protegidos = new Set([
    ...(await correosDe('data/empresas.json')),
    ...(await correosDe('data/empresas.candidatas.json')),
    ...(await correosDe('tests/fixtures/empresas.ficticias.json')),
  ]);
  const problemas: string[] = [];
  const lista = (await archivos('dist')).filter((f) => /\.(html|js|css|json|txt|map|svg)$/.test(f));
  for (const f of lista) {
    const txt = await readFile(f, 'utf8');
    for (const m of txt.matchAll(RE_EMAIL)) {
      const e = m[0].toLowerCase();
      if (/\.(png|jpe?g|svg|webp|js|css)$/.test(e) || /@\d+x\./.test(e)) continue;
      if (protegidos.has(e)) problemas.push(`${f}: correo protegido ${e}`);
      else if (!PERMITIDOS.has(e)) problemas.push(`${f}: correo no permitido ${e}`);
    }
    for (const s of SECRETOS) {
      const valor = process.env[s];
      if (valor && valor.length >= 6 && txt.includes(valor)) problemas.push(`${f}: contiene el valor de ${s}`);
      if (txt.includes(s)) problemas.push(`${f}: menciona la variable ${s}`);
    }
    if (/ficticia-[a-z]+\.test/.test(txt)) problemas.push(`${f}: contiene datos ficticios de pruebas`);
  }
  if (problemas.length) {
    console.error(`✖ ${problemas.length} problema(s) en dist/:\n` + problemas.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }
  console.log(`✔ Bundle limpio: ${lista.length} archivos revisados, ${protegidos.size} correos protegidos ausentes, sin secretos.`);
}

void main();
