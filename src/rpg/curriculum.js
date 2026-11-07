// Temario de Bitlandia: el orden en el que se aprende a programar.
// Cada capítulo ocurre en una zona. Primero se aprenden sus lecciones una a una (los bugs
// salvajes de la hierba alta aparecen en este orden, y cada concepto nuevo trae su lección);
// el gimnasio del capítulo es el examen final con los retos más difíciles, y solo acepta el
// reto cuando has depurado todas las lecciones de la zona.
import { DRILLS } from '../curriculum/drills.js';

export const CHAPTERS = [
  {
    id: 'c1', n: 1, zone: 'r1', title: 'Funciones y operaciones',
    summary: 'Qué es una función, cómo recibe datos y cómo devuelve un resultado. Sumas, multiplicaciones, paréntesis y variables.',
    lessons: ['d1-fuel', 'd1-kelvin', 'd1-perimeter', 'd1-seconds'],
    exam: { trainer: 'gym1', drills: ['d1-cells', 'd1-leftover'], place: 'el Gimnasio Variable de Ciudad Byte' },
    intro: [
      'Esta es la Ruta 1. Aquí empieza tu formación como programador.',
      'Los bugs de esta hierba han roto funciones muy sencillas: sumas, multiplicaciones, cálculos de toda la vida.',
      'Vas a aprender, en orden: a usar los datos que recibe una función, a operar con números, a usar paréntesis y a guardar resultados en variables.',
      'Cuando los domines, Vera te examinará en Ciudad Byte con algo más difícil: la división entera y el resto.',
    ],
  },
  {
    id: 'c2', n: 2, zone: 'forest', title: 'Decisiones y bucles',
    summary: 'Comparar valores, decidir con if y repetir con bucles: para que el programa piense y trabaje por ti.',
    lessons: ['d2-even', 'd2-max3', 'd2-sum', 'd2-multiples'],
    exam: { trainer: 'gym2', drills: ['d2-collatz', 'd2-prime'], place: 'el Gimnasio Bucle de Ciudad Bucle' },
    intro: [
      'El Bosque Bucle. Hasta ahora tus funciones hacían siempre el mismo cálculo.',
      'Aquí aprenderás a que tomen decisiones: verdadero o falso, if y else.',
      'Y después a repetir trabajo con bucles, sin escribir lo mismo cien veces.',
      'El examen de Bruno: bucles while que no sabes cuántas vueltas darán, y salir de un bucle antes de tiempo.',
    ],
  },
  {
    id: 'c3', n: 3, zone: 'lake', title: 'Listas y colecciones',
    summary: 'Guardar muchos datos juntos y recorrerlos: sumar, buscar el mayor, contar, encontrar posiciones y darles la vuelta.',
    lessons: ['d3-sum', 'd3-max', 'd3-above', 'd3-index', 'd3-reverse'],
    exam: { trainer: 'gym3', drills: ['d3-frequent', 'd3-distinct'], place: 'el Gimnasio Índice de Pueblo Índice' },
    intro: [
      'El Lago Array. Ya sabes repetir cosas con un bucle; ahora vas a recorrer listas enteras de datos.',
      'Recuerda: las posiciones de una lista empiezan en 0.',
      'Aprenderás a sumar una lista, encontrar el mayor, contar, buscar y dar la vuelta a una lista.',
      'Ingrid te examinará con diccionarios y conjuntos: otras formas de guardar datos.',
    ],
  },
  {
    id: 'c4', n: 4, zone: 'rec', title: 'Recursión',
    summary: 'Funciones que se llaman a sí mismas: resolver un problema grande a partir de uno más pequeño.',
    lessons: ['d6-digits', 'd6-factorial', 'd6-power'],
    exam: { trainer: 'gym4', drills: ['d6-fibonacci', 'd6-gcd'], place: 'la Torre Recursiva' },
    intro: [
      'Ciudad Recursiva. Aquí las cosas se definen a partir de sí mismas.',
      'Primero desmontarás números cifra a cifra, y luego escribirás tus primeras funciones recursivas.',
      'La clave: un caso base que responde sin volver a llamarse, y un paso que acerca el problema a ese caso base.',
      'Rémi, en la Torre, te pondrá a prueba con Fibonacci y con un algoritmo de hace 2300 años.',
    ],
  },
  {
    id: 'c5', n: 5, zone: 'peak', title: 'Bits y algoritmos',
    summary: 'Cómo ve el ordenador los números por dentro y los algoritmos clásicos que usan los programadores de verdad.',
    lessons: ['d5-ring', 'd5-bits', 'd5-pow2', 'd7-sorted', 'd7-second'],
    exam: { trainer: 'boss', drills: ['d7-binary', 'd7-kadane', 'd7-insertion'], place: 'la Cueva Null' },
    intro: [
      'La Cumbre Algoritmo. Último tramo: ya sabes programar; ahora vas a pensar como una programadora o un programador.',
      'Verás cómo son los números en binario y aprenderás algoritmos que se usan en todo el mundo.',
      'Cuando estés listo, el Comandante Null te espera en la cueva con búsqueda binaria, Kadane y ordenación por inserción.',
    ],
  },
];

