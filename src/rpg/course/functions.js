// Retos de funciones de Bitlandia. Cada reto se describe una vez en la representación neutral
// de levelgen.js y se genera código idiomático en los 10 lenguajes. Todos tienen sentido dentro
// del juego: la tienda, los combates, el equipo, la Bitdex...
import { fn, num, bool, V, B, not, idx, len, call, mget, shas, let_, set, op, if_, for_, each, while_, ret, swap, minc, sadd } from '../../curriculum/levelgen.js';

const P = (n) => [n, 'int'];
const PB = (n) => [n, 'bool'];
const A = (n) => [n, 'arr'];
const AM = (n) => [n, 'arrMut'];

export const FUNCTION_LEVELS = [
  // ═════════════ Capítulo 1 · Fundamentos ═════════════
  {
    id: 'f-golpe', title: 'Golpe en cadena', xp: 60,
    story: 'Tu daemon ataca varias veces seguidas. El marcador de combate necesita una función que calcule el daño total, y el bug la ha dejado devolviendo siempre 0.',
    objective: 'Escribe golpeTotal(ataque, golpes): el daño total es el ataque de cada golpe por el número de golpes.',
    lesson: [
      {
        title: 'Una función es una máquina con entrada y salida', visual: 'boxes',
        text: 'Una función es un trozo de código con nombre. Recibe datos (los parámetros, entre paréntesis), hace un cálculo y devuelve un resultado con return. Se escribe una vez y se usa todas las veces que haga falta: el marcador de combate llamará a golpeTotal en cada ataque.',
        example: fn('doble', [P('x')], 'int', [ret(B('*', V('x'), num(2)))]),
      },
      {
        title: 'Los parámetros son variables que te dan hechas', visual: 'boxes',
        text: 'Dentro de la función, ataque y golpes ya tienen valor: el que le pase quien la llame. Por ejemplo, golpeTotal(12, 3) se ejecuta con ataque = 12 y golpes = 3, y debe devolver 36. Tú solo escribes el cálculo.',
      },
    ],
    todo: 'devuelve ataque multiplicado por golpes',
    hint: 'Multiplica los dos parámetros (ataque * golpes) y devuelve el resultado con return.',
    fns: [fn('golpeTotal', [P('ataque'), P('golpes')], 'int', [ret(B('*', V('ataque'), V('golpes')))])],
    tests: [[[12, 3], 36], [[0, 5], 0], [[7, 7], 49], [[25, 4], 100]],
  },
  {
    id: 'f-cafe', title: 'Un café reparador', xp: 60,
    story: 'Un café recupera vida a tu daemon. El bug ha roto la función que suma la curación a la vida actual.',
    objective: 'Escribe vidaTrasCafe(vida, cura): la vida después de tomar el café es la vida actual más la cura.',
    lesson: [{
      title: 'Operaciones con números', visual: 'boxes',
      text: 'Los ordenadores calculan con los operadores de siempre: + suma, - resta y * multiplica. El resultado de una operación se puede devolver directamente con return, sin guardarlo antes en una variable.',
      example: fn('vidaTrasGolpe', [P('vida'), P('golpe')], 'int', [ret(B('-', V('vida'), V('golpe')))]),
    }],
    todo: 'suma la cura a la vida',
    hint: 'Devuelve vida + cura.',
    fns: [fn('vidaTrasCafe', [P('vida'), P('cura')], 'int', [ret(B('+', V('vida'), V('cura')))])],
    tests: [[[30, 25], 55], [[0, 25], 25], [[100, 0], 100], [[1, 9], 10]],
  },
  {
    id: 'f-experiencia', title: 'La fórmula de la experiencia', xp: 70,
    story: 'En Bitlandia, para subir del nivel n al siguiente hacen falta 40 + 30 × n puntos de experiencia. Es la fórmula que usa de verdad este juego... y el bug la ha borrado.',
    objective: 'Escribe experienciaParaSubir(nivel): devuelve 40 + 30 × nivel.',
    lesson: [{
      title: 'El orden de las operaciones', visual: 'boxes',
      text: 'Como en matemáticas, la multiplicación va antes que la suma: 40 + 30 * 2 da 100, no 140. Si quieres que la suma vaya primero, usa paréntesis: (40 + 30) * 2 da 140. Lee la fórmula con cuidado antes de escribirla.',
      example: fn('media', [P('a'), P('b')], 'int', [ret(B('/', B('+', V('a'), V('b')), num(2)))]),
    }],
    todo: 'devuelve la experiencia necesaria para subir de nivel',
    hint: 'La multiplicación se hace antes que la suma: return 40 + 30 * nivel.',
    fns: [fn('experienciaParaSubir', [P('nivel')], 'int', [ret(B('+', num(40), B('*', num(30), V('nivel'))))])],
    tests: [[[1], 70], [[5], 190], [[10], 340], [[0], 40]],
  },
  {
    id: 'f-compra', title: 'La cuenta de la tienda', xp: 70,
    story: 'En la tienda del Centro Daemon, un café cuesta 40 bits y un expreso 120. La caja registradora se ha estropeado.',
    objective: 'Escribe precioCompra(cafes, expresos): lo que cuesta comprar esos cafés (40 bits cada uno) y esos expresos (120 bits cada uno).',
    lesson: [{
      title: 'Variables intermedias', visual: 'boxes',
      text: 'Cuando un cálculo tiene varias partes, guárdalas en variables con buen nombre: primero lo que cuestan los cafés, luego lo que cuestan los expresos, y al final las sumas. El código se lee como una explicación y es más fácil encontrar errores.',
      example: fn('minutos', [P('horas')], 'int', [let_('total', 'int', B('*', V('horas'), num(60))), ret(V('total'))]),
    }],
    todo: 'calcula el coste de los cafés y de los expresos y súmalos',
    hint: 'Guarda costeCafes = cafes * 40 y costeExpresos = expresos * 120, y devuelve la suma de las dos.',
    fns: [fn('precioCompra', [P('cafes'), P('expresos')], 'int', [
      let_('costeCafes', 'int', B('*', V('cafes'), num(40))),
      let_('costeExpresos', 'int', B('*', V('expresos'), num(120))),
      ret(B('+', V('costeCafes'), V('costeExpresos'))),
    ])],
    tests: [[[3, 0], 120], [[0, 2], 240], [[2, 1], 200], [[5, 5], 800]],
  },
  {
    id: 'f-cuantos', title: '¿Cuántos cafés me llegan?', xp: 80,
    story: 'Tienes unos bits ahorrados y cada café cuesta 40. No se puede comprar medio café: ¿cuántos cafés enteros puedes llevarte?',
    objective: 'Escribe cafesQuePuedesComprar(bits): cuántos cafés enteros de 40 bits puedes comprar.',
    lesson: [{
      title: 'División entera', visual: 'division',
      text: 'Al dividir dos números enteros, muchos lenguajes descartan los decimales: 100 / 40 da 2, no 2,5. En Python el operador para eso es // y en JavaScript se usa Math.floor. Es justo lo que necesitas para contar cosas que no se pueden partir.',
      example: fn('mitad', [P('n')], 'int', [ret(B('/', V('n'), num(2)))]),
    }],
    todo: 'divide los bits entre el precio de un café (división entera)',
    hint: 'Divide bits entre 40 con división entera.',
    fns: [fn('cafesQuePuedesComprar', [P('bits')], 'int', [ret(B('/', V('bits'), num(40)))])],
    tests: [[[100], 2], [[40], 1], [[39], 0], [[400], 10]],
  },
  {
    id: 'f-cambio', title: 'El cambio', xp: 80,
    story: 'Después de comprar todos los cafés que puedes, te sobran algunos bits. La caja tiene que devolverte el cambio exacto.',
    objective: 'Escribe bitsDeVuelta(bits): los bits que sobran después de comprar todos los cafés de 40 bits que se puedan.',
    lesson: [{
      title: 'El resto de una división: %', visual: 'modulo',
      text: 'El operador % (módulo) da lo que sobra de una división entera: 100 % 40 es 20, porque caben 2 cafés (80 bits) y sobran 20. Si la división es exacta, el resto es 0. Lo usarás muchísimo: para repartir, para saber si un número es par, para dar vueltas...',
      example: fn('restoEntreTres', [P('n')], 'int', [ret(B('%', V('n'), num(3)))]),
    }],
    todo: 'devuelve los bits que sobran',
    hint: 'El resto de dividir bits entre 40: bits % 40.',
    fns: [fn('bitsDeVuelta', [P('bits')], 'int', [ret(B('%', V('bits'), num(40)))])],
    tests: [[[100], 20], [[40], 0], [[39], 39], [[85], 5]],
  },

  // ═════════════ Capítulo 2 · Control de flujo ═════════════
  {
    id: 'f-entreno', title: 'El entrenamiento de Kai', xp: 90,
    story: 'Kai entrena a su daemon cada día: el primer día gana 10 puntos de experiencia, el segundo 20, el tercero 30... ¿Cuánta experiencia acumula en total?',
    objective: 'Escribe entrenamiento(dias): la suma de 10 × día para cada día desde el 1 hasta dias (ambos incluidos).',
    lesson: [
      {
        title: 'Un bucle repite trabajo', visual: 'loop',
        text: 'Un bucle for repite un bloque de código para cada valor de un rango. En cada vuelta la variable del bucle (aquí, dia) toma el siguiente valor. Así no tienes que escribir diez veces lo mismo.',
        example: fn('sumaHasta', [P('n')], 'int', [let_('total', 'int', num(0), true), for_('i', num(1), V('n'), [op('total', '+', V('i'))], true), ret(V('total'))]),
      },
      {
        title: 'Cuidado con los extremos del rango', visual: 'rangeEnds',
        text: 'El error más común con los bucles es dar una vuelta de más o de menos. Aquí los días van del 1 al número de días, los dos incluidos. Fíjate bien en cómo escribe tu lenguaje un rango que incluye el último número.',
      },
    ],
    todo: 'suma 10 × día para cada día del entrenamiento',
    hint: 'Empieza con total = 0. Recorre dia desde 1 hasta dias (incluido) y suma 10 * dia en cada vuelta.',
    requires: ['loop'],
    fns: [fn('entrenamiento', [P('dias')], 'int', [let_('total', 'int', num(0), true), for_('dia', num(1), V('dias'), [op('total', '+', B('*', num(10), V('dia')))], true), ret(V('total'))])],
    tests: [[[1], 10], [[3], 60], [[0], 0], [[10], 550]],
  },
  {
    id: 'f-eficaz', title: '¡Es muy eficaz!', xp: 90,
    story: 'Cuando un ataque es eficaz contra el tipo del rival, hace el doble de daño. Si no, hace el daño normal.',
    objective: 'Escribe danoFinal(dano, esEficaz): si esEficaz es verdadero, devuelve el doble del daño; si no, el daño tal cual.',
    lesson: [{
      title: 'Decidir con if y else', visual: 'branch',
      text: 'if comprueba una condición: si es verdadera, se ejecuta su bloque; si no, se ejecuta el bloque de else. Un booleano (verdadero o falso) ya es una condición, así que puedes escribir directamente if (esEficaz).',
      example: fn('valorAbsoluto', [P('x')], 'int', [if_(B('<', V('x'), num(0)), [ret(B('-', num(0), V('x')))]), ret(V('x'))]),
    }],
    todo: 'devuelve el doble si el ataque es eficaz',
    hint: 'Si esEficaz es verdadero, devuelve dano * 2. Si no, devuelve dano.',
    fns: [fn('danoFinal', [P('dano'), PB('esEficaz')], 'int', [if_(V('esEficaz'), [ret(B('*', V('dano'), num(2)))]), ret(V('dano'))])],
    tests: [[[10, true], 20], [[10, false], 10], [[0, true], 0], [[7, true], 14]],
  },
  {
    id: 'f-turno', title: '¿A quién le toca?', xp: 90,
    story: 'En los combates de entrenamiento, tú atacas en los turnos pares y Kai en los impares.',
    objective: 'Escribe esTurnoDeKai(turno): verdadero si el turno es impar.',
    lesson: [{
      title: 'Booleanos y comparaciones', visual: 'modulo',
      text: 'Una comparación (==, !=, <, >, <=, >=) da un booleano: verdadero o falso. Se puede devolver directamente. Para saber si un número es impar, mira el resto de dividirlo entre 2: si turno % 2 es 1, es impar.',
      example: fn('esMayorDeEdad', [P('edad')], 'bool', [ret(B('>=', V('edad'), num(18)))]),
    }],
    todo: 'devuelve si el turno es impar',
    hint: 'Devuelve el resultado de comparar turno % 2 con 1.',
    fns: [fn('esTurnoDeKai', [P('turno')], 'bool', [ret(B('==', B('%', V('turno'), num(2)), num(1)))])],
    tests: [[[1], true], [[2], false], [[7], true], [[10], false]],
  },
  {
    id: 'f-fuerte', title: 'El más fuerte de tres', xp: 90,
    story: 'Antes de un combate importante eliges a tu daemon con más ataque de entre tres candidatos.',
    objective: 'Escribe masFuerte(a, b, c): devuelve el mayor de los tres ataques.',
    lesson: [{
      title: 'Varias decisiones seguidas', visual: 'branch',
      text: 'Una técnica sencilla: guarda el primero como «el mejor hasta ahora» y compara con los demás uno a uno. Cada if solo cambia el mejor si encuentra uno mayor. Al final, el mejor es el mayor de todos.',
      example: fn('mayorDeDos', [P('a'), P('b')], 'int', [if_(B('>', V('a'), V('b')), [ret(V('a'))]), ret(V('b'))]),
    }],
    todo: 'devuelve el mayor de a, b y c',
    hint: 'mejor = a. Si b > mejor, mejor = b. Si c > mejor, mejor = c. Devuelve mejor.',
    fns: [fn('masFuerte', [P('a'), P('b'), P('c')], 'int', [
      let_('mejor', 'int', V('a'), true),
      if_(B('>', V('b'), V('mejor')), [set('mejor', V('b'))]),
      if_(B('>', V('c'), V('mejor')), [set('mejor', V('c'))]),
      ret(V('mejor')),
    ])],
    tests: [[[3, 9, 4], 9], [[10, 2, 7], 10], [[1, 2, 30], 30], [[5, 5, 5], 5]],
  },
  {
    id: 'f-curar', title: 'Curar sin pasarse', xp: 100,
    story: 'Cada café cura 25 puntos de vida, pero un daemon nunca puede tener más vida que su máximo. El bug deja que la vida se pase del límite.',
    objective: 'Escribe vidaConCafes(vida, cafes, maximo): toma los cafés de uno en uno (cada uno +25) sin que la vida supere el máximo.',
    lesson: [{
      title: 'Bucles y condiciones juntos', visual: 'loop',
      text: 'Dentro de un bucle puedes poner un if: en cada vuelta sumas la cura y, si te has pasado del máximo, lo dejas en el máximo. Así se programan casi todas las reglas de un juego: repetir algo y vigilar los límites.',
    }],
    todo: 'suma 25 por cada café sin pasar del máximo',
    hint: 'Repite cafes veces: vida += 25 y, si vida > maximo, vida = maximo. Devuelve vida.',
    requires: ['loop'],
    fns: [fn('vidaConCafes', [P('vida'), P('cafes'), P('maximo')], 'int', [
      let_('v', 'int', V('vida'), true),
      for_('i', num(0), V('cafes'), [op('v', '+', num(25)), if_(B('>', V('v'), V('maximo')), [set('v', V('maximo'))])]),
      ret(V('v')),
    ])],
    tests: [[[10, 1, 100], 35], [[90, 1, 100], 100], [[0, 3, 62], 62], [[40, 0, 80], 40], [[5, 2, 100], 55]],
  },
  {
    id: 'f-encuentros', title: 'Pasos peligrosos', xp: 100,
    story: 'En la hierba alta del bosque salta un bug en cada paso múltiplo de 3 y también en cada paso múltiplo de 5. ¿Cuántos encuentros tendrás?',
    objective: 'Escribe encuentros(pasos): cuántos números del 1 al pasos son múltiplo de 3 o de 5.',
    lesson: [{
      title: 'Condiciones combinadas: y / o', visual: 'modulo',
      text: 'Puedes unir condiciones: «o» (|| u or) es verdadero si se cumple al menos una; «y» (&& o and) solo si se cumplen las dos. Para contar, empieza un contador en 0 y súmale 1 cada vez que se cumpla la condición.',
    }],
    todo: 'cuenta los pasos múltiplo de 3 o de 5',
    hint: 'Recorre paso desde 1 hasta pasos (incluido). Si paso % 3 == 0 o paso % 5 == 0, suma 1 al contador.',
    requires: ['loop'],
    fns: [fn('encuentros', [P('pasos')], 'int', [
      let_('total', 'int', num(0), true),
      for_('paso', num(1), V('pasos'), [if_(B('||', B('==', B('%', V('paso'), num(3)), num(0)), B('==', B('%', V('paso'), num(5)), num(0))), [op('total', '+', num(1))])], true),
      ret(V('total')),
    ])],
    tests: [[[10], 5], [[2], 0], [[15], 7], [[5], 2]],
  },
  {
    id: 'f-turnos', title: '¿Cuántos turnos?', xp: 110,
    story: 'Para planear un combate necesitas saber cuántos turnos tardarás en dejar sin vida al bug si cada turno le quitas siempre lo mismo.',
    objective: 'Escribe turnosParaGanar(vida, dano): cuántos turnos hacen falta para que la vida llegue a 0 o menos (dano siempre es mayor que 0).',
    lesson: [{
      title: 'while: repetir mientras se cumpla algo', visual: 'loop',
      text: 'Cuando no sabes cuántas vueltas hará falta, usa while: repite el bloque mientras la condición sea verdadera. Dentro del bucle algo tiene que cambiar para que, tarde o temprano, la condición deje de cumplirse. Si no, el bucle no termina nunca.',
      example: fn('mitades', [P('n')], 'int', [let_('pasos', 'int', num(0), true), let_('x', 'int', V('n'), true), while_(B('>', V('x'), num(1)), [op('x', '/', num(2)), op('pasos', '+', num(1))]), ret(V('pasos'))]),
    }],
    todo: 'cuenta los turnos hasta que la vida llegue a 0',
    hint: 'turnos = 0. Mientras la vida sea mayor que 0: réstale dano y suma 1 a turnos.',
    requires: ['loop'],
    fns: [fn('turnosParaGanar', [P('vida'), P('dano')], 'int', [
      let_('v', 'int', V('vida'), true),
      let_('turnos', 'int', num(0), true),
      while_(B('>', V('v'), num(0)), [op('v', '-', V('dano')), op('turnos', '+', num(1))]),
      ret(V('turnos')),
    ])],
    tests: [[[100, 30], 4], [[60, 20], 3], [[1, 50], 1], [[0, 10], 0]],
  },
  {
    id: 'f-primo', title: 'La clave del cortafuegos', xp: 120,
    story: 'Los cortafuegos de Bitlandia solo aceptan claves que sean números primos: números que solo se pueden dividir entre 1 y entre sí mismos.',
    objective: 'Escribe esPrimo(clave): verdadero si la clave es un número primo.',
    lesson: [{
      title: 'Salir antes de tiempo con return', visual: 'branch',
      text: 'Dentro de un bucle, return termina la función en ese mismo momento. Es perfecto para buscar: en cuanto encuentras un divisor, ya sabes que no es primo y no hace falta seguir. Si el bucle termina sin encontrar ninguno, es primo.',
      example: fn('tieneUnSiete', [P('n')], 'bool', [let_('x', 'int', V('n'), true), while_(B('>', V('x'), num(0)), [if_(B('==', B('%', V('x'), num(10)), num(7)), [ret(bool(true))]), op('x', '/', num(10))]), ret(bool(false))]),
    }],
    todo: 'devuelve si la clave es un número primo',
    hint: 'Si la clave es menor que 2, no es primo. Prueba divisores i desde 2 mientras i * i <= clave: si clave % i == 0, devuelve falso. Al final, verdadero.',
    requires: ['loop'],
    fns: [fn('esPrimo', [P('clave')], 'bool', [
      if_(B('<', V('clave'), num(2)), [ret(bool(false))]),
      let_('i', 'int', num(2), true),
      while_(B('<=', B('*', V('i'), V('i')), V('clave')), [if_(B('==', B('%', V('clave'), V('i')), num(0)), [ret(bool(false))]), op('i', '+', num(1))]),
      ret(bool(true)),
    ])],
    tests: [[[2], true], [[1], false], [[17], true], [[21], false], [[97], true], [[100], false]],
  },

  // ═════════════ Capítulo 3 · Estructuras de datos ═════════════
  {
    id: 'f-equipo-vida', title: 'La vida del equipo', xp: 110,
    story: 'Antes de entrar en un gimnasio quieres saber cuánta vida tiene tu equipo entero. Las vidas de tus daemons están guardadas en una lista.',
    objective: 'Escribe vidaDelEquipo(vidas): la suma de todas las vidas de la lista.',
    lesson: [
      {
        title: 'Una lista guarda muchos valores', visual: 'array',
        text: 'Una lista (array) es una fila de cajas, una detrás de otra. Cada caja tiene una posición (su índice) y las posiciones empiezan en 0: en [30, 45, 12], el 30 está en la posición 0 y el 12 en la 2.',
      },
      {
        title: 'Recorrer una lista', visual: 'array',
        text: 'Con un bucle puedes visitar todos los elementos, uno a uno. Para sumar, empieza con total = 0 y en cada vuelta suma el elemento actual. Una lista vacía suma 0.',
        example: fn('contarElementos', [A('valores')], 'int', [let_('cuantos', 'int', num(0), true), each('v', 'valores', [op('cuantos', '+', num(1))]), ret(V('cuantos'))]),
      },
    ],
    todo: 'suma todas las vidas',
    hint: 'total = 0; recorre la lista y suma cada vida; devuelve total.',
    requires: ['loop'],
    fns: [fn('vidaDelEquipo', [A('vidas')], 'int', [let_('total', 'int', num(0), true), each('v', 'vidas', [op('total', '+', V('v'))]), ret(V('total'))])],
    tests: [[[[30, 45, 12]], 87], [[[]], 0], [[[50]], 50], [[[1, 2, 3, 4]], 10]],
  },
  {
    id: 'f-nivel-max', title: 'El veterano', xp: 110,
    story: 'Para el examen del gimnasio quieres sacar a tu daemon de mayor nivel. Los niveles de tu equipo están en una lista (nunca vacía).',
    objective: 'Escribe nivelMasAlto(niveles): el mayor nivel de la lista.',
    lesson: [{
      title: 'El campeón provisional', visual: 'array',
      text: 'Para encontrar el mayor, empieza suponiendo que el primero es el campeón. Recorre el resto: si alguno es mayor, pasa a ser el nuevo campeón. Al terminar, el campeón es el mayor de todos. No empieces en 0: si todos los valores fueran negativos, fallaría.',
    }],
    todo: 'devuelve el nivel más alto',
    hint: 'mejor = niveles[0]. Para cada nivel, si es mayor que mejor, mejor = nivel.',
    requires: ['loop'],
    fns: [fn('nivelMasAlto', [A('niveles')], 'int', [let_('mejor', 'int', idx('niveles', num(0)), true), each('nivel', 'niveles', [if_(B('>', V('nivel'), V('mejor')), [set('mejor', V('nivel'))])]), ret(V('mejor'))])],
    tests: [[[[4, 12, 7]], 12], [[[3]], 3], [[[9, 2, 9, 1]], 9], [[[1, 2, 3, 15]], 15]],
  },
  {
    id: 'f-debilitados', title: 'Daemons debilitados', xp: 110,
    story: 'La enfermera del Centro Daemon pregunta cuántos de tus daemons están debilitados (con 0 de vida).',
    objective: 'Escribe debilitados(vidas): cuántas vidas de la lista son 0.',
    lesson: [{
      title: 'Contar con condición', visual: 'array',
      text: 'Para contar los elementos que cumplen algo, combina lo que ya sabes: un contador que empieza en 0, un bucle que recorre la lista y un if que suma 1 solo cuando se cumple la condición.',
    }],
    todo: 'cuenta las vidas que valen 0',
    hint: 'Recorre la lista y suma 1 al contador cuando la vida sea 0.',
    requires: ['loop'],
    fns: [fn('debilitados', [A('vidas')], 'int', [let_('cuantos', 'int', num(0), true), each('v', 'vidas', [if_(B('==', V('v'), num(0)), [op('cuantos', '+', num(1))])]), ret(V('cuantos'))])],
    tests: [[[[0, 30, 0, 12]], 2], [[[]], 0], [[[5, 5]], 0], [[[0]], 1]],
  },
  {
    id: 'f-posicion', title: '¿Dónde está?', xp: 120,
    story: 'Tu equipo es una lista con los números de Bitdex de tus daemons. Quieres saber en qué posición está uno concreto para sacarlo a combatir.',
    objective: 'Escribe posicionEnEquipo(equipo, numero): la posición de numero en la lista, o -1 si no está.',
    lesson: [{
      title: 'Buscar por posición', visual: 'array',
      text: 'Cuando necesitas la posición (y no solo el valor), recorre los índices: i va de 0 hasta la longitud menos 1, y equipo[i] es el elemento de esa posición. En cuanto lo encuentres, devuelve i. Si terminas el bucle sin encontrarlo, devuelve -1: es la forma habitual de decir «no está».',
    }],
    todo: 'devuelve la posición del número o -1',
    hint: 'Recorre i desde 0 hasta la longitud. Si equipo[i] == numero, devuelve i. Al final, devuelve -1.',
    fns: [fn('posicionEnEquipo', [A('equipo'), P('numero')], 'int', [for_('i', num(0), len('equipo'), [if_(B('==', idx('equipo', V('i')), V('numero')), [ret(V('i'))])]), ret(num(-1))])],
    tests: [[[[7, 3, 12, 5], 12], 2], [[[7, 3, 12, 5], 7], 0], [[[7, 3, 12, 5], 9], -1], [[[], 1], -1]],
  },
  {
    id: 'f-invertir', title: 'Del revés', xp: 120,
    story: 'Para sorprender al líder del gimnasio vas a sacar a tus daemons en el orden contrario. Hay que dar la vuelta a la lista del equipo sin crear otra.',
    objective: 'Escribe invertirEquipo(equipo): invierte el orden de la lista EN SU SITIO.',
    lesson: [{
      title: 'Intercambiar desde los extremos', visual: 'swap',
      text: 'Para dar la vuelta a una lista sin crear otra, intercambia el primero con el último, el segundo con el penúltimo... y para en la mitad: si sigues, lo vuelves a dejar como estaba. El último índice es la longitud menos 1.',
      example: fn('cambiarExtremos', [AM('valores')], 'void', [swap('valores', num(0), B('-', len('valores'), num(1)))]),
    }],
    todo: 'invierte la lista intercambiando elementos',
    hint: 'Recorre i desde 0 hasta la mitad de la longitud e intercambia equipo[i] con equipo[longitud - 1 - i].',
    fns: [fn('invertirEquipo', [AM('equipo')], 'void', [for_('i', num(0), B('/', len('equipo'), num(2)), [swap('equipo', V('i'), B('-', B('-', len('equipo'), num(1)), V('i')))])])],
    tests: [[[[1, 2, 3, 4, 5]], [5, 4, 3, 2, 1]], [[[1, 2, 3, 4]], [4, 3, 2, 1]], [[[9]], [9]], [[[]], []]],
  },
  {
    id: 'f-burbuja', title: 'Ordenar el equipo', xp: 140,
    story: 'Quieres ver tu equipo ordenado de menor a mayor nivel. Nada de pedírselo a la librería: vas a ordenar tú.',
    objective: 'Escribe ordenarPorNivel(niveles): ordena la lista de menor a mayor EN SU SITIO, sin usar sort().',
    lesson: [{
      title: 'Ordenación de burbuja', visual: 'bubble',
      text: 'Recorre la lista comparando cada elemento con el siguiente: si están al revés, los intercambias. Tras una pasada completa, el mayor ha «subido» al final como una burbuja. Repite las pasadas (cada vez hace falta llegar un poco menos lejos) hasta que todo quede ordenado.',
    }],
    todo: 'ordena la lista con el método de la burbuja',
    hint: 'Dos bucles: i desde 0 hasta la longitud y, dentro, j desde 0 hasta longitud - 1 - i. Si niveles[j] > niveles[j + 1], intercámbialos.',
    requires: ['nosort'],
    fns: [fn('ordenarPorNivel', [AM('niveles')], 'void', [
      for_('i', num(0), len('niveles'), [
        for_('j', num(0), B('-', B('-', len('niveles'), num(1)), V('i')), [
          if_(B('>', idx('niveles', V('j')), idx('niveles', B('+', V('j'), num(1)))), [swap('niveles', V('j'), B('+', V('j'), num(1)))]),
        ]),
      ]),
    ])],
    tests: [[[[5, 2, 8, 1, 9, 3]], [1, 2, 3, 5, 8, 9]], [[[3, 3, 1]], [1, 3, 3]], [[[1]], [1]], [[[4, 3, 2, 1]], [1, 2, 3, 4]]],
  },
  {
    id: 'f-tipo-comun', title: 'El tipo más común', xp: 150,
    story: 'Ingrid ha apuntado el tipo de cada bug que ha visto en el lago (cada tipo es un número del 0 al 9). Quiere saber qué tipo abunda más.',
    objective: 'Escribe tipoMasComun(tipos): el valor que más se repite (si empatan, el que aparece antes en la lista).',
    lesson: [{
      title: 'Contar con un diccionario', visual: 'counter',
      text: 'Un diccionario (mapa) guarda pares clave → valor. Aquí la clave es el tipo y el valor, cuántas veces ha aparecido. Una primera pasada cuenta cada tipo; una segunda busca el tipo con el contador más alto.',
      example: fn('vecesQueAparece', [A('valores'), P('buscado')], 'int', [let_('cuenta', 'map', null, false, 10), each('v', 'valores', [minc('cuenta', V('v'))]), ret(mget('cuenta', V('buscado')))]),
    }],
    todo: 'devuelve el tipo que más se repite',
    hint: 'Cuenta cada tipo en un diccionario. Después recorre la lista y quédate con el tipo de mayor contador (solo cambia si es estrictamente mayor).',
    fns: [fn('tipoMasComun', [A('tipos')], 'int', [
      let_('cuenta', 'map', null, false, 10),
      each('t', 'tipos', [minc('cuenta', V('t'))]),
      let_('mejor', 'int', idx('tipos', num(0)), true),
      each('t', 'tipos', [if_(B('>', mget('cuenta', V('t')), mget('cuenta', V('mejor'))), [set('mejor', V('t'))])]),
      ret(V('mejor')),
    ])],
    tests: [[[[3, 1, 3, 2, 3, 1]], 3], [[[5]], 5], [[[1, 2, 2, 1, 1]], 1], [[[0, 9, 9]], 9]],
  },
  {
    id: 'f-especies', title: 'Especies distintas', xp: 150,
    story: 'Tienes la lista de números de Bitdex de todos los bugs que has visto (del 0 al 99), con muchos repetidos. ¿Cuántas especies distintas has visto?',
    objective: 'Escribe especiesDistintas(vistos): cuántos valores diferentes hay en la lista.',
    lesson: [{
      title: 'Conjuntos: sin repetidos', visual: 'seen',
      text: 'Un conjunto guarda valores sin repetirlos y responde al instante si un valor ya está dentro. Recorre la lista: si el número es nuevo, lo añades al conjunto y sumas 1 a las especies distintas.',
      example: fn('hayRepetido', [A('valores')], 'bool', [let_('vistos', 'set', null, false, 100), each('x', 'valores', [if_(shas('vistos', V('x')), [ret(bool(true))]), sadd('vistos', V('x'))]), ret(bool(false))]),
    }],
    todo: 'cuenta los valores distintos',
    hint: 'Usa un conjunto: si un número no está, añádelo y suma 1.',
    fns: [fn('especiesDistintas', [A('vistos')], 'int', [
      let_('conjunto', 'set', null, false, 100),
      let_('distintas', 'int', num(0), true),
      each('x', 'vistos', [if_(not(shas('conjunto', V('x'))), [sadd('conjunto', V('x')), op('distintas', '+', num(1))])]),
      ret(V('distintas')),
    ])],
    tests: [[[[4, 4, 7, 1, 7]], 3], [[[]], 0], [[[5, 5, 5]], 1], [[[1, 2, 3, 4]], 4]],
  },

  // ═════════════ Capítulo 5 · Sistemas ═════════════
  {
    id: 'f-turno-circular', title: 'Turnos en círculo', xp: 130,
    story: 'En un combate por equipos, los daemons atacan por turnos: 0, 1, 2... y después del último le vuelve a tocar al 0. Así funcionan también los buffers circulares de memoria.',
    objective: 'Escribe siguienteTurno(turno, jugadores): a quién le toca después de turno (tras el último, vuelve el 0).',
    lesson: [{
      title: 'Dar la vuelta con %', visual: 'modulo',
      text: 'Los sistemas reutilizan memoria con buffers circulares: al pasar del final se vuelve al principio. El operador % hace exactamente eso: (turno + 1) % jugadores es turno + 1, salvo cuando llega a jugadores, que da 0.',
      example: fn('turnoAnterior', [P('turno'), P('jugadores')], 'int', [ret(B('%', B('+', V('turno'), B('-', V('jugadores'), num(1))), V('jugadores')))]),
    }],
    todo: 'devuelve el siguiente turno, volviendo al 0 tras el último',
    hint: 'Suma 1 al turno y quédate con el resto de dividir entre jugadores.',
    fns: [fn('siguienteTurno', [P('turno'), P('jugadores')], 'int', [ret(B('%', B('+', V('turno'), num(1)), V('jugadores')))])],
    tests: [[[0, 3], 1], [[2, 3], 0], [[5, 6], 0], [[1, 4], 2]],
  },
  {
    id: 'f-bits', title: 'Interruptores encendidos', xp: 140,
    story: 'El panel del Gimnasio Núcleo guarda el estado de sus interruptores en un número: cada bit a 1 es un interruptor encendido. Kernel quiere saber cuántos hay encendidos.',
    objective: 'Escribe contarBits(n): cuántos unos tiene n escrito en binario (13 = 1101 → 3).',
    lesson: [{
      title: 'Ver un número en binario', visual: 'division',
      text: 'En binario, n % 2 es el último bit (0 o 1) y n / 2 lo quita, igual que % 10 y / 10 hacen con las cifras normales. Repitiéndolo mientras quede número, recorres todos los bits.',
      example: fn('ultimoBit', [P('n')], 'int', [ret(B('%', V('n'), num(2)))]),
    }],
    todo: 'cuenta los bits a 1 de n',
    hint: 'Copia n en x. Mientras x > 0: suma x % 2 al contador y divide x entre 2.',
    fns: [fn('contarBits', [P('n')], 'int', [
      let_('unos', 'int', num(0), true),
      let_('x', 'int', V('n'), true),
      while_(B('>', V('x'), num(0)), [op('unos', '+', B('%', V('x'), num(2))), op('x', '/', num(2))]),
      ret(V('unos')),
    ])],
    tests: [[[13], 3], [[0], 0], [[8], 1], [[255], 8]],
  },
  {
    id: 'f-potencia-dos', title: 'Bloques de memoria', xp: 150,
    story: 'El Centro Daemon reparte la memoria de sus máquinas en bloques de 1, 2, 4, 8, 16... unidades. Kernel quiere validar cada petición de memoria.',
    objective: 'Escribe esPotenciaDeDos(n): verdadero si n es 1, 2, 4, 8, 16...',
    lesson: [{
      title: 'Por qué las potencias de dos', visual: 'widths',
      text: 'La memoria se organiza en potencias de dos porque así funciona el binario. Un número es potencia de dos si, dividiéndolo entre 2 una y otra vez mientras sea par, acaba en 1. Los números menores que 1 nunca lo son.',
      example: fn('quitarPares', [P('n')], 'int', [let_('x', 'int', V('n'), true), while_(B('&&', B('>', V('x'), num(0)), B('==', B('%', V('x'), num(2)), num(0))), [op('x', '/', num(2))]), ret(V('x'))]),
    }],
    todo: 'comprueba si n es potencia de dos',
    hint: 'Si n < 1, falso. Copia n en x y divídelo entre 2 mientras sea par. Es potencia de dos si x acaba valiendo 1.',
    fns: [fn('esPotenciaDeDos', [P('n')], 'bool', [
      if_(B('<', V('n'), num(1)), [ret(bool(false))]),
      let_('x', 'int', V('n'), true),
      while_(B('==', B('%', V('x'), num(2)), num(0)), [op('x', '/', num(2))]),
      ret(B('==', V('x'), num(1))),
    ])],
    tests: [[[1], true], [[16], true], [[12], false], [[0], false], [[1024], true], [[100], false]],
  },

  // ═════════════ Capítulo 6 · Funciones y recursión ═════════════
  {
    id: 'f-cifras', title: 'La suma de control', xp: 130,
    story: 'Cada entrada de la Bitdex lleva una suma de control: la suma de las cifras de su número secreto. Si no coincide, la entrada está corrupta.',
    objective: 'Escribe sumaCifras(n): la suma de las cifras de n (123 → 6).',
    lesson: [{
      title: 'Desmontar un número', visual: 'division',
      text: 'n % 10 es la última cifra de n y n / 10 (división entera) la quita: de 123 sacas el 3 y te queda 12. Repite mientras quede número y habrás visitado todas las cifras. Es la preparación para pensar problemas «por partes».',
      example: fn('ultimaCifra', [P('n')], 'int', [ret(B('%', V('n'), num(10)))]),
    }],
    todo: 'suma las cifras de n',
    hint: 'Copia n en x. Mientras x > 0: suma x % 10 al total y haz x = x / 10.',
    fns: [fn('sumaCifras', [P('n')], 'int', [
      let_('total', 'int', num(0), true),
      let_('x', 'int', V('n'), true),
      while_(B('>', V('x'), num(0)), [op('total', '+', B('%', V('x'), num(10))), op('x', '/', num(10))]),
      ret(V('total')),
    ])],
    tests: [[[123], 6], [[0], 0], [[9999], 36], [[1005], 6]],
  },
  {
    id: 'f-ordenes', title: '¿De cuántas formas?', xp: 140,
    story: 'Antes de un combate puedes elegir el orden en que salen tus daemons. Con 3 daemons hay 3 × 2 × 1 = 6 órdenes posibles. ¿Y con n?',
    objective: 'Escribe ordenesPosibles(n) usando RECURSIÓN: n × (n - 1) × ... × 1, y 1 si n es 0 o 1.',
    lesson: [
      {
        title: 'Recursión: una función que se llama a sí misma', visual: 'stack',
        text: 'Una función recursiva resuelve un problema usando la respuesta del mismo problema un poco más pequeño: los órdenes de 4 daemons son 4 × los órdenes de 3. La función se llama a sí misma con n - 1.',
        example: fn('cuentaAtras', [P('n')], 'int', [if_(B('<=', V('n'), num(0)), [ret(num(0))]), ret(B('+', num(1), call('cuentaAtras', B('-', V('n'), num(1)))))]),
      },
      {
        title: 'Siempre hace falta un caso base', visual: 'stack',
        text: 'Si la función solo se llamara a sí misma, no pararía nunca. El caso base es la pregunta que se responde directamente, sin volver a llamarse: con 0 o 1 daemons solo hay 1 orden posible.',
      },
    ],
    todo: 'calcula los órdenes posibles con recursión',
    hint: 'Si n <= 1 devuelve 1 (caso base). Si no, devuelve n * ordenesPosibles(n - 1).',
    requires: ['recursion'],
    fns: [fn('ordenesPosibles', [P('n')], 'int', [if_(B('<=', V('n'), num(1)), [ret(num(1))]), ret(B('*', V('n'), call('ordenesPosibles', B('-', V('n'), num(1)))))])],
    tests: [[[0], 1], [[1], 1], [[3], 6], [[5], 120], [[10], 3628800]],
  },
  {
    id: 'f-potencia', title: 'El Amplificón', xp: 150,
    story: 'Un Amplificón multiplica su poder por la misma cantidad en cada turno. Si empieza con 1 y en cada turno se multiplica por base, ¿qué poder tiene tras exp turnos?',
    objective: 'Escribe potencia(base, exp) con RECURSIÓN: base elevado a exp.',
    lesson: [{
      title: 'Pensar en recursivo', visual: 'stack',
      text: 'Piensa así: base elevado a exp es base × (base elevado a exp - 1). Y cualquier número elevado a 0 es 1: ese es el caso base. Primero escribe el caso base y después la llamada con un problema más pequeño.',
    }],
    todo: 'calcula la potencia con recursión',
    hint: 'Si exp == 0 devuelve 1. Si no, devuelve base * potencia(base, exp - 1).',
    requires: ['recursion'],
    fns: [fn('potencia', [P('base'), P('exp')], 'int', [if_(B('==', V('exp'), num(0)), [ret(num(1))]), ret(B('*', V('base'), call('potencia', V('base'), B('-', V('exp'), num(1)))))])],
    tests: [[[2, 10], 1024], [[5, 0], 1], [[3, 4], 81], [[7, 1], 7]],
  },
  {
    id: 'f-fibonacci', title: 'La espiral de Rémi', xp: 160,
    story: 'Rémi cultiva Espiralis: cada generación tiene tantos como las dos generaciones anteriores juntas (0, 1, 1, 2, 3, 5, 8...). Es la sucesión de Fibonacci.',
    objective: 'Escribe fibonacci(n): el número de la generación n (fibonacci(0) = 0, fibonacci(1) = 1).',
    lesson: [{
      title: 'Avanzar con dos variables', visual: 'loop',
      text: 'La versión recursiva de Fibonacci repite muchísimos cálculos. Es mejor avanzar con dos variables: a y b son los dos últimos números; en cada paso el siguiente es a + b y las dos variables avanzan una posición. Recursión no siempre es la mejor herramienta.',
    }],
    todo: 'calcula el número n de la sucesión',
    hint: 'a = 0, b = 1. Repite n veces: siguiente = a + b; a = b; b = siguiente. Devuelve a.',
    fns: [fn('fibonacci', [P('n')], 'int', [
      let_('a', 'int', num(0), true),
      let_('b', 'int', num(1), true),
      for_('i', num(0), V('n'), [let_('siguiente', 'int', B('+', V('a'), V('b'))), set('a', V('b')), set('b', V('siguiente'))]),
      ret(V('a')),
    ])],
    tests: [[[0], 0], [[1], 1], [[10], 55], [[20], 6765]],
  },
  {
    id: 'f-mcd', title: 'Lotes iguales', xp: 170,
    story: 'Rémi quiere repartir a cafés y b expresos en lotes iguales, lo más grandes posible y sin que sobre nada. El tamaño del lote es el máximo común divisor de a y b.',
    objective: 'Escribe mcd(a, b) con el algoritmo de Euclides (recursivo).',
    lesson: [{
      title: 'Euclides: un algoritmo de hace 2300 años', visual: 'stack',
      text: 'El máximo común divisor de a y b es el mismo que el de b y a % b. Cada llamada hace los números más pequeños, hasta que b vale 0: entonces la respuesta es a. Es uno de los algoritmos más antiguos que se siguen usando.',
    }],
    todo: 'calcula el máximo común divisor con recursión',
    hint: 'Si b == 0 devuelve a. Si no, devuelve mcd(b, a % b).',
    requires: ['recursion'],
    fns: [fn('mcd', [P('a'), P('b')], 'int', [if_(B('==', V('b'), num(0)), [ret(V('a'))]), ret(call('mcd', V('b'), B('%', V('a'), V('b'))))])],
    tests: [[[12, 18], 6], [[17, 5], 1], [[100, 75], 25], [[7, 0], 7]],
  },

  // ═════════════ Capítulo 7 · Algoritmos ═════════════
  {
    id: 'f-ordenado', title: 'El ranking', xp: 150,
    story: 'La tabla de récords de la Cumbre debería estar ordenada de menor a mayor tiempo. Antes de publicarla, hay que comprobarlo.',
    objective: 'Escribe estaOrdenado(tiempos): verdadero si cada tiempo es menor o igual que el siguiente.',
    lesson: [{
      title: 'Comparar vecinos', visual: 'array',
      text: 'Una lista está ordenada si ningún elemento es mayor que el que tiene justo a su derecha. Basta con recorrerla comparando cada pareja de vecinos: en cuanto una esté al revés, ya sabes la respuesta. Una lista vacía o de un elemento está ordenada.',
    }],
    todo: 'comprueba si la lista está ordenada',
    hint: 'Recorre i desde 1: si tiempos[i - 1] > tiempos[i], devuelve falso. Al final, verdadero.',
    fns: [fn('estaOrdenado', [A('tiempos')], 'bool', [for_('i', num(1), len('tiempos'), [if_(B('>', idx('tiempos', B('-', V('i'), num(1))), idx('tiempos', V('i'))), [ret(bool(false))])]), ret(bool(true))])],
    tests: [[[[1, 2, 2, 5]], true], [[[3, 1]], false], [[[]], true], [[[7]], true], [[[1, 3, 2]], false]],
  },
  {
    id: 'f-segundo', title: 'El suplente', xp: 160,
    story: 'Si tu daemon más fuerte se debilita, sale el segundo más fuerte. Quieres saber su ataque en una sola pasada por la lista.',
    objective: 'Escribe segundoMejor(ataques): el segundo valor más grande (la lista tiene al menos 2 valores, todos distintos).',
    lesson: [{
      title: 'Llevar dos récords a la vez', visual: 'array',
      text: 'Guarda el primero y el segundo mejor. Cuando llega uno mayor que el primero, el antiguo primero baja a segundo. Si solo supera al segundo, sustituye al segundo. Una sola pasada, sin ordenar nada.',
    }],
    todo: 'devuelve el segundo mayor en una sola pasada',
    hint: 'primero y segundo con los dos primeros valores (el mayor en primero). Desde el tercero: si x > primero, segundo = primero y primero = x; si no, si x > segundo, segundo = x.',
    fns: [fn('segundoMejor', [A('ataques')], 'int', [
      let_('primero', 'int', idx('ataques', num(0)), true),
      let_('segundo', 'int', idx('ataques', num(1)), true),
      if_(B('>', V('segundo'), V('primero')), [let_('t', 'int', V('primero')), set('primero', V('segundo')), set('segundo', V('t'))]),
      for_('i', num(2), len('ataques'), [
        if_(B('>', idx('ataques', V('i')), V('primero')), [set('segundo', V('primero')), set('primero', idx('ataques', V('i')))],
          [if_(B('>', idx('ataques', V('i')), V('segundo')), [set('segundo', idx('ataques', V('i')))])]),
      ]),
      ret(V('segundo')),
    ])],
    tests: [[[[5, 1, 9, 3]], 5], [[[2, 8]], 2], [[[10, 9, 8, 7]], 9], [[[1, 2, 3, 4, 5]], 4]],
  },
  {
    id: 'f-binaria', title: 'Buscar en la Bitdex', xp: 180,
    story: 'La Bitdex completa de Bitlandia tiene miles de números ORDENADOS. Mirarlos uno a uno es lento: hay que partir el problema por la mitad.',
    objective: 'Escribe buscarEnBitdex(numeros, buscado) sobre una lista ordenada: la posición de buscado, o -1 si no está.',
    lesson: [{
      title: 'Partir por la mitad: búsqueda binaria', visual: 'grid',
      text: 'Mira el elemento del medio. Si es el que buscas, ya está. Si es menor, el buscado solo puede estar en la mitad derecha; si es mayor, en la izquierda. Cada paso descarta la mitad: con un millón de elementos bastan unos 20 pasos. Solo funciona si la lista está ordenada.',
    }],
    todo: 'busca partiendo la lista por la mitad',
    hint: 'bajo = 0, alto = longitud - 1. Mientras bajo <= alto: medio = (bajo + alto) / 2. Si numeros[medio] == buscado, devuelve medio; si es menor, bajo = medio + 1; si no, alto = medio - 1. Al final, -1.',
    requires: ['loop'],
    fns: [fn('buscarEnBitdex', [A('numeros'), P('buscado')], 'int', [
      let_('bajo', 'int', num(0), true),
      let_('alto', 'int', B('-', len('numeros'), num(1)), true),
      while_(B('<=', V('bajo'), V('alto')), [
        let_('medio', 'int', B('/', B('+', V('bajo'), V('alto')), num(2))),
        if_(B('==', idx('numeros', V('medio')), V('buscado')), [ret(V('medio'))],
          [if_(B('<', idx('numeros', V('medio')), V('buscado')), [set('bajo', B('+', V('medio'), num(1)))], [set('alto', B('-', V('medio'), num(1)))])]),
      ]),
      ret(num(-1)),
    ])],
    tests: [[[[1, 3, 5, 7, 9, 11], 7], 3], [[[1, 3, 5, 7, 9, 11], 1], 0], [[[1, 3, 5, 7, 9, 11], 4], -1], [[[2, 4], 4], 1], [[[5], 5], 0]],
  },
  {
    id: 'f-racha', title: 'La mejor racha', xp: 190,
    story: 'Kai ha apuntado cuántos bits ganó o perdió cada día. Quiere presumir de su mejor racha: el tramo de días seguidos con más bits ganados en total.',
    objective: 'Escribe mejorRacha(bitsPorDia): la mayor suma de un tramo seguido de la lista (que no está vacía).',
    lesson: [{
      title: 'El algoritmo de Kadane', visual: 'bars',
      text: 'Recorre la lista llevando la mejor suma que termina en el día actual: o continúas la racha anterior (actual + valor) o empiezas una nueva en este día, lo que sea mayor. A la vez guardas la mejor racha vista. Una sola pasada.',
    }],
    todo: 'calcula la mayor suma de días seguidos',
    hint: 'actual = mejor = bitsPorDia[0]. Para cada día siguiente: si actual + valor > valor, actual += valor; si no, actual = valor. Si actual > mejor, mejor = actual.',
    fns: [fn('mejorRacha', [A('bitsPorDia')], 'int', [
      let_('mejor', 'int', idx('bitsPorDia', num(0)), true),
      let_('actual', 'int', idx('bitsPorDia', num(0)), true),
      for_('i', num(1), len('bitsPorDia'), [
        if_(B('>', B('+', V('actual'), idx('bitsPorDia', V('i'))), idx('bitsPorDia', V('i'))), [op('actual', '+', idx('bitsPorDia', V('i')))], [set('actual', idx('bitsPorDia', V('i')))]),
        if_(B('>', V('actual'), V('mejor')), [set('mejor', V('actual'))]),
      ]),
      ret(V('mejor')),
    ])],
    tests: [[[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6], [[[1, 2, 3]], 6], [[[-3, -1, -2]], -1], [[[5, -9, 6]], 6]],
  },
  {
    id: 'f-insercion', title: 'Como las cartas', xp: 190,
    story: 'Kai ordena su equipo por nivel como quien ordena cartas en la mano: coge cada daemon y lo desliza hacia la izquierda hasta su sitio.',
    objective: 'Escribe ordenarPorInsercion(niveles): ordena la lista de menor a mayor EN SU SITIO, sin usar sort().',
    lesson: [{
      title: 'Ordenación por inserción', visual: 'bubble',
      text: 'Recorre desde el segundo elemento. Cada uno se intercambia con su vecino de la izquierda mientras ese vecino sea mayor. Así, todo lo que queda a la izquierda está siempre ordenado. Si la lista ya está casi ordenada, es rapidísimo.',
    }],
    todo: 'ordena la lista por inserción',
    hint: 'Para i desde 1: j = i; mientras j > 0 y niveles[j - 1] > niveles[j], intercambia niveles[j - 1] y niveles[j] y resta 1 a j.',
    requires: ['nosort'],
    fns: [fn('ordenarPorInsercion', [AM('niveles')], 'void', [
      for_('i', num(1), len('niveles'), [
        let_('j', 'int', V('i'), true),
        while_(B('&&', B('>', V('j'), num(0)), B('>', idx('niveles', B('-', V('j'), num(1))), idx('niveles', V('j')))), [swap('niveles', B('-', V('j'), num(1)), V('j')), op('j', '-', num(1))]),
      ]),
    ])],
    tests: [[[[5, 2, 8, 1, 9, 3]], [1, 2, 3, 5, 8, 9]], [[[3, 3, 1]], [1, 3, 3]], [[[1]], [1]], [[[4, 3, 2, 1]], [1, 2, 3, 4]]],
  },
];

/** El jefe final: la función es correcta desde el principio, pero es O(n²). */
export const BOSS_LEVEL = {
  id: 'f-enjambre', title: 'El Enjambre O(n²)', xp: 500,
  story: 'El Comandante Null suelta un enjambre de bugs, cada uno con un número de serie. Algunos son clones (números repetidos). El detector compara cada bug con todos los demás: funciona, pero con 1600 bugs hace más de un millón de comparaciones y el enjambre te arrolla.',
  objective: 'hayClones(ids) devuelve verdadero si algún número se repite. Ya funciona, pero es O(n²): reescríbela para que sea O(n). El juego mide las operaciones reales con 200, 400, 800 y 1600 bugs.',
  lesson: [
    {
      title: 'Contar el trabajo que hace tu código', visual: 'grid',
      text: 'La notación Big O describe cómo crece el trabajo cuando crecen los datos. Dos bucles anidados sobre n elementos hacen unas n × n comparaciones: si duplicas los bugs, el trabajo se multiplica por cuatro. Eso es O(n²).',
    },
    {
      title: 'Un conjunto recuerda lo que ya viste', visual: 'seen',
      text: 'Con un conjunto basta un solo recorrido: para cada bug preguntas «¿ya he visto este número?», que el conjunto responde al instante. Si sí, hay clon; si no, lo apuntas. Eso es O(n): el doble de bugs, el doble de trabajo.',
      example: fn('cuentaDistintos', [A('ids')], 'int', [let_('vistos', 'set', null, false, 100), let_('distintos', 'int', num(0), true), each('x', 'ids', [if_(not(shas('vistos', V('x'))), [sadd('vistos', V('x')), op('distintos', '+', num(1))])]), ret(V('distintos'))]),
    },
    {
      title: 'Por qué importa', visual: 'bars',
      text: 'Con 1600 bugs, O(n²) son más de un millón de comparaciones; O(n), unas 1600. Los programas de verdad trabajan con millones de datos: elegir bien el algoritmo es la diferencia entre una respuesta instantánea y una que no llega nunca.',
    },
  ],
  hint: 'Usa un conjunto de vistos. Recorre ids: si el número ya está en el conjunto, devuelve verdadero; si no, añádelo. Al final, falso.',
  slow: fn('hayClones', [A('ids')], 'bool', [
    for_('i', num(0), len('ids'), [
      for_('j', B('+', V('i'), num(1)), len('ids'), [if_(B('==', idx('ids', V('i')), idx('ids', V('j'))), [ret(bool(true))])]),
    ]),
    ret(bool(false)),
  ]),
  fast: fn('hayClones', [A('ids')], 'bool', [
    let_('vistos', 'set', null, false, 5000),
    each('x', 'ids', [if_(shas('vistos', V('x')), [ret(bool(true))]), sadd('vistos', V('x'))]),
    ret(bool(false)),
  ]),
};
