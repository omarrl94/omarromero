// Módulo 1 · Fundamentos: las leyes físicas del mundo (variables y tipos).
import { check, v } from './helpers.js';

const worldLaws = {
  id: 'm1-world-laws',
  module: 1,
  title: 'Las Leyes del Mundo',
  codename: 'GRAVITY.INIT',
  scene: 'lander',
  xp: 120,
  mode: 'run',
  story: 'La lanzadera Nova cae hacia el planeta Kepler-9. El motor físico aún no existe: tú escribes sus constantes. Si la gravedad tiene el tipo equivocado, la simulación se rompe y la nave se estrella.',
  objective: 'Declara gravity (decimal ≈ 9.81), shipMass (entero 1200), shieldsOn (booleano activo) y pilotName (tu nombre de piloto).',
  concept: {
    title: 'Variables y tipos de datos',
    text: 'Una variable es una caja con nombre; su tipo decide qué cabe dentro y cuánta memoria ocupa. Un entero no guarda decimales; un texto no se puede multiplicar por un tiempo. Los lenguajes estáticos (Java, Kotlin, Swift, C) comprueban los tipos al compilar; Python, al ejecutar.',
  },
  starter: {
    python: `# Módulo 1 · Las leyes del mundo
# El sensor devuelve la gravedad como texto...
# ¿puede el motor físico multiplicar texto por tiempo?
gravity = "9.81"
ship_mass = 1200
shields_on = True
# TODO: declara pilot_name con tu nombre de piloto
`,
    java: `public class Main {
    public static void main(String[] args) {
        // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
        int gravity = 9.81;
        int shipMass = 1200;
        boolean shieldsOn = true;
        // TODO: declara pilotName (texto) con tu nombre de piloto
    }
}
`,
    kotlin: `fun main() {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    val gravity: Int = 9.81
    val shipMass: Int = 1200
    val shieldsOn: Boolean = true
    // TODO: declara pilotName (String) con tu nombre de piloto
}
`,
    swift: `// Las constantes físicas de tu mundo. ¡Ojo con los tipos!
let gravity: Int = 9.81
let shipMass: Int = 1200
let shieldsOn: Bool = true
// TODO: declara pilotName (String) con tu nombre de piloto
`,
    c: `#include <stdio.h>
#include <stdbool.h>

int main(void) {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    int gravity = 9.81;
    int shipMass = 1200;
    bool shieldsOn = true;
    // TODO: declara pilotName (char *) con tu nombre de piloto
    printf("g = %d\\n", gravity);
    return 0;
}
`,
  },
  solution: {
    python: `gravity = 9.81
ship_mass = 1200
shields_on = True
pilot_name = "Nova"
`,
    java: `public class Main {
    public static void main(String[] args) {
        double gravity = 9.81;
        int shipMass = 1200;
        boolean shieldsOn = true;
        String pilotName = "Nova";
    }
}
`,
    kotlin: `fun main() {
    val gravity: Double = 9.81
    val shipMass: Int = 1200
    val shieldsOn: Boolean = true
    val pilotName: String = "Nova"
}
`,
    swift: `let gravity: Double = 9.81
let shipMass: Int = 1200
let shieldsOn: Bool = true
let pilotName: String = "Nova"
`,
    c: `#include <stdio.h>
#include <stdbool.h>

int main(void) {
    double gravity = 9.81;
    int shipMass = 1200;
    bool shieldsOn = true;
    char *pilotName = "Nova";
    printf("g = %.2f\\n", gravity);
    return 0;
}
`,
  },
  polyglot: {
    python: 'Tipado dinámico: el tipo lo lleva el valor, no la variable. "9.81" es str y 9.81 es float; Python solo protesta cuando operas con ellos.',
    java: 'Tipado estático estricto: asignar 9.81 a un int es un error de compilación (posible pérdida de precisión). double es el decimal por defecto.',
    kotlin: 'Inferencia de tipos con seguridad: val g = 9.81 ya es Double. Declarar Int y asignar un decimal no compila.',
    swift: 'Como Kotlin: inferencia + seguridad. Double es el decimal estándar; Swift nunca convierte números implícitamente.',
    c: 'C convierte en silencio: int g = 9.81 compila y guarda 9 (truncado). El compilador confía en ti… y la nave se estrella.',
  },
  evaluate({ result, lang }) {
    const g = v(result, 'gravity', lang);
    const mass = v(result, 'shipMass', lang);
    const sh = v(result, 'shieldsOn', lang);
    const pilot = v(result, 'pilotName', lang);
    const gVal = g ? Number(g.value) : NaN;
    const gIsDecimal = g && g.kind === 'float';
    const checks = [
      check('gravity-type', 'gravity es de tipo decimal', gIsDecimal,
        !g ? 'No encuentro la variable gravity.' : g.kind === 'str' ? 'gravity es texto (str): el motor no puede multiplicar texto por tiempo.'
          : g.flags.includes('truncated') ? `C truncó 9.81 a ${g.value}: un int no guarda decimales.` : `gravity es ${g.type}: necesitas un tipo con decimales.`),
      check('gravity-value', 'gravity ≈ 9.81 m/s²', gIsDecimal && gVal > 9.7 && gVal < 9.9, gIsDecimal ? `Valor actual: ${gVal}` : ''),
      check('mass', 'shipMass es un entero de 1200 kg', mass && mass.kind === 'int' && Number(mass.value) === 1200, mass ? `${mass.type} = ${mass.value}` : 'Falta shipMass.'),
      check('shields', 'shieldsOn es booleano y está activo', sh && sh.kind === 'bool' && sh.value === true, sh ? `${sh.type} = ${sh.value}` : 'Falta shieldsOn.'),
      check('pilot', 'pilotName es un texto con tu nombre', pilot && pilot.kind === 'str' && String(pilot.value).trim().length > 0, pilot ? '' : 'Declara pilotName.'),
    ];
    return {
      checks,
      scene: {
        gravity: gIsDecimal ? gVal : g && typeof g.value === 'number' ? g.value : null,
        gravityBroken: !gIsDecimal,
        mass: mass ? Number(mass.value) : 0,
        shields: sh ? !!sh.value : false,
        pilot: pilot ? String(pilot.value) : '???',
      },
    };
  },
  duck: {
    'gravity-type': [
      '¿Qué diferencia hay entre el número 9.81 y el texto "9.81" para un ordenador?',
      'Si un tipo entero solo guarda números sin decimales, ¿qué crees que le pasa al .81?',
      '¿Qué tipo de tu lenguaje está pensado para números con decimales?',
    ],
    'gravity-value': ['¿Cuánto vale la gravedad en la Tierra, aproximadamente?'],
    mass: ['¿La masa de la nave necesita decimales en esta misión? ¿Qué tipo usarías para contar kilos enteros?'],
    shields: ['¿Cuántos valores posibles tiene un interruptor? ¿Qué tipo representa exactamente eso?'],
    pilot: ['¿Cómo se escribe un texto literal en tu lenguaje? ¿Entre qué símbolos va?', 'Mira cómo están declaradas las otras variables: ¿qué patrón siguen?'],
  },
};

