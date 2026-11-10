// Lecciones «Aprende primero»: antes de cada misión, una explicación visual paso a paso
// pensada para quien empieza desde cero. Cada paso tiene un texto sencillo, una
// animación (visual) y, si procede, un ejemplo en el lenguaje elegido.
// `langs` limita un paso a ciertos lenguajes; `mission` explica qué cambiar en la misión.
import jsPack from './js-pack.js';
import { DRILL_LESSONS } from './drill-challenges.js';
import { PROGRAM_LESSONS } from './programs.js';

export const LESSONS = {
  'm1-world-laws': {
    steps: [
      {
        title: 'Una variable es una caja con nombre',
        text: 'Programar empieza por guardar datos. Una variable es una caja: tiene una etiqueta (el nombre) y dentro guarda un valor. Cuando escribes gravedad = 9.81, el ordenador crea una caja llamada gravedad y mete dentro 9.81. A partir de ahí, cada vez que escribas gravedad, el programa usará ese valor.',
        visual: 'boxes',
        code: {
          python: 'gravedad = 9.81\nprint(gravedad)   # muestra 9.81',
          java: 'double gravedad = 9.81;\nSystem.out.println(gravedad); // 9.81',
          kotlin: 'val gravedad = 9.81\nprintln(gravedad) // 9.81',
          swift: 'let gravedad = 9.81\nprint(gravedad) // 9.81',
          c: 'double gravedad = 9.81;\nprintf("%f", gravedad); // 9.810000',
        },
      },
      {
        title: 'Cada caja tiene un tipo',
        text: 'No todas las cajas son iguales. El tipo dice qué puede guardar: números enteros (1200), números con decimales (9.81), sí/no (verdadero o falso) o texto ("Nova"). Si intentas meter un decimal en una caja de enteros, los decimales no caben: mira en la animación qué hace tu lenguaje en ese caso.',
        visual: 'typecut',
        code: {
          python: 'masa_nave = 1200      # int   → entero\ngravity = 9.81        # float → decimal\nshields_on = True     # bool  → sí / no\npilot_name = "Nova"   # str   → texto',
          java: 'int masaNave = 1200;          // entero\ndouble gravedad = 9.81;        // decimal\nboolean escudosActivos = true;     // sí / no\nString nombrePiloto = "Nova";    // texto',
          kotlin: 'val masaNave: Int = 1200          // entero\nval gravedad: Double = 9.81        // decimal\nval escudosActivos: Boolean = true     // sí / no\nval nombrePiloto: String = "Nova"    // texto',
          swift: 'let masaNave: Int = 1200         // entero\nlet gravedad: Double = 9.81       // decimal\nlet escudosActivos: Bool = true       // sí / no\nlet nombrePiloto: String = "Nova"   // texto',
          c: 'int masaNave = 1200;          // entero\ndouble gravedad = 9.81;        // decimal\nbool escudosActivos = true;        // sí / no (stdbool.h)\nchar nombrePiloto[] = "Nova";    // texto: array de char',
        },
      },
      {
        title: 'En C no existe el tipo «string»',
        text: 'C es un lenguaje de bajo nivel y no tiene un tipo para texto. Un texto es un array de caracteres (char): una fila de cajitas con una letra en cada una y, al final, un carácter especial \'\\0\' (el «terminador») que marca dónde acaba. Por eso "Nova" ocupa 5 cajas, no 4. Se declara con char nombre[] = "..." y C cuenta las cajas por ti. Si escribes string, el compilador no lo conoce.',
        visual: 'cstring',
        langs: ['c'],
        code: {
          c: 'char nombrePiloto[] = "Nova";\n// en memoria: \'N\' \'o\' \'v\' \'a\' \'\\0\'  → 5 bytes\n\nchar callsign[16] = "Nova";   // array de 16: sobra sitio\nprintf("%s\\n", nombrePiloto);    // %s imprime un texto\n\n// string nombrePiloto = "Nova";  ❌ unknown type name \'string\'',
        },
      },
      {
        title: 'Con comillas es texto; sin comillas, número',
        text: '"9.81" (entre comillas) es un texto que se parece a un número, como un número escrito en una pegatina. 9.81 (sin comillas) es un número de verdad con el que se puede calcular. El motor físico necesita multiplicar la gravedad por el tiempo, así que necesita el número.',
        visual: 'quotes',
      },
    ],
    mission: {
      python: 'La línea gravedad = "9.81" guarda texto. Quita las comillas para que sea un número decimal. Después añade una línea nueva al final: nombre_piloto = "tu nombre" (aquí sí van comillas, porque es texto).',
      java: 'gravedad está declarada como int (entero) y no puede guardar 9.81. Cambia int por double en esa línea. Luego, donde está el TODO, declara String nombrePiloto = "tu nombre";',
      kotlin: 'gravedad está declarada como Int (entero). Cambia Int por Double. Luego, donde está el TODO, añade val nombrePiloto: String = "tu nombre"',
      swift: 'gravedad está declarada como Int (entero). Cambia Int por Double. Luego, donde está el TODO, añade let nombrePiloto: String = "tu nombre"',
      c: 'int gravedad = 9.81 guarda solo 9 (C corta los decimales sin avisar). Cambia int por double. Si quieres que el printf la muestre bien, cambia %d por %f. Luego, donde está el TODO, declara el texto como un array de char: char nombrePiloto[] = "tu nombre"; (en C no existe el tipo string).',
    },
  },

  'm2-patrol': {
    steps: [
      {
        title: 'Un bucle repite un trozo de código',
        text: 'En vez de escribir seis veces lo mismo, un bucle for lo repite por ti. Usa un contador (normalmente se llama i) que empieza en 0 y sube de uno en uno. En cada vuelta, el código de dentro se ejecuta con un valor distinto de i.',
        visual: 'loop',
        code: {
          python: 'for i in range(3):\n    print(i)\n# 0\n# 1\n# 2',
          java: 'for (int i = 0; i < 3; i++) {\n    System.out.println(i);\n}\n// 0, 1, 2',
          kotlin: 'for (i in 0 until 3) {\n    println(i)\n}\n// 0, 1, 2',
          swift: 'for i in 0..<3 {\n    print(i)\n}\n// 0, 1, 2',
          c: 'for (int i = 0; i < 3; i++) {\n    printf("%d\\n", i);\n}\n// 0, 1, 2',
        },
      },
      {
        title: '¿El último número entra o no?',
        text: 'Es el error más común de la historia de la programación: dar una vuelta de más o de menos. Fíjate siempre en si el final del rango se incluye. Para 6 vueltas empezando en 0, i debe ir de 0 a 5.',
        visual: 'rangeEnds',
        code: {
          python: 'range(6)    # 0,1,2,3,4,5      → 6 vueltas ✅\nrange(7)    # 0,1,2,3,4,5,6    → 7 vueltas',
          java: 'i < 6       // 0..5  → 6 vueltas ✅\ni <= 6      // 0..6  → 7 vueltas',
          kotlin: '0 until 6   // 0..5  → 6 vueltas ✅\n0..6        // 0..6  → 7 vueltas (incluye el 6)',
          swift: '0..<6       // 0..5  → 6 vueltas ✅\n0...6       // 0..6  → 7 vueltas (incluye el 6)',
          c: 'i < 6       // 0..5  → 6 vueltas ✅\ni <= 6      // 0..6  → 7 vueltas',
        },
      },
      {
        title: 'Usa i para calcular posiciones',
        text: 'El contador sirve para calcular. Si cada baliza está 100 px más a la derecha que la anterior y la primera está en x = 80, la fórmula es x = 80 + i × 100. Comprueba la tabla: cada vuelta produce una baliza.',
        visual: 'table',
      },
    ],
    mission: {
      python: 'range(7) da 7 vueltas y la séptima baliza (x = 680) se sale de la zona. Cambia el 7 por un 6.',
      java: 'i <= 6 da 7 vueltas. Cámbialo por i < 6.',
      kotlin: '0..6 incluye el 6 (7 vueltas). Usa 0 until 6.',
      swift: '0...6 incluye el 6 (7 vueltas). Usa 0..<6.',
      c: 'i <= 6 da 7 vueltas. Cámbialo por i < 6.',
    },
  },

  'm2-zigzag': {
    steps: [
      {
        title: 'if: el programa toma decisiones',
        text: 'Un if es un cruce de caminos. Si la condición es verdadera, se ejecuta el primer bloque; si es falsa, se ejecuta el bloque else. Así un mismo programa puede comportarse distinto según la situación.',
        visual: 'branch',
        code: {
          python: 'if fuel > 50:\n    print("Vamos")\nelse:\n    print("Repostar")',
          java: 'if (fuel > 50) {\n    System.out.println("Vamos");\n} else {\n    System.out.println("Repostar");\n}',
          kotlin: 'if (fuel > 50) {\n    println("Vamos")\n} else {\n    println("Repostar")\n}',
          swift: 'if fuel > 50 {\n    print("Vamos")\n} else {\n    print("Repostar")\n}',
          c: 'if (fuel > 50) {\n    printf("Vamos\\n");\n} else {\n    printf("Repostar\\n");\n}',
        },
      },
      {
        title: 'El operador % (resto) distingue pares e impares',
        text: '% da el resto de una división. Al dividir entre 2, los pares tienen resto 0 y los impares, resto 1. Por eso i % 2 == 0 significa «i es par». El doble igual (==) compara; el igual simple (=) guarda un valor.',
        visual: 'modulo',
        code: {
          python: 'print(6 % 2)   # 0 → par\nprint(7 % 2)   # 1 → impar',
          java: 'System.out.println(6 % 2); // 0 → par\nSystem.out.println(7 % 2); // 1 → impar',
          kotlin: 'println(6 % 2) // 0 → par\nprintln(7 % 2) // 1 → impar',
          swift: 'print(6 % 2) // 0 → par\nprint(7 % 2) // 1 → impar',
          c: 'printf("%d\\n", 6 % 2); // 0 → par\nprintf("%d\\n", 7 % 2); // 1 → impar',
        },
      },
      {
        title: 'Junta las dos ideas',
        text: 'Dentro del bucle, pregunta en cada vuelta si i es par. Si lo es, el dron va arriba (y = 80); si no, abajo (y = 280). El resultado es un zigzag que la torreta no puede predecir.',
        visual: 'zigzag',
      },
    ],
    mission: {
      python: 'Sustituye la línea y = 80 por un if / else: si i % 2 == 0, y = 80; si no, y = 280. Recuerda los dos puntos y la sangría.',
      java: 'Declara int y; y después un if (i % 2 == 0) { y = 80; } else { y = 280; } antes de baliza.',
      kotlin: 'Cambia val y = 80 por var y = 80 (var permite cambiarla) y añade: if (i % 2 != 0) { y = 280 }',
      swift: 'Cambia let y = 80 por var y = 80 y añade: if i % 2 == 1 { y = 280 }',
      c: 'Sustituye int y = 80; por un if / else, o usa el atajo: int y = (i % 2 == 0) ? 80 : 280;',
    },
  },

  'm3-sort-carga': {
    steps: [
      {
        title: 'Un array es una fila de cajas numeradas',
        text: 'Un array guarda muchos valores seguidos. Cada caja tiene un número de posición llamado índice, y se empieza a contar desde 0. Con 8 elementos, los índices van del 0 al 7. La posición 8 no existe: si intentas leerla, el programa falla.',
        visual: 'array',
        code: {
          python: 'carga = [42, 7, 93]\nprint(carga[0])    # 42 (el primero)\nprint(carga[2])    # 93 (el último)\nprint(len(carga))  # 3',
          java: 'int[] carga = {42, 7, 93};\ncargo[0]       // 42 (el primero)\ncargo[2]       // 93 (el último)\ncargo.length   // 3',
          kotlin: 'val carga = intArrayOf(42, 7, 93)\ncargo[0]     // 42 (el primero)\ncargo[2]     // 93 (el último)\ncargo.size   // 3',
          swift: 'var carga = [42, 7, 93]\ncargo[0]      // 42 (el primero)\ncargo[2]      // 93 (el último)\ncargo.count   // 3',
          c: 'int carga[] = {42, 7, 93};\ncargo[0]   // 42 (el primero)\ncargo[2]   // 93 (el último)\n// en C el tamaño se pasa aparte: n = 3',
        },
      },
      {
        title: 'Intercambiar dos cajas',
        text: 'Para ordenar hay que cambiar valores de sitio. Si copias a en b directamente, pierdes b. Por eso se usa una variable temporal: guardas uno, copias el otro y recuperas el guardado.',
        visual: 'swap',
        code: {
          python: '# Python lo hace en una línea\ncargo[0], carga[1] = carga[1], carga[0]',
          java: 'int tmp = carga[0];\ncargo[0] = carga[1];\ncargo[1] = tmp;',
          kotlin: 'val tmp = carga[0]\ncargo[0] = carga[1]\ncargo[1] = tmp',
          swift: 'carga.swapAt(0, 1)   // Swift trae un atajo',
          c: 'int tmp = carga[0];\ncargo[0] = carga[1];\ncargo[1] = tmp;',
        },
      },
      {
        title: 'Bubble sort: comparar vecinos',
        text: 'Recorre la fila comparando cada caja (j) con su vecina de la derecha (j + 1). Si están desordenadas, intercámbialas. Tras cada pasada, el más grande ha «burbujeado» hasta el final. Ojo: como comparas con j + 1, j solo puede llegar hasta la penúltima caja.',
        visual: 'bubble',
      },
    ],
    mission: {
      python: 'El bucle interior es range(n - i) y en la última vuelta carga[j + 1] se sale del array. Cámbialo por range(n - 1 - i).',
      java: 'La condición j < n - i deja que carga[j + 1] se salga. Cámbiala por j < n - 1 - i.',
      kotlin: '0 until n - i deja que carga[j + 1] se salga. Usa 0 until n - 1 - i.',
      swift: '0..<(n - i) deja que carga[j + 1] se salga. Usa 0..<(n - 1 - i).',
      c: 'j < n - i deja que carga[j + 1] lea fuera del array. Cámbiala por j < n - 1 - i.',
    },
  },

};

