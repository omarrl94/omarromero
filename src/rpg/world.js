// El mundo de Bitlandia: mapa, zonas, personajes, entrenadores, puertas y guiones de la historia.
// El mapa se construye con un pequeño «constructor» (rectángulos, caminos y edificios) para que
// sea fácil de leer y de cambiar; `npm run test:world` comprueba que todo es alcanzable.

export const W = 30;
export const H = 120;

const grid = Array.from({ length: H }, () => Array(W).fill('.'));
// Cada zona se dibuja con coordenadas propias y un desplazamiento vertical (OY).
let OY = 0;
const rect = (x, y, w, h, ch) => { for (let j = y + OY; j < y + OY + h; j++) for (let i = x; i < x + w; i++) if (grid[j] && i >= 0 && i < W) grid[j][i] = ch; };
const hline = (x1, x2, y, ch) => rect(x1, y, x2 - x1 + 1, 1, ch);
const vline = (x, y1, y2, ch) => rect(x, y1, 1, y2 - y1 + 1, ch);
const put = (x, y, ch) => { grid[y + OY][x] = ch; };
export const DOORS = {};
export const BUILDINGS = [];
/** Tipos de edificio: posición en TilesetHouse, ancho y columna de la puerta. */
export const BUILDING_TYPES = {
  home: { sx: 0, w: 4, door: 1 },
  house: { sx: 8, w: 4, door: 1 },
  house2: { sx: 4, w: 4, door: 1 },
  gym: { sx: 12, w: 4, door: 1 },
  lab: { sx: 19, w: 4, door: 2 },
  center: { sx: 16, w: 3, door: 1 },
  tower: { sx: 23, w: 3, door: 1 },
};
/** Edificio de 3 filas: se dibuja con su sprite; su huella es sólida salvo la puerta. */
function house(x, y, type, door) {
  const b = BUILDING_TYPES[type];
  rect(x, y, b.w, 3, 'B');
  put(x + b.door, y + 2, 'D');
  DOORS[`${x + b.door},${y + OY + 2}`] = door;
  BUILDINGS.push({ x, y: y + OY, type, door });
  return x + b.door;
}

// ── bordes
vline(0, 0, H - 1, 'T');
vline(W - 1, 0, H - 1, 'T');

// La mitad sur del mapa se diseñó antes de añadir Villa Objeto y Ciudad Núcleo: va 24 filas más abajo.
OY = 24;

// ════════ Pueblo Origen ════════
hline(1, 28, 84, 'T'); put(15, 84, '=');
hline(1, 28, 95, 'T');
vline(14, 85, 90, '='); vline(15, 85, 90, '=');
house(3, 86, 'home', 'home');
house(19, 86, 'lab', 'lab');
hline(4, 21, 90, '='); vline(4, 89, 90, '='); vline(21, 89, 90, '=');
rect(19, 92, 6, 2, '~');
rect(2, 92, 4, 2, '*'); put(27, 85, '*'); put(1, 85, '*'); put(10, 87, '*'); put(11, 88, '*');
hline(8, 13, 93, 'F');
put(12, 89, 'S');

// ════════ Ruta 1 ════════
vline(14, 74, 83, '='); vline(15, 74, 83, '=');
rect(2, 76, 9, 4, ','); rect(18, 78, 10, 4, ','); rect(4, 81, 7, 2, ',');
rect(11, 75, 2, 2, 'T'); rect(22, 75, 3, 2, 'T'); rect(1, 82, 3, 2, 'T'); put(25, 83, 'T'); put(18, 76, 'T');
put(16, 82, 'S');

