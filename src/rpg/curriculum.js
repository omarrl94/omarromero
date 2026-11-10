// Temario de Bitlandia: el mismo temario que CodeForge (8 módulos, de las variables a la notación
// Big O), con 43 retos pensados para este mundo (course/), en los 10 lenguajes.
// Cada capítulo ocurre en una zona. Primero se aprenden sus lecciones una a una (los bugs
// salvajes de la hierba alta aparecen en este orden y cada concepto nuevo trae su lección);
// el examen del capítulo (gimnasio, rival o jefe) tiene los retos más difíciles y solo se
// puede hacer cuando has depurado todas las lecciones de la zona.
import { byId } from './course/index.js';

export const CHAPTERS = [
  {
    id: 'c1', n: 1, zone: 'r1', title: 'Fundamentos',
    summary: 'Variables y tipos de datos, el límite de los números, funciones y operaciones: la base de todo programa.',
    lessons: ['p-ficha', 'p-hucha', 'f-golpe', 'f-cafe', 'f-experiencia', 'f-compra'],
    exam: { trainer: 'gym1', drills: ['f-cuantos', 'f-cambio'], place: 'el Gimnasio Variable de Ciudad Byte', flag: 'medal1' },
    intro: [
      'Esta es la Ruta 1. Aquí empieza tu formación como programador, desde cero.',
      'Lo primero: las variables. Cajas con nombre donde se guardan los datos, cada una de un tipo. Empezarás por la ficha de tu propio daemon.',
      'Después verás cuánto cabe en cada tipo de número, y aprenderás a escribir funciones: el daño de un ataque, lo que cura un café, lo que cuesta una compra en la tienda...',
      'Cuando lo domines todo, Vera te examinará en Ciudad Byte con la división entera y el resto: cuántos cafés te llegan y cuánto cambio te devuelven.',
    ],
  },
  {
    id: 'c2', n: 2, zone: 'forest', title: 'Control de flujo',
    summary: 'Bucles y rangos, if y else, booleanos, condiciones combinadas y while: para que el programa decida y repita trabajo por ti.',
    lessons: ['f-entreno', 'f-eficaz', 'f-turno', 'f-fuerte', 'f-curar', 'f-encuentros'],
    exam: { trainer: 'gym2', drills: ['f-turnos', 'f-primo'], place: 'el Gimnasio Bucle de Ciudad Bucle', flag: 'medal2' },
    intro: [
      'El Bosque Bucle. Hasta ahora tus programas hacían siempre lo mismo, línea a línea.',
      'Aquí aprenderás a repetir trabajo con bucles y a tomar decisiones con if: si un ataque es eficaz, a quién le toca, cuánto cura un café sin pasarse del máximo...',
      'Cuidado con el clásico error de contar una vez de más o de menos: aquí lo verás en acción.',
      'El examen de Bruno: bucles while que no sabes cuántas vueltas darán, y salir de un bucle antes de tiempo.',
    ],
  },
  {
    id: 'c3', n: 3, zone: 'lake', title: 'Estructuras de datos',
    summary: 'Listas e índices, recorrer, buscar, invertir y ordenar; diccionarios y conjuntos: guardar muchos datos juntos y trabajar con ellos.',
    lessons: ['f-equipo-vida', 'f-nivel-max', 'f-debilitados', 'f-posicion', 'f-invertir', 'f-burbuja'],
    exam: { trainer: 'gym3', drills: ['f-tipo-comun', 'f-especies'], place: 'el Gimnasio Índice de Pueblo Índice', flag: 'medal3' },
    intro: [
      'El Lago Array. Ya sabes repetir cosas; ahora vas a trabajar con listas enteras de datos.',
      'Las posiciones de una lista empiezan en 0. Lo repetiré muchas veces, porque es el error más común.',
      'Trabajarás con la lista de tu equipo: sumar sus vidas, encontrar al de mayor nivel, buscarlo, darle la vuelta y ordenarlo.',
      'Ingrid te examinará con diccionarios y conjuntos.',
    ],
  },
  {
    id: 'c4', n: 4, zone: 'oop', title: 'Programación orientada a objetos',
    summary: 'Clases, herencia y polimorfismo: modelar el mundo con objetos que tienen datos y comportamiento.',
    lessons: ['c-clase', 'c-quietos', 'c-poli'],
    exam: { trainer: 'gym4', drills: ['c-escuadron'], place: 'el Gimnasio Clase de Villa Objeto', flag: 'medal4' },
    intro: [
      'Villa Objeto. Aquí todo lo que hay en el mapa es una Pieza: tiene una posición y un método update() que el juego llama en cada turno.',
      'Una clase es el molde y un objeto es lo que sale del molde. Y una clase puede heredar de otra: Pygota es un tipo de Pieza.',
      'Aprenderás a crear clases hijas y a que cada una se mueva a su manera con el mismo método: eso es el polimorfismo.',
      'Clara te examinará con un escuadrón completo de clases.',
    ],
  },
  {
    id: 'c5', n: 5, zone: 'sys', title: 'Sistemas',
    summary: 'Memoria y concurrencia, y cómo ve el ordenador los números por dentro: turnos circulares, bits y potencias de dos.',
    lessons: ['p-centro', 'f-turno-circular'],
    exam: { trainer: 'gym5', drills: ['f-bits', 'f-potencia-dos'], place: 'el Gimnasio Núcleo de Ciudad Núcleo', flag: 'medal5' },
    intro: [
      'Ciudad Núcleo, el corazón de las máquinas de Bitlandia.',
      'En el Centro Daemon verás cómo se gestiona la memoria y cómo hacer varias tareas a la vez: curar a tres daemons al mismo tiempo.',
      'También aprenderás a dar la vuelta con el operador %, como los turnos de un combate por equipos.',
      'Kernel, el líder, te examinará con bits y potencias de dos: cómo ve el ordenador los números por dentro.',
    ],
  },
  {
    id: 'c6', n: 6, zone: 'rec', title: 'Funciones y recursión',
    summary: 'Descomponer problemas: funciones que se llaman a sí mismas para resolver un problema a partir de uno más pequeño.',
    lessons: ['f-cifras', 'f-ordenes', 'f-potencia'],
    exam: { trainer: 'gym6', drills: ['f-fibonacci', 'f-mcd'], place: 'la Torre Recursiva', flag: 'medal6' },
    intro: [
      'Ciudad Recursiva. Aquí las cosas se definen a partir de sí mismas.',
      'Primero desmontarás números cifra a cifra, y luego escribirás tus primeras funciones recursivas: ¿de cuántas formas puedes ordenar tu equipo?',
      'La clave: un caso base que responde sin volver a llamarse, y un paso que acerca el problema a ese caso base.',
      'Rémi, en la Torre, te pondrá a prueba con Fibonacci y con un algoritmo de hace 2300 años.',
    ],
  },
  {
    id: 'c7', n: 7, zone: 'peak', title: 'Algoritmos',
    summary: 'Buscar, ordenar y optimizar: los algoritmos clásicos que usan los programadores de verdad.',
    lessons: ['f-ordenado', 'f-segundo', 'f-binaria'],
    exam: { trainer: 'rival3', drills: ['f-racha', 'f-insercion'], place: 'la entrada de la Cueva Null, donde te espera Kai', flag: 'rival3' },
    intro: [
      'La Cumbre Algoritmo. Ya sabes programar; ahora vas a pensar como una programadora o un programador.',
      'Aprenderás a comprobar si un ranking está ordenado, a encontrar al segundo mejor en una sola pasada y a buscar en la Bitdex con la búsqueda binaria.',
      'Kai te espera en la entrada de la cueva para un último duelo: Kadane y la ordenación por inserción.',
    ],
  },
  {
    id: 'c8', n: 8, zone: 'cave', title: 'Jefe final: Big O',
    summary: 'La eficiencia importa: pasar de un algoritmo O(n²) a uno O(n) para vencer al Enjambre.',
    lessons: [],
    exam: { trainer: 'boss', drills: ['f-enjambre'], place: 'el fondo de la Cueva Null', flag: 'boss' },
    intro: [
      'La Cueva Null. El Comandante Null ha creado el Enjambre O(n²): un detector de clones que se vuelve lentísimo cuantos más bugs hay.',
      'Tu código no solo tiene que funcionar: tiene que ser rápido. Ahí entra la notación Big O.',
    ],
  },
];

