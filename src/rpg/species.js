// Criaturas de Bitlandia.
// · Daemons iniciales: uno por lenguaje. Tu daemon ES tu lenguaje: con él programas toda la aventura.
// · Bugs: uno por nivel de práctica. Cada bug ha corrompido una función; si la arreglas, se depura
//   y puede unirse a tu equipo.
// Sprites: pack «Ninja Adventure» (Pixel-boy & AAA, CC0).
import { byId } from './course/index.js';
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

/** Un bug por reto del temario: nombre, tipo, entrada de la Bitdex y sprite. */
const BUG_INFO = {
  'p-ficha': ['Cajaleón', 'Variable', 'Cambia las etiquetas de las cajas: guarda texto donde debería haber números y enteros donde hacen falta decimales.', 'Axolot'],
  'p-hucha': ['Desbordón', 'Aritmético', 'Mete bits y más bits en una caja demasiado pequeña... hasta que el número da la vuelta y se vuelve negativo.', 'Flam2'],
  'f-golpe': ['Multiplaga', 'Aritmético', 'Se alimenta de multiplicaciones a medio hacer: le pides el daño total y te devuelve 0.', 'Slime'],
  'f-cafe': ['Sorbín', 'Aritmético', 'Se bebe el café antes que tu daemon. Por eso la vida nunca sube.', 'Mushroom'],
  'f-experiencia': ['Formulón', 'Aritmético', 'Borra fórmulas. Le encanta confundir el orden de las operaciones.', 'Slime2'],
  'f-compra': ['Cajerín', 'Aritmético', 'Vive dentro de las cajas registradoras y cobra lo que le da la gana.', 'Mushroom2'],
  'f-cuantos': ['Partícula', 'Aritmético', 'Parte las cosas en trozos con decimales, aunque nadie pueda comprarse medio café.', 'Slime4'],
  'f-cambio': ['Restojo', 'Aritmético', 'Colecciona lo que sobra de las divisiones. Nunca devuelve el cambio.', 'Larva'],
  'f-entreno': ['Patrullón', 'Bucle', 'Repite su ruta una vez de más o de menos: el rey del error de contar mal un rango.', 'Mouse'],
  'f-eficaz': ['Duplicón', 'Condición', 'Nunca sabe si un ataque es eficaz o no. Le falta un buen if.', 'Lizard'],
  'f-turno': ['Parimpar', 'Condición', 'Tiene dos caras que nunca se ponen de acuerdo sobre si un número es par.', 'Skull'],
  'f-fuerte': ['Mandamás', 'Condición', 'Siempre quiere ser el más fuerte de tres, aunque no lo sea.', 'SkullBlue'],
  'f-curar': ['Rebosón', 'Bucle', 'Cura y cura sin mirar el límite. Con él, la vida se sale de la barra.', 'Snake'],
  'f-encuentros': ['Radarcito', 'Bucle', 'Sus antenas cuentan pasos peligrosos. Se lía con «o» e «y».', 'Snake2'],
  'f-turnos': ['Eternón', 'Bucle', 'Atrapado en un while que nunca termina. Odia que algo cambie dentro del bucle.', 'Snake3'],
  'f-primo': ['Primordio', 'Bucle', 'Guarda los cortafuegos. Solo respeta a los números que nadie puede dividir.', 'Snake4'],
  'f-equipo-vida': ['Cargamento', 'Lista', 'Arrastra una lista de vidas y nunca sabe cuánto suman.', 'Larva2'],
  'f-nivel-max': ['Pesadón', 'Lista', 'Busca el más alto... y a veces se queda con el primero que ve.', 'Mollusc'],
  'f-debilitados': ['Alarmón', 'Lista', 'Suena cada vez que un daemon cae. Si no lo arreglas, suena siempre.', 'Mollusc2'],
  'f-posicion': ['Buscaíndex', 'Lista', 'Encuentra cosas, pero olvida que las posiciones empiezan en 0.', 'Fish'],
  'f-invertir': ['Espejón', 'Lista', 'Da la vuelta a las listas... cuando no se tropieza en la mitad.', 'FishRed'],
  'f-burbuja': ['Bodegón', 'Lista', 'Amontona a los daemons en cualquier orden. Solo se calma cuando están ordenados.', 'Mole2'],
  'f-tipo-comun': ['Ecozumbido', 'Diccionario', 'Repite el valor que más se oye. Vive en los diccionarios.', 'HeartRed'],
  'f-especies': ['Censalino', 'Conjunto', 'Cuenta especies distintas, pero a los gemelos los cuenta dos veces.', 'HeartGreen'],
  'c-clase': ['Herenciador', 'Objeto', 'Tiene hijos que no heredan nada de él. Su árbol de clases está roto.', 'Reptile'],
  'c-quietos': ['Piedrín', 'Objeto', 'No sabe si debe moverse o quedarse quieto. Le falta saber qué heredar.', 'KappaGreen'],
  'c-poli': ['Polimorfo', 'Objeto', 'Cambia de forma, pero siempre se mueve igual: le falta sobrescribir su método.', 'Bamboo'],
  'c-escuadron': ['Escuadrix', 'Objeto', 'Comanda un escuadrón entero de clases. Si una falla, fallan todas.', 'Dragon'],
  'p-centro': ['Nucleón', 'Sistema', 'Pide memoria y nunca la devuelve, o hace las tareas de una en una cuando podría hacerlas a la vez.', 'AxolotBlue'],
  'f-turno-circular': ['Anillón', 'Sistema', 'Da vueltas en círculo. Cuando llega al final, se pierde en vez de volver al principio.', 'Spirit'],
  'f-bits': ['Bitácaro', 'Sistema', 'Diminuto. Solo ve unos y ceros, y quiere contarlos todos.', 'SpiderRed'],
  'f-potencia-dos': ['Potenciota', 'Sistema', 'Crece duplicándose: 1, 2, 4, 8... hasta no caber en la memoria.', 'SpiderYellow'],
  'f-cifras': ['Digitón', 'Recursión', 'Desmonta los números cifra a cifra con / y %.', 'LanternGreen'],
  'f-ordenes': ['Factorón', 'Recursión', 'Se llama a sí mismo una y otra vez. Sin caso base, nunca para.', 'Octopus'],
  'f-potencia': ['Amplificón', 'Recursión', 'Multiplica su poder en cada turno, paso a paso.', 'LanternRed'],
  'f-fibonacci': ['Espiralis', 'Recursión', 'Sus tentáculos se enroscan siguiendo la sucesión de Fibonacci.', 'GreenOctopus'],
  'f-mcd': ['Euclidón', 'Recursión', 'Un búho muy antiguo. Encuentra el divisor común de cualquier pareja de números.', 'Owl2'],
  'f-ordenado': ['Inspectrón', 'Algoritmo', 'Revisa los rankings y ruge si alguien está fuera de orden.', 'Beast'],
  'f-segundo': ['Subcampeón', 'Algoritmo', 'Nunca gana, siempre queda segundo. Y lo lleva fatal.', 'Bear'],
  'f-binaria': ['Bisectón', 'Algoritmo', 'Corta el problema por la mitad cada vez. Encuentra cualquier cosa en una lista ordenada.', 'Beast2'],
  'f-racha': ['Rachón', 'Algoritmo', 'Busca la mejor racha de una lista. Olvida el pasado en cuanto le perjudica.', 'TRex'],
  'f-insercion': ['Insertix', 'Algoritmo', 'Ordena como quien ordena cartas: coge una y la desliza hasta su sitio.', 'GreyTrex'],
  'f-enjambre': ['Enjambre O(n²)', 'Algoritmo', 'La creación del Comandante Null: cuantos más datos recibe, más lento va. Solo un algoritmo O(n) puede pararlo.', null],
};

