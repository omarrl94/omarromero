/**
 * Comprueba el equilibrio del cuestionario.
 *
 * Cada dimension debe poder alcanzar un maximo comparable al de las demas. Si
 * una se queda corta, las familias que dependen de ella no pueden salir nunca
 * las primeras por muy bien que responda el estudiante: el instrumento tiene un
 * techo antes que una opinion. Se comprueba tambien que ninguna etiqueta de
 * afinidad quede huerfana (declarada en un ciclo pero inalcanzable en el test).
 *
 * Uso:  node scripts/check-balance.mjs
 * Devuelve codigo 1 si algo se descuelga, para poder usarlo en CI.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'orientafp-balance-'));

// El dataset esta en TypeScript: se compila a un modulo temporal para leerlo.
const entrada = join(tmp, 'entrada.ts');
writeFileSync(
  entrada,
  `export { PREGUNTAS } from ${JSON.stringify(join(raiz, 'src/data/questions'))};
   export { CICLOS, FAMILIAS } from ${JSON.stringify(join(raiz, 'src/data/fpData'))};
   export { DIMENSIONES } from ${JSON.stringify(join(raiz, 'src/lib/scoring'))};
   export { MERCADO } from ${JSON.stringify(join(raiz, 'src/data/mercadoLaboral'))};
   export { ARQUETIPOS } from ${JSON.stringify(join(raiz, 'src/utils/archetypes'))};`,
);
const salida = join(tmp, 'salida.mjs');
execFileSync(
  'npx',
  ['esbuild', entrada, '--bundle', '--platform=node', '--format=esm', `--outfile=${salida}`, '--log-level=error'],
  { cwd: raiz, stdio: 'inherit' },
);

const { PREGUNTAS, CICLOS, FAMILIAS, DIMENSIONES, MERCADO, ARQUETIPOS } = await import(`file://${salida}`);

/** Tolerancia: la dimension mas floja no debe bajar del 55 % de la mas fuerte. */
const RATIO_MINIMO = 0.55;

let fallos = 0;

// ---- 1. Maximo alcanzable por dimension ----
const maximos = Object.fromEntries(DIMENSIONES.map((d) => [d, 0]));
for (const p of PREGUNTAS) {
  for (const d of DIMENSIONES) {
    maximos[d] += Math.max(0, ...p.opciones.map((o) => o.pesos?.[d] ?? 0));
  }
}
const valores = DIMENSIONES.map((d) => maximos[d]);
const techo = Math.max(...valores);
const suelo = Math.min(...valores);

console.log('Máximo alcanzable por dimensión');
for (const d of [...DIMENSIONES].sort((a, b) => maximos[b] - maximos[a])) {
  const ratio = maximos[d] / techo;
  const marca = ratio < RATIO_MINIMO ? '  <-- se descuelga' : '';
  console.log(`  ${d.padEnd(14)} ${String(maximos[d]).padStart(3)}  (${Math.round(ratio * 100)}% del techo)${marca}`);
  if (ratio < RATIO_MINIMO) fallos++;
}
console.log(`  ratio suelo/techo: ${(suelo / techo).toFixed(2)} (mínimo aceptado ${RATIO_MINIMO})\n`);

// ---- 2. Etiquetas: las de los ciclos deben ser alcanzables en el test ----
const tagsTest = new Set(PREGUNTAS.flatMap((p) => p.opciones.flatMap((o) => o.tags ?? [])));
const tagsCiclos = new Set(CICLOS.flatMap((c) => c.tagsAfinidad ?? []));

const huerfanas = [...tagsCiclos].filter((t) => !tagsTest.has(t));
const inutiles = [...tagsTest].filter((t) => !tagsCiclos.has(t));

if (huerfanas.length) {
  console.log(`Etiquetas usadas en ciclos pero inalcanzables en el test: ${huerfanas.join(', ')}`);
  fallos++;
} else {
  console.log('Todas las etiquetas de los ciclos son alcanzables desde el test.');
}
if (inutiles.length) {
  console.log(`Aviso: etiquetas que el test puntúa y ningún ciclo usa: ${inutiles.join(', ')}`);
}

// ---- 3. Cada familia debe tener al menos un ciclo ----
for (const f of FAMILIAS) {
  const n = CICLOS.filter((c) => c.familia === f.id).length;
  if (n === 0) {
    console.log(`La familia "${f.nombre}" no tiene ningún ciclo.`);
    fallos++;
  }
}

// ---- 4. Estructura del cuestionario ----
for (const p of PREGUNTAS) {
  if (p.opciones.length !== 4) {
    console.log(`La pregunta ${p.id} tiene ${p.opciones.length} opciones (se esperan 4).`);
    fallos++;
  }
  for (const o of p.opciones) {
    if (!o.pesos && !o.metas) {
      console.log(`La opción ${p.id}.${o.id} no aporta ni dimensiones ni metas.`);
      fallos++;
    }
  }
}

// ---- 5. Datos de mercado: cobertura y coherencia ----
const sinMercado = CICLOS.filter((c) => !MERCADO[c.id]).map((c) => c.id);
if (sinMercado.length) {
  console.log(`\nCiclos sin datos de mercado (saldrían con "—" en el comparador): ${sinMercado.join(', ')}`);
  fallos++;
} else {
  console.log(`\nLos ${CICLOS.length} ciclos tienen datos de mercado.`);
}

const idsCiclos = new Set(CICLOS.map((c) => c.id));
const mercadoHuerfano = Object.keys(MERCADO).filter((id) => !idsCiclos.has(id));
if (mercadoHuerfano.length) {
  console.log(`Datos de mercado de ciclos que ya no existen: ${mercadoHuerfano.join(', ')}`);
  fallos++;
}

for (const [id, m] of Object.entries(MERCADO)) {
  if (m.salarioMin > m.salarioMax) {
    console.log(`${id}: el salario mínimo supera al máximo.`);
    fallos++;
  }
  if (m.insercion < 0 || m.insercion > 100) {
    console.log(`${id}: inserción fuera de rango (${m.insercion}).`);
    fallos++;
  }
  for (const campo of ['cargaLogica', 'cargaPractica']) {
    if (m[campo] < 1 || m[campo] > 5) {
      console.log(`${id}: ${campo} fuera de la escala 1-5 (${m[campo]}).`);
      fallos++;
    }
  }
  if (!Array.isArray(m.modalidades) || m.modalidades.length === 0) {
    console.log(`${id}: no declara ninguna modalidad.`);
    fallos++;
  }
}

// ---- 6. Arquetipos: cada uno debe poder ganar con algún perfil ----
const familiasCubiertas = new Set(ARQUETIPOS.flatMap((a) => a.familias));
const familiasSinArquetipo = FAMILIAS.filter((f) => !familiasCubiertas.has(f.id)).map((f) => f.id);
if (familiasSinArquetipo.length) {
  console.log(`Familias que ningún arquetipo reclama: ${familiasSinArquetipo.join(', ')}`);
  fallos++;
} else {
  console.log(`Los ${ARQUETIPOS.length} arquetipos cubren las ${FAMILIAS.length} familias.`);
}

rmSync(tmp, { recursive: true, force: true });

console.log(
  fallos === 0
    ? `\nEquilibrio correcto: ${PREGUNTAS.length} preguntas, ${CICLOS.length} ciclos, ${FAMILIAS.length} familias.`
    : `\n${fallos} problema(s) de equilibrio.`,
);
process.exit(fallos === 0 ? 0 : 1);
