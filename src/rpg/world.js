// El mundo de Bitlandia: mapa, zonas, personajes, entrenadores, puertas y guiones de la historia.
// El mapa se construye con un pequeño «constructor» (rectángulos, caminos y edificios) para que
// sea fácil de leer y de cambiar; `npm run test:world` comprueba que todo es alcanzable.

export const W = 30;
export const H = 96;

const grid = Array.from({ length: H }, () => Array(W).fill('.'));
const rect = (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (grid[j] && i >= 0 && i < W) grid[j][i] = ch; };
const hline = (x1, x2, y, ch) => rect(x1, y, x2 - x1 + 1, 1, ch);
const vline = (x, y1, y2, ch) => rect(x, y1, 1, y2 - y1 + 1, ch);
const put = (x, y, ch) => { grid[y][x] = ch; };
export const DOORS = {};
/** Edificio: 2 filas de tejado y 1 de fachada con ventanas y una puerta. */
function house(x, y, w, roof, dx, door) {
  rect(x, y, w, 2, roof);
  for (let i = 0; i < w; i++) put(x + i, y + 2, i === 0 || i === w - 1 ? 'W' : i % 2 ? 'w' : 'W');
  put(x + dx, y + 2, 'D');
  DOORS[`${x + dx},${y + 2}`] = door;
}

// ── bordes
vline(0, 0, H - 1, 'T');
vline(W - 1, 0, H - 1, 'T');

// ════════ Zona 9 · Pueblo Origen (y 84-95) ════════
hline(1, 28, 84, 'T'); put(15, 84, '=');
hline(1, 28, 95, 'T');
vline(14, 85, 90, '='); vline(15, 85, 90, '=');
house(3, 86, 5, 'R', 2, 'home');
house(19, 86, 7, 'A', 3, 'lab');
hline(5, 22, 90, '='); vline(5, 89, 90, '='); vline(22, 89, 90, '=');
rect(19, 92, 6, 2, '~');
rect(2, 92, 4, 2, '*'); put(27, 85, '*'); put(1, 85, '*'); put(10, 87, '*'); put(11, 88, '*');
hline(8, 13, 93, 'F');
put(12, 89, 'S');

// ════════ Zona 8 · Ruta 1 (y 74-83) ════════
vline(14, 74, 83, '='); vline(15, 74, 83, '=');
rect(2, 76, 9, 4, ','); rect(18, 78, 10, 4, ','); rect(4, 81, 7, 2, ',');
rect(11, 75, 2, 2, 'T'); rect(22, 75, 3, 2, 'T'); rect(1, 82, 3, 2, 'T'); put(25, 83, 'T'); put(18, 76, 'T');
put(16, 82, 'S');

// ════════ Zona 7 · Ciudad Byte (y 64-73) ════════
hline(1, 28, 64, 'T'); put(15, 64, 'X');
vline(14, 65, 73, '='); vline(15, 65, 73, '=');
house(3, 66, 5, 'H', 2, 'center');
house(19, 65, 7, 'G', 3, 'gym1');
hline(3, 26, 69, '='); vline(22, 68, 69, '=');
house(4, 70, 4, 'R', 1, 'house-byte');
house(21, 70, 5, 'R', 2, 'house-byte2');
vline(5, 73, 73, '='); vline(23, 73, 73, '=');
put(12, 66, 'S'); put(10, 72, '*'); put(11, 72, '*'); put(17, 72, '*'); put(17, 71, '*');

// ════════ Zona 6 · Bosque Bucle (y 54-63) ════════
rect(1, 54, 28, 10, 'T');
hline(6, 23, 56, '='); hline(6, 23, 61, '='); vline(6, 56, 61, '='); vline(23, 56, 61, '=');
rect(7, 57, 16, 4, ','); put(11, 58, 'T'); put(18, 59, 'T'); put(14, 58, 'T'); put(15, 58, 'T');
rect(2, 57, 4, 4, ','); rect(24, 57, 4, 4, ',');
vline(15, 62, 63, '='); vline(15, 54, 55, '=');
put(14, 62, 'S');

// ════════ Zona 5 · Ciudad Bucle (y 44-53) ════════
hline(1, 28, 44, 'T'); put(15, 44, 'X');
hline(1, 28, 53, 'T'); put(15, 53, '=');
hline(1, 28, 52, 'T'); put(15, 52, '=');
house(4, 45, 7, 'G', 3, 'gym2');
house(20, 45, 5, 'H', 2, 'center');
hline(3, 26, 48, '='); vline(7, 48, 48, '='); vline(14, 45, 51, '='); vline(15, 45, 51, '=');
rect(10, 49, 3, 2, '*'); rect(17, 49, 3, 2, '*'); put(12, 46, 'S');
rect(22, 49, 5, 2, '~');

