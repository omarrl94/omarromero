/** Valida los JSON de datos con los esquemas Zod (sin red). Se ejecuta en `npm run check`. */
import { readFile } from 'node:fs/promises';
import { CandidatasSchema, EmpresasSchema } from '../shared/schemas';

async function leer(ruta: string) {
  return JSON.parse(await readFile(ruta, 'utf8'));
}

async function main() {
  let error = false;
  const empresas = EmpresasSchema.safeParse(await leer('data/empresas.json'));
  if (!empresas.success) {
    error = true;
    console.error('✖ data/empresas.json:', empresas.error.issues.slice(0, 10));
  }
  const candidatas = CandidatasSchema.safeParse(await leer('data/empresas.candidatas.json'));
  if (!candidatas.success) {
    error = true;
    console.error('✖ data/empresas.candidatas.json:', candidatas.error.issues.slice(0, 10));
  }
  const ids = new Set<string>();
  for (const c of candidatas.success ? candidatas.data : []) {
    if (ids.has(c.id)) {
      error = true;
      console.error(`✖ id de candidata duplicado: ${c.id}`);
    }
    ids.add(c.id);
  }
  const retiradas = (await leer('data/retiradas.json')) as { id?: string; dominio?: string }[];
  for (const e of empresas.success ? empresas.data : []) {
    const host = new URL(e.web).hostname.replace(/^www\./, '');
    if (retiradas.some((r) => r.id === e.id || (r.dominio && host.endsWith(r.dominio)))) {
      error = true;
      console.error(`✖ ${e.id} está retirada pero sigue en data/empresas.json`);
    }
  }
  if (error) process.exit(1);
  const n = empresas.success ? empresas.data.length : 0;
  console.log(`✔ Datos válidos: ${n} empresas verificadas, ${candidatas.success ? candidatas.data.length : 0} candidatas.`);
}

void main();
