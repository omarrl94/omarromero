// Criaturas de Bitlandia.
// · Daemons iniciales: uno por lenguaje. Tu daemon ES tu lenguaje: con él programas toda la aventura.
// · Bugs: uno por nivel de práctica. Cada bug ha corrompido una función; si la arreglas, se depura
//   y se une a tu equipo como un daemon más.
import { DRILLS } from '../curriculum/drills.js';

/** Iniciales: tres fases de evolución (niveles 1, 5 y 10). */
export const STARTERS = {
  python: {
    lang: 'python', type: 'Serpiente', names: ['Pyxi', 'Pythora', 'Serpentrix'],
    look: { body: 'long', main: '#3d7bd9', belly: '#ffd43b', accent: '#ffe98a', eyes: 'big', ears: 'none', tail: 'curl', pattern: 'spots' },
    blurb: 'Tranquila y legible. Habla casi como un humano y nunca se pierde con los números grandes.',
  },
  js: {
    lang: 'js', type: 'Chispa', names: ['Chispi', 'Voltajs', 'Asincronox'],
    look: { body: 'round', main: '#f0db4f', belly: '#fff6c4', accent: '#323330', eyes: 'big', ears: 'long', tail: 'zap', pattern: 'none' },
    blurb: 'Vive en todos los navegadores. Rápida y algo traviesa: a veces suma texto con números.',
  },
  java: {
    lang: 'java', type: 'Gólem', names: ['Cafeto', 'Javalem', 'Bytecoloso'],
    look: { body: 'tall', main: '#b0713a', belly: '#f6d6a8', accent: '#f89820', eyes: 'sleepy', ears: 'horns', tail: 'none', pattern: 'stripes' },
    blurb: 'Fuerte y ordenado. Todo lo guarda en clases y siempre declara de qué tipo es cada cosa.',
  },
  csharp: {
    lang: 'csharp', type: 'Zorro', names: ['Notín', 'Sharpino', 'Sinfonix'],
    look: { body: 'round', main: '#9b4f96', belly: '#e9c8ec', accent: '#68217a', eyes: 'big', ears: 'cat', tail: 'flame', pattern: 'none' },
    blurb: 'Elegante y versátil. Afina sus ataques con tipos estrictos y un compás impecable.',
  },
  kotlin: {
    lang: 'kotlin', type: 'Felino', names: ['Kotti', 'Kotlince', 'Corrutigre'],
    look: { body: 'round', main: '#a97bff', belly: '#f1e6ff', accent: '#f88909', eyes: 'big', ears: 'cat', tail: 'curl', pattern: 'stripes' },
    blurb: 'Ágil y sin ceremonias. Se mueve entre tareas a la vez sin despeinarse.',
  },
  swift: {
    lang: 'swift', type: 'Ave', names: ['Vencejo', 'Swiftero', 'Halcónix'],
    look: { body: 'bird', main: '#f05138', belly: '#ffd2c4', accent: '#ffb534', eyes: 'angry', ears: 'fin', tail: 'spiky', pattern: 'none' },
    blurb: 'Veloz y segura. Prefiere detenerse antes que dar un resultado equivocado.',
  },
  c: {
    lang: 'c', type: 'Robot', names: ['Punterín', 'Mallocón', 'Kernelord'],
    look: { body: 'tall', main: '#5c6bc0', belly: '#c5cae9', accent: '#22e4ff', eyes: 'one', ears: 'antenna', tail: 'none', pattern: 'circuit' },
    blurb: 'El veterano. Toca la memoria con sus propias manos: poderoso, pero no perdona descuidos.',
  },
  cpp: {
    lang: 'cpp', type: 'Gemelo', names: ['Duplín', 'Plusplasma', 'Templatrón'],
    look: { body: 'blob', main: '#00599c', belly: '#9ecbf0', accent: '#ff3df0', eyes: 'big', ears: 'antenna', tail: 'spiky', pattern: 'circuit' },
    blurb: 'Hermano de Punterín con mil herramientas extra. Muy rápido si sabes manejarlo.',
  },
  go: {
    lang: 'go', type: 'Topo', names: ['Topín', 'Gorrutín', 'Concurrentopo'],
    look: { body: 'blob', main: '#00add8', belly: '#d4f6ff', accent: '#5dc9e2', eyes: 'big', ears: 'cat', tail: 'none', pattern: 'spots' },
    blurb: 'Sencillo y trabajador. Cava túneles en paralelo con sus amigos y nunca se estorban.',
  },
  rust: {
    lang: 'rust', type: 'Armadillo', names: ['Oxidín', 'Prestadillo', 'Armadurox'],
    look: { body: 'round', main: '#ce422b', belly: '#f7c6a3', accent: '#3b2a24', eyes: 'angry', ears: 'horns', tail: 'spiky', pattern: 'stripes' },
    blurb: 'Su caparazón le protege de los errores de memoria. Exigente, pero nunca se rompe.',
  },
};