// ════════ Zona 4 · Lago Array y Pueblo Índice (y 30-43) ════════
hline(1, 28, 29, 'T'); put(15, 29, 'X');
rect(1, 34, 28, 7, '~');
vline(15, 34, 40, 'b');
hline(16, 19, 37, 'b');
rect(20, 35, 8, 5, ':'); rect(21, 35, 6, 4, ',');
vline(14, 41, 43, '='); vline(15, 41, 43, '=');
rect(2, 41, 10, 2, ','); rect(18, 41, 10, 2, ',');
house(3, 30, 7, 'G', 3, 'gym3');
house(21, 30, 5, 'H', 2, 'center');
hline(2, 27, 33, '='); vline(14, 30, 33, '='); vline(15, 30, 33, '=');
put(12, 31, 'S'); put(17, 42, 'S');

// ════════ Zona 3 · Ciudad Recursiva (y 17-28) ════════
hline(1, 28, 17, 'T'); put(4, 17, 'X');
hline(10, 19, 18, 'N'); rect(10, 19, 10, 5, '#'); put(15, 23, 'D'); DOORS['15,23'] = 'gym4';
vline(14, 24, 28, '='); vline(15, 24, 28, '=');
hline(4, 25, 26, '='); vline(4, 18, 26, '=');
rect(1, 27, 9, 2, 'k'); rect(20, 27, 9, 2, 'k'); rect(5, 19, 4, 5, 'k');
house(22, 19, 5, 'H', 2, 'center');
vline(24, 22, 26, '=');
put(13, 25, 'S');

// ════════ Zona 2 · Cumbre Algoritmo (y 8-16) ════════
rect(1, 8, 28, 9, ':');
rect(1, 8, 3, 9, 'M'); rect(26, 8, 3, 9, 'M');
vline(4, 13, 16, '='); hline(4, 15, 13, '='); vline(15, 8, 13, '=');
rect(5, 14, 9, 3, ','); rect(17, 9, 8, 4, ','); rect(5, 9, 6, 3, ',');
rect(16, 14, 9, 3, 'M'); put(12, 10, 'r'); put(20, 13, 'r'); put(9, 12, 'r'); put(24, 9, 'r');
hline(11, 14, 8, 'M'); hline(16, 19, 8, 'M');

// ════════ Zona 1 · Cueva Null (y 0-7) ════════
rect(1, 0, 28, 8, 'M');
rect(10, 1, 11, 5, 'c'); rect(12, 0, 7, 1, 'M'); vline(15, 6, 7, 'c');
put(11, 2, 'r'); put(19, 4, 'r');

export const MAP = grid.map((r) => r.join(''));
export const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 'T' : MAP[y][x]);

// Cortafuegos: se abren con una medalla.
export const FIREWALLS = { '15,64': 'medal1', '15,44': 'medal2', '15,29': 'medal3', '4,17': 'medal4' };

const SOLID = new Set(['T', '~', 'M', 'r', 'F', 'S', 'W', 'w', 'D', '#', 'R', 'H', 'G', 'A', 'N']);
export function walkable(x, y, flags) {
  const t = tileAt(x, y);
  if (t === 'X') return !!flags[FIREWALLS[`${x},${y}`]];
  return !SOLID.has(t);
}

/** Zonas (de norte a sur). `modules`: de qué módulos salen los bugs salvajes. */
export const ZONES = [
  { id: 'cave', name: 'Cueva Null', y0: 0, y1: 7, music: 'boss', modules: [] },
  { id: 'peak', name: 'Cumbre Algoritmo', y0: 8, y1: 16, music: 'route', modules: [5, 7] },
  { id: 'rec', name: 'Ciudad Recursiva', y0: 17, y1: 28, music: 'town', modules: [6] },
  { id: 'lake', name: 'Lago Array', y0: 29, y1: 43, music: 'route', modules: [3] },
  { id: 'loop', name: 'Ciudad Bucle', y0: 44, y1: 53, music: 'town', modules: [] },
  { id: 'forest', name: 'Bosque Bucle', y0: 54, y1: 63, music: 'route', modules: [2] },
  { id: 'byte', name: 'Ciudad Byte', y0: 64, y1: 73, music: 'town', modules: [] },
  { id: 'r1', name: 'Ruta 1', y0: 74, y1: 83, music: 'route', modules: [1] },
  { id: 'origin', name: 'Pueblo Origen', y0: 84, y1: 95, music: 'town', modules: [] },
];
export const zoneAt = (y) => ZONES.find((z) => y >= z.y0 && y <= z.y1) || ZONES[ZONES.length - 1];