// ════════ Ciudad Byte ════════
hline(1, 28, 64, 'T'); put(15, 64, 'X');
vline(14, 65, 73, '='); vline(15, 65, 73, '=');
house(3, 66, 'center', 'center');
house(19, 65, 'gym', 'gym1');
hline(3, 26, 69, '='); vline(20, 68, 69, '=');
house(4, 70, 'house', 'house-byte');
house(21, 70, 'house2', 'house-byte2');
vline(5, 73, 73, '='); vline(22, 73, 73, '=');
put(12, 66, 'S'); put(10, 72, '*'); put(11, 72, '*'); put(17, 72, '*'); put(17, 71, '*');

// ════════ Bosque Bucle ════════
rect(1, 54, 28, 10, 'T');
hline(6, 23, 56, '='); hline(6, 23, 61, '='); vline(6, 56, 61, '='); vline(23, 56, 61, '=');
rect(7, 57, 16, 4, ','); put(11, 58, 'T'); put(18, 59, 'T'); put(14, 58, 'T'); put(15, 58, 'T');
rect(2, 57, 4, 4, ','); rect(24, 57, 4, 4, ',');
vline(15, 62, 63, '='); vline(15, 54, 55, '=');
put(14, 62, 'S');

// ════════ Ciudad Bucle ════════
hline(1, 28, 44, 'T'); put(15, 44, 'X');
hline(1, 28, 53, 'T'); put(15, 53, '=');
hline(1, 28, 52, 'T'); put(15, 52, '=');
house(4, 45, 'gym', 'gym2');
house(20, 45, 'center', 'center');
hline(3, 26, 48, '='); vline(14, 45, 51, '='); vline(15, 45, 51, '=');
rect(10, 49, 3, 2, '*'); rect(17, 49, 3, 2, '*'); put(12, 46, 'S');
rect(22, 49, 5, 2, '~');

// ════════ Lago Array y Pueblo Índice ════════
hline(1, 28, 29, 'T'); put(15, 29, 'X');
rect(1, 34, 28, 7, '~');
vline(15, 34, 40, 'b');
hline(16, 19, 37, 'b');
rect(20, 35, 8, 5, ':'); rect(21, 35, 6, 4, ',');
vline(14, 41, 43, '='); vline(15, 41, 43, '=');
rect(2, 41, 10, 2, ','); rect(18, 41, 10, 2, ',');
house(3, 30, 'gym', 'gym3');
house(21, 30, 'center', 'center');
hline(2, 27, 33, '='); vline(14, 30, 33, '='); vline(15, 30, 33, '=');
put(12, 31, 'S'); put(17, 42, 'S');

// ════════ Villa Objeto (y 41-52) · capítulo 4: POO ════════
OY = 41;
hline(1, 28, 0, 'T'); put(15, 0, 'X');
vline(14, 1, 11, '='); vline(15, 1, 11, '=');
house(3, 2, 'gym', 'gym4');
house(20, 2, 'center', 'center');
hline(2, 27, 5, '=');
rect(2, 7, 10, 4, ','); rect(18, 7, 10, 4, ',');
put(12, 8, 'T'); put(17, 10, 'T'); put(26, 3, 'T'); put(1, 3, '*'); put(9, 3, '*'); put(10, 3, '*');
put(12, 3, 'S');

// ════════ Ciudad Núcleo (y 29-40) · capítulo 5: Sistemas ════════
OY = 29;
hline(1, 28, 0, 'T'); put(15, 0, 'X');
vline(14, 1, 11, '='); vline(15, 1, 11, '=');
house(3, 2, 'center', 'center');
house(19, 2, 'gym', 'gym5');
hline(2, 27, 5, '=');
rect(2, 7, 10, 4, ','); rect(18, 7, 10, 4, ',');
put(12, 9, 'r'); put(17, 8, 'r'); put(26, 2, 'r'); put(9, 2, 'r');
put(12, 3, 'S');