/** Orden completo del temario (también es el orden de la Bitdex). */
export const ORDER = CHAPTERS.flatMap((c) => [...c.lessons, ...c.exam.drills]);
export const LESSON_NO = Object.fromEntries(ORDER.map((id, i) => [id, i + 1]));
const SPEC = Object.fromEntries(DRILLS.map((d) => [d.id, d]));
export const lessonTitle = (id) => SPEC[id].teach.title;

export const chapterOf = (id) => CHAPTERS.find((c) => c.lessons.includes(id) || c.exam.drills.includes(id));
export const chapterOfZone = (zoneId) => CHAPTERS.find((c) => c.zone === zoneId);
export const chapterOfTrainer = (trainer) => CHAPTERS.find((c) => c.exam.trainer === trainer);

const solved = (g, id) => !!(g.solved && g.solved[id]);
export const pendingLessons = (g, ch) => ch.lessons.filter((id) => !solved(g, id));
/** La siguiente lección de un capítulo (null si ya están todas). */
export const nextLesson = (g, ch) => pendingLessons(g, ch)[0] || null;
/** La siguiente lección de todo el temario. */
export const nextInCourse = (g) => ORDER.find((id) => !solved(g, id)) || null;

/**
 * Bugs salvajes de una zona: si queda una lección pendiente, siempre aparece esa (así se
 * aprende en orden). Con el capítulo terminado aparecen los ya aprendidos para practicar y,
 * tras ganar el examen, también los del examen (para completar la Bitdex).
 */
export function wildPool(g, zoneId) {
  const ch = chapterOfZone(zoneId);
  if (!ch) return [];
  const next = nextLesson(g, ch);
  if (next) return [next];
  const examWon = !!(g.flags && g.flags[ch.exam.trainer === 'boss' ? 'boss' : `medal${ch.n}`]);
  return [...ch.lessons, ...(examWon ? ch.exam.drills : [])];
}

/**
 * Nivel de ayuda guiada según la experiencia: 2 = te dice exactamente qué escribir,
 * 1 = te dice qué línea cambiar y una pista, 0 = ya sabes cómo va (la pista sigue disponible).
 */
export function guideLevel(g) {
  const n = Object.keys(g.solved || {}).length;
  return n === 0 ? 2 : n < 3 ? 1 : 0;
}

/** Líneas de la solución que no están en el código inicial: lo que hay que escribir. */
export function linesToWrite(starter, solution) {
  const clean = (l) => l.trim();
  const have = new Set(starter.split('\n').map(clean));
  return solution.split('\n').filter((l) => clean(l) && !have.has(clean(l)) && !/^(\/\/|#|\/\*|\*)/.test(clean(l)));
}

/** Lecciones del mismo capítulo que van antes de un reto y aún no están aprendidas. */
export function missingBefore(g, id) {
  const ch = chapterOf(id);
  const all = [...ch.lessons, ...ch.exam.drills];
  return all.slice(0, all.indexOf(id)).filter((x) => !solved(g, x) && ch.lessons.includes(x));
}