/** Orden completo del temario (también es el orden de la Bitdex). */
export const ORDER = CHAPTERS.flatMap((c) => [...c.lessons, ...c.exam.drills]);
export const LESSON_NO = Object.fromEntries(ORDER.map((id, i) => [id, i + 1]));
export const TOTAL = ORDER.length;
/** Concepto que enseña cada nivel. */
export const lessonTitle = (id) => byId(id).concept.title;
/** Concepto y nombre del reto (los niveles de POO comparten concepto). */
export const lessonLabel = (id) => (byId(id).drill ? lessonTitle(id) : `${lessonTitle(id)}: ${byId(id).title}`);

export const chapterOf = (id) => CHAPTERS.find((c) => c.lessons.includes(id) || c.exam.drills.includes(id));
export const chapterOfZone = (zoneId) => CHAPTERS.find((c) => c.zone === zoneId);
export const chapterOfTrainer = (trainer) => CHAPTERS.find((c) => c.exam.trainer === trainer);
export const examDone = (g, ch) => !!(g.flags && g.flags[ch.exam.flag]);

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
  if (!ch || !ch.lessons.length) return [];
  const next = nextLesson(g, ch);
  if (next) return [next];
  return [...ch.lessons, ...(examDone(g, ch) ? ch.exam.drills : [])];
}

/** Lecciones del mismo capítulo que van antes de un reto y aún no están aprendidas. */
export function missingBefore(g, id) {
  const ch = chapterOf(id);
  const all = [...ch.lessons, ...ch.exam.drills];
  return all.slice(0, all.indexOf(id)).filter((x) => !solved(g, x) && ch.lessons.includes(x));
}

/**
 * Nivel de ayuda guiada según la experiencia: 2 = te dice qué cambiar y qué escribir,
 * 1 = te dice qué cambiar, 0 = ya sabes cómo va (la lección y la pista siguen disponibles).
 */
export function guideLevel(g) {
  const n = Object.keys(g.solved || {}).length;
  return n < 3 ? 2 : n < 6 ? 1 : 0;
}

/** Líneas de la solución que no están en el código inicial: lo que hay que escribir. */
export function linesToWrite(starter, solution) {
  const clean = (l) => l.trim();
  const have = new Set(starter.split('\n').map(clean));
  return solution.split('\n').filter((l) => clean(l) && !have.has(clean(l)) && !/^(\/\/|#|\/\*|\*)/.test(clean(l)) && !/^[})\]];?$/.test(clean(l)));
}