OY = 0;
// ════════ Ciudad Recursiva (y 17-28) · capítulo 6 ════════
hline(1, 28, 17, 'T'); put(4, 17, 'X');
house(14, 20, 'tower', 'gym6');
vline(14, 23, 28, '='); vline(15, 23, 28, '=');
hline(4, 25, 26, '='); vline(4, 18, 26, '=');
rect(1, 27, 9, 2, 'k'); rect(20, 27, 9, 2, 'k'); rect(5, 19, 4, 5, 'k');
house(22, 19, 'center', 'center');
vline(23, 22, 26, '=');
put(13, 25, 'S');

// ════════ Cumbre Algoritmo ════════
rect(1, 8, 28, 9, ':');
rect(1, 8, 3, 9, 'M'); rect(26, 8, 3, 9, 'M');
vline(4, 13, 16, '='); hline(4, 15, 13, '='); vline(15, 8, 13, '=');
rect(5, 14, 9, 3, ','); rect(17, 9, 8, 4, ','); rect(5, 9, 6, 3, ',');
rect(16, 14, 9, 3, 'M'); put(12, 10, 'r'); put(20, 13, 'r'); put(9, 12, 'r'); put(24, 9, 'r');
hline(11, 14, 8, 'M'); hline(16, 19, 8, 'M');

// ════════ Cueva Null ════════
rect(1, 0, 28, 8, 'M');
rect(10, 1, 11, 5, 'c'); rect(12, 0, 7, 1, 'M'); vline(15, 6, 7, 'c');
put(11, 2, 'r'); put(19, 4, 'r');

export const MAP = grid.map((r) => r.join(''));
export const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 'T' : MAP[y][x]);

// Cortafuegos: se abren con una medalla.
export const FIREWALLS = { '15,88': 'medal1', '15,68': 'medal2', '15,53': 'medal3', '15,41': 'medal4', '15,29': 'medal5', '4,17': 'medal6' };

const SOLID = new Set(['T', '~', 'M', 'r', 'F', 'S', 'B', 'D']);
export function walkable(x, y, flags) {
  const t = tileAt(x, y);
  if (t === 'X') return !!flags[FIREWALLS[`${x},${y}`]];
  return !SOLID.has(t);
}

/** Zonas (de norte a sur). `wild`: hay bugs salvajes (su orden lo marca el temario, curriculum.js). */
export const ZONES = [
  { id: 'cave', name: 'Cueva Null', y0: 0, y1: 7, music: 'cave' },
  { id: 'peak', name: 'Cumbre Algoritmo', y0: 8, y1: 16, music: 'route', wild: true },
  { id: 'rec', name: 'Ciudad Recursiva', y0: 17, y1: 28, music: 'town', wild: true },
  { id: 'sys', name: 'Ciudad Núcleo', y0: 29, y1: 40, music: 'town', wild: true },
  { id: 'oop', name: 'Villa Objeto', y0: 41, y1: 52, music: 'town', wild: true },
  { id: 'lake', name: 'Lago Array', y0: 53, y1: 67, music: 'route', wild: true },
  { id: 'loop', name: 'Ciudad Bucle', y0: 68, y1: 77, music: 'town' },
  { id: 'forest', name: 'Bosque Bucle', y0: 78, y1: 87, music: 'forest', wild: true },
  { id: 'byte', name: 'Ciudad Byte', y0: 88, y1: 97, music: 'town' },
  { id: 'r1', name: 'Ruta 1', y0: 98, y1: 107, music: 'route', wild: true },
  { id: 'origin', name: 'Pueblo Origen', y0: 108, y1: 119, music: 'town' },
];
export const zoneAt = (y) => ZONES.find((z) => y >= z.y0 && y <= z.y1) || ZONES[ZONES.length - 1];

export const START = { x: 4, y: 113, dir: 'down' };
/** Centros Daemon: dónde reapareces si tu equipo se debilita (la casilla delante de la puerta). */
export const CENTERS = [
  { x: 4, y: 113, minY: 98 }, // casa
  { x: 4, y: 93, minY: 78 },
  { x: 21, y: 72, minY: 58 },
  { x: 22, y: 57, minY: 53 },
  { x: 21, y: 46, minY: 41 },
  { x: 4, y: 34, minY: 29 },
  { x: 23, y: 22, minY: 0 },
];