export const START = { x: 5, y: 89, dir: 'down' };
/** Centros Daemon: dónde reapareces si tu equipo se debilita (la casilla delante de la puerta). */
export const CENTERS = [
  { x: 5, y: 89, minY: 74 }, // casa
  { x: 5, y: 69, minY: 54 },
  { x: 22, y: 48, minY: 34 },
  { x: 23, y: 33, minY: 22 },
  { x: 24, y: 22, minY: 0 },
];

// ─────────────────────────── Entrenadores ───────────────────────────
export const TRAINERS = {
  rival1: {
    name: 'Kai', title: 'Rival', look: 'rival', flag: 'rival1', bits: 60,
    team: ['d1-fuel'],
    intro: ['¡Eh! Yo también tengo daemon. He atrapado un bug en la valla del laboratorio... ¡a ver si eres capaz de depurarlo!'],
    win: ['¿Ya está? ¿Así de fácil? Bah, ha sido suerte de principiante.', '¡La próxima vez no te lo pondré tan fácil! ¡Nos vemos en Ciudad Byte!'],
  },
  rival2: {
    name: 'Kai', title: 'Rival', look: 'rival', flag: 'rival2', bits: 150,
    team: ['d2-sum'],
    intro: ['¡Por fin llegas! Ya tengo la medalla de Ciudad Byte... ¿tú también? Bueno, eso da igual.', 'Este bug va sumando cosas y se salta la última. Te reto a arreglarlo antes que yo.'],
    win: ['Vale, vale. Lo reconozco: los bucles se te dan bien.', 'Dicen que la Legión Null está soltando bugs en el Lago Array. Yo voy para allá. ¡No te quedes atrás!'],
  },
  rival3: {
    name: 'Kai', title: 'Rival', look: 'rival', flag: 'rival3', bits: 300,
    team: ['d5-bits', 'd7-second'],
    intro: ['La cueva de ahí arriba es la guarida de la Legión Null. Su jefe quiere corromper el Gran Compilador.', 'Antes de entrar... quiero comprobar una cosa. ¡Último duelo!'],
    win: ['...Eres buena gente programando. Mejor que yo.', 'Ve tú a la cueva. Yo vigilo la entrada para que no escape ningún bug. ¡Suerte!'],
  },
  grunt1: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt1', bits: 80,
    team: ['d2-even'],
    intro: ['¡Alto! La Legión Null está sembrando bugs en el bosque. ¡Nadie pasa!'],
    win: ['¡Ugh! Mi bug par-impar... ¡depurado!', 'El jefe dice que con suficientes bugs el Gran Compilador se rendirá...'],
  },
  grunt2: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt2', bits: 90,
    team: ['d2-max3'],
    intro: ['Este camino es nuestro. ¡Mi Mandamás se encargará de ti!'],
    win: ['¿Cómo has sabido cuál era el mayor de los tres?', 'Vale, pasa. Pero en Ciudad Bucle te espera alguien mucho más duro.'],
  },
  grunt3: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt3', bits: 120,
    team: ['d3-sum'],
    intro: ['¡El puente está cerrado por orden de la Legión Null!', 'Mi Cargamento lleva una lista entera de pesos. ¡A ver si sabes recorrerla!'],
    win: ['Recorrido completo... vaya.', 'Bueno, el puente es tuyo. Total, ya hemos llenado la isla de bugs.'],
  },
  grunt4: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt4', bits: 120,
    team: ['d3-reverse'],
    intro: ['¿Vas a la isla? ¡Primero tendrás que darle la vuelta a mi Espejón!'],
    win: ['¡Mi lista vuelve a estar al derecho! ¡Qué rabia!'],
  },
  grunt5: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt5', bits: 160,
    team: ['d6-factorial'],
    intro: ['El jardín corrupto es obra nuestra. ¡Mi Factorón se llama a sí mismo hasta el infinito!'],
    win: ['¿Un caso base? ¿Así se paraba? Nadie me lo había dicho...'],
  },
  grunt6: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt6', bits: 200,
    team: ['d7-sorted'],
    intro: ['La Cumbre es territorio Null. ¡Te voy a desordenar las ideas!'],
    win: ['Todo en orden... ¡pues vaya!'],
  },
  grunt7: {
    name: 'Recluta Null', title: 'Legión Null', look: 'grunt', flag: 'grunt7', bits: 200,
    team: ['d5-pow2'],
    intro: ['¡Mi Potenciota se duplica sin parar! ¿Sabrás si un número es potencia de dos?'],
    win: ['Un solo bit encendido... ¡claro! ¿Cómo no lo vi?'],
  },
  gym1: {
    name: 'Vera', title: 'Líder · Gimnasio Variable', look: 'leader1', flag: 'medal1', bits: 300, medal: 1,
    team: ['d1-cells', 'd1-leftover'],
    intro: ['¡Bienvenida, bienvenido al Gimnasio Variable! Soy Vera.', 'Aquí todo empieza por lo básico: números, operaciones y cajas con nombre.', 'Mis bugs no saben repartir: cortan con decimales y pierden lo que sobra. ¿Sabrás dividir de verdad?'],
    win: ['¡Impresionante! Has dominado la división entera y el resto.', 'Toma la Medalla Variable. Con ella, el cortafuegos del norte te dejará pasar al Bosque Bucle.'],
  },
  gym2: {
    name: 'Bruno', title: 'Líder · Gimnasio Bucle', look: 'leader2', flag: 'medal2', bits: 450, medal: 2,
    team: ['d2-collatz', 'd2-prime'],
    intro: ['Soy Bruno. En mi gimnasio todo se repite... hasta que deja de repetirse.', 'Un bucle sin condición de salida es una trampa. Uno bien hecho, una herramienta poderosa.', '¡Que empiece la vuelta!'],
    win: ['Tus bucles terminan siempre. Eso es más difícil de lo que parece.', 'Te has ganado la Medalla Bucle. El Lago Array te espera al norte.'],
  },
  gym3: {
    name: 'Ingrid', title: 'Líder · Gimnasio Índice', look: 'leader3', flag: 'medal3', bits: 600, medal: 3,
    team: ['d3-frequent', 'd3-distinct'],
    intro: ['Hola. Soy Ingrid y colecciono datos: listas, diccionarios, conjuntos...', 'Saber elegir dónde guardar las cosas es la mitad del trabajo de un buen programador.', 'Veamos si sabes contar sin repetirte.'],
    win: ['Diccionarios y conjuntos... los usas como una profesional.', 'Aquí tienes la Medalla Índice. Ciudad Recursiva está al otro lado del cortafuegos.'],
  },
  gym4: {
    name: 'Rémi', title: 'Líder · Torre Recursiva', look: 'leader4', flag: 'medal4', bits: 800, medal: 4,
    team: ['d6-fibonacci', 'd6-gcd'],
    intro: ['Para entender la recursión... primero hay que entender la recursión.', 'Soy Rémi, guardián de la Torre. Mis bugs se llaman a sí mismos.', 'Recuerda: todo problema recursivo necesita un caso base. ¡En guardia!'],
    win: ['Caso base, paso recursivo y... victoria. Perfecto.', 'La Medalla Recursión es tuya. La Cumbre Algoritmo y la Cueva Null están al norte. Ten cuidado.'],
  },
  boss: {
    name: 'Comandante Null', title: 'Jefe de la Legión Null', look: 'boss', flag: 'boss', bits: 2000,
    team: ['d7-binary', 'd7-kadane', 'd7-insertion'],
    intro: ['Así que tú eres quien va depurando mis bugs por toda Bitlandia.', 'El Gran Compilador nos obliga a escribir código correcto. Qué aburrimiento. Yo quiero un mundo lleno de errores, donde nada funcione.', 'Mis tres bugs más poderosos son algoritmos clásicos corrompidos. ¡Nadie los ha depurado jamás!'],
    win: ['¡No... no puede ser! ¡Búsqueda binaria, Kadane, inserción... todos depurados!', 'Está bien. Lo admito. Un mundo sin errores... tampoco está tan mal.', 'La Legión Null se disuelve. Hasta otra, programador.'],
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
  { id: 'prof-end', x: 15, y: 2, look: 'prof', dir: 'down', showIf: 'boss', name: 'Profesora Lambda', lines: (s) => [`¡${s.name}! Gracias a ti, el Gran Compilador vuelve a funcionar.`, `Ahora intenta completar la Bitdex: llevas ${Object.keys(s.dex.caught).length} de 32 bugs depurados.`] },
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

export const MEDALS = ['Medalla Variable', 'Medalla Bucle', 'Medalla Índice', 'Medalla Recursión'];