export const EVOLVE_AT = [5, 10];
export const stageOf = (level) => (level >= EVOLVE_AT[1] ? 2 : level >= EVOLVE_AT[0] ? 1 : 0);

/** Un bug por nivel de práctica: nombre, tipo y entrada de la Bitdex. */
const BUG_INFO = {
  'd1-fuel': ['Multiplaga', 'Aritmético', 'Se alimenta de multiplicaciones a medio hacer. Si le pides el doble, te da la mitad.'],
  'd1-kelvin': ['Termita', 'Aritmético', 'Roe los termómetros de Bitlandia y se olvida siempre de sumar 273.'],
  'd1-perimeter': ['Vallarácnido', 'Aritmético', 'Teje vallas sin paréntesis: por eso nunca le salen las cuentas del perímetro.'],
  'd1-seconds': ['Relojín', 'Aritmético', 'Vive dentro de los relojes. Cree que un minuto tiene 100 segundos.'],
  'd1-cells': ['Partícula', 'Aritmético', 'Parte las cosas en trozos con decimales, aunque no se puedan partir.'],
  'd1-leftover': ['Restojo', 'Aritmético', 'Colecciona lo que sobra de las divisiones. Le encanta el operador %.'],
  'd2-even': ['Parimpar', 'Condición', 'Tiene dos cabezas que nunca se ponen de acuerdo sobre si un número es par.'],
  'd2-max3': ['Mandamás', 'Condición', 'Siempre quiere ser el más grande de tres, aunque no lo sea.'],
  'd2-sum': ['Acumulón', 'Bucle', 'Va sumando todo lo que encuentra, pero se salta el último número.'],
  'd2-multiples': ['Radarcito', 'Bucle', 'Sus antenas cuentan múltiplos. Si se despista, cuenta el cero también.'],
  'd2-collatz': ['Caoticol', 'Bucle', 'Salta sin parar: si es par se divide, si es impar se triplica. ¿Llegará algún día al 1?'],
  'd2-prime': ['Primordio', 'Bucle', 'Solo respeta a los números que nadie puede dividir.'],
  'd3-sum': ['Cargamento', 'Lista', 'Arrastra una lista de pesos y nunca sabe cuánto lleva en total.'],
  'd3-max': ['Pesadón', 'Lista', 'Busca el elemento más pesado... y a veces se queda con el primero que ve.'],
  'd3-above': ['Alarmón', 'Lista', 'Suena cada vez que un valor supera el límite. Si no lo arreglas, suena siempre.'],
  'd3-index': ['Buscaíndex', 'Lista', 'Encuentra cosas, pero olvida que las posiciones empiezan en 0.'],
  'd3-reverse': ['Espejón', 'Lista', 'Da la vuelta a las listas... cuando no se tropieza con el centro.'],
  'd3-frequent': ['Ecozumbido', 'Diccionario', 'Repite el valor que más se oye. Vive en los diccionarios.'],
  'd3-distinct': ['Censalino', 'Conjunto', 'Cuenta especies distintas, pero a los gemelos los cuenta dos veces.'],
  'd5-ring': ['Anillón', 'Sistema', 'Da vueltas y vueltas en un buffer circular. Cuando llega al final, vuelve al principio.'],
  'd5-bits': ['Bitácaro', 'Sistema', 'Diminuto. Solo ve unos y ceros, y quiere contarlos todos.'],
  'd5-pow2': ['Potenciota', 'Sistema', 'Crece duplicándose: 1, 2, 4, 8... hasta no caber en la memoria.'],
  'd6-factorial': ['Factorón', 'Recursión', 'Se llama a sí mismo una y otra vez. Sin caso base, nunca para.'],
  'd6-fibonacci': ['Espiralis', 'Recursión', 'Su concha crece siguiendo la sucesión de Fibonacci.'],
  'd6-power': ['Amplificón', 'Recursión', 'Eleva todo a la potencia que le pidas, multiplicando paso a paso.'],
  'd6-digits': ['Digitón', 'Recursión', 'Desmonta los números cifra a cifra con / y %.'],
  'd6-gcd': ['Euclidón', 'Recursión', 'Un sabio muy antiguo. Encuentra el divisor común de cualquier pareja.'],
  'd7-sorted': ['Inspectrón', 'Algoritmo', 'Revisa las colas y grita si alguien está fuera de orden.'],
  'd7-binary': ['Bisectón', 'Algoritmo', 'Corta el problema por la mitad cada vez. Encuentra cualquier cosa en una lista ordenada.'],
  'd7-second': ['Subcampeón', 'Algoritmo', 'Nunca gana, siempre queda segundo. Y lo lleva fatal.'],
  'd7-kadane': ['Rachón', 'Algoritmo', 'Busca la mejor racha de una lista. Olvida el pasado en cuanto le perjudica.'],
  'd7-insertion': ['Insertix', 'Algoritmo', 'Ordena como quien ordena cartas: coge una y la inserta en su sitio.'],
};

