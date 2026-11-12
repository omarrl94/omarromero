// Valida todo /content con Zod. Falla el build si algo no cumple el contrato.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  DistritoSchema, IaTramposaSchema, TeoriaSchema, ItemSchema, LibraryDocSchema, NormaFileSchema, RaFileSchema,
} from '../src/data/schemas';

const raiz = join(import.meta.dirname, '..', 'content');
const errores: string[] = [];
let n = 0;

function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? ficheros(p) : p.endsWith('.json') ? [p] : [];
  });
}
function esquemaPara(ruta: string): z.ZodTypeAny | null {
  const r = ruta.replace(raiz, '').replaceAll('\\', '/');
  if (r.startsWith('/ra/')) return RaFileSchema;
  if (r.startsWith('/teoria/')) return TeoriaSchema;
  if (r.startsWith('/norma/')) return NormaFileSchema;
  if (r.startsWith('/library/')) return LibraryDocSchema;
  if (r.startsWith('/ia-tramposa/')) return IaTramposaSchema;
  if (r.endsWith('/distrito.json')) return DistritoSchema;
  if (/\/d[1-8]\/.*\.json$/.test(r)) return ItemSchema;
  return null; // epilogo, etc.
}

for (const f of ficheros(raiz)) {
  const esq = esquemaPara(f);
  if (!esq) continue;
  n++;
  const r = esq.safeParse(JSON.parse(readFileSync(f, 'utf8')));
  if (!r.success) errores.push(`${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
}

// Los pesos de RA deben sumar 1.
const ra = RaFileSchema.parse(JSON.parse(readFileSync(join(raiz, 'ra', 'ra.json'), 'utf8')));
const suma = ra.ras.reduce((s, x) => s + x.peso, 0);
if (Math.abs(suma - 1) > 1e-9) errores.push(`Los pesos de RA suman ${suma}, no 1`);

if (errores.length) {
  console.error(errores.join('\n'));
  process.exit(1);
}
console.log(`Contenido válido: ${n} ficheros.`);
