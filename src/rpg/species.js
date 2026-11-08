// Criaturas de Bitlandia.
// · Daemons iniciales: uno por lenguaje. Tu daemon ES tu lenguaje: con él programas toda la aventura.
// · Bugs: uno por nivel de práctica. Cada bug ha corrompido una función; si la arreglas, se depura
//   y puede unirse a tu equipo.
// Sprites: pack «Ninja Adventure» (Pixel-boy & AAA, CC0).
import { byId } from '../curriculum/index.js';
import { ORDER, chapterOf } from './curriculum.js';

const mon = (key) => ({ kind: 'mon', key });
const boss = (key) => ({ kind: 'boss', key });

/** Iniciales: tres fases de evolución (niveles 1, 5 y 10). */
export const STARTERS = {
  python: { lang: 'python', type: 'Gelatina', names: ['Pygota', 'Pyctopus', 'Pythogel'], sprites: [mon('Slime3'), mon('Octopus2'), boss('GiantSlime')],
    blurb: 'Tranquila y fácil de entender. Habla casi como un humano y nunca se pierde con los números grandes.' },
  js: { lang: 'js', type: 'Mapache', names: ['Mapachís', 'Voltapache', 'Asincronox'], sprites: [mon('GoldRacoon'), mon('Racoon'), boss('GiantRacoonGold')],
    blurb: 'Vive en todos los navegadores. Rápido y algo travieso: a veces suma texto con números.' },
  java: { lang: 'java', type: 'Bambú', names: ['Cafeto', 'Javadrako', 'Bytecoloso'], sprites: [mon('BambooYellow'), mon('DragonYellow'), boss('GiantBamboo2')],
    blurb: 'Fuerte y ordenado. Todo lo guarda en clases y siempre declara de qué tipo es cada cosa.' },
  csharp: { lang: 'csharp', type: 'Alado', names: ['Notín', 'Sharpiala', 'Sinfonix'], sprites: [mon('ButterflyBlue'), mon('BlueBat'), boss('TenguBlue')],
    blurb: 'Elegante y versátil. Afina sus ataques con tipos estrictos y un compás impecable.' },
  kotlin: { lang: 'kotlin', type: 'Llama', names: ['Kotllama', 'Kotfuego', 'Corrutinferno'], sprites: [mon('Flam'), mon('Spirit2'), boss('GiantFlam')],
    blurb: 'Ágil y sin ceremonias. Arde en varias tareas a la vez sin despeinarse.' },
  swift: { lang: 'swift', type: 'Ave', names: ['Vencejo', 'Swiftero', 'Halcónix'], sprites: [mon('Owl'), mon('Butterfly'), boss('TenguRed')],
    blurb: 'Veloz y segura. Prefiere detenerse antes que dar un resultado equivocado.' },
  c: { lang: 'c', type: 'Cíclope', names: ['Punterín', 'Mallocojo', 'Kernelord'], sprites: [mon('Cyclope2'), mon('Eye'), boss('DemonCyclop2')],
    blurb: 'El veterano. Mira la memoria de frente con su único ojo: poderoso, pero no perdona descuidos.' },
  cpp: { lang: 'cpp', type: 'Cíclope', names: ['Duplín', 'Plusplojo', 'Templatrón'], sprites: [mon('Cyclope'), mon('Eye2'), boss('DemonCyclop')],
    blurb: 'Hermano de Punterín con mil herramientas extra. Muy rápido si sabes manejarlo.' },
  go: { lang: 'go', type: 'Topo', names: ['Topín', 'Gorrutín', 'Concurrentopo'], sprites: [mon('Mole'), mon('Panda'), boss('GiantRacoon')],
    blurb: 'Sencillo y trabajador. Cava túneles en paralelo con sus amigos y nunca se estorban.' },
  rust: { lang: 'rust', type: 'Kappa', names: ['Oxidín', 'Prestapulpo', 'Krakóxido'], sprites: [mon('KappaRed'), mon('RedOctopus'), boss('SquidRed')],
    blurb: 'Su caparazón le protege de los errores de memoria. Exigente, pero nunca se rompe.' },
};

export const EVOLVE_AT = [5, 10];
export const stageOf = (level) => (level >= EVOLVE_AT[1] ? 2 : level >= EVOLVE_AT[0] ? 1 : 0);