// ─────────────────────────── Entrenadores ───────────────────────────
export const TRAINERS = {
  rival1: {
    name: 'Kai', title: 'Rival', look: 'rival', flag: 'rival1', bits: 60,
    team: ['p-ficha'],
    intro: ['¡Eh! Yo también tengo daemon. Mira: un Cajaleón se ha colado en el laboratorio y ha estropeado la ficha de datos de tu daemon.', '¡A ver si eres capaz de arreglarla!'],
    win: ['¿Ya está? ¿Así de fácil? Bah, ha sido suerte de principiante.', '¡La próxima vez no te lo pondré tan fácil! ¡Nos vemos en Ciudad Byte!'],
  },
  rival2: {
    name: 'Kai', title: 'Rival', look: 'rival', flag: 'rival2', bits: 150,
    team: ['f-curar'],
    intro: ['¡Por fin llegas! Ya tengo la medalla de Ciudad Byte... ¿tú también? Bueno, eso da igual.', 'Mi Rebosón cura y cura sin mirar el límite: ¡la vida se sale de la barra! Te reto a arreglarlo.'],
    win: ['Vale, vale. Lo reconozco: bucles y condiciones juntos... se te dan bien.', 'Dicen que la Legión Null está soltando bugs en el Lago Array. Yo voy para allá. ¡No te quedes atrás!'],
  },
  rival3: {
    name: 'Kai', title: 'Rival', look: 'rival', flag: 'rival3', bits: 300,
    team: ['f-racha', 'f-insercion'],
    intro: ['La cueva de ahí arriba es la guarida de la Legión Null. Su jefe quiere corromper el Gran Compilador.', 'Antes de entrar... quiero comprobar que estás preparado. Mi mejor racha de bits y mi equipo ordenado como las cartas. ¡Último duelo!'],
    win: ['...Eres buena gente programando. Mejor que yo.', 'Ve tú a la cueva. Yo vigilo la entrada para que no escape ningún bug. ¡Suerte!'],
  },
  grunt1: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt1', bits: 80,
    team: ['f-eficaz'],
    intro: ['¡Alto! La Legión Null está sembrando bugs en el bosque. ¡Mi Duplicón no sabe si un ataque es eficaz y nunca lo sabrá!'],
    win: ['¡Ugh! Un simple if... ¡y depurado!', 'El jefe dice que con suficientes bugs el Gran Compilador se rendirá...'],
  },
  grunt2: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt2', bits: 90,
    team: ['f-fuerte'],
    intro: ['Este camino es nuestro. ¡Mi Mandamás se encargará de ti!'],
    win: ['¿Cómo has sabido cuál era el mayor de los tres?', 'Vale, pasa. Pero en Ciudad Bucle te espera alguien mucho más duro.'],
  },
  grunt3: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt3', bits: 120,
    team: ['f-equipo-vida'],
    intro: ['¡El puente está cerrado por orden de la Legión Null!', 'Mi Cargamento lleva la lista de vidas de un equipo entero. ¡A ver si sabes recorrerla!'],
    win: ['Recorrido completo... vaya.', 'Bueno, el puente es tuyo. Total, ya hemos llenado la isla de bugs.'],
  },
  grunt4: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt4', bits: 120,
    team: ['f-invertir'],
    intro: ['¿Vas a la isla? ¡Primero tendrás que darle la vuelta a mi Espejón!'],
    win: ['¡Mi lista vuelve a estar al derecho! ¡Qué rabia!'],
  },
  grunt5: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt5', bits: 160,
    team: ['f-ordenes'],
    intro: ['El jardín corrupto es obra nuestra. ¡Mi Factorón cuenta las formas de ordenar un equipo llamándose a sí mismo hasta el infinito!'],
    win: ['¿Un caso base? ¿Así se paraba? Nadie me lo había dicho...'],
  },
  grunt6: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt6', bits: 200,
    team: ['f-ordenado'],
    intro: ['La Cumbre es territorio Null. ¡Mi Inspectrón ha desordenado el ranking de récords!'],
    win: ['Todo en orden... ¡pues vaya!'],
  },
  grunt7: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt7', bits: 200,
    team: ['f-segundo'],
    intro: ['¡Mi Subcampeón siempre queda segundo! ¿Sabrás encontrar el segundo mayor de una lista?'],
    win: ['Dos récords a la vez... ¡claro! ¿Cómo no lo vi?'],
  },
  grunt8: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt8', bits: 220,
    team: ['c-quietos'],
    intro: ['¡Mi Piedrín ha llenado el mapa de rocas que no saben si moverse! ¡Y así se quedarán!'],
    win: ['¿Una clase que hereda de Pieza y ya está? ¿Así de fácil?'],
  },
  grunt9: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt9', bits: 260,
    team: ['f-turno-circular'],
    intro: ['¡Mi Anillón ha roto el orden de los turnos: después del último no le toca a nadie!'],
    win: ['Con % vuelve al primero... qué listo eres.'],
  },
  gym1: {
    name: 'Vera', title: 'Líder · Gimnasio Variable', look: 'leader1', flag: 'medal1', bits: 300, medal: 1,
    team: ['f-cuantos', 'f-cambio'],
    intro: ['¡Bienvenida, bienvenido al Gimnasio Variable! Soy Vera.', 'Ya sabes declarar variables, operar con números y escribir funciones. Hoy subimos un escalón.', 'Mis bugs han roto la caja de la tienda: no saben cuántos cafés te llegan ni cuánto cambio devolver. Te enseñaré la división entera y el resto... ¡y luego tendrás que usarlos!'],
    win: ['¡Impresionante! Has dominado la división entera y el resto.', 'Toma la Medalla Variable. Con ella, el cortafuegos del norte te dejará pasar al Bosque Bucle.'],
  },
  gym2: {
    name: 'Bruno', title: 'Líder · Gimnasio Bucle', look: 'leader2', flag: 'medal2', bits: 450, medal: 2,
    team: ['f-turnos', 'f-primo'],
    intro: ['Soy Bruno. En mi gimnasio todo se repite... hasta que deja de repetirse.', 'Un bucle sin condición de salida es una trampa. Uno bien hecho, una herramienta poderosa.', 'Primero calcularás cuántos turnos dura un combate, y luego abrirás un cortafuegos con números primos. ¡Que empiece la vuelta!'],
    win: ['Tus bucles terminan siempre. Eso es más difícil de lo que parece.', 'Te has ganado la Medalla Bucle. El Lago Array te espera al norte.'],
  },
  gym3: {
    name: 'Ingrid', title: 'Líder · Gimnasio Índice', look: 'leader3', flag: 'medal3', bits: 600, medal: 3,
    team: ['f-tipo-comun', 'f-especies'],
    intro: ['Hola. Soy Ingrid y colecciono datos: listas, diccionarios, conjuntos...', 'Saber elegir dónde guardar las cosas es la mitad del trabajo de un buen programador.', 'Veamos si sabes contar sin repetirte.'],
    win: ['Diccionarios y conjuntos... los usas como una profesional.', 'Aquí tienes la Medalla Índice. Villa Objeto está al otro lado del cortafuegos.'],
  },
  gym4: {
    name: 'Clara', title: 'Líder · Gimnasio Clase', look: 'leader5', flag: 'medal4', bits: 700, medal: 4,
    team: ['c-escuadron'],
    intro: ['Soy Clara, líder del Gimnasio Clase. Aquí todo es un objeto.', 'Ya sabes crear clases que heredan y sobrescriben métodos. Ahora, un escuadrón entero.', '¡Que cada clase haga lo suyo!'],
    win: ['Herencia, polimorfismo y todo funcionando junto. Excelente.', 'La Medalla Clase es tuya. Ciudad Núcleo está al norte.'],
  },
  gym5: {
    name: 'Kernel', title: 'Líder · Gimnasio Núcleo', look: 'leader6', flag: 'medal5', bits: 750, medal: 5,
    team: ['f-bits', 'f-potencia-dos'],
    intro: ['Soy Kernel. Bajo cada programa hay una máquina que solo entiende unos y ceros.', 'Ya sabes gestionar la memoria y dar la vuelta con %. Ahora, a mirar los números por dentro.', 'Cuenta los interruptores encendidos de mi panel y valida los bloques de memoria del Centro. ¡Adelante!'],
    win: ['Ves los bits como yo. Impresionante.', 'La Medalla Núcleo es tuya. Ciudad Recursiva te espera al norte.'],
  },
  gym6: {
    name: 'Rémi', title: 'Líder · Torre Recursiva', look: 'leader4', flag: 'medal6', bits: 800, medal: 6,
    team: ['f-fibonacci', 'f-mcd'],
    intro: ['Para entender la recursión... primero hay que entender la recursión.', 'Soy Rémi, guardián de la Torre. Cultivo Espiralis que siguen la sucesión de Fibonacci y reparto cafés en lotes con el algoritmo de Euclides.', 'Recuerda: todo problema recursivo necesita un caso base. ¡En guardia!'],
    win: ['Caso base, paso recursivo y... victoria. Perfecto.', 'La Medalla Recursión es tuya. La Cumbre Algoritmo y la Cueva Null están al norte. Ten cuidado.'],
  },
  boss: {
    name: 'Comandante Null', title: 'Jefe de la Legión Null', look: 'boss', flag: 'boss', bits: 2000,
    team: ['f-enjambre'],
    intro: ['Así que tú eres quien va depurando mis bugs por toda Bitlandia.', 'El Gran Compilador nos obliga a escribir código correcto. Qué aburrimiento. Yo quiero un mundo lleno de errores, donde nada funcione.', 'Contempla mi obra maestra: el Enjambre O(n²). Cuantos más datos recibe, más lento va. ¡Tu código nunca será lo bastante rápido!'],
    win: ['¡No... no puede ser! ¡Has bajado el Enjambre de O(n²) a O(n)!', 'Está bien. Lo admito. Un mundo sin errores... tampoco está tan mal.', 'La Legión Null se disuelve. Hasta otra, programador.'],
  },
};

