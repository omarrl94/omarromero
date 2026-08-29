/**
 * Valida el algoritmo contra perfiles arquetípicos.
 *
 * Cada persona responde las 20 preguntas de forma coherente con un perfil que
 * cualquier orientador reconoceria, y se comprueba que el algoritmo llega a la
 * familia esperada. Es la red de seguridad al tocar pesos, preguntas o el
 * dataset: un cambio que parece inocente puede desplazar una familia entera.
 *
 * Uso:  node scripts/check-personas.mjs
 * Devuelve codigo 1 si alguna persona no aterriza donde debe.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'orientafp-personas-'));
const entrada = join(tmp, 'entrada.ts');
writeFileSync(
  entrada,
  `export { calcularResultado } from ${JSON.stringify(join(raiz, 'src/lib/scoring'))};
   export { PREGUNTAS } from ${JSON.stringify(join(raiz, 'src/data/questions'))};
   export { CICLOS, FAMILIAS } from ${JSON.stringify(join(raiz, 'src/data/fpData'))};`,
);
const salida = join(tmp, 'salida.mjs');
execFileSync(
  'npx',
  ['esbuild', entrada, '--bundle', '--platform=node', '--format=esm', `--outfile=${salida}`, '--log-level=error'],
  { cwd: raiz, stdio: 'inherit' },
);
const { calcularResultado, PREGUNTAS, CICLOS, FAMILIAS } = await import(`file://${salida}`);

/** Convierte "bacdb..." en el objeto de respuestas { q1: 'b', q2: 'a', ... }. */
const responder = (clave) =>
  Object.fromEntries(clave.split('').map((letra, i) => [`q${i + 1}`, letra]));

const PERSONAS = [
  {
    nombre: 'Programador: lógica, pantalla, trabajo autónomo',
    situacion: 'conBachillerato',
    espera: ['informatica'],
    clave: 'babcbabdbcaabdccbbdb',
  },
  {
    nombre: 'Vocación sanitaria: cuidado con método',
    situacion: 'conEso',
    espera: ['sanidad'],
    clave: 'bcddcdaaabbdadaabcca',
  },
  {
    nombre: 'Manos y máquinas: taller e industria',
    situacion: 'conEso',
    espera: ['mecanica', 'automocion', 'electricidad'],
    clave: 'abaabcddddaddbcaadca',
  },
  {
    nombre: 'Apasionado del motor',
    situacion: 'conEso',
    espera: ['mecanica', 'automocion'],
    clave: 'abaabcdddddddbcaadba',
    // Las etiquetas son lo unico que separa Automocion de Fabricacion Mecanica:
    // sus perfiles por dimensiones son casi identicos.
    cicloContiene: ['Vehículos', 'Automoción'],
  },
  {
    nombre: 'Creativo audiovisual',
    situacion: 'conBachillerato',
    espera: ['imagen'],
    clave: 'dcccdbbbccccbcbcbbdc',
  },
  {
    nombre: 'Perfil organizativo de oficina',
    situacion: 'conBachillerato',
    espera: ['administracion', 'comercio'],
    clave: 'caabaabcbaadadddbcdc',
  },
  {
    nombre: 'Vocación social: acompañar personas',
    situacion: 'conEso',
    espera: ['sociocultural', 'sanidad'],
    clave: 'cdddddacabbdccaaacca',
  },
  {
    nombre: 'Deportista: movimiento y grupo',
    situacion: 'conBachillerato',
    espera: ['deportes'],
    clave: 'cdadddcaddddcaaaaaaa',
  },
  {
    nombre: 'Cocina y hostelería',
    situacion: 'conEso',
    espera: ['hosteleria'],
    clave: 'adacdccdabccdcaaddaa',
  },
  {
    nombre: 'Sin la ESO, manos y trabajar ya',
    situacion: 'sinEso',
    espera: null, // aquí lo que se comprueba es el grado, no la familia
    clave: 'abaabcdddddddbcaadca',
    gradoEsperado: 'basico',
  },
];

let fallos = 0;

// ---- Integridad del dataset ----
const ids = CICLOS.map((c) => c.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) {
  console.log('ids de ciclo duplicados:', dup);
  fallos++;
}
for (const c of CICLOS) {
  const vacios = ['habilidadesClave', 'salidasLaborales', 'perfilIdeal', 'tagsAfinidad', 'asignaturasTipicas']
    .filter((campo) => !Array.isArray(c[campo]) || c[campo].length === 0);
  if (vacios.length) {
    console.log(`El ciclo ${c.id} tiene campos vacíos: ${vacios.join(', ')}`);
    fallos++;
  }
  if (!c.continuidad || !Array.isArray(c.continuidad.especializacion)) {
    console.log(`El ciclo ${c.id} no declara continuidad.`);
    fallos++;
  }
}

console.log(`Dataset: ${CICLOS.length} ciclos, ${FAMILIAS.length} familias, ${PREGUNTAS.length} preguntas\n`);

// ---- Personas ----
for (const p of PERSONAS) {
  if (p.clave.length !== PREGUNTAS.length) {
    console.log(`MAL  ${p.nombre}: la clave tiene ${p.clave.length} respuestas, se esperan ${PREGUNTAS.length}`);
    fallos++;
    continue;
  }

  const res = calcularResultado(p.situacion, responder(p.clave));
  const top = res.familias[0];
  const top3 = res.familias.slice(0, 3);

  let ok = true;
  const notas = [];

  if (p.espera && !p.espera.includes(top.familia.id)) {
    ok = false;
    notas.push(`esperaba ${p.espera.join(' o ')}, salió ${top.familia.id}`);
  }
  if (p.gradoEsperado && res.gradoSugerido !== p.gradoEsperado) {
    ok = false;
    notas.push(`grado ${res.gradoSugerido}, se esperaba ${p.gradoEsperado}`);
  }
  if (p.cicloContiene) {
    const primeros = res.ciclos.slice(0, 3).map((c) => c.ciclo.nombre).join(' | ');
    if (!p.cicloContiene.some((frag) => primeros.includes(frag))) {
      ok = false;
      notas.push(`ningún ciclo de "${p.cicloContiene.join('/')}" en el top 3`);
    }
  }
  if (p.gradoEsperado && !res.ciclos.slice(0, 3).some((c) => c.ciclo.grado === p.gradoEsperado)) {
    ok = false;
    notas.push(`ningún ciclo de grado ${p.gradoEsperado} en el top 3`);
  }

  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'MAL '} ${p.nombre}`);
  console.log(`     top3: ${top3.map((f) => `${f.familia.id} ${f.afinidad}%`).join(' | ')}`);
  console.log(`     grado: ${res.gradoSugerido} · ciclos: ${res.ciclos.slice(0, 3).map((c) => `${c.ciclo.nombre} (${c.encaje}%)`).join(' · ')}`);
  if (notas.length) console.log(`     -> ${notas.join('; ')}`);
  console.log();
}

// ---- El test vacío no debe reventar ----
const vacio = calcularResultado('explorar', {});
if (!vacio?.familias?.length) {
  console.log('Un test sin respuestas no devuelve resultado.');
  fallos++;
}

rmSync(tmp, { recursive: true, force: true });
console.log(fallos === 0 ? 'Todas las personas aterrizan donde deben.' : `${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
