// El curso de Bitlandia: los retos del juego, en orden, con sus lecciones.
// Mismo temario que CodeForge (variables, control de flujo, estructuras de datos, POO,
// sistemas, recursión, algoritmos y Big O), con retos pensados para este mundo.
import { FUNCTION_LEVELS, BOSS_LEVEL } from './functions.js';
import { buildFunctionLevel, buildBossLevel, lessonOf } from './build.js';
import { OOP_LEVELS_SPEC, buildOopLevel, oopLesson } from './oop.js';
import { FICHA, FICHA_LESSON, HUCHA, HUCHA_LESSON, CENTRO, CENTRO_LESSON } from './programs.js';

/** Capítulo de cada reto (lo usa la dificultad de los combates). */
export const CHAPTER_OF = {};
const assign = (n, ids) => ids.forEach((id) => { CHAPTER_OF[id] = n; });
assign(1, ['p-ficha', 'p-hucha', 'f-golpe', 'f-cafe', 'f-experiencia', 'f-compra', 'f-cuantos', 'f-cambio']);
assign(2, ['f-entreno', 'f-eficaz', 'f-turno', 'f-fuerte', 'f-curar', 'f-encuentros', 'f-turnos', 'f-primo']);
assign(3, ['f-equipo-vida', 'f-nivel-max', 'f-debilitados', 'f-posicion', 'f-invertir', 'f-burbuja', 'f-tipo-comun', 'f-especies']);
assign(4, ['c-clase', 'c-quietos', 'c-poli', 'c-escuadron']);
assign(5, ['p-centro', 'f-turno-circular', 'f-bits', 'f-potencia-dos']);
assign(6, ['f-cifras', 'f-ordenes', 'f-potencia', 'f-fibonacci', 'f-mcd']);
assign(7, ['f-ordenado', 'f-segundo', 'f-binaria', 'f-racha', 'f-insercion']);
assign(8, ['f-enjambre']);

export const COURSE = [
  { ...FICHA, module: 1 },
  { ...HUCHA, module: 1 },
  ...FUNCTION_LEVELS.map((s) => buildFunctionLevel(s, CHAPTER_OF[s.id])),
  ...OOP_LEVELS_SPEC.map((L) => buildOopLevel(L, 4)),
  { ...CENTRO, module: 5 },
  buildBossLevel(BOSS_LEVEL, 8),
];

export const LESSONS = {
  'p-ficha': FICHA_LESSON,
  'p-hucha': HUCHA_LESSON,
  'p-centro': CENTRO_LESSON,
  ...Object.fromEntries(FUNCTION_LEVELS.map((s) => [s.id, lessonOf(s)])),
  ...Object.fromEntries(OOP_LEVELS_SPEC.map((L) => [L.id, oopLesson(L)])),
  [BOSS_LEVEL.id]: lessonOf(BOSS_LEVEL),
};

const BY_ID = Object.fromEntries(COURSE.map((c) => [c.id, c]));
export const byId = (id) => BY_ID[id];
const pick = (x, lang) => (typeof x === 'string' ? x : x[lang] || x.default);
export const objectiveOf = (ch, lang) => pick(ch.objective, lang);
export const storyOf = (ch, lang) => pick(ch.story, lang);
/** Pasos de una lección visibles en un lenguaje (algunos pasos son solo para ciertos lenguajes). */
export const lessonSteps = (id, lang) => (LESSONS[id] ? LESSONS[id].steps.filter((s) => !s.langs || s.langs.includes(lang)) : []);