/** Un bug por nivel de práctica: nombre, tipo y entrada de la Bitdex. */
const BUG_INFO = {
  'm1-world-laws': ['Cajaleón', 'Variable', 'Cambia las etiquetas de las cajas: guarda texto donde debería haber números y enteros donde caben decimales.'],
  'm1-reactor': ['Desbordón', 'Aritmético', 'Suma y suma hasta que el número no cabe en su caja... y entonces da la vuelta y se vuelve negativo.'],
  'm2-patrol': ['Patrullón', 'Bucle', 'Recorre siempre su ruta una vez de más o de menos. El rey del error «off-by-one».'],
  'm2-zigzag': ['Zigzagueo', 'Condición', 'Gira a izquierda o derecha sin ningún criterio. Con un if y un % se vuelve predecible.'],
  'm3-sort-cargo': ['Bodegón', 'Lista', 'Amontona las cajas de la bodega en cualquier orden. Solo se calma cuando están ordenadas.'],
  'm3-inventory': ['Inventarín', 'Diccionario', 'Guarda cada objeto bajo una clave... y a veces pisa el que ya había.'],
  'm4-entities': ['Herenciador', 'Objeto', 'Tiene hijos que no heredan nada de él. Su árbol familiar de clases está roto.'],
  'o4-turrets': ['Torretón', 'Objeto', 'Una torreta que no sabe que es una entidad. Necesita una clase propia que herede bien.'],
  'o4-asteroids': ['Asteroidón', 'Objeto', 'Cae del cielo sin saber cómo moverse: le falta sobrescribir su método.'],
  'o4-squadron': ['Escuadrix', 'Objeto', 'Comanda un escuadrón entero de clases. Si una falla, fallan todas.'],
  'm5-systems': ['Nucleón', 'Sistema', 'Pide memoria y nunca la devuelve. O hace las tareas de una en una cuando podría hacerlas a la vez.'],
  'boss-swarm': ['Enjambre O(n²)', 'Algoritmo', 'La creación del Comandante Null: cuantos más datos recibe, más lento va. Solo un algoritmo O(n) puede pararlo.'],
  'd1-fuel': ['Multiplaga', 'Aritmético', 'Se alimenta de multiplicaciones a medio hacer. Si le pides el doble, te da la mitad.'],
  'd1-kelvin': ['Termita', 'Aritmético', 'Roe los termómetros de Bitlandia y se olvida siempre de sumar 273.'],
  'd1-perimeter': ['Vallarácnido', 'Aritmético', 'Teje vallas sin paréntesis: por eso nunca le salen las cuentas del perímetro.'],
  'd1-seconds': ['Relojín', 'Aritmético', 'Vive dentro de los relojes. Cree que un minuto tiene 100 segundos.'],
  'd1-cells': ['Partícula', 'Aritmético', 'Parte las cosas en trozos con decimales, aunque no se puedan partir.'],
  'd1-leftover': ['Restojo', 'Aritmético', 'Colecciona lo que sobra de las divisiones. Le encanta el operador %.'],
  'd2-even': ['Parimpar', 'Condición', 'Tiene dos caras que nunca se ponen de acuerdo sobre si un número es par.'],
  'd2-max3': ['Mandamás', 'Condición', 'Siempre quiere ser el más grande de tres, aunque no lo sea.'],
  'd2-sum': ['Acumulón', 'Bucle', 'Va sumando todo lo que encuentra, pero se salta el último número.'],
  'd2-multiples': ['Radarcito', 'Bucle', 'Cuenta múltiplos sin parar. Si se despista, cuenta el cero también.'],
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
  'd6-fibonacci': ['Espiralis', 'Recursión', 'Sus tentáculos se enroscan siguiendo la sucesión de Fibonacci.'],
  'd6-power': ['Amplificón', 'Recursión', 'Eleva todo a la potencia que le pidas, multiplicando paso a paso.'],
  'd6-digits': ['Digitón', 'Recursión', 'Desmonta los números cifra a cifra con / y %.'],
  'd6-gcd': ['Euclidón', 'Recursión', 'Un búho muy antiguo. Encuentra el divisor común de cualquier pareja.'],
  'd7-sorted': ['Inspectrón', 'Algoritmo', 'Revisa las colas y ruge si alguien está fuera de orden.'],
  'd7-binary': ['Bisectón', 'Algoritmo', 'Corta el problema por la mitad cada vez. Encuentra cualquier cosa en una lista ordenada.'],
  'd7-second': ['Subcampeón', 'Algoritmo', 'Nunca gana, siempre queda segundo. Y lo lleva fatal.'],
  'd7-kadane': ['Rachón', 'Algoritmo', 'Busca la mejor racha de una lista. Olvida el pasado en cuanto le perjudica.'],
  'd7-insertion': ['Insertix', 'Algoritmo', 'Ordena como quien ordena cartas: coge una y la inserta en su sitio.'],
};

