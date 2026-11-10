// Niveles de práctica: cada uno se describe una vez (IR) y se genera para los 3 mundos.
// Cada nivel trae explicación, ejemplo en el lenguaje del mundo, casos de prueba y pistas.
// Los nombres van en castellano para distinguir bien lo que inventas tú (los nombres)
// de lo que pone el lenguaje (if, for, return…).
import { fn, num, bool, V, B, idx, len, let_, set, op, if_, for_, each, while_, ret } from './levelgen.js';

const P = (n) => [n, 'int'];
const PB = (n) => [n, 'bool'];
const A = (n) => [n, 'arr'];

/* eslint-disable max-len */
export const DRILLS = [
  // ───────────── Funciones: máquinas con nombre ─────────────
  {
    id: 'fn-combustible', title: 'Consumo de Combustible', codename: 'FN.FUEL', xp: 50,
    story: 'El ordenador de navegación necesita saber cuánto combustible gastará la nave en cada salto.',
    objective: 'Completa combustible(distancia, porKm): el combustible total es la distancia multiplicada por lo que gasta en cada kilómetro.',
    teach: {
      title: 'Funciones: una máquina con entrada y salida', visual: 'boxes',
      text: 'Una función es una pequeña máquina con nombre. Le das datos (los parámetros, entre paréntesis), hace un cálculo y te devuelve un resultado con return. La escribes una vez y la puedes usar todas las veces que quieras. En esta misión la máquina ya está montada: solo tienes que cambiar lo que devuelve.',
      example: fn('doble', [P('x')], 'int', [ret(B('*', V('x'), num(2)))]),
    },
    todo: 'devuelve distancia multiplicada por porKm',
    hint: 'Multiplica los dos parámetros con * y devuelve el resultado con return.',
    fns: [fn('combustible', [P('distancia'), P('porKm')], 'int', [ret(B('*', V('distancia'), V('porKm')))])],
    tests: [[[10, 3], 30], [[0, 5], 0], [[7, 7], 49], [[125, 4], 500]],
  },
  {
    id: 'fn-kelvin', title: 'Sensor Térmico', codename: 'FN.KELVIN', xp: 50,
    story: 'Los sensores del casco miden en grados Celsius, pero el reactor trabaja en Kelvin.',
    objective: 'Completa kelvin(celsius): los Kelvin son los grados Celsius más 273.',
    teach: {
      title: 'Operaciones con números', visual: 'boxes',
      text: 'Los ordenadores calculan con los operadores de siempre: + suma, - resta, * multiplica. El resultado de una operación se puede devolver directamente con return, sin guardarlo antes en una variable.',
      example: fn('sumaDiez', [P('x')], 'int', [ret(B('+', V('x'), num(10)))]),
    },
    todo: 'convierte los grados Celsius a Kelvin',
    hint: 'Suma 273 al parámetro.',
    fns: [fn('kelvin', [P('celsius')], 'int', [ret(B('+', V('celsius'), num(273)))])],
    tests: [[[0], 273], [[100], 373], [[-273], 0], [[27], 300]],
  },
  {
    id: 'fn-perimetro', title: 'Valla del Hangar', codename: 'FN.PERIM', xp: 50,
    story: 'Hay que rodear el hangar con una valla de seguridad. ¿Cuántos metros de valla hacen falta?',
    objective: 'Completa perimetro(ancho, alto): el perímetro de un rectángulo es 2 veces la suma del ancho y el alto.',
    teach: {
      title: 'Los paréntesis mandan', visual: 'boxes',
      text: 'Como en matemáticas, la multiplicación va antes que la suma: 2 * 3 + 4 da 10. Si quieres que se sume primero, usa paréntesis: 2 * (3 + 4) da 14.',
      example: fn('triple', [P('a'), P('b')], 'int', [ret(B('*', num(3), B('+', V('a'), V('b'))))]),
    },
    todo: 'devuelve el perímetro del rectángulo',
    hint: 'Suma ancho y alto entre paréntesis y multiplica por 2.',
    fns: [fn('perimetro', [P('ancho'), P('alto')], 'int', [ret(B('*', num(2), B('+', V('ancho'), V('alto'))))])],
    tests: [[[3, 4], 14], [[10, 10], 40], [[1, 7], 16], [[0, 5], 10]],
  },
  {
    id: 'fn-segundos', title: 'Reloj de Misión', codename: 'FN.TIME', xp: 50,
    story: 'El reloj de la misión marca minutos y segundos, pero el sistema de lanzamiento solo entiende segundos.',
    objective: 'Completa aSegundos(minutos, segundos): pasa todo a segundos (un minuto son 60 segundos).',
    teach: {
      title: 'Cálculos en varios pasos', visual: 'boxes',
      text: 'Cuando un cálculo tiene varios pasos, puedes guardar cada paso en una variable con un buen nombre. Así el código se lee casi como una frase: primero calculas una parte y luego la usas.',
      example: fn('aMinutos', [P('horas')], 'int', [let_('minutos', 'int', B('*', V('horas'), num(60))), ret(V('minutos'))]),
    },
    todo: 'pasa los minutos a segundos y súmales los segundos',
    hint: 'minutos * 60 son los segundos de los minutos; después súmale segundos.',
    fns: [fn('aSegundos', [P('minutos'), P('segundos')], 'int', [ret(B('+', B('*', V('minutos'), num(60)), V('segundos')))])],
    tests: [[[1, 30], 90], [[0, 45], 45], [[10, 0], 600], [[2, 5], 125]],
  },
  {
    id: 'fn-reparto', title: 'Reparto de Celdas', codename: 'FN.DIV', xp: 60,
    story: 'Hay que repartir las celdas de energía entre los motores a partes iguales. Las celdas no se pueden partir.',
    objective: 'Completa celdasPorMotor(celdas, motores): cuántas celdas enteras le tocan a cada motor.',
    teach: {
      title: 'División sin decimales', visual: 'division',
      text: 'Hay cosas que no se pueden partir: 7 celdas entre 2 motores son 3 para cada uno (y sobra una). A eso se le llama división entera: la que se queda solo con la parte entera. Fíjate en el ejemplo para ver cómo se escribe en tu lenguaje.',
      example: fn('mitad', [P('n')], 'int', [ret(B('/', V('n'), num(2)))]),
    },
    todo: 'reparte las celdas en partes enteras',
    hint: 'Divide celdas entre motores con la división entera, igual que en el ejemplo.',
    fns: [fn('celdasPorMotor', [P('celdas'), P('motores')], 'int', [ret(B('/', V('celdas'), V('motores')))])],
    tests: [[[1000, 3], 333], [[10, 2], 5], [[7, 7], 1], [[5, 10], 0]],
  },
  {
    id: 'fn-sobrante', title: 'Celdas de Reserva', codename: 'FN.MOD', xp: 60,
    story: 'Tras repartir las celdas entre los motores, las que sobran se guardan en la reserva.',
    objective: 'Completa celdasSobrantes(celdas, motores): cuántas celdas sobran después del reparto.',
    teach: {
      title: 'El resto: lo que sobra', visual: 'modulo',
      text: 'El operador % devuelve lo que sobra de una división entera: 7 % 3 da 1, porque 3 cabe 2 veces en 7 y sobra 1. Parece poca cosa, pero se usa muchísimo: para repartir, para saber si un número es par, para dar vueltas en círculo…',
      example: fn('ultimaCifra', [P('n')], 'int', [ret(B('%', V('n'), num(10)))]),
    },
    todo: 'devuelve las celdas que sobran',
    hint: 'Usa el operador % entre celdas y motores.',
    fns: [fn('celdasSobrantes', [P('celdas'), P('motores')], 'int', [ret(B('%', V('celdas'), V('motores')))])],
    tests: [[[1000, 3], 1], [[10, 2], 0], [[7, 4], 3], [[5, 10], 5]],
  },

  // ───────────── Decisiones: if / else ─────────────
  {
    id: 'if-adulto', title: 'Licencia de Piloto', codename: 'IF.AGE', xp: 60,
    story: 'Para pilotar una lanzadera hay que tener 18 años o más. El control de acceso lo comprueba con tu código.',
    objective: 'Completa puedePilotar(edad): devuelve verdadero si edad es 18 o más, y falso si no.',
    teach: {
      title: 'Comparar: verdadero o falso', visual: 'branch',
      text: 'Una comparación es una pregunta que el ordenador responde con verdadero o falso: > mayor, < menor, >= mayor o igual, <= menor o igual, == igual. Ese sí/no es un valor más (se llama booleano) y se puede devolver directamente con return.',
      example: fn('esPositivo', [P('n')], 'bool', [ret(B('>', V('n'), num(0)))]),
    },
    todo: 'devuelve si edad es 18 o más',
    hint: 'Devuelve directamente la comparación: edad >= 18.',
    fns: [fn('puedePilotar', [P('edad')], 'bool', [ret(B('>=', V('edad'), num(18)))])],
    tests: [[[18], true], [[17], false], [[30], true], [[5], false]],
  },
  {
    id: 'if-par', title: 'Turnos de Guardia', codename: 'IF.EVEN', xp: 70,
    story: 'Los turnos pares vigila el escuadrón azul y los impares el rojo. El sistema necesita saber de quién es cada turno.',
    objective: 'Completa esPar(n): devuelve verdadero si n es par y falso si es impar.',
    teach: {
      title: '¿Par o impar? Pregúntale al resto', visual: 'modulo',
      text: 'Un número es par si al dividirlo entre 2 no sobra nada, es decir, si n % 2 es 0. Para preguntar «¿es igual a…?» se usan dos signos igual seguidos (un solo = sirve para guardar un valor, no para comparar).',
      example: fn('acabaEnCero', [P('n')], 'bool', [ret(B('==', B('%', V('n'), num(10)), num(0)))]),
    },
    todo: 'devuelve si n es par',
    hint: 'Un número es par si el resto de dividirlo entre 2 es 0.',
    fns: [fn('esPar', [P('n')], 'bool', [ret(B('==', B('%', V('n'), num(2)), num(0)))])],
    tests: [[[4], true], [[7], false], [[0], true], [[13], false]],
  },
  {
    id: 'if-entrada', title: 'Billete a la Estación', codename: 'IF.ELIF', xp: 80,
    story: 'El billete a la estación orbital no cuesta lo mismo para todos: los menores de 12 años pagan 5 créditos, los de 65 o más pagan 6 y el resto paga 10.',
    objective: 'Completa precioBillete(edad): 5 si edad es menor que 12, 6 si es 65 o más, y 10 en cualquier otro caso.',
    teach: {
      title: 'Varios caminos: si… si no, si… si no', visual: 'branch',
      text: 'Con if eliges un camino según una condición. Si hay más de dos caminos, se encadenan: el ordenador prueba las condiciones en orden, de arriba abajo, y entra SOLO en la primera que se cumple. El else final recoge todo lo que no ha entrado en ninguna.',
      example: fn('nivelBateria', [P('carga')], 'int', [if_(B('<', V('carga'), num(20)), [ret(num(1))], [if_(B('<', V('carga'), num(80)), [ret(num(2))], [ret(num(3))])])]),
    },
    todo: 'devuelve 5, 6 o 10 según la edad',
    hint: 'Primero pregunta si edad < 12 (devuelve 5); si no, si edad >= 65 (devuelve 6); y si no, devuelve 10.',
    fns: [fn('precioBillete', [P('edad')], 'int', [if_(B('<', V('edad'), num(12)), [ret(num(5))], [if_(B('>=', V('edad'), num(65)), [ret(num(6))], [ret(num(10))])])])],
    tests: [[[8], 5], [[12], 10], [[30], 10], [[65], 6], [[80], 6], [[11], 5]],
  },
  {
    id: 'if-mayor3', title: 'El Escudo Más Fuerte', codename: 'IF.MAX', xp: 80,
    story: 'Tres escudos marcan su energía. El sistema de defensa debe activar el más potente.',
    objective: 'Completa mayorDeTres(a, b, c): devuelve el mayor de los tres números.',
    teach: {
      title: 'El campeón provisional', visual: 'branch',
      text: 'Un truco muy usado para encontrar el mayor: supón que el primero es el campeón y guárdalo en una variable. Después compara con cada uno de los demás: si alguno lo supera, pasa a ser el nuevo campeón.',
      example: fn('mayorDeDos', [P('a'), P('b')], 'int', [let_('mejor', 'int', V('a'), true), if_(B('>', V('b'), V('mejor')), [set('mejor', V('b'))]), ret(V('mejor'))]),
    },
    todo: 'devuelve el mayor de a, b y c',
    hint: 'Guarda a como «mejor» y compáralo con b y luego con c.',
    fns: [fn('mayorDeTres', [P('a'), P('b'), P('c')], 'int', [
      let_('mejor', 'int', V('a'), true),
      if_(B('>', V('b'), V('mejor')), [set('mejor', V('b'))]),
      if_(B('>', V('c'), V('mejor')), [set('mejor', V('c'))]),
      ret(V('mejor')),
    ])],
    tests: [[[1, 2, 3], 3], [[9, 4, 7], 9], [[5, 8, 2], 8], [[4, 4, 4], 4], [[-1, -5, -3], -1]],
  },
  {
    id: 'if-despegue', title: 'Permiso de Despegue', codename: 'IF.AND', xp: 80,
    story: 'La torre de control solo autoriza el despegue si hay combustible suficiente Y los escudos están activos. Con una sola cosa no basta.',
    objective: 'Completa puedeDespegar(combustible, escudosActivos): verdadero solo si combustible es 50 o más y, además, escudosActivos es verdadero.',
    teach: {
      title: 'Unir condiciones: «y» / «o»', visual: 'branch',
      text: 'Puedes juntar dos preguntas en una. Con «y» tienen que cumplirse las dos; con «o» basta con que se cumpla una. Mira en el ejemplo cómo se escribe «y» en tu lenguaje.',
      example: fn('enRango', [P('x')], 'bool', [ret(B('&&', B('>=', V('x'), num(1)), B('<=', V('x'), num(10))))]),
    },
    todo: 'devuelve si se cumplen las dos condiciones',
    hint: 'Une las dos condiciones con «y»: combustible >= 50 y escudosActivos.',
    fns: [fn('puedeDespegar', [P('combustible'), PB('escudosActivos')], 'bool', [ret(B('&&', B('>=', V('combustible'), num(50)), V('escudosActivos')))])],
    tests: [[[80, true], true], [[80, false], false], [[20, true], false], [[50, true], true], [[0, false], false]],
  },

  // ───────────── Bucles: repetir sin cansarse ─────────────
  {
    id: 'loop-suma', title: 'Acumulador de Energía', codename: 'LOOP.SUM', xp: 80,
    story: 'Cada segundo el colector capta un poco más de energía: 1, luego 2, luego 3… ¿Cuánto lleva tras n segundos?',
    objective: 'Completa sumaHasta(n): la suma 1 + 2 + … + n.',
    teach: {
      title: 'Acumular dentro de un bucle', visual: 'loop',
      text: 'Para sumar muchos números se usa un acumulador: una variable que empieza en 0 y a la que, en cada vuelta del bucle, le sumas algo. Es como una hucha: cada vuelta echas una moneda y al acabar miras cuánto hay.',
      example: fn('contarHasta', [P('n')], 'int', [let_('cuenta', 'int', num(0), true), for_('i', num(0), V('n'), [op('cuenta', '+', num(1))]), ret(V('cuenta'))]),
    },
    todo: 'suma los números del 1 al n',
    hint: 'Empieza con total = 0 y recorre de 1 a n (incluido) sumando cada número al total.',
    requires: ['loop'],
    fns: [fn('sumaHasta', [P('n')], 'int', [let_('total', 'int', num(0), true), for_('i', num(1), V('n'), [op('total', '+', V('i'))], true), ret(V('total'))])],
    tests: [[[5], 15], [[1], 1], [[10], 55], [[100], 5050]],
  },
  {
    id: 'loop-multiplos', title: 'Radar de Frecuencias', codename: 'LOOP.MULT', xp: 90,
    story: 'El radar solo escucha las frecuencias que son múltiplo de 3 o de 5. ¿Cuántas hay entre 1 y n?',
    objective: 'Completa contarMultiplos(n): cuántos números del 1 al n son múltiplo de 3 o de 5.',
    teach: {
      title: 'Un if dentro de un bucle', visual: 'loop',
      text: 'Dentro de un bucle puedes poner un if: así, en cada vuelta, el programa decide si ese número cuenta o no. Un contador es un acumulador que solo suma 1 cuando se cumple la condición. Recuerda: un número es múltiplo de 3 si al dividirlo entre 3 no sobra nada.',
      example: fn('contarPares', [P('n')], 'int', [let_('cuenta', 'int', num(0), true), for_('i', num(1), V('n'), [if_(B('==', B('%', V('i'), num(2)), num(0)), [op('cuenta', '+', num(1))])], true), ret(V('cuenta'))]),
    },
    todo: 'cuenta los múltiplos de 3 o de 5 entre 1 y n',
    hint: 'Recorre de 1 a n y suma 1 al contador cuando i % 3 == 0 «o» i % 5 == 0.',
    requires: ['loop'],
    fns: [fn('contarMultiplos', [P('n')], 'int', [
      let_('cuenta', 'int', num(0), true),
      for_('i', num(1), V('n'), [if_(B('||', B('==', B('%', V('i'), num(3)), num(0)), B('==', B('%', V('i'), num(5)), num(0))), [op('cuenta', '+', num(1))])], true),
      ret(V('cuenta')),
    ])],
    tests: [[[10], 5], [[15], 7], [[1], 0], [[30], 14]],
  },
  {
    id: 'loop-mitades', title: 'Batería a la Mitad', codename: 'WHILE.HALF', xp: 90,
    story: 'Cada salto al hiperespacio deja la batería a la mitad. La nave puede seguir saltando mientras le quede más de 1 unidad de energía.',
    objective: 'Completa saltosPosibles(energia): cuántas veces se puede dividir energia entre 2 (sin decimales) hasta que valga 1 o menos.',
    teach: {
      title: 'while: repetir mientras se cumpla algo', visual: 'loop',
      text: 'Cuando no sabes de antemano cuántas vueltas hacen falta, usa while: repite el bloque MIENTRAS la condición sea verdadera. Dentro del bucle algo tiene que cambiar para que, tarde o temprano, la condición deje de cumplirse. Si no, el bucle no acabaría nunca.',
      example: fn('cuantasCifras', [P('n')], 'int', [let_('cifras', 'int', num(1), true), let_('x', 'int', V('n'), true), while_(B('>=', V('x'), num(10)), [op('x', '/', num(10)), op('cifras', '+', num(1))]), ret(V('cifras'))]),
    },
    todo: 'cuenta cuántas veces se puede partir por la mitad',
    hint: 'Copia energia en una variable x y pon saltos = 0. Mientras x > 1: divide x entre 2 y suma 1 a saltos.',
    requires: ['loop'],
    fns: [fn('saltosPosibles', [P('energia')], 'int', [
      let_('saltos', 'int', num(0), true),
      let_('x', 'int', V('energia'), true),
      while_(B('>', V('x'), num(1)), [op('x', '/', num(2)), op('saltos', '+', num(1))]),
      ret(V('saltos')),
    ])],
    tests: [[[8], 3], [[1], 0], [[100], 6], [[2], 1], [[1000], 9]],
  },

  // ───────────── Listas: muchos datos en fila ─────────────
  {
    id: 'list-suma', title: 'Peso Total de la Carga', codename: 'LIST.SUM', xp: 90,
    story: 'Antes de despegar hay que sumar el peso de todos los contenedores de la bodega.',
    objective: 'Completa pesoTotal(pesos): la suma de todos los números de la lista.',
    teach: {
      title: 'Recorrer una lista', visual: 'array',
      text: 'Para visitar todos los elementos de una lista se usa un bucle que la recorre de principio a fin. En cada vuelta tienes un elemento en la mano: haz con él lo que necesites, por ejemplo echarlo a un acumulador.',
      example: fn('cuantosHay', [A('datos')], 'int', [let_('cuenta', 'int', num(0), true), each('d', 'datos', [op('cuenta', '+', num(1))]), ret(V('cuenta'))]),
    },
    todo: 'suma todos los pesos',
    hint: 'Acumulador a 0 y recorre la lista sumando cada peso.',
    requires: ['loop'],
    fns: [fn('pesoTotal', [A('pesos')], 'int', [let_('total', 'int', num(0), true), each('p', 'pesos', [op('total', '+', V('p'))]), ret(V('total'))])],
    tests: [[[[1, 2, 3]], 6], [[[]], 0], [[[10, 5, 7]], 22], [[[42]], 42]],
  },
  {
    id: 'list-max', title: 'El Contenedor Más Pesado', codename: 'LIST.MAX', xp: 90,
    story: 'La grúa necesita saber cuánto pesa el contenedor más pesado antes de levantarlo.',
    objective: 'Completa masPesado(pesos): el número más grande de la lista (la lista nunca está vacía).',
    teach: {
      title: 'El campeón provisional, ahora en una lista', visual: 'array',
      text: 'Es el mismo truco que con tres números, pero con todos los que haya: supón que el primero es el campeón y recorre la lista. Cada vez que encuentres uno que lo supere, ese pasa a ser el nuevo campeón.',
      example: fn('masLigero', [A('pesos')], 'int', [let_('mejor', 'int', idx('pesos', num(0)), true), each('p', 'pesos', [if_(B('<', V('p'), V('mejor')), [set('mejor', V('p'))])]), ret(V('mejor'))]),
    },
    todo: 'devuelve el peso más grande',
    hint: 'mejor = el primero de la lista; recorre y, si un peso es mayor que mejor, guárdalo.',
    requires: ['loop'],
    fns: [fn('masPesado', [A('pesos')], 'int', [let_('mejor', 'int', idx('pesos', num(0)), true), each('p', 'pesos', [if_(B('>', V('p'), V('mejor')), [set('mejor', V('p'))])]), ret(V('mejor'))])],
    tests: [[[[3, 9, 2]], 9], [[[-4, -2, -9]], -2], [[[5]], 5], [[[1, 8, 8, 3]], 8]],
  },
  {
    id: 'list-contar', title: 'Alarma de Sobrecarga', codename: 'LIST.COUNT', xp: 90,
    story: 'Los sensores avisan cuando un motor supera su límite de temperatura. ¿Cuántos motores están en zona roja?',
    objective: 'Completa contarCalientes(temperaturas, limite): cuántos valores de la lista son mayores que limite.',
    teach: {
      title: 'Contar solo los que cumplen', visual: 'array',
      text: 'Recorre la lista y pregunta con un if por cada elemento. Si cumple la condición, suma 1 al contador. Si no, no hagas nada y pasa al siguiente.',
      example: fn('contarCeros', [A('datos')], 'int', [let_('cuenta', 'int', num(0), true), each('d', 'datos', [if_(B('==', V('d'), num(0)), [op('cuenta', '+', num(1))])]), ret(V('cuenta'))]),
    },
    todo: 'cuenta los valores mayores que limite',
    hint: 'Contador a 0; por cada temperatura, si es mayor que limite, suma 1.',
    requires: ['loop'],
    fns: [fn('contarCalientes', [A('temperaturas'), P('limite')], 'int', [let_('cuenta', 'int', num(0), true), each('t', 'temperaturas', [if_(B('>', V('t'), V('limite')), [op('cuenta', '+', num(1))])]), ret(V('cuenta'))])],
    tests: [[[[5, 10, 15], 8], 2], [[[], 3], 0], [[[1, 2, 3], 3], 0], [[[4, 4, 9], 3], 3]],
  },
  {
    id: 'list-buscar', title: 'Localizador de Señales', codename: 'LIST.FIND', xp: 100,
    story: 'Buscamos la frecuencia de una baliza perdida en la lista de señales captadas.',
    objective: 'Completa posicionDe(senales, buscada): la posición de buscada en la lista, o -1 si no está.',
    teach: {
      title: 'Buscar por posición', visual: 'array',
      text: 'Cada elemento de una lista tiene un número de posición, y se empieza a contar en 0. Para saber DÓNDE está algo, recorre las posiciones con un contador i (0, 1, 2…). Si el elemento de la posición i es el que buscas, devuelve i. Si acabas el bucle sin encontrarlo, devuelve -1, que significa «no está».',
      example: fn('contiene', [A('datos'), P('buscado')], 'bool', [for_('i', num(0), len('datos'), [if_(B('==', idx('datos', V('i')), V('buscado')), [ret(bool(true))])]), ret(bool(false))]),
    },
    todo: 'devuelve la posición de buscada o -1',
    hint: 'Recorre i desde 0 hasta la longitud de la lista; si el elemento en i es igual a buscada, devuelve i. Al final, devuelve -1.',
    requires: ['loop'],
    fns: [fn('posicionDe', [A('senales'), P('buscada')], 'int', [for_('i', num(0), len('senales'), [if_(B('==', idx('senales', V('i')), V('buscada')), [ret(V('i'))])]), ret(num(-1))])],
    tests: [[[[4, 8, 15], 8], 1], [[[4, 8, 15], 4], 0], [[[4, 8, 15], 99], -1], [[[], 1], -1], [[[7, 7, 7], 7], 0]],
  },
];