const TYPE_COLOR = {
  Variable: '#2f8fb0', Objeto: '#8a5cc4', Aritmético: '#d98b2b', Condición: '#2f8fb0', Bucle: '#4f9a3c', Lista: '#7a5cc4', Diccionario: '#c9466f',
  Conjunto: '#2f9c88', Sistema: '#6b7685', Recursión: '#b048b4', Algoritmo: '#c63b2f',
  Gelatina: '#3d8fd1', Mapache: '#d9a032', Bambú: '#b8931f', Alado: '#4a7fd6', Llama: '#e2622b', Ave: '#d9542c', Cíclope: '#6f9136', Topo: '#9b6a45', Kappa: '#cf3f34',
};
export const typeColor = (t) => TYPE_COLOR[t] || '#8a7a6a';

/** Bugs en el orden del temario (es también su número en la Bitdex). */
export const BUGS = ORDER.map((id, i) => {
  const [name, type, entry, key] = BUG_INFO[id];
  const sprite = key ? mon(key) : boss('GiantSpirit');
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
export const creaturePaths = () => [...Object.values(STARTERS).flatMap((s) => s.sprites), ...Object.values(BUG_INFO).map((b) => (b[3] ? mon(b[3]) : boss('GiantSpirit')))]
  .flatMap((sp) => [`${sp.kind}/${sp.key}.png`, faceOf(sp)]);

// ───── Niveles y vida ─────
export const xpToNext = (level) => 40 + level * 30;
export const maxHpOf = (level) => 26 + level * 6;