const BUG_SPRITE = {
  'm1-world-laws': 'Axolot', 'm1-reactor': 'Flam2', 'm2-patrol': 'Mouse', 'm2-zigzag': 'Lizard', 'm3-sort-cargo': 'Mole2', 'm3-inventory': 'MouseBlack',
  'm4-entities': 'Reptile', 'o4-turrets': 'KappaGreen', 'o4-asteroids': 'Bamboo', 'o4-squadron': 'Dragon', 'm5-systems': 'AxolotBlue',
  'd1-fuel': 'Slime', 'd1-kelvin': 'Slime2', 'd1-perimeter': 'Mushroom', 'd1-seconds': 'Mushroom2', 'd1-cells': 'Slime4', 'd1-leftover': 'Larva',
  'd2-even': 'Skull', 'd2-max3': 'SkullBlue', 'd2-sum': 'Snake', 'd2-multiples': 'Snake2', 'd2-collatz': 'Snake3', 'd2-prime': 'Snake4',
  'd3-sum': 'Larva2', 'd3-max': 'Mollusc', 'd3-above': 'Mollusc2', 'd3-index': 'Fish', 'd3-reverse': 'FishRed', 'd3-frequent': 'HeartRed', 'd3-distinct': 'HeartGreen',
  'd5-ring': 'Spirit', 'd5-bits': 'SpiderRed', 'd5-pow2': 'SpiderYellow',
  'd6-factorial': 'Octopus', 'd6-fibonacci': 'GreenOctopus', 'd6-power': 'LanternRed', 'd6-digits': 'LanternGreen', 'd6-gcd': 'Owl2',
  'd7-sorted': 'Beast', 'd7-binary': 'Beast2', 'd7-second': 'Bear', 'd7-kadane': 'TRex', 'd7-insertion': 'GreyTrex',
};

const TYPE_COLOR = {
  Variable: '#2f8fb0', Objeto: '#8a5cc4', Aritmético: '#d98b2b', Condición: '#2f8fb0', Bucle: '#4f9a3c', Lista: '#7a5cc4', Diccionario: '#c9466f',
  Conjunto: '#2f9c88', Sistema: '#6b7685', Recursión: '#b048b4', Algoritmo: '#c63b2f',
  Gelatina: '#3d8fd1', Mapache: '#d9a032', Bambú: '#b8931f', Alado: '#4a7fd6', Llama: '#e2622b', Ave: '#d9542c', Cíclope: '#6f9136', Topo: '#9b6a45', Kappa: '#cf3f34',
};
export const typeColor = (t) => TYPE_COLOR[t] || '#8a7a6a';

/** Bugs en el orden del temario (es también su número en la Bitdex). */
export const BUGS = ORDER.map((id, i) => {
  const [name, type, entry] = BUG_INFO[id];
  const sprite = id === 'boss-swarm' ? boss('GiantSpirit') : mon(BUG_SPRITE[id]);
  return { id, dex: i + 1, name, type, entry, module: chapterOf(id).n, xp: byId(id).xp || 100, sprite };
});
export const BUG = Object.fromEntries(BUGS.map((b) => [b.id, b]));

/** Nombre visible de un daemon del equipo. */
export function daemonName(m) {
  if (m.nick) return m.nick;
  if (m.kind === 'starter') return STARTERS[m.species].names[stageOf(m.level)];
  return BUG[m.species].name;
}
/** Sprite de un daemon del equipo (cambia al evolucionar). */
export function daemonSprite(m) {
  if (m.kind === 'starter') return STARTERS[m.species].sprites[stageOf(m.level)];
  return BUG[m.species].sprite;
}
export function daemonType(m) {
  return m.kind === 'starter' ? STARTERS[m.species].type : BUG[m.species].type;
}
/** Retrato (faceset) de una criatura. */
export const faceOf = (sprite) => `${sprite.kind}/${sprite.key}-face.png`;
/** Rutas de imagen de todas las criaturas, para precargarlas. */
export const creaturePaths = () => [...Object.values(STARTERS).flatMap((s) => s.sprites), ...Object.values(BUG_SPRITE).map(mon), boss('GiantSpirit')]
  .flatMap((sp) => [`${sp.kind}/${sp.key}.png`, faceOf(sp)]);

// ───── Niveles y vida ─────
export const xpToNext = (level) => 40 + level * 30;
export const maxHpOf = (level) => 26 + level * 6;
