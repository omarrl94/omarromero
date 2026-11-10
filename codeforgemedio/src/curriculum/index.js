// Currículo de CodeForge Medio: 6 módulos pensados para empezar desde cero.
// Cada módulo mezcla misiones con escena propia (la nave, los drones, la bodega),
// programas cortos que escriben en la pantalla y niveles de práctica con casos de prueba.
import m1 from './m1-fundamentals.js';
import m2 from './m2-control-flow.js';
import m3 from './m3-data-structures.js';
import jsPack from './js-pack.js';
import { DRILL_CHALLENGES } from './drill-challenges.js';
import { PROGRAMS } from './programs.js';

export const PACKS = [jsPack];

const [worldLaws] = m1;
const [patrol, zigzag] = m2;
const [sortCargo] = m3;
const drill = (id) => DRILL_CHALLENGES.find((d) => d.id === id);
const drills = (...ids) => ids.map(drill);
const P = PROGRAMS;

export const MODULES = [
  { id: 1, name: 'Primeros Pasos', subtitle: 'Escribir en pantalla, variables y cálculos', icon: 'Atom', color: '#22e4ff', challenges: [P['p1-hola'], P['p1-variables'], P['p1-calculo'], P['p1-cambiar'], P['p1-texto'], worldLaws] },
  { id: 2, name: 'Funciones', subtitle: 'Máquinas con nombre que calculan por ti', icon: 'Sigma', color: '#7fffd4', challenges: drills('fn-combustible', 'fn-kelvin', 'fn-perimetro', 'fn-segundos', 'fn-reparto', 'fn-sobrante') },
  { id: 3, name: 'Decisiones', subtitle: 'if y else: programas que eligen', icon: 'Route', color: '#a3ff3d', challenges: [P['p3-puerta'], ...drills('if-adulto', 'if-par', 'if-entrada', 'if-mayor3', 'if-despegue')] },
  { id: 4, name: 'Bucles', subtitle: 'Repetir sin cansarse', icon: 'Binary', color: '#ffb534', challenges: [patrol, P['p4-cuenta'], drill('loop-suma'), zigzag, drill('loop-multiplos'), drill('loop-mitades')] },
  { id: 5, name: 'Listas', subtitle: 'Muchos datos en fila', icon: 'Boxes', color: '#9d7bff', challenges: [P['p5-mochila'], ...drills('list-suma', 'list-max', 'list-contar', 'list-buscar'), sortCargo] },
  { id: 6, name: 'Reto Final', subtitle: 'El Guardián FizzBuzz', icon: 'Skull', color: '#ff4767', challenges: [P['reto-fizzbuzz']], boss: true },
];

for (const m of MODULES) for (const c of m.challenges) c.module = m.id;

export const CHALLENGES = MODULES.flatMap((m) => m.challenges);

// Paquete de JavaScript: las misiones heredadas reciben su versión en ese lenguaje.
const asMap = (x) => (typeof x === 'string' ? { default: x } : { ...x });
for (const pack of PACKS) {
  for (const ch of CHALLENGES) {
    const m = pack.missions[ch.id];
    if (!m) continue;
    ch.starter[pack.lang] = m.starter;
    ch.solution[pack.lang] = m.solution;
    ch.polyglot[pack.lang] = m.polyglot;
    if (pack.objective && pack.objective[ch.id]) ch.objective = { ...asMap(ch.objective), [pack.lang]: pack.objective[ch.id] };
    if (pack.story && pack.story[ch.id]) ch.story = { ...asMap(ch.story), [pack.lang]: pack.story[ch.id] };
  }
}

export const byId = (id) => CHALLENGES.find((c) => c.id === id);

export const modeOf = (ch, lang) => (typeof ch.mode === 'function' ? ch.mode(lang) : ch.mode);
export const sceneOf = (ch, lang) => (typeof ch.scene === 'function' ? ch.scene(lang) : ch.scene);
export const objectiveOf = (ch, lang) => (typeof ch.objective === 'string' ? ch.objective : ch.objective[lang] || ch.objective.default);
export const storyOf = (ch, lang) => (typeof ch.story === 'string' ? ch.story : ch.story[lang] || ch.story.default);
