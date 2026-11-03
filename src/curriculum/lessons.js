// Lecciones «Aprende primero»: antes de cada misión, una explicación visual paso a paso
// pensada para quien empieza desde cero. Cada paso tiene un texto sencillo, una
// animación (visual) y, si procede, un ejemplo en el lenguaje elegido.
// `langs` limita un paso a ciertos lenguajes; `mission` explica qué cambiar en la misión.
import rustPack from './rust-pack.js';
import cppPack from './cpp-pack.js';
import goPack from './go-pack.js';
import jsPack from './js-pack.js';
import { DRILL_LESSONS } from './drill-challenges.js';
import { OOP_LESSONS } from './oop-levels.js';

export const LESSONS = {
  'm1-world-laws': {
    steps: [
      {
        title: 'Una variable es una caja con nombre',
        text: 'Programar empieza por guardar datos. Una variable es una caja: tiene una etiqueta (el nombre) y dentro guarda un valor. Cuando escribes gravity = 9.81, el ordenador crea una caja llamada gravity y mete dentro 9.81. A partir de ahí, cada vez que escribas gravity, el programa usará ese valor.',
        visual: 'boxes',
        code: {
          python: 'gravity = 9.81\nprint(gravity)   # muestra 9.81',
          java: 'double gravity = 9.81;\nSystem.out.println(gravity); // 9.81',
          kotlin: 'val gravity = 9.81\nprintln(gravity) // 9.81',
          swift: 'let gravity = 9.81\nprint(gravity) // 9.81',
          c: 'double gravity = 9.81;\nprintf("%f", gravity); // 9.810000',
        },
      },
      {
        title: 'Cada caja tiene un tipo',
        text: 'No todas las cajas son iguales. El tipo dice qué puede guardar: números enteros (1200), números con decimales (9.81), sí/no (verdadero o falso) o texto ("Nova"). Si intentas meter un decimal en una caja de enteros, los decimales no caben: mira en la animación qué hace tu lenguaje en ese caso.',
        visual: 'typecut',
        code: {
          python: 'ship_mass = 1200      # int   → entero\ngravity = 9.81        # float → decimal\nshields_on = True     # bool  → sí / no\npilot_name = "Nova"   # str   → texto',
          java: 'int shipMass = 1200;          // entero\ndouble gravity = 9.81;        // decimal\nboolean shieldsOn = true;     // sí / no\nString pilotName = "Nova";    // texto',
          kotlin: 'val shipMass: Int = 1200          // entero\nval gravity: Double = 9.81        // decimal\nval shieldsOn: Boolean = true     // sí / no\nval pilotName: String = "Nova"    // texto',
          swift: 'let shipMass: Int = 1200         // entero\nlet gravity: Double = 9.81       // decimal\nlet shieldsOn: Bool = true       // sí / no\nlet pilotName: String = "Nova"   // texto',
          c: 'int shipMass = 1200;        // entero\ndouble gravity = 9.81;      // decimal\nbool shieldsOn = true;      // sí / no (stdbool.h)\nchar *pilotName = "Nova";   // texto',
        },
      },
      {
        title: 'Con comillas es texto; sin comillas, número',
        text: '"9.81" (entre comillas) es un texto que se parece a un número, como un número escrito en una pegatina. 9.81 (sin comillas) es un número de verdad con el que se puede calcular. El motor físico necesita multiplicar la gravedad por el tiempo, así que necesita el número.',
        visual: 'quotes',
      },
    ],
    mission: {
      python: 'La línea gravity = "9.81" guarda texto. Quita las comillas para que sea un número decimal. Después añade una línea nueva al final: pilot_name = "tu nombre" (aquí sí van comillas, porque es texto).',
      java: 'gravity está declarada como int (entero) y no puede guardar 9.81. Cambia int por double en esa línea. Luego, donde está el TODO, declara String pilotName = "tu nombre";',
      kotlin: 'gravity está declarada como Int (entero). Cambia Int por Double. Luego, donde está el TODO, añade val pilotName: String = "tu nombre"',
      swift: 'gravity está declarada como Int (entero). Cambia Int por Double. Luego, donde está el TODO, añade let pilotName: String = "tu nombre"',
      c: 'int gravity = 9.81 guarda solo 9 (C corta los decimales sin avisar). Cambia int por double. Si quieres que el printf la muestre bien, cambia %d por %f. Luego declara char *pilotName = "tu nombre";',
    },
  },

  'm1-reactor': {
    steps: [
      {
        title: 'Los números enteros tienen un límite',
        text: 'Un int usa 32 bits de memoria. Con 32 bits caben unos 4.300 millones de valores distintos: la mitad negativos y la mitad positivos. El más grande es 2.147.483.647. Si te pasas, el número «da la vuelta» y aparece en negativo, como el cuentakilómetros de un coche antiguo que pasa de 99999 a 00000.',
        visual: 'odometer',
      },
      {
        title: 'Cajas más grandes para números más grandes',
        text: 'Si necesitas números enormes, usa un tipo de 64 bits: llega hasta 9 trillones. 4 motores × 750 millones = 3.000 millones, que no cabe en un int pero sí en uno de 64 bits.',
        visual: 'widths',
        code: {
          python: '# En Python no hace falta: los enteros crecen solos\ngrande = 4 * 750_000_000   # 3000000000 sin problema',
          java: 'int pequeno = 2_147_483_647;   // máximo de int\nlong grande = 3_000_000_000L;  // long: 64 bits (la L indica long)',
          kotlin: 'val pequeno: Int = 2_147_483_647\nval grande: Long = 3_000_000_000L',
          swift: 'let pequeno: Int32 = 2_147_483_647\nlet grande: Int64 = 3_000_000_000',
          c: 'int pequeno = 2147483647;           // 32 bits\nlong long grande = 3000000000LL;    // 64 bits',
        },
      },
      {
        title: 'La trampa: convierte ANTES de multiplicar',
        text: 'Cuidado: si multiplicas dos int, el resultado se calcula como int aunque lo guardes en una caja de 64 bits. Se desborda antes de llegar a la caja. La solución es convertir uno de los dos números a 64 bits antes de multiplicar.',
        visual: 'promotion',
        langs: ['java', 'kotlin', 'swift', 'c'],
        code: {
          java: 'int a = 4, b = 750_000_000;\nlong mal  = a * b;         // ❌ se calcula en int: -1294967296\nlong bien = (long) a * b;  // ✅ 3000000000',
          kotlin: 'val a = 4; val b = 750_000_000\nval mal: Long = (a * b).toLong()   // ❌ ya desbordó\nval bien: Long = a.toLong() * b    // ✅',
          swift: 'let a: Int32 = 4, b: Int32 = 750_000_000\n// let mal = a * b             ❌ Swift detiene el programa\nlet bien = Int64(a) * Int64(b)  // ✅',
          c: 'int a = 4, b = 750000000;\nlong long mal  = a * b;               // ❌ desborda\nlong long bien = (long long) a * b;   // ✅',
        },
      },
      {
        title: 'Dividir en partes enteras: // y %',
        text: 'En Python los enteros no se desbordan, así que tu reto es otro. El operador / siempre da decimales: 1000 / 3 = 333.33. Para repartir en partes enteras usa // (división entera): 1000 // 3 = 333. Y para saber lo que sobra usa % (resto): 1000 % 3 = 1.',
        visual: 'division',
        langs: ['python'],
        code: { python: 'print(7 / 2)    # 3.5  → con decimales\nprint(7 // 2)   # 3    → parte entera\nprint(7 % 2)    # 1    → lo que sobra' },
      },
    ],
    mission: {
      python: 'Cambia fuel_per_engine = total_fuel / fuel_engines para usar // en vez de /. Después cambia reserve = 0 por el resto de la división: total_fuel % fuel_engines.',
      java: 'totalThrust es int y no cabe 3.000 millones. Cambia su tipo a long Y convierte un operando: (long) engines * thrustPerEngine.',
      kotlin: 'Cambia el tipo de totalThrust a Long y convierte un operando antes de multiplicar: engines.toLong() * thrustPerEngine.',
      swift: 'Los dos números son Int32. Convierte ambos a Int64 antes de multiplicar: Int64(engines) * Int64(thrustPerEngine).',
      c: 'Cambia int totalThrust por long long totalThrust y convierte un operando: (long long) engines * thrustPerEngine. En el printf usa %lld.',
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
      java: 'Declara int y; y después un if (i % 2 == 0) { y = 80; } else { y = 280; } antes de waypoint.',
      kotlin: 'Cambia val y = 80 por var y = 80 (var permite cambiarla) y añade: if (i % 2 != 0) { y = 280 }',
      swift: 'Cambia let y = 80 por var y = 80 y añade: if i % 2 == 1 { y = 280 }',
      c: 'Sustituye int y = 80; por un if / else, o usa el atajo: int y = (i % 2 == 0) ? 80 : 280;',
    },
  },

  'm3-sort-cargo': {
    steps: [
      {
        title: 'Un array es una fila de cajas numeradas',
        text: 'Un array guarda muchos valores seguidos. Cada caja tiene un número de posición llamado índice, y se empieza a contar desde 0. Con 8 elementos, los índices van del 0 al 7. La posición 8 no existe: si intentas leerla, el programa falla.',
        visual: 'array',
        code: {
          python: 'cargo = [42, 7, 93]\nprint(cargo[0])    # 42 (el primero)\nprint(cargo[2])    # 93 (el último)\nprint(len(cargo))  # 3',
          java: 'int[] cargo = {42, 7, 93};\ncargo[0]       // 42 (el primero)\ncargo[2]       // 93 (el último)\ncargo.length   // 3',
          kotlin: 'val cargo = intArrayOf(42, 7, 93)\ncargo[0]     // 42 (el primero)\ncargo[2]     // 93 (el último)\ncargo.size   // 3',
          swift: 'var cargo = [42, 7, 93]\ncargo[0]      // 42 (el primero)\ncargo[2]      // 93 (el último)\ncargo.count   // 3',
          c: 'int cargo[] = {42, 7, 93};\ncargo[0]   // 42 (el primero)\ncargo[2]   // 93 (el último)\n// en C el tamaño se pasa aparte: n = 3',
        },
      },
      {
        title: 'Intercambiar dos cajas',
        text: 'Para ordenar hay que cambiar valores de sitio. Si copias a en b directamente, pierdes b. Por eso se usa una variable temporal: guardas uno, copias el otro y recuperas el guardado.',
        visual: 'swap',
        code: {
          python: '# Python lo hace en una línea\ncargo[0], cargo[1] = cargo[1], cargo[0]',
          java: 'int tmp = cargo[0];\ncargo[0] = cargo[1];\ncargo[1] = tmp;',
          kotlin: 'val tmp = cargo[0]\ncargo[0] = cargo[1]\ncargo[1] = tmp',
          swift: 'cargo.swapAt(0, 1)   // Swift trae un atajo',
          c: 'int tmp = cargo[0];\ncargo[0] = cargo[1];\ncargo[1] = tmp;',
        },
      },
      {
        title: 'Bubble sort: comparar vecinos',
        text: 'Recorre la fila comparando cada caja (j) con su vecina de la derecha (j + 1). Si están desordenadas, intercámbialas. Tras cada pasada, el más grande ha «burbujeado» hasta el final. Ojo: como comparas con j + 1, j solo puede llegar hasta la penúltima caja.',
        visual: 'bubble',
      },
    ],
    mission: {
      python: 'El bucle interior es range(n - i) y en la última vuelta cargo[j + 1] se sale del array. Cámbialo por range(n - 1 - i).',
      java: 'La condición j < n - i deja que cargo[j + 1] se salga. Cámbiala por j < n - 1 - i.',
      kotlin: '0 until n - i deja que cargo[j + 1] se salga. Usa 0 until n - 1 - i.',
      swift: '0..<(n - i) deja que cargo[j + 1] se salga. Usa 0..<(n - 1 - i).',
      c: 'j < n - i deja que cargo[j + 1] lea fuera del array. Cámbiala por j < n - 1 - i.',
    },
  },

  'm3-inventory': {
    steps: [
      {
        title: 'Un diccionario relaciona etiquetas con valores',
        text: 'Un array usa números como posición. Un diccionario (o mapa) usa la etiqueta que tú quieras, por ejemplo el nombre de un objeto. Es como una agenda: buscas «ore» y te dice cuántos tienes.',
        visual: 'dict',
        langs: ['python', 'java', 'kotlin', 'swift'],
        code: {
          python: 'counts = {}\ncounts["ore"] = 3\nprint(counts["ore"])   # 3',
          java: 'Map<String, Integer> counts = new HashMap<>();\ncounts.put("ore", 3);\ncounts.get("ore");   // 3',
          kotlin: 'val counts = mutableMapOf<String, Int>()\ncounts["ore"] = 3\ncounts["ore"]   // 3',
          swift: 'var counts: [String: Int] = [:]\ncounts["ore"] = 3\ncounts["ore"]   // 3',
        },
      },
      {
        title: 'En C, un array hace de diccionario',
        text: 'C no tiene diccionarios. Pero si cada objeto tiene un código numérico (0 = ore, 1 = fuel, 2 = chip), un array de 3 posiciones funciona igual: counts[0] es la cantidad de ore, counts[1] la de fuel…',
        visual: 'dict',
        langs: ['c'],
        code: { c: 'int counts[3] = {0, 0, 0};\ncounts[0] = 3;   // 3 de ore (código 0)\ncounts[2] = 1;   // 1 chip (código 2)' },
      },
      {
        title: 'El patrón «contador»',
        text: 'Para contar, cada vez que aparece algo hay que leer cuántos llevábamos, sumar 1 y guardar el resultado. Si es la primera vez, partimos de 0. Si en vez de sumar pones = 1, el contador se reinicia cada vez y nunca pasa de 1.',
        visual: 'counter',
        code: {
          python: 'votos = {}\nfor color in ["rojo", "azul", "rojo"]:\n    votos[color] = votos.get(color, 0) + 1\n# {"rojo": 2, "azul": 1}',
          java: 'for (String color : colores) {\n    votos.put(color, votos.getOrDefault(color, 0) + 1);\n}',
          kotlin: 'for (color in colores) {\n    votos[color] = (votos[color] ?: 0) + 1\n}',
          swift: 'for color in colores {\n    votos[color, default: 0] += 1\n}',
          c: 'for (int i = 0; i < n; i++) {\n    votos[colores[i]] = votos[colores[i]] + 1;  // o ++\n}',
        },
      },
    ],
    mission: {
      python: 'Cambia counts[item] = 1 para que sume: counts[item] = counts.get(item, 0) + 1',
      java: 'Cambia counts.put(item, 1) para que sume uno a lo que ya había: usa counts.getOrDefault(item, 0) + 1.',
      kotlin: 'Cambia counts[item] = 1 por (counts[item] ?: 0) + 1.',
      swift: 'Cambia counts[item] = 1 por counts[item, default: 0] += 1.',
      c: 'Cambia counts[ids[i]] = 1 por counts[ids[i]]++ (suma 1 a lo que ya había).',
    },
  },

  'm4-entities': {
    steps: [
      {
        title: 'Una clase es un molde',
        text: 'Una clase describe cómo es un tipo de cosa: qué datos tiene (x, y) y qué sabe hacer (update). Con un molde puedes fabricar tantos objetos como quieras, cada uno con sus propios valores.',
        visual: 'mold',
        code: {
          python: 'class Entity:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\nnave = Entity(10, 20)   # un objeto',
          java: 'class Entity {\n    double x, y;\n    Entity(double x, double y) { this.x = x; this.y = y; }\n}\nEntity nave = new Entity(10, 20);',
          kotlin: 'open class Entity(var x: Double, var y: Double)\n\nval nave = Entity(10.0, 20.0)',
          swift: 'class Entity {\n    var x: Double, y: Double\n    init(x: Double, y: Double) { self.x = x; self.y = y }\n}\nlet nave = Entity(x: 10, y: 20)',
          c: 'typedef struct Entity {\n    float x, y;\n} Entity;\n\nEntity nave = { 10, 20 };',
        },
      },
      {
        title: 'Herencia: «es un tipo de»',
        text: 'Un enemigo es un tipo de entidad: también tiene x e y. En vez de repetir ese código, Enemy hereda de Entity y recibe todo lo que Entity tiene. Luego solo añades lo que le hace especial.',
        visual: 'tree',
        code: {
          python: 'class Enemy(Entity):\n    pass   # ya tiene x, y y update()',
          java: 'class Enemy extends Entity {\n    Enemy(double x, double y) { super(x, y); }\n}',
          kotlin: '// En Kotlin la clase padre debe ser open\nclass Enemy(x: Double, y: Double) : Entity(x, y)',
          swift: 'class Enemy: Entity { }',
          c: '// En C: la struct base va la primera\ntypedef struct {\n    Entity base;\n    int damage;\n} Enemy;',
        },
      },
      {
        title: 'Sobrescribir: cada uno a su manera',
        text: 'Todas las entidades tienen update(), pero cada clase puede escribir su propia versión. El motor llama a update() en todas sin preguntar qué son, y cada una se mueve a su manera. Eso es el polimorfismo.',
        visual: 'poly',
        code: {
          python: 'class Enemy(Entity):\n    def update(self):\n        self.y += 3   # baja 3 px cada frame',
          java: 'class Enemy extends Entity {\n    Enemy(double x, double y) { super(x, y); }\n\n    @Override\n    void update() {\n        y += 3;\n    }\n}',
          kotlin: 'class Enemy(x: Double, y: Double) : Entity(x, y) {\n    override fun update() {\n        y += 3\n    }\n}\n// y en Entity: open fun update() { }',
          swift: 'class Enemy: Entity {\n    override func update() {\n        y += 3\n    }\n}',
          c: 'void enemy_update(Entity *self) {\n    self->y += 3;\n}\n// y se conecta así:\ne.base.update = enemy_update;',
        },
      },
    ],
    mission: {
      python: 'Debajo de Player, crea class Enemy(Entity): con un def update(self): que haga self.y += 3. Después crea class Obstacle(Entity): con pass dentro.',
      java: 'Copia el patrón de Player: class Enemy extends Entity con su constructor y un update() que haga y += 3. Luego class Obstacle extends Entity solo con constructor.',
      kotlin: 'Primero añade open delante de class Entity y delante de fun update(). Después crea Enemy (con override fun update() { y += 3 }) y Obstacle, siguiendo el patrón de Player.',
      swift: 'Siguiendo el patrón de Player, crea class Enemy: Entity con override func update() { y += 3 } y class Obstacle: Entity { }.',
      c: 'Crea typedef struct { Entity base; int damage; } Enemy; y otra para Obstacle. Escribe void enemy_update(Entity *self) { self->y += 3; } y en main conéctalas: e.base.update = enemy_update; o.base.update = entity_update;',
    },
  },

  'm5-systems': {
    steps: [
      {
        title: 'malloc: pedir memoria en bytes',
        text: 'A veces necesitas memoria mientras el programa funciona. malloc te la presta, pero la pide en bytes, no en número de elementos. Un int ocupa 4 bytes, así que 8 ints son 32 bytes. sizeof(int) te dice el tamaño para que no tengas que recordarlo.',
        visual: 'malloc',
        langs: ['c'],
        code: { c: 'int *datos = malloc(8 * sizeof(int));  // 8 ints = 32 bytes\ndatos[0] = 10;\ndatos[7] = 70;   // la última posición válida' },
      },
      {
        title: 'free: devolver lo que pediste',
        text: 'La memoria de malloc no se devuelve sola. Cuando termines, llama a free. Si se te olvida, tienes una fuga: memoria que nadie usa pero que tampoco está disponible. Y después de free, no vuelvas a tocar ese puntero.',
        visual: 'leak',
        langs: ['c'],
        code: { c: 'int *a = malloc(4 * sizeof(int));\nint *b = malloc(4 * sizeof(int));\n// ... usar a y b ...\nfree(a);\nfree(b);   // un free por cada malloc' },
      },
      {
        title: 'Esperar uno a uno o todos a la vez',
        text: 'Imagina tres hornos y tres pizzas de 10 minutos cada una. Si metes una, esperas a que salga y luego metes la siguiente, tardas 30 minutos. Si metes las tres a la vez y esperas al final, tardas 10. La concurrencia consiste en lanzar todas las tareas primero y esperar después.',
        visual: 'timeline',
        langs: ['python', 'java', 'kotlin', 'swift'],
      },
      {
        title: 'Cómo se lanzan tareas en tu lenguaje',
        text: 'La idea es siempre la misma: crear las tareas sin esperar y, cuando estén todas en marcha, esperar a que terminen. Así se escribe en tu mundo:',
        visual: 'timeline',
        langs: ['python', 'java', 'kotlin', 'swift'],
        code: {
          python: '# gather lanza todas y espera a todas\nresultados = await asyncio.gather(tarea(1), tarea(2), tarea(3))',
          java: 'List<Thread> hilos = new ArrayList<>();\nfor (int i = 0; i < 3; i++) {\n    Thread t = new Thread(() -> trabajar());\n    hilos.add(t);\n    t.start();          // lanzar\n}\nfor (Thread t : hilos) t.join();   // esperar al final',
          kotlin: 'val resultados = (0 until 3)\n    .map { i -> async { tarea(i) } }   // lanzar\n    .awaitAll()                        // esperar',
          swift: 'async let a = tarea(1)   // lanzar sin esperar\nasync let b = tarea(2)\nlet total = await a + b  // esperar al final',
        },
      },
      {
        title: 'Cuidado con compartir una variable',
        text: 'Si varias tareas suman a la vez en la misma variable, pueden pisarse: las dos leen 10, las dos suman y las dos escriben 20, y se pierde una suma. Lo más seguro es que cada tarea devuelva su resultado y sumarlos al final, o usar herramientas seguras como AtomicInteger.',
        visual: 'race',
        langs: ['java', 'kotlin', 'swift'],
        code: {
          java: 'AtomicInteger total = new AtomicInteger(0);\ntotal.addAndGet(5);   // suma segura entre hilos',
          kotlin: '// devuelve valores en vez de compartir\nval suma = resultados.sum()',
          swift: '// async let devuelve valores: no compartes nada\nlet total = await a + b + c',
        },
      },
    ],
    mission: {
      c: 'malloc(8) reserva 8 bytes, que son solo 2 ints. Cámbialo por malloc(8 * sizeof(int)). Después, al final, añade free(buffer); para que no haya fugas.',
      python: 'El bucle espera a cada escaneo antes de lanzar el siguiente. Sustituye el bucle por: results = await asyncio.gather(scan(0), scan(1), scan(2))',
      java: 'El t.join() dentro del bucle obliga a esperar cada hilo. Guarda los hilos en una lista, haz join en un segundo bucle y cambia total por un AtomicInteger (total.addAndGet(...)).',
      kotlin: 'El job.join() dentro del bucle espera a cada tarea. Sustituye el bucle por: val results = (0 until 3).map { s -> async { scan(s) } }.awaitAll() y luego imprime results.sum().',
      swift: 'El bucle espera cada scan. Usa async let a = scan(0), async let b = scan(1), async let c = scan(2) y después let total = await a + b + c.',
    },
  },

  'boss-swarm': {
    steps: [
      {
        title: 'Contar el trabajo que hace tu código',
        text: 'Para buscar repetidos comparando todos con todos, con 4 drones haces unas 6 comparaciones; con 1600, más de un millón. El trabajo crece con el cuadrado de n: duplicar los drones multiplica el trabajo por 4. A eso se le llama O(n²).',
        visual: 'grid',
      },
      {
        title: 'Un conjunto recuerda lo que ya viste',
        text: 'Un conjunto (set) es como una lista de invitados: preguntarle si alguien ya está apuntado es instantáneo, lo tenga vacío o lleno. Recorre los drones una sola vez; si un ID ya está en el conjunto, es un clon. Si no, apúntalo. Una sola pasada: O(n).',
        visual: 'seen',
        code: {
          python: 'vistos = set()\nvistos.add(5)\nprint(5 in vistos)   # True, al instante',
          java: 'Set<Integer> vistos = new HashSet<>();\nvistos.add(5);\nvistos.contains(5);   // true, al instante',
          kotlin: 'val vistos = mutableSetOf<Int>()\nvistos.add(5)\n5 in vistos   // true, al instante',
          swift: 'var vistos = Set<Int>()\nvistos.insert(5)\nvistos.contains(5)   // true, al instante',
          c: '// IDs entre 0 y 9999: un array de bool sirve de conjunto\nbool vistos[10000] = {false};\nvistos[5] = true;\nif (vistos[5]) { /* ya estaba */ }',
        },
      },
      {
        title: 'Por qué importa',
        text: 'Con 1600 drones, el código ingenuo hace unos 1.280.000 pasos por frame y el de un solo recorrido, unos 1600: 800 veces menos trabajo. En un juego, eso es la diferencia entre ir a 8 o a 60 fotogramas por segundo.',
        visual: 'bars',
      },
    ],
    mission: {
      python: 'Borra los dos bucles. Crea seen = set(), recorre ids con un solo for x in ids: y dentro: si x ya está en seen, devuelve True; si no, añádelo. Al final, return False.',
      java: 'Crea Set<Integer> seen = new HashSet<>(); y recorre con un solo for (int x : ids). seen.add(x) devuelve false si ya estaba: en ese caso, return true.',
      kotlin: 'Crea val seen = mutableSetOf<Int>() y recorre con un solo for (x in ids). Si seen.add(x) devuelve false, return true.',
      swift: 'Crea var seen = Set<Int>() y recorre con un solo for x in ids. Si seen.contains(x), return true; si no, seen.insert(x).',
      c: 'Crea bool seen[10000] = {false}; y recorre una sola vez. Si seen[ids[i]] ya es true, return true; si no, ponlo a true.',
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
  for (const pack of [rustPack, cppPack, goPack, jsPack]) {
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

// Lecciones de los niveles de práctica (generadas: ya traen el ejemplo en los 9 lenguajes).
Object.assign(LESSONS, DRILL_LESSONS, OOP_LESSONS);

/** Pasos de la lección visibles para un lenguaje. */
export const lessonSteps = (id, lang) => (LESSONS[id] ? LESSONS[id].steps.filter((s) => !s.langs || s.langs.includes(lang)) : []);

/**
 * Ayuda «¿Cómo lo hago?» de cada check, en lenguaje sencillo.
 * Si un check no tiene ayuda propia se muestra la indicación general de la misión.
 */
export const CHECK_HELP = {
  'gravity-type': {
    python: 'Quita las comillas: 9.81 sin comillas es un número decimal (float); con comillas es texto (str).',
    js: 'Quita las comillas: 9.81 sin comillas es un number; con comillas es un string.',
    java: 'Cambia int por double: es el tipo para números con decimales.',
    kotlin: 'Cambia Int por Double: es el tipo para números con decimales.',
    swift: 'Cambia Int por Double: es el tipo para números con decimales.',
    c: 'Cambia int por double: un int corta los decimales sin avisar.',
    cpp: 'Cambia int por double: un int corta los decimales sin avisar.',
    go: 'Cambia int por float64: es el tipo de Go para números con decimales.',
    rust: 'Cambia i32 por f64: es el tipo de Rust para números con decimales.',
  },
  'gravity-value': 'Escribe el valor de la gravedad terrestre: 9.81 (con punto, no con coma).',
  mass: 'shipMass ya está bien: 1200 es un entero. No hace falta tocarlo.',
  shields: 'shieldsOn ya está bien: un booleano a true (True en Python).',
  pilot: 'Añade una variable de texto nueva llamada pilotName (pilot_name en Python) con tu nombre entre comillas.',
  'total-exists': 'No cambies el nombre totalThrust: el motor lo busca por ese nombre.',
  'no-overflow': {
    default: 'El resultado (3.000 millones) no cabe en 32 bits. Usa un tipo de 64 bits y convierte uno de los números ANTES de multiplicar.',
    swift: 'Convierte los dos números a Int64 antes de multiplicar: Int64(engines) * Int64(thrustPerEngine).',
    go: 'Convierte los dos números a int64 antes de multiplicar: int64(engines) * int64(thrustPerEngine).',
    rust: 'Declara total_thrust como i64 y convierte cada operando con as i64.',
  },
  precision: 'Añade una n al final de los dos números para que sean BigInt: 9007199254740992n y 1n.',
  'fuel-int': 'Usa // en lugar de / para obtener una división sin decimales.',
  'fuel-reserve': 'El sobrante de repartir es el resto de la división: usa el operador %.',
  loop: 'Usa un bucle for en lugar de llamar a waypoint varias veces a mano.',
  count: 'Cuenta las vueltas de tu bucle: deben ser exactamente las pedidas. Revisa si el final del rango se incluye.',
  inside: 'Alguna baliza tiene una x mayor que 640. Suele pasar por dar una vuelta de más.',
  positions: 'Comprueba la fórmula: con i = 0 debe salir 80, con i = 1 debe salir 180.',
  x: 'La x se calcula con 40 + i * 80. Si el número de puntos es correcto, esto ya debería cumplirse.',
  alternate: 'Usa un if: cuando i % 2 == 0 (par) y = 80; en otro caso y = 280.',
  branch: 'La misión pide usar un if (o el operador ? :) y el operador % para alternar.',
  sorted: 'Si el programa falla por salirse del array, revisa hasta dónde llega j: como comparas con j + 1, j debe parar una posición antes.',
  inplace: 'Modifica el array que recibes (no crees uno nuevo). Se cumple solo cuando la ordenación funciona.',
  own: 'No uses sort() ni sorted(): escribe tú los bucles que comparan e intercambian.',
  returns: 'La función debe terminar con return counts.',
  ore: 'Cada vez que aparece un objeto, súmale 1 a lo que ya tenía en vez de poner 1.',
  'fuel-chip': 'Mismo arreglo que para ore: el contador debe sumar, no reemplazar.',
  base: 'Debe existir una clase Entity con un método update(). Ya viene en el código inicial: no la borres.',
  inherit: {
    default: 'Crea las clases Enemy y Obstacle haciendo que hereden de Entity, igual que Player.',
    go: 'Crea los structs Enemy y Obstacle, cada uno con su método Update(): así cumplen la interface Entity.',
    rust: 'Crea los structs Enemy y Obstacle y escribe impl Entity for Enemy y impl Entity for Obstacle.',
    c: 'Crea las structs Enemy y Obstacle con Entity base; como primer campo.',
  },
  override: {
    default: 'Enemy necesita su propio update() que reemplace al de Entity.',
    kotlin: 'Enemy necesita su propio update(), escrito como override fun update().',
    swift: 'Enemy necesita su propio update(), escrito como override func update().',
    cpp: 'Enemy necesita void update() override { … }.',
    c: 'Escribe enemy_update y conéctala: e.base.update = enemy_update;',
    go: 'Enemy necesita su propio método: func (e *Enemy) Update() { … }.',
    rust: 'Enemy necesita su bloque impl Entity for Enemy con su propio fn update(&mut self).',
  },
  'cpp-virtual': 'Escribe virtual delante de void update() en la clase Entity.',
  'go-pointer': 'Cambia el receptor por un puntero: func (p *Player) Update() en lugar de func (p Player) Update().',
  'rust-default': 'En el trait, da a update un cuerpo vacío: fn update(&mut self) {}. Así Obstacle puede usar la versión por defecto.',
  polymorph: 'Haz que Enemy se mueva distinto que Player: por ejemplo y += 3 en lugar de x += 2.',
  'kotlin-open': 'En Kotlin escribe open class Entity y open fun update() para permitir heredar y sobrescribir.',
  'swift-override': 'Pon override delante de func update() en cada clase hija.',
  alloc: 'Necesitas dos llamadas a malloc: una para shields y otra para buffer.',
  size: 'malloc cuenta bytes: para 8 ints escribe malloc(8 * sizeof(int)).',
  safe: 'El programa ha leído o escrito fuera de un bloque de memoria. Normalmente se arregla pidiendo el tamaño correcto en malloc.',
  filled: 'shields debe contener 0, 10, 20… 70. El bucle ya lo hace si el bloque es lo bastante grande.',
  'no-leaks': 'Cada malloc necesita su free. Revisa que liberas también buffer.',
  scan: 'La función scan ya está bien definida: no la cambies.',
  concurrent: 'Lanza las 3 tareas sin esperar entre ellas y espera a todas al final.',
  waits: 'Después de lanzar las tareas, espera a que terminen (await, join, awaitAll…).',
  race: 'No sumes en una variable compartida desde varias tareas. Devuelve valores y súmalos al final, o usa AtomicInteger.',
  correct: 'Prueba tu función a mano con [3, 1, 4, 1, 5]: debe devolver verdadero. Con una lista vacía, falso.',
  complexity: 'Quita el bucle anidado: recorre los IDs una sola vez y apunta los vistos en un conjunto.',
};