// ─────────────────────────── Personajes del mapa ───────────────────────────
// lines: lo que dicen. trainer: id del entrenador. hideIf/showIf: banderas de la historia.
export const NPCS = [
  { id: 'aide', x: 15, y: 84, look: 'aide', dir: 'down', hideIf: 'starter', name: 'Ayudante Bit', lines: ['¡Espera! La hierba alta está llena de bugs salvajes y no tienes ningún daemon.', 'La Profesora Lambda te está esperando en el laboratorio: el edificio del tejado verde.'] },
  { id: 'mom', x: 8, y: 91, look: 'mom', dir: 'left', name: 'Mamá', lines: (s) => (s.flags.starter ? ['¡Qué daemon tan bonito! Si os cansáis, venid a casa a descansar.', 'Y recuerda: cuando algo no funcione, léete el error con calma. Siempre dice algo útil.'] : ['¡Buenos días! La Profesora Lambda ha preguntado por ti.', 'Hoy es el gran día: ¡vas a recibir tu primer daemon!']) },
  { id: 'kid1', x: 20, y: 91, look: 'kid', dir: 'up', name: 'Niño', lines: ['¿Sabías que cada daemon habla un lenguaje de programación distinto?', 'Yo de mayor quiero uno que hable Rust. Dicen que nunca se rompe.'] },
  { id: 'coder1', x: 17, y: 80, look: 'coder', dir: 'left', name: 'Programadora', lines: ['Contra un bug, tu ataque es tu código: cada caso de prueba que pasa es un golpe.', 'Si un caso falla, el bug te contraataca. Mira qué esperaba y qué ha salido: ahí está la pista.'] },
  { id: 'girl1', x: 10, y: 71, look: 'girl', dir: 'right', name: 'Chica', lines: ['La líder Vera usa bugs que no saben dividir.', 'Un truco: en muchos lenguajes, 7 / 2 da 3 si los dos son enteros. Y 7 % 2 te da lo que sobra: 1.'] },
  { id: 'elder1', x: 25, y: 73, look: 'elder', dir: 'left', name: 'Abuelo', lines: ['En mis tiempos programábamos con tarjetas perforadas...', '¡Y los bugs eran polillas de verdad dentro de las máquinas!'] },
  { id: 'grunt1', x: 6, y: 58, look: 'grunt', dir: 'down', trainer: 'grunt1' },
  { id: 'grunt2', x: 15, y: 55, look: 'grunt', dir: 'down', trainer: 'grunt2' },
  { id: 'rival2', x: 15, y: 52, look: 'rival', dir: 'down', trainer: 'rival2', hideIf: 'rival2' },
  { id: 'kid2', x: 10, y: 51, look: 'kid', dir: 'right', name: 'Niña', lines: ['En el Bosque Bucle el camino da vueltas y vueltas... como un while sin salida.', '¡Menos mal que tiene una salida al norte!'] },
  { id: 'coder2', x: 18, y: 47, look: 'coder', dir: 'down', name: 'Programador', lines: ['Un for repite un número conocido de veces. Un while repite mientras se cumpla una condición.', 'El gimnasio de Bruno usa los dos. ¡Prepárate!'] },
  { id: 'grunt3', x: 15, y: 38, look: 'grunt', dir: 'down', trainer: 'grunt3' },
  { id: 'grunt4', x: 18, y: 37, look: 'grunt', dir: 'left', trainer: 'grunt4' },
  { id: 'elder2', x: 18, y: 32, look: 'elder', dir: 'down', name: 'Anciana', lines: ['Aquí en Pueblo Índice contamos desde cero. El primer elemento de una lista es el [0].', 'Los forasteros siempre se confunden. ¡Y luego se salen de la lista!'] },
  { id: 'grunt5', x: 4, y: 21, look: 'grunt', dir: 'down', trainer: 'grunt5' },
  { id: 'girl2', x: 18, y: 25, look: 'girl', dir: 'up', name: 'Estudiante', lines: ['La Torre Recursiva tiene una torre dentro, que tiene otra torre dentro, que tiene...', '¡Ay! Me he mareado. Menos mal que en algún momento se acaba: ese es el caso base.'] },
  { id: 'grunt6', x: 15, y: 11, look: 'grunt', dir: 'down', trainer: 'grunt6' },
  { id: 'grunt7', x: 4, y: 14, look: 'grunt', dir: 'down', trainer: 'grunt7' },
  { id: 'rival3', x: 15, y: 8, look: 'rival', dir: 'down', trainer: 'rival3', hideIf: 'rival3' },
  { id: 'rival3b', x: 14, y: 9, look: 'rival', dir: 'down', showIf: 'rival3', name: 'Kai', lines: (s) => (s.flags.boss ? ['¡Lo has conseguido! Toda Bitlandia habla de ti.', 'Oye... ¿la próxima vez me enseñas a hacer la búsqueda binaria?'] : ['La guarida de la Legión Null está justo ahí dentro. Yo vigilo la entrada.']) },
  { id: 'boss', x: 15, y: 2, look: 'boss', dir: 'down', trainer: 'boss', hideIf: 'boss' },
  { id: 'prof-end', x: 15, y: 2, look: 'prof', dir: 'down', showIf: 'boss', name: 'Profesora Lambda', lines: (s) => [`¡${s.name}! Gracias a ti, el Gran Compilador vuelve a funcionar.`, `Ahora intenta completar la Bitdex: llevas ${Object.keys(s.dex.caught).length} de 44 bugs depurados.`] },
];