// Paquetes de lenguaje: ejemplos, textos propios, pasos exclusivos y texto de misión.
const BASE = ['python', 'java', 'kotlin', 'swift', 'c'];
for (const [id, lesson] of Object.entries(LESSONS)) {
  for (const step of lesson.steps) {
    step.generic = !step.langs;
    if (!step.langs) step.langs = [...BASE];
    step.textByLang = step.textByLang || {};
  }
  for (const pack of [jsPack]) {
    for (const step of lesson.steps) {
      if (step.only) continue;
      const wasGeneric = step.generic;
      const excluded = (pack.excludeTitles || []).includes(step.title);
      if (!excluded && (wasGeneric || (pack.extraLangs || []).includes(step.title))) step.langs.push(pack.lang);
      if (step.code && pack.lessonCode && pack.lessonCode[step.title]) step.code[pack.lang] = pack.lessonCode[step.title];
      if (pack.lessonText && pack.lessonText[step.title]) step.textByLang[pack.lang] = pack.lessonText[step.title];
    }
    for (const { after, step } of (pack.extraSteps && pack.extraSteps[id]) || []) {
      const anchor = lesson.steps.filter((s2) => s2.langs.includes(pack.lang))[after];
      const idx = anchor ? lesson.steps.indexOf(anchor) + 1 : 0;
      lesson.steps.splice(idx, 0, { ...step, langs: [pack.lang], only: true, textByLang: {} });
    }
    lesson.mission[pack.lang] = pack.missionText[id];
  }
}