const TYPE_COLOR = {
  Aritmético: '#ffb534', Condición: '#22e4ff', Bucle: '#a3ff3d', Lista: '#9d7bff', Diccionario: '#ff7ab6',
  Conjunto: '#5eead4', Sistema: '#94a3b8', Recursión: '#ff3df0', Algoritmo: '#ff4767',
};
export const typeColor = (t) => TYPE_COLOR[t] || '#cbd5e1';

// Generador determinista de rasgos a partir del id.
function rng(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const hsl = (h, s, l) => `hsl(${Math.round(h)} ${s}% ${l}%)`;

function bugLook(id, type) {
  const r = rng(id);
  const base = { Aritmético: 35, Condición: 190, Bucle: 95, Lista: 260, Diccionario: 330, Conjunto: 170, Sistema: 215, Recursión: 300, Algoritmo: 355 }[type] ?? r() * 360;
  const h = base + (r() - 0.5) * 50;
  return {
    body: pick(r, ['round', 'blob', 'tall', 'long', 'bug', 'bug']),
    main: hsl(h, 55 + r() * 25, 48 + r() * 10),
    belly: hsl(h + 20, 70, 82),
    accent: hsl(h + 150 + r() * 60, 80, 60),
    eyes: pick(r, ['big', 'angry', 'one', 'sleepy', 'many']),
    ears: pick(r, ['antenna', 'antenna', 'horns', 'long', 'fin', 'none']),
    tail: pick(r, ['none', 'spiky', 'zap', 'curl', 'stinger']),
    pattern: pick(r, ['spots', 'stripes', 'circuit', 'none']),
    legs: r() < 0.6,
  };
}

export const BUGS = DRILLS.map((d, i) => {
  const [name, type, entry] = BUG_INFO[d.id];
  return { id: d.id, dex: i + 1, name, type, entry, module: d.module, xp: d.xp, look: bugLook(d.id, type) };
});
export const BUG = Object.fromEntries(BUGS.map((b) => [b.id, b]));

/** Nombre visible de un daemon del equipo. */
export function daemonName(m) {
  if (m.nick) return m.nick;
  if (m.kind === 'starter') return STARTERS[m.species].names[stageOf(m.level)];
  return BUG[m.species].name;
}
export function daemonLook(m) {
  if (m.kind === 'starter') return { ...STARTERS[m.species].look, stage: stageOf(m.level) };
  return { ...BUG[m.species].look, stage: 0 };
}
export function daemonType(m) {
  return m.kind === 'starter' ? STARTERS[m.species].type : BUG[m.species].type;
}

// ───── Niveles y vida ─────
export const xpToNext = (level) => 40 + level * 30;
export const maxHpOf = (level) => 26 + level * 6;