/** Carteles. */
export const SIGNS = {
  '12,89': ['PUEBLO ORIGEN', 'Donde empieza todo programa.'],
  '16,82': ['RUTA 1', '↑ Ciudad Byte · ↓ Pueblo Origen', 'Cuidado: hierba alta con bugs de tipo Aritmético.'],
  '12,66': ['CIUDAD BYTE', 'Gimnasio Variable · Líder: Vera', '«Toda gran aventura empieza con una variable.»'],
  '14,62': ['BOSQUE BUCLE', 'Si das vueltas sin salir, revisa tu condición.'],
  '12,46': ['CIUDAD BUCLE', 'Gimnasio Bucle · Líder: Bruno'],
  '17,42': ['LAGO ARRAY', 'El puente es el índice 15. Bueno, más o menos.'],
  '12,31': ['PUEBLO ÍNDICE', 'Gimnasio Índice · Líder: Ingrid', 'Aquí se cuenta desde el 0.'],
  '13,25': ['CIUDAD RECURSIVA', 'Torre Recursiva · Líder: Rémi', '«Para entender la recursión, lee este cartel.»'],
};

/** Personajes del pack: clave de aspecto → hoja de sprites. */
export const CHARACTERS = {
  hero: 'Boy', rival: 'Hunter', prof: 'Master', aide: 'Monk', mom: 'Woman', nurse: 'Princess', grunt: 'NinjaDark', boss: 'Vampire',
  leader1: 'Cavegirl', leader2: 'FighterWhite', leader3: 'EggGirl', leader4: 'Shaman', leader5: 'KnightGold', leader6: 'RobotGrey', kid: 'Child', elder: 'OldMan', girl: 'Villager4', coder: 'Villager3',
};