// Lecciones de las misiones de programa y de los niveles de práctica (ya traen el ejemplo en cada lenguaje).
Object.assign(LESSONS, PROGRAM_LESSONS, DRILL_LESSONS);

/** Pasos de la lección visibles para un lenguaje. */
export const lessonSteps = (id, lang) => (LESSONS[id] ? LESSONS[id].steps.filter((s) => !s.langs || s.langs.includes(lang)) : []);

/**
 * Ayuda «¿Cómo lo hago?» de cada check, en lenguaje sencillo.
 * Si un check no tiene ayuda propia se muestra la indicación general de la misión.
 */
export const CHECK_HELP = {
  // Primeros pasos
  linea1: 'No toques la primera orden: ya escribe «Hola, mundo».',
  linea2: 'Copia la orden de la primera línea justo debajo y cambia el texto de dentro de las comillas por Sistemas en línea.',
  variable: {
    python: 'Escribe el nombre de la caja, un = y su valor: escudos = 100',
    js: 'Escribe const, el nombre de la caja, un = y su valor: const escudos = 100;',
    java: 'Escribe el tipo, el nombre de la caja, un = y su valor: int escudos = 100;',
  },
  'usa-variable': 'No escribas el nombre a mano dentro de las comillas: pega la variable con + piloto, sin comillas.',
  pantalla: 'Muestra la variable escribiendo su nombre SIN comillas dentro de la orden de escribir, igual que se hace con energia.',
  total: 'El doble del premio es premio * 2. Cambia la cuenta para que sea creditos + premio * 2.',
  calculo: 'No escribas el 20 directamente: deja que lo calcule el programa con las variables creditos y premio.',
  antes: 'La variable vidas debe empezar valiendo 3 y mostrarse antes del golpe.',
  despues: 'Entre las dos órdenes de mostrar, cambia la variable: vidas = vidas - 1.',
  resta: 'Escribe vidas = vidas - 1 en la línea vacía. Se lee: «calcula vidas menos 1 y guárdalo en vidas».',
  piloto: 'La primera línea crea la variable piloto con un nombre entre comillas. No la borres (puedes poner tu nombre).',
  saludo: 'Pega la variable al texto con el signo +: "Hola, " + piloto. El espacio va dentro de las comillas.',
  // Las leyes del mundo
  'gravedad-type': {
    python: 'Quita las comillas: 9.81 sin comillas es un número decimal; con comillas es un texto.',
    js: 'Quita las comillas: 9.81 sin comillas es un número; con comillas es un texto.',
    java: 'Cambia int por double: es el tipo para números con decimales.',
  },
  'gravedad-value': 'Escribe el valor de la gravedad terrestre: 9.81 (con punto, no con coma).',
  mass: 'masaNave ya está bien: 1200 es un entero. No hace falta tocarla.',
  shields: 'escudosActivos ya está bien: un valor de sí/no puesto en verdadero.',
  pilot: 'Añade una variable de texto nueva llamada nombrePiloto (nombre_piloto en Python) con tu nombre entre comillas.',
  // Decisiones
  bloqueada: {
    python: 'Debajo del if, al mismo nivel, escribe else: y, en la línea siguiente con sangría, print("Puerta bloqueada").',
    default: 'Después de la llave que cierra el if escribe else { … } con la orden que muestra «Puerta bloqueada» dentro.',
  },
  abierta: 'Deja el if como estaba: con 50 o más debe decir solo «Puerta abierta».',
  // Bucles
  cuenta: 'La cuenta empieza en el valor inicial de n. Cámbialo de 3 a 5.',
  despegue: 'Escribe la orden de mostrar «¡Despegue!» FUERA del bucle, después de que termine, para que salga una sola vez.',
  bucle: 'Deja que el bucle haga las repeticiones: no escribas una orden de mostrar por cada número.',
  loop: 'Usa un bucle (for o while) para repetir, en lugar de escribir lo mismo varias veces a mano.',
  count: 'Cuenta las vueltas de tu bucle: deben ser exactamente las pedidas. Revisa si el final del rango se incluye.',
  inside: 'Alguna baliza tiene una x mayor que 640. Suele pasar por dar una vuelta de más.',
  positions: 'Comprueba la fórmula: con i = 0 debe salir 80, con i = 1 debe salir 180.',
  x: 'La x se calcula con 40 + i * 80. Si el número de puntos es correcto, esto ya debería cumplirse.',
  alternate: 'Usa un if: cuando i % 2 == 0 (par) y = 80; en otro caso y = 280.',
  branch: 'La misión pide usar un if y el operador % para alternar.',
  // Listas
  primero: 'Deja la línea que muestra mochila[0]: es el primer objeto.',
  ultimo: 'En una lista de 3 elementos el último está en la posición 2: muestra mochila[2].',
  cuantos: {
    python: 'Pregúntale el tamaño a la lista con len(mochila) y muéstralo.',
    default: 'Pregúntale el tamaño a la lista con mochila.length y muéstralo.',
  },
  sorted: 'Al copiar un valor encima de otro, el que había se pierde. Guarda primero uno de los dos en una variable temporal (o intercámbialos a la vez).',
  inplace: 'Modifica la lista que recibes (no crees una nueva). Se cumple solo cuando la ordenación funciona.',
  own: 'No uses sort() ni sorted(): aquí la gracia es mover tú los elementos.',
  // Reto final
  lineas: 'Cada número debe escribir UNA sola línea. Usa una cadena if / else if / else: solo se entra en un camino.',
  fizz: 'Los múltiplos de 3 se detectan con i % 3 == 0 y deben mostrar «Fizz».',
  buzz: 'Añade un camino más: si i % 5 == 0, muestra «Buzz».',
  fizzbuzz: 'Pregunta PRIMERO por el caso doble: si i % 15 == 0, muestra «FizzBuzz». Si lo preguntas después, el 15 ya habrá entrado en «Fizz».',
  numeros: 'El else final muestra el número: es el camino de «todos los demás».',
};