const reactor = {
  id: 'm1-reactor',
  module: 1,
  title: 'Reactor en Desbordamiento',
  codename: 'OVERFLOW.CORE',
  scene: 'reactor',
  xp: 160,
  mode: 'run',
  story: 'El reactor tiene 4 motores de 750 000 000 N cada uno. El ordenador de a bordo suma el empuje total… y el número no cabe. Un entero de 32 bits llega solo hasta 2 147 483 647: lo que sobra da la vuelta y se vuelve negativo. Empuje negativo = explosión.',
  objective: 'Calcula totalThrust = engines × thrustPerEngine (3 000 000 000) sin desbordamiento. En Python, reparte además 1000 celdas de combustible entre 3 motores en partes enteras.',
  concept: {
    title: 'Rangos numéricos y overflow',
    text: 'Cada tipo entero tiene un número fijo de bits. int/Int32: ±2 147 483 647. long/Int64: ±9,2 trillones. Si una operación se pasa, Java, Kotlin y C dan la vuelta en silencio (wrap-around), Swift detiene el programa y Python amplía el número automáticamente.',
  },
  starter: {
    python: `# En Python los enteros NO desbordan (precisión arbitraria).
engines = 4
thrust_per_engine = 750_000_000
total_thrust = engines * thrust_per_engine

# Tu reto en Python: repartir el combustible en celdas ENTERAS.
total_fuel = 1000
fuel_engines = 3
fuel_per_engine = total_fuel / fuel_engines   # ¿celdas partidas?
reserve = 0                                   # TODO: lo que sobra
`,
    java: `public class Main {
    public static void main(String[] args) {
        int engines = 4;
        int thrustPerEngine = 750_000_000;
        int totalThrust = engines * thrustPerEngine;
        System.out.println("Empuje total: " + totalThrust);
    }
}
`,
    kotlin: `fun main() {
    val engines: Int = 4
    val thrustPerEngine: Int = 750_000_000
    val totalThrust: Int = engines * thrustPerEngine
    println("Empuje total: $totalThrust")
}
`,
    swift: `let engines: Int32 = 4
let thrustPerEngine: Int32 = 750_000_000
let totalThrust = engines * thrustPerEngine
print("Empuje total: \\(totalThrust)")
`,
    c: `#include <stdio.h>

int main(void) {
    int engines = 4;
    int thrustPerEngine = 750000000;
    int totalThrust = engines * thrustPerEngine;
    printf("Empuje total: %d\\n", totalThrust);
    return 0;
}
`,
  },
  solution: {
    python: `engines = 4
thrust_per_engine = 750_000_000
total_thrust = engines * thrust_per_engine

total_fuel = 1000
fuel_engines = 3
fuel_per_engine = total_fuel // fuel_engines
reserve = total_fuel % fuel_engines
`,
    java: `public class Main {
    public static void main(String[] args) {
        int engines = 4;
        int thrustPerEngine = 750_000_000;
        long totalThrust = (long) engines * thrustPerEngine;
        System.out.println("Empuje total: " + totalThrust);
    }
}
`,
    kotlin: `fun main() {
    val engines: Int = 4
    val thrustPerEngine: Int = 750_000_000
    val totalThrust: Long = engines.toLong() * thrustPerEngine
    println("Empuje total: $totalThrust")
}
`,
    swift: `let engines: Int32 = 4
let thrustPerEngine: Int32 = 750_000_000
let totalThrust = Int64(engines) * Int64(thrustPerEngine)
print("Empuje total: \\(totalThrust)")
`,
    c: `#include <stdio.h>

int main(void) {
    int engines = 4;
    int thrustPerEngine = 750000000;
    long long totalThrust = (long long) engines * thrustPerEngine;
    printf("Empuje total: %lld\\n", totalThrust);
    return 0;
}
`,
  },
  polyglot: {
    python: 'Los int de Python crecen sin límite (bignum), así que aquí no hay overflow. A cambio, / siempre devuelve float: para división entera usa // y para el resto %.',
    java: 'Trampa clásica: long total = a * b sigue desbordando, porque a * b se calcula en int ANTES de ampliarse. Hay que convertir un operando: (long) a * b.',
    kotlin: 'Igual que Java en la JVM: Int * Int es Int. Convierte explícitamente con .toLong(); Kotlin no amplía tipos por ti.',
    swift: 'Swift detecta el overflow en tiempo de ejecución y detiene el programa (trap) en vez de corromper datos. Convierte con Int64(x) o usa &* si quieres el wrap a propósito.',
    c: 'En C el overflow de enteros con signo es comportamiento indefinido: puede pasar cualquier cosa. Usa long long (64 bits) y castea antes de multiplicar.',
  },
  evaluate({ result, lang }) {
    const total = v(result, 'totalThrust', lang);
    const val = total ? Number(total.value) : NaN;
    const checks = [
      check('total-exists', 'totalThrust está calculado', !!total, total ? '' : 'No encuentro totalThrust.'),
      check('no-overflow', 'Sin desbordamiento: totalThrust = 3 000 000 000', total && !total.overflow && val === 3e9,
        !total ? '' : total.flags.includes('promotion') ? `Valor ${val}: la multiplicación se hizo en 32 bits antes de ampliarse a ${total.type}.`
          : total.overflow ? `Valor ${val}: ¡wrap-around! El tipo ${total.type} no llega a 3 000 millones.` : `Valor actual: ${val}`),
    ];
    let fuel = null;
    if (lang === 'python') {
      const fpe = v(result, 'fuelPerEngine', lang);
      const res = v(result, 'reserve', lang);
      checks.push(check('fuel-int', 'fuel_per_engine son celdas enteras (333)', fpe && Number.isInteger(fpe.value) && fpe.value === 333,
        fpe ? `fuel_per_engine = ${fpe.value}${Number.isInteger(fpe.value) ? '' : ' (float: celdas partidas)'}` : 'Falta fuel_per_engine.'));
      checks.push(check('fuel-reserve', 'reserve guarda el sobrante (1 celda)', res && res.value === 1, res ? `reserve = ${res.value}` : 'Falta reserve.'));
      fuel = { perEngine: fpe ? fpe.value : 0, reserve: res ? res.value : 0 };
    }
    return { checks, scene: { total: Number.isFinite(val) ? val : 0, overflow: !total || !!total.overflow, typeName: total ? total.type : '?', fuel, engines: 4 } };
  },
  duck: {
    'no-overflow': [
      '¿Cuál es el número más grande que cabe en el tipo que has elegido para totalThrust?',
      'Si cambias el tipo de la variable de destino, ¿en qué tipo se hace la multiplicación de la derecha?',
      '¿Qué pasaría si conviertes uno de los operandos a un tipo de 64 bits ANTES de multiplicar?',
    ],
    'fuel-int': ['En Python, ¿qué devuelve 7 / 2? ¿Y 7 // 2?', '¿Existe algún operador que divida y descarte los decimales?'],
    'fuel-reserve': ['Si repartes 1000 entre 3 partes enteras, ¿cuánto sobra? ¿Qué operador calcula el resto?'],
    'total-exists': ['¿Has mantenido el nombre exacto de la variable que espera el motor?'],
  },
};

export default [worldLaws, reactor];