export const MEDALS = ['Medalla Variable', 'Medalla Bucle', 'Medalla Índice', 'Medalla Clase', 'Medalla Núcleo', 'Medalla Recursión'];

// La mitad sur del mapa se desplazó 24 filas: los personajes y carteles de esa mitad también.
const shiftY = (y) => (y >= 29 ? y + 24 : y);
for (const n of NPCS) n.y = shiftY(n.y);
for (const k of Object.keys(SIGNS)) {
  const [x, y] = k.split(',').map(Number);
  if (y >= 29) { SIGNS[`${x},${y + 24}`] = SIGNS[k]; delete SIGNS[k]; }
}
NPCS.push(
  { id: 'grunt8', x: 14, y: 47, look: 'grunt', dir: 'down', trainer: 'grunt8' },
  { id: 'coder3', x: 9, y: 47, look: 'coder', dir: 'right', name: 'Programadora', lines: ['Una clase es como el plano de una casa; un objeto es cada casa construida con ese plano.', 'Y si una clase hereda de otra, recibe todo lo que tiene la otra sin volver a escribirlo.'] },
  { id: 'grunt9', x: 14, y: 36, look: 'grunt', dir: 'down', trainer: 'grunt9' },
  { id: 'elder3', x: 24, y: 35, look: 'elder', dir: 'left', name: 'Ingeniero', lines: ['Aquí dentro todo son bits: unos y ceros.', 'El 13 en binario es 1101. Cuatro cifras, tres unos. ¡Pruébalo!'] },
);
SIGNS['12,44'] = ['VILLA OBJETO', 'Gimnasio Clase · Líder: Clara', '«Todo es un objeto.»'];
SIGNS['12,32'] = ['CIUDAD NÚCLEO', 'Gimnasio Núcleo · Líder: Kernel', 'Memoria, concurrencia y bits.'];
