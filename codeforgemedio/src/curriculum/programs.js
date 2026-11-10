// Misiones de programa: los primeros pasos de quien empieza desde cero.
// No hay funciones: el programa se ejecuta de arriba abajo y lo que escribe con print
// aparece en la pantalla de la nave (escena «screen»).
import { check, v } from './helpers.js';
import { runProgram } from '../core/runtime.js';
import { stripComments } from '../core/transpiler.js';
import { usesLoop } from '../core/analyzer.js';

/** Compara textos sin fijarse en mayúsculas, tildes, signos ni espacios de más. */
export const norm = (s) => String(s === undefined || s === null ? '' : s)
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const same = (a, b) => norm(a) === norm(b);
const printCalls = (src) => (src.match(/\bprint\s*\(|console\.log\s*\(|System\.out\.print(ln)?\s*\(/g) || []).length;

/**
 * Construye una misión de programa.
 * spec.checks({ out, get, src, code, lang, rerun }) → { checks, goal }
 *   out   líneas que el programa ha escrito en pantalla
 *   get   variable declarada por el jugador (o undefined)
 *   src   el código sin comentarios
 *   rerun vuelve a ejecutar el programa cambiando el código (para probar otros valores)
 *   goal  líneas que debería mostrar la pantalla (para pintar ✓ / ✗ en la escena)
 */
function program(spec) {
  return {
    id: spec.id,
    title: spec.title,
    codename: spec.codename,
    xp: spec.xp,
    boss: spec.boss,
    mode: 'run',
    scene: 'screen',
    story: spec.story,
    objective: spec.objective,
    concept: spec.concept,
    starter: spec.starter,
    solution: spec.solution,
    polyglot: spec.polyglot,
    evaluate({ result, code, lang }) {
      const out = (result && result.output ? result.output : []).map(String);
      const src = stripComments(code, lang);
      const rerun = (change) => {
        const r = runProgram({ code: change(code), lang });
        return r.error ? null : (r.output || []).map(String);
      };
      const { checks, goal } = spec.checks({ out, get: (name) => v(result, name, lang), src, code, lang, rerun });
      return {
        checks,
        scene: {
          title: spec.screen,
          lines: out.slice(0, 16).map((t, i) => ({ text: t, ok: goal ? i < goal.length && same(t, goal[i]) : true })),
          missing: goal ? Math.max(0, goal.length - out.length) : 0,
        },
      };
    },
    duck: spec.duck,
  };
}

const isNumber = (rec, n) => rec && rec.kind !== 'str' && rec.kind !== 'bool' && Number(rec.value) === n;

/* eslint-disable max-len */
const SPECS = [
  // ───────────── Módulo 1 · Primeros pasos ─────────────
  {
    id: 'p1-hola', title: 'Enciende la Pantalla', codename: 'HOLA.MUNDO', xp: 60, screen: 'PANTALLA PRINCIPAL',
    story: 'La pantalla principal de la nave Nova lleva años apagada. Tu primer programa la enciende: cada orden de escribir pone una línea de texto en la pantalla. Todo el mundo que programa empezó exactamente así.',
    objective: 'Haz que la pantalla muestre dos líneas: primero «Hola, mundo» y debajo «Sistemas en línea».',
    concept: {
      title: 'Tu primer programa',
      text: 'Un programa es una lista de órdenes que el ordenador cumple de arriba abajo, una detrás de otra. La primera orden que aprende cualquier programador es la de escribir un texto en la pantalla.',
    },
    starter: {
      python: `# print escribe un texto en la pantalla.
# El texto va siempre entre comillas.
print("Hola, mundo")
# TODO: escribe debajo otra línea que diga: Sistemas en línea
`,
      js: `// console.log escribe un texto en la pantalla.
// El texto va siempre entre comillas.
console.log("Hola, mundo");
// TODO: escribe debajo otra línea que diga: Sistemas en línea
`,
      java: `public class Main {
    public static void main(String[] args) {
        // System.out.println escribe un texto en la pantalla.
        // El texto va siempre entre comillas.
        System.out.println("Hola, mundo");
        // TODO: escribe debajo otra línea que diga: Sistemas en línea
    }
}
`,
    },
    solution: {
      python: `print("Hola, mundo")
print("Sistemas en línea")
`,
      js: `console.log("Hola, mundo");
console.log("Sistemas en línea");
`,
      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hola, mundo");
        System.out.println("Sistemas en línea");
    }
}
`,
    },
    polyglot: {
      python: 'En Python basta con print("texto"). No hace falta nada más: por eso es uno de los lenguajes más usados para empezar.',
      js: 'En JavaScript se escribe con console.log("texto"). Cada orden suele acabar en punto y coma.',
      java: 'En Java todo el programa vive dentro de una clase y empieza por el método main. Ese «envoltorio» es siempre igual: de momento, escribe tus órdenes dentro de las llaves de main.',
    },
    checks({ out }) {
      const goal = ['Hola, mundo', 'Sistemas en línea'];
      return {
        goal,
        checks: [
          check('linea1', 'La primera línea dice «Hola, mundo»', same(out[0], goal[0]), out[0] ? `Ahora dice: ${out[0]}` : 'La pantalla está vacía.'),
          check('linea2', 'La segunda línea dice «Sistemas en línea»', same(out[1], goal[1]), out[1] ? `Ahora dice: ${out[1]}` : 'Todavía no hay segunda línea.'),
        ],
      };
    },
    duck: {
      linea1: ['¿Qué orden del código inicial escribe la primera línea? ¿La has cambiado sin querer?'],
      linea2: ['Fíjate en la línea que ya funciona: ¿qué tendrías que copiar y qué tendrías que cambiar para escribir otro texto?', '¿Has puesto el texto entre comillas?'],
    },
  },
  {
    id: 'p1-variables', title: 'Cajas con Nombre', codename: 'VAR.CAJA', xp: 70, screen: 'ESTADO DE LA NAVE',
    story: 'El panel de la nave necesita recordar datos: cuánta energía queda, cómo están los escudos… Para recordar algo, un programa lo guarda en una variable: una caja con una etiqueta.',
    objective: 'Crea una variable llamada escudos con el valor 100 y muéstrala en la pantalla, debajo de la energía.',
    concept: {
      title: 'Variables: cajas con nombre',
      text: 'Una variable es una caja con una etiqueta. Dentro guardas un dato (un número, un texto…) y, a partir de ahí, cada vez que escribes su nombre el programa usa lo que hay dentro.',
    },
    starter: {
      python: `# Una variable es una caja con nombre que guarda un dato.
energia = 50
print(energia)
# TODO: crea la variable escudos con el valor 100 y muéstrala
`,
      js: `// Una variable es una caja con nombre que guarda un dato.
const energia = 50;
console.log(energia);
// TODO: crea la variable escudos con el valor 100 y muéstrala
`,
      java: `public class Main {
    public static void main(String[] args) {
        // Una variable es una caja con nombre que guarda un dato.
        int energia = 50;
        System.out.println(energia);
        // TODO: crea la variable escudos con el valor 100 y muéstrala
    }
}
`,
    },
    solution: {
      python: `energia = 50
print(energia)
escudos = 100
print(escudos)
`,
      js: `const energia = 50;
console.log(energia);
const escudos = 100;
console.log(escudos);
`,
      java: `public class Main {
    public static void main(String[] args) {
        int energia = 50;
        System.out.println(energia);
        int escudos = 100;
        System.out.println(escudos);
    }
}
`,
    },
    polyglot: {
      python: 'En Python una variable se crea al darle un valor: nombre = valor. No hay que avisar de nada antes.',
      js: 'En JavaScript se crea con const (si no va a cambiar) o con let (si va a cambiar). Después va el nombre, un = y el valor.',
      java: 'En Java hay que decir de qué tipo es la caja antes del nombre: int significa «número entero».',
    },
    checks({ out, get }) {
      const esc = get('escudos');
      return {
        goal: ['50', '100'],
        checks: [
          check('variable', 'Existe la variable escudos y vale 100', isNumber(esc, 100), !esc ? 'No encuentro ninguna variable llamada escudos.' : esc.kind === 'str' ? 'escudos es un texto: quita las comillas para que sea un número.' : `escudos vale ${esc.value}.`),
          check('pantalla', 'La pantalla muestra 50 y, debajo, 100', out[0] === '50' && out[1] === '100', out.length ? `La pantalla muestra: ${out.join(' · ')}` : 'La pantalla está vacía.'),
        ],
      };
    },
    duck: {
      variable: ['Mira cómo está creada la variable energia. ¿Qué cambiarías para crear otra que se llame escudos y valga 100?', '¿Has escrito el nombre exactamente igual, sin mayúsculas ni tildes?'],
      pantalla: ['¿Qué orden muestra la energía en la pantalla? ¿Cómo sería la misma orden para los escudos?', 'Para mostrar lo que hay DENTRO de una variable, ¿su nombre va con comillas o sin ellas?'],
    },
  },
  {
    id: 'p1-calculo', title: 'Calculadora de a Bordo', codename: 'VAR.CALC', xp: 80, screen: 'BANCO DE CRÉDITOS',
    story: 'Has completado una misión de rescate y te pagan el DOBLE del premio habitual. El banco de a bordo tiene que sumarlo a tus créditos, pero la cuenta que hace no es correcta.',
    objective: 'Arregla el cálculo: total debe ser tus créditos más el doble del premio (10 + 5 × 2 = 20).',
    concept: {
      title: 'Calcular con variables',
      text: 'Con las variables se puede calcular igual que con números: + suma, - resta, * multiplica. El resultado se puede guardar en otra variable.',
    },
    starter: {
      python: `creditos = 10
premio = 5
# TODO: te pagan el DOBLE del premio. Arregla la cuenta.
total = creditos + premio
print(total)
`,
      js: `const creditos = 10;
const premio = 5;
// TODO: te pagan el DOBLE del premio. Arregla la cuenta.
const total = creditos + premio;
console.log(total);
`,
      java: `public class Main {
    public static void main(String[] args) {
        int creditos = 10;
        int premio = 5;
        // TODO: te pagan el DOBLE del premio. Arregla la cuenta.
        int total = creditos + premio;
        System.out.println(total);
    }
}
`,
    },
    solution: {
      python: `creditos = 10
premio = 5
total = creditos + premio * 2
print(total)
`,
      js: `const creditos = 10;
const premio = 5;
const total = creditos + premio * 2;
console.log(total);
`,
      java: `public class Main {
    public static void main(String[] args) {
        int creditos = 10;
        int premio = 5;
        int total = creditos + premio * 2;
        System.out.println(total);
    }
}
`,
    },
    polyglot: {
      python: 'El asterisco * es el signo de multiplicar en casi todos los lenguajes (la x se confundiría con una letra).',
      js: 'El asterisco * es el signo de multiplicar en casi todos los lenguajes (la x se confundiría con una letra).',
      java: 'El asterisco * es el signo de multiplicar en casi todos los lenguajes (la x se confundiría con una letra).',
    },
    checks({ out, rerun }) {
      // Con otro premio debe seguir funcionando: así no vale escribir un 20 a mano.
      const other = rerun((c) => c.replace(/(\bpremio\s*=\s*)5\b/, '$17'));
      const general = !!other && other[0] === '24';
      return {
        goal: ['20'],
        checks: [
          check('total', 'La pantalla muestra 20', out[0] === '20', out.length ? `Ahora muestra: ${out[0]}` : 'La pantalla está vacía.'),
          check('calculo', 'La cuenta usa las variables (también funciona con otro premio)', out[0] === '20' && general, out[0] === '20' && !general ? 'Con un premio de 7 debería salir 24: calcula con las variables creditos y premio.' : ''),
        ],
      };
    },
    duck: {
      total: ['¿Cuánto es el doble de 5? ¿Y qué operación tendrías que hacer con la variable premio para conseguirlo?', '¿Con qué símbolo se multiplica en un programa?'],
      calculo: ['Si mañana el premio fuera 7, ¿tu programa seguiría dando el resultado correcto sin tocarlo?'],
    },
  },
  {
    id: 'p1-cambiar', title: 'Una Vida Menos', codename: 'VAR.CAMBIO', xp: 80, screen: 'VIDAS',
    story: 'Un asteroide ha golpeado la nave. Tenías 3 vidas y ahora deberías tener 2, pero el marcador sigue mostrando 3: nadie le ha dicho a la variable que cambie.',
    objective: 'Después del golpe, resta 1 a la variable vidas para que la pantalla muestre primero 3 y luego 2.',
    concept: {
      title: 'Las variables pueden cambiar',
      text: 'Lo que hay dentro de una caja se puede cambiar. En un juego pasa todo el rato: los puntos suben, las vidas bajan. Para cambiar una variable se le vuelve a dar un valor, que puede calcularse a partir del que ya tenía.',
    },
    starter: {
      python: `vidas = 3
print(vidas)
# Un asteroide golpea la nave: pierdes una vida.
# TODO: resta 1 a vidas

print(vidas)
`,
      js: `let vidas = 3;
console.log(vidas);
// Un asteroide golpea la nave: pierdes una vida.
// TODO: resta 1 a vidas

console.log(vidas);
`,
      java: `public class Main {
    public static void main(String[] args) {
        int vidas = 3;
        System.out.println(vidas);
        // Un asteroide golpea la nave: pierdes una vida.
        // TODO: resta 1 a vidas

        System.out.println(vidas);
    }
}
`,
    },
    solution: {
      python: `vidas = 3
print(vidas)
vidas = vidas - 1
print(vidas)
`,
      js: `let vidas = 3;
console.log(vidas);
vidas = vidas - 1;
console.log(vidas);
`,
      java: `public class Main {
    public static void main(String[] args) {
        int vidas = 3;
        System.out.println(vidas);
        vidas = vidas - 1;
        System.out.println(vidas);
    }
}
`,
    },
    polyglot: {
      python: 'vidas = vidas - 1 se lee de derecha a izquierda: «calcula vidas menos 1 y guárdalo en vidas». Hay un atajo: vidas -= 1.',
      js: 'Para poder cambiarla, la variable se crea con let (con const no se puede cambiar). Atajos: vidas -= 1 o vidas--.',
      java: 'El tipo (int) solo se escribe la primera vez, al crear la variable. Para cambiarla basta con su nombre. Atajos: vidas -= 1 o vidas--.',
    },
    checks({ out, src }) {
      const changes = /\bvidas\s*(-=|--|=\s*vidas\s*-)|--\s*vidas/.test(src);
      return {
        goal: ['3', '2'],
        checks: [
          check('antes', 'Antes del golpe la pantalla muestra 3', out[0] === '3', out.length ? `Muestra: ${out[0]}` : 'La pantalla está vacía.'),
          check('despues', 'Después del golpe muestra 2', out[1] === '2', out.length > 1 ? `Muestra: ${out[1]}` : ''),
          check('resta', 'El programa resta 1 a la variable vidas', changes && out[1] === '2', changes ? '' : 'Cambia la variable: vidas = vidas - 1.'),
        ],
      };
    },
    duck: {
      despues: ['Entre las dos órdenes de mostrar, ¿hay alguna línea que cambie lo que vale vidas?', '¿Cómo le dirías al programa: «lo que valga vidas ahora, menos 1»?'],
      resta: ['No escribas el 2 a mano: ¿cómo se calcula a partir de lo que ya vale la variable?'],
      antes: ['¿Has cambiado el valor inicial de vidas? Debe empezar en 3.'],
    },
  },
  {
    id: 'p1-texto', title: 'Mensaje de Bienvenida', codename: 'TEXTO.UNIR', xp: 90, screen: 'BIENVENIDA',
    story: 'El ordenador de a bordo saluda a quien se sienta a los mandos, pero ahora mismo dice «Hola, » y se queda callado. Tiene que añadir el nombre que hay guardado en la variable piloto.',
    objective: 'Haz que la pantalla salude al piloto por su nombre: «Hola, Nova». Si cambias el nombre guardado en piloto, el saludo debe cambiar solo.',
    concept: {
      title: 'Unir textos',
      text: 'Los textos también se pueden «sumar»: el signo + pega un texto a continuación de otro. Así puedes mezclar un texto fijo con lo que haya guardado en una variable.',
    },
    starter: {
      python: `piloto = "Nova"
# El signo + une dos textos en uno solo.
# TODO: completa el saludo con el nombre guardado en piloto
print("Hola, ")
`,
      js: `const piloto = "Nova";
// El signo + une dos textos en uno solo.
// TODO: completa el saludo con el nombre guardado en piloto
console.log("Hola, ");
`,
      java: `public class Main {
    public static void main(String[] args) {
        String piloto = "Nova";
        // El signo + une dos textos en uno solo.
        // TODO: completa el saludo con el nombre guardado en piloto
        System.out.println("Hola, ");
    }
}
`,
    },
    solution: {
      python: `piloto = "Nova"
print("Hola, " + piloto)
`,
      js: `const piloto = "Nova";
console.log("Hola, " + piloto);
`,
      java: `public class Main {
    public static void main(String[] args) {
        String piloto = "Nova";
        System.out.println("Hola, " + piloto);
    }
}
`,
    },
    polyglot: {
      python: 'Ojo con el espacio: "Hola, " lo lleva dentro de las comillas. Más adelante verás otra forma muy cómoda: print(f"Hola, {piloto}").',
      js: 'Ojo con el espacio: "Hola, " lo lleva dentro de las comillas. Otra forma moderna: `Hola, ${piloto}` con comillas inclinadas.',
      java: 'String (con mayúscula) es el tipo de las cajas que guardan texto. El + pega textos y también textos con números.',
    },
    checks({ out, get, src, rerun }) {
      const p = get('piloto');
      const name = p && p.kind === 'str' ? String(p.value) : '';
      const other = rerun((c) => c.replace(/(\bpiloto\s*=\s*)(["'])[^"']*\2/, '$1$2Zoe$2'));
      const general = !!other && same(other[0], 'Hola, Zoe');
      return {
        goal: [`Hola, ${name || 'Nova'}`],
        checks: [
          check('piloto', 'La variable piloto guarda un nombre', name.trim().length > 0, p ? '' : 'No encuentro la variable piloto.'),
          check('saludo', `La pantalla dice «Hola, ${name || 'Nova'}»`, !!name && same(out[0], `Hola, ${name}`), out[0] ? `Ahora dice: ${out[0]}` : 'La pantalla está vacía.'),
          check('usa-variable', 'El saludo usa la variable (cambia solo si cambias el nombre)', general && (src.match(/\bpiloto\b/g) || []).length >= 2, 'Si piloto guardara "Zoe", la pantalla debería decir «Hola, Zoe».'),
        ],
      };
    },
    duck: {
      saludo: ['¿Qué signo pega un texto a continuación de otro?', 'Para usar lo que hay dentro de la variable piloto, ¿su nombre va con comillas o sin ellas?'],
      'usa-variable': ['Si escribes el nombre a mano dentro de las comillas, ¿qué pasa cuando se siente otro piloto a los mandos?'],
      piloto: ['¿Has borrado la primera línea? La variable piloto tiene que seguir existiendo.'],
    },
  },

  // ───────────── Módulo 3 · Decisiones ─────────────
  {
    id: 'p3-puerta', title: 'Control de Acceso', codename: 'IF.ELSE', xp: 100, screen: 'PUERTA DEL HANGAR',
    story: 'La puerta del hangar solo se abre si la nave tiene energía suficiente. El programa ya sabe decir «Puerta abierta», pero cuando falta energía se queda en silencio y nadie sabe qué pasa.',
    objective: 'Si energia es 50 o más, la pantalla debe decir «Puerta abierta». En cualquier otro caso debe decir «Puerta bloqueada».',
    concept: {
      title: 'Decisiones: si… y si no…',
      text: 'Hasta ahora tus programas hacían siempre lo mismo. Con if («si») el programa hace una pregunta y elige: si la respuesta es sí, ejecuta un bloque; con else («si no») ejecuta otro distinto.',
    },
    starter: {
      python: `energia = 30
# Si la energía es 50 o más, la puerta se abre.
if energia >= 50:
    print("Puerta abierta")
# TODO: añade un else que muestre: Puerta bloqueada
`,
      js: `const energia = 30;
// Si la energía es 50 o más, la puerta se abre.
if (energia >= 50) {
  console.log("Puerta abierta");
}
// TODO: añade un else que muestre: Puerta bloqueada
`,
      java: `public class Main {
    public static void main(String[] args) {
        int energia = 30;
        // Si la energía es 50 o más, la puerta se abre.
        if (energia >= 50) {
            System.out.println("Puerta abierta");
        }
        // TODO: añade un else que muestre: Puerta bloqueada
    }
}
`,
    },
    solution: {
      python: `energia = 30
if energia >= 50:
    print("Puerta abierta")
else:
    print("Puerta bloqueada")
`,
      js: `const energia = 30;
if (energia >= 50) {
  console.log("Puerta abierta");
} else {
  console.log("Puerta bloqueada");
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int energia = 30;
        if (energia >= 50) {
            System.out.println("Puerta abierta");
        } else {
            System.out.println("Puerta bloqueada");
        }
    }
}
`,
    },
    polyglot: {
      python: 'En Python el bloque de cada camino se marca con dos puntos y con la sangría: las líneas que van «metidas hacia dentro» pertenecen al if o al else.',
      js: 'La condición va entre paréntesis y cada camino entre llaves { }. El else se escribe justo después de la llave que cierra el if.',
      java: 'La condición va entre paréntesis y cada camino entre llaves { }. El else se escribe justo después de la llave que cierra el if.',
    },
    checks({ out, rerun }) {
      const high = rerun((c) => c.replace(/(\benergia\s*=\s*)\d+/, '$180'));
      const low = rerun((c) => c.replace(/(\benergia\s*=\s*)\d+/, '$130'));
      const okLow = !!low && low.length === 1 && same(low[0], 'Puerta bloqueada');
      const okHigh = !!high && high.length === 1 && same(high[0], 'Puerta abierta');
      return {
        goal: [same(out[0], 'Puerta abierta') ? 'Puerta abierta' : 'Puerta bloqueada'],
        checks: [
          check('bloqueada', 'Con energía 30, la pantalla dice «Puerta bloqueada»', okLow, low && low.length ? `Con 30 dice: ${low.join(' · ')}` : 'Con 30 la pantalla se queda vacía.'),
          check('abierta', 'Con energía 80, la pantalla dice «Puerta abierta»', okHigh, high && high.length ? `Con 80 dice: ${high.join(' · ')}` : 'Con 80 la pantalla se queda vacía.'),
        ],
      };
    },
    duck: {
      bloqueada: ['Ahora mismo, cuando la condición del if NO se cumple, ¿qué líneas se ejecutan?', '¿Qué palabra sirve para decir «y si no se cumple, haz esto otro»?'],
      abierta: ['¿Has cambiado la condición del if? Debe seguir abriendo con 50 o más.', '¿Puede ser que tu programa escriba las dos frases a la vez? Solo debe salir una.'],
    },
  },

  // ───────────── Módulo 4 · Bucles ─────────────
  {
    id: 'p4-cuenta', title: 'Cuenta Atrás', codename: 'WHILE.DESPEGUE', xp: 110, screen: 'LANZAMIENTO',
    story: 'Todo listo para el lanzamiento. La torre espera la cuenta atrás completa: 5, 4, 3, 2, 1… y la orden de despegue. El programa actual empieza a contar tarde y nunca da la orden.',
    objective: 'Haz que la pantalla muestre 5, 4, 3, 2, 1 (cada número en su línea) y, al final, «¡Despegue!».',
    concept: {
      title: 'while: repetir mientras…',
      text: 'Un bucle while repite un bloque MIENTRAS su condición sea verdadera. En cada vuelta algo tiene que cambiar (aquí, el número baja de uno en uno) para que el bucle termine alguna vez.',
    },
    starter: {
      python: `n = 3
# Mientras n sea mayor que 0: muéstralo y réstale 1.
while n > 0:
    print(n)
    n = n - 1
# TODO: la cuenta debe empezar en 5 y, al terminar, mostrar: ¡Despegue!
`,
      js: `let n = 3;
// Mientras n sea mayor que 0: muéstralo y réstale 1.
while (n > 0) {
  console.log(n);
  n = n - 1;
}
// TODO: la cuenta debe empezar en 5 y, al terminar, mostrar: ¡Despegue!
`,
      java: `public class Main {
    public static void main(String[] args) {
        int n = 3;
        // Mientras n sea mayor que 0: muéstralo y réstale 1.
        while (n > 0) {
            System.out.println(n);
            n = n - 1;
        }
        // TODO: la cuenta debe empezar en 5 y, al terminar, mostrar: ¡Despegue!
    }
}
`,
    },
    solution: {
      python: `n = 5
while n > 0:
    print(n)
    n = n - 1
print("¡Despegue!")
`,
      js: `let n = 5;
while (n > 0) {
  console.log(n);
  n = n - 1;
}
console.log("¡Despegue!");
`,
      java: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        while (n > 0) {
            System.out.println(n);
            n = n - 1;
        }
        System.out.println("¡Despegue!");
    }
}
`,
    },
    polyglot: {
      python: 'Lo que está metido hacia dentro (con sangría) se repite. La primera línea que vuelve al margen ya está FUERA del bucle: se ejecuta una sola vez, al terminar.',
      js: 'Lo que está entre las llaves { } se repite. Lo que escribas después de la llave de cierre ya está FUERA del bucle: se ejecuta una sola vez, al terminar.',
      java: 'Lo que está entre las llaves { } del while se repite. Lo que escribas después de su llave de cierre ya está FUERA del bucle: se ejecuta una sola vez, al terminar.',
    },
    checks({ out, src, code, lang }) {
      const goal = ['5', '4', '3', '2', '1', '¡Despegue!'];
      const nums = goal.slice(0, 5).every((g, i) => out[i] === g);
      const once = out.filter((l) => same(l, 'Despegue')).length === 1;
      return {
        goal,
        checks: [
          check('cuenta', 'La cuenta va de 5 a 1', nums, out.length ? `La pantalla muestra: ${out.slice(0, 8).join(', ')}` : 'La pantalla está vacía.'),
          check('despegue', 'Al final, y una sola vez, «¡Despegue!»', nums && out.length === 6 && same(out[5], 'Despegue') && once, !once && out.some((l) => same(l, 'Despegue')) ? '«¡Despegue!» sale varias veces: está dentro del bucle.' : ''),
          check('bucle', 'La cuenta la hace un bucle (no cinco órdenes a mano)', usesLoop(code, lang) && printCalls(src) <= 3),
        ],
      };
    },
    duck: {
      cuenta: ['¿En qué número empieza a contar tu programa? ¿Qué línea lo decide?'],
      despegue: ['¿La orden de despegue debe repetirse en cada vuelta o ejecutarse una sola vez al acabar?', '¿Cómo sabe tu lenguaje qué líneas están dentro del bucle y cuáles fuera?'],
      bucle: ['Si la cuenta atrás fuera desde 100, ¿escribirías 100 órdenes? ¿Qué estructura lo hace por ti?'],
    },
  },

  // ───────────── Módulo 5 · Listas ─────────────
  {
    id: 'p5-mochila', title: 'La Mochila del Explorador', codename: 'LISTA.INICIO', xp: 110, screen: 'INVENTARIO',
    story: 'Antes de bajar al planeta revisas tu mochila. En vez de tres variables sueltas, los objetos están guardados juntos en una lista, uno detrás de otro.',
    objective: 'La pantalla ya muestra el primer objeto. Haz que muestre también el ÚLTIMO objeto de la lista (mapa) y, debajo, cuántos objetos hay (3).',
    concept: {
      title: 'Listas: muchos datos en fila',
      text: 'Una lista guarda varios datos en orden bajo un solo nombre. Cada dato tiene un número de posición y —esto sorprende a todo el mundo— se empieza a contar por el 0: el primero está en la posición 0, el segundo en la 1…',
    },
    starter: {
      python: `# Una lista guarda varios datos en orden. Las posiciones empiezan en 0.
mochila = ["linterna", "cuerda", "mapa"]
print(mochila[0])
# TODO: muestra el último objeto y, debajo, cuántos objetos hay
`,
      js: `// Una lista guarda varios datos en orden. Las posiciones empiezan en 0.
const mochila = ["linterna", "cuerda", "mapa"];
console.log(mochila[0]);
// TODO: muestra el último objeto y, debajo, cuántos objetos hay
`,
      java: `public class Main {
    public static void main(String[] args) {
        // Una lista guarda varios datos en orden. Las posiciones empiezan en 0.
        String[] mochila = {"linterna", "cuerda", "mapa"};
        System.out.println(mochila[0]);
        // TODO: muestra el último objeto y, debajo, cuántos objetos hay
    }
}
`,
    },
    solution: {
      python: `mochila = ["linterna", "cuerda", "mapa"]
print(mochila[0])
print(mochila[2])
print(len(mochila))
`,
      js: `const mochila = ["linterna", "cuerda", "mapa"];
console.log(mochila[0]);
console.log(mochila[2]);
console.log(mochila.length);
`,
      java: `public class Main {
    public static void main(String[] args) {
        String[] mochila = {"linterna", "cuerda", "mapa"};
        System.out.println(mochila[0]);
        System.out.println(mochila[2]);
        System.out.println(mochila.length);
    }
}
`,
    },
    polyglot: {
      python: 'len(lista) te dice cuántos elementos tiene. Y un atajo solo de Python: lista[-1] es el último, sea cual sea el tamaño.',
      js: 'lista.length te dice cuántos elementos tiene. El último siempre está en la posición lista.length - 1.',
      java: 'En Java una lista sencilla se llama array: String[] es «un array de textos». mochila.length te dice cuántos elementos tiene.',
    },
    checks({ out, src }) {
      const reads = (src.match(/\bmochila\s*\[/g) || []).length;
      const size = /len\s*\(\s*mochila\s*\)|mochila\s*\.\s*length/.test(src);
      return {
        goal: ['linterna', 'mapa', '3'],
        checks: [
          check('primero', 'La primera línea sigue siendo «linterna»', same(out[0], 'linterna'), out[0] ? `Muestra: ${out[0]}` : 'La pantalla está vacía.'),
          check('ultimo', 'La segunda línea es el último objeto, sacado de la lista', same(out[1], 'mapa') && reads >= 2, out[1] ? (same(out[1], 'mapa') ? 'Sácalo de la lista con su posición, no lo escribas a mano.' : `Muestra: ${out[1]}`) : 'Falta la segunda línea.'),
          check('cuantos', 'La tercera línea es el número de objetos, preguntándoselo a la lista', out[2] === '3' && size, out[2] === '3' && !size ? 'No escribas el 3 a mano: pregúntale su tamaño a la lista.' : out[2] ? `Muestra: ${out[2]}` : 'Falta la tercera línea.'),
        ],
      };
    },
    duck: {
      ultimo: ['Si el primero está en la posición 0, ¿en qué posición está el tercero?', 'Mira cómo se muestra el primer objeto: ¿qué número cambiarías?'],
      cuantos: ['¿Cómo se le pregunta a una lista cuántos elementos tiene en tu lenguaje? Está en la lección.'],
      primero: ['¿Has borrado la línea que mostraba mochila[0]?'],
    },
  },

  // ───────────── Reto final ─────────────
  {
    id: 'reto-fizzbuzz', title: 'El Guardián FizzBuzz', codename: 'RETO.FINAL', xp: 300, screen: 'PRUEBA DEL GUARDIÁN', boss: true,
    story: 'La última puerta la vigila el Guardián, y solo deja pasar a quien supera su prueba. No es una prueba inventada: FizzBuzz se ha usado durante años en entrevistas de trabajo reales para saber si alguien sabe programar. Tú ya tienes todo lo que hace falta: bucles, decisiones y el resto de la división.',
    objective: 'Recorre los números del 1 al 15. Por cada uno muestra una línea: «Fizz» si es múltiplo de 3, «Buzz» si es múltiplo de 5, «FizzBuzz» si lo es de los dos, y el propio número en los demás casos.',
    concept: {
      title: 'Juntarlo todo: bucle + decisiones + resto',
      text: 'Los programas de verdad se hacen combinando piezas pequeñas que ya conoces. Aquí un bucle recorre los números y, dentro, una cadena de decisiones elige qué escribir. El orden de las preguntas importa.',
    },
    starter: {
      python: `for i in range(1, 16):
    if i % 3 == 0:
        print("Fizz")
    else:
        print(i)
# TODO: falta «Buzz» (múltiplos de 5) y «FizzBuzz» (múltiplos de 3 y de 5)
`,
      js: `for (let i = 1; i <= 15; i++) {
  if (i % 3 === 0) {
    console.log("Fizz");
  } else {
    console.log(i);
  }
}
// TODO: falta «Buzz» (múltiplos de 5) y «FizzBuzz» (múltiplos de 3 y de 5)
`,
      java: `public class Main {
    public static void main(String[] args) {
        for (int i = 1; i <= 15; i++) {
            if (i % 3 == 0) {
                System.out.println("Fizz");
            } else {
                System.out.println(i);
            }
        }
        // TODO: falta «Buzz» (múltiplos de 5) y «FizzBuzz» (múltiplos de 3 y de 5)
    }
}
`,
    },
    solution: {
      python: `for i in range(1, 16):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`,
      js: `for (let i = 1; i <= 15; i++) {
  if (i % 15 === 0) {
    console.log("FizzBuzz");
  } else if (i % 3 === 0) {
    console.log("Fizz");
  } else if (i % 5 === 0) {
    console.log("Buzz");
  } else {
    console.log(i);
  }
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        for (int i = 1; i <= 15; i++) {
            if (i % 15 == 0) {
                System.out.println("FizzBuzz");
            } else if (i % 3 == 0) {
                System.out.println("Fizz");
            } else if (i % 5 == 0) {
                System.out.println("Buzz");
            } else {
                System.out.println(i);
            }
        }
    }
}
`,
    },
    polyglot: {
      python: 'elif es «si no, si…»: encadena preguntas y solo entra en la primera que se cumple. range(1, 16) va del 1 al 15: el 16 no entra.',
      js: 'else if encadena preguntas y solo entra en la primera que se cumple. Un número es múltiplo de 3 y de 5 a la vez cuando es múltiplo de 15.',
      java: 'else if encadena preguntas y solo entra en la primera que se cumple. Un número es múltiplo de 3 y de 5 a la vez cuando es múltiplo de 15.',
    },
    checks({ out, code, lang, src }) {
      const want = (i) => (i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));
      const goal = Array.from({ length: 15 }, (_, k) => want(k + 1));
      const okAt = (list) => list.every((i) => same(out[i - 1], goal[i - 1]));
      const firstBad = goal.findIndex((g, k) => !same(out[k], g));
      return {
        goal,
        checks: [
          check('lineas', 'Hay exactamente 15 líneas, una por número', out.length === 15, `Líneas en pantalla: ${out.length}`),
          check('fizz', '«Fizz» en los múltiplos de 3 (3, 6, 9, 12)', okAt([3, 6, 9, 12])),
          check('buzz', '«Buzz» en los múltiplos de 5 (5, 10)', okAt([5, 10]), out[4] ? `En el 5 muestra: ${out[4]}` : ''),
          check('fizzbuzz', '«FizzBuzz» en el 15', okAt([15]), out[14] ? `En el 15 muestra: ${out[14]}` : ''),
          check('numeros', 'El número tal cual en todos los demás', okAt([1, 2, 4, 7, 8, 11, 13, 14]), firstBad >= 0 && out.length ? `Primera línea distinta: la del ${firstBad + 1}` : ''),
          check('bucle', 'Lo hace un bucle (no 15 órdenes a mano)', usesLoop(code, lang) && printCalls(src) <= 6),
        ],
      };
    },
    duck: {
      buzz: ['¿Cómo sabes si un número es múltiplo de 5? Ya lo haces con el 3.', '¿Dónde añadirías una pregunta más para que haya tres caminos en vez de dos?'],
      fizzbuzz: ['El 15 es múltiplo de 3… y tu programa entra en la primera pregunta que se cumple. ¿Qué pregunta tendría que ir la PRIMERA para que el 15 no se quede en «Fizz»?', '¿Qué tienen en común los números que son múltiplo de 3 y de 5 a la vez?'],
      numeros: ['¿En qué camino se muestra el número? ¿Sigue siendo el último, el que recoge «todos los demás»?'],
      lineas: ['¿Puede que algún número escriba dos líneas? Con una cadena if / else if / else solo se entra en un camino.'],
      fizz: ['El código inicial ya escribía «Fizz». ¿Has cambiado esa condición?'],
      bucle: ['¿Y si el Guardián pidiera del 1 al 1000?'],
    },
  },
];

export const PROGRAMS = Object.fromEntries(SPECS.map((s) => [s.id, program(s)]));

const P = (py, js, java) => ({ python: py, js, java });

/** Lecciones «Aprende primero» de las misiones de programa. */
export const PROGRAM_LESSONS = {
  'p1-hola': {
    steps: [
      {
        title: 'Un programa es una lista de órdenes',
        text: 'Programar es escribir órdenes para que el ordenador las cumpla, una detrás de otra y de arriba abajo, como una receta de cocina. El ordenador es rapidísimo pero no adivina nada: hace exactamente lo que pone, ni más ni menos.',
        visual: 'orders',
      },
      {
        title: 'La primera orden: escribir en pantalla',
        text: 'La orden más famosa de la programación es la que escribe un texto en la pantalla. El texto va entre comillas para que el ordenador sepa que es un mensaje y no otra orden. Cada vez que la usas, aparece una línea nueva.',
        code: P('print("Hola")\nprint("¿Qué tal?")\n# En pantalla:\n# Hola\n# ¿Qué tal?', 'console.log("Hola");\nconsole.log("¿Qué tal?");\n// En pantalla:\n// Hola\n// ¿Qué tal?', 'System.out.println("Hola");\nSystem.out.println("¿Qué tal?");\n// En pantalla:\n// Hola\n// ¿Qué tal?'),
      },
      {
        title: 'Las líneas que el ordenador se salta',
        text: 'Las líneas que empiezan por el símbolo de comentario son notas para las personas: el ordenador las ignora. En las misiones, los comentarios que empiezan por TODO («por hacer», en inglés) te dicen qué falta.',
        code: P('# Esto es un comentario: no hace nada\nprint("Esto sí se ejecuta")', '// Esto es un comentario: no hace nada\nconsole.log("Esto sí se ejecuta");', '// Esto es un comentario: no hace nada\nSystem.out.println("Esto sí se ejecuta");'),
      },
    ],
    mission: P(
      'Debajo de la línea que ya hay, escribe otra igual pero con el texto nuevo: print("Sistemas en línea")',
      'Debajo de la línea que ya hay, escribe otra igual pero con el texto nuevo: console.log("Sistemas en línea");',
      'Debajo de la línea que ya hay (y antes de la llave que cierra main), escribe otra igual con el texto nuevo: System.out.println("Sistemas en línea");',
    ),
  },
  'p1-variables': {
    steps: [
      {
        title: 'Una variable es una caja con nombre',
        text: 'Para recordar un dato, el programa lo guarda en una variable: una caja con una etiqueta. Tú eliges el nombre de la etiqueta. A partir de ese momento, cada vez que escribas ese nombre, el programa usará lo que hay dentro de la caja.',
        visual: 'boxes',
        code: P('energia = 50\nprint(energia)   # muestra 50', 'const energia = 50;\nconsole.log(energia);   // muestra 50', 'int energia = 50;\nSystem.out.println(energia);   // muestra 50'),
      },
      {
        title: 'Con comillas es texto; sin comillas, el contenido de la caja',
        text: 'Mucho ojo con esto: si escribes el nombre entre comillas, el ordenador muestra esa palabra tal cual. Si lo escribes sin comillas, va a la caja y muestra lo que hay dentro.',
        code: P('print("energia")   # muestra la palabra: energia\nprint(energia)     # muestra el contenido: 50', 'console.log("energia");   // muestra la palabra: energia\nconsole.log(energia);     // muestra el contenido: 50', 'System.out.println("energia");   // la palabra: energia\nSystem.out.println(energia);     // el contenido: 50'),
      },
      {
        title: 'Elige buenos nombres',
        text: 'Los nombres los inventas tú: sin espacios, sin tildes y sin empezar por un número. Un buen nombre dice qué hay dentro: escudos se entiende; x o cosa1, no. Los programadores profesionales pasan más tiempo leyendo código que escribiéndolo, así que los buenos nombres valen oro.',
      },
    ],
    mission: P(
      'Añade dos líneas al final: escudos = 100 para crear la caja y print(escudos) para mostrar lo que guarda.',
      'Añade dos líneas al final: const escudos = 100; para crear la caja y console.log(escudos); para mostrar lo que guarda.',
      'Añade dos líneas antes de la llave que cierra main: int escudos = 100; para crear la caja y System.out.println(escudos); para mostrar lo que guarda.',
    ),
  },
  'p1-calculo': {
    steps: [
      {
        title: 'El ordenador es una calculadora',
        text: 'Puedes hacer cuentas con números y con variables: + suma, - resta, * multiplica. Cuando el programa encuentra el nombre de una variable en una cuenta, lo cambia por lo que hay dentro de la caja.',
        visual: 'boxes',
        code: P('puntos = 40\nextra = 10\nprint(puntos + extra)   # 50\nprint(puntos * 2)       # 80', 'const puntos = 40;\nconst extra = 10;\nconsole.log(puntos + extra);   // 50\nconsole.log(puntos * 2);       // 80', 'int puntos = 40;\nint extra = 10;\nSystem.out.println(puntos + extra);   // 50\nSystem.out.println(puntos * 2);       // 80'),
      },
      {
        title: 'Primero se multiplica, luego se suma',
        text: 'Igual que en clase de matemáticas: en 10 + 5 * 2 primero se hace 5 * 2 y después se suma el 10. El resultado es 20, no 30. Si quisieras sumar primero, usarías paréntesis: (10 + 5) * 2.',
      },
    ],
    mission: P(
      'En la línea de total, multiplica el premio por 2: total = creditos + premio * 2',
      'En la línea de total, multiplica el premio por 2: const total = creditos + premio * 2;',
      'En la línea de total, multiplica el premio por 2: int total = creditos + premio * 2;',
    ),
  },
  'p1-cambiar': {
    steps: [
      {
        title: 'Lo que hay en la caja se puede cambiar',
        text: 'Una variable no es para siempre: puedes sacar lo que hay y meter otra cosa. En un videojuego pasa continuamente: los puntos suben, las vidas bajan, la posición del personaje cambia 60 veces por segundo.',
        visual: 'boxes',
      },
      {
        title: 'El signo = no significa «es igual»',
        text: 'En programación, el signo = significa «guarda». Se lee de derecha a izquierda: primero se calcula lo de la derecha y después se guarda en la caja de la izquierda. Por eso puntos = puntos + 10 tiene sentido: «coge lo que vale puntos, súmale 10 y guárdalo otra vez en puntos».',
        code: P('puntos = 0\npuntos = puntos + 10\nprint(puntos)   # 10\npuntos = puntos + 10\nprint(puntos)   # 20', 'let puntos = 0;\npuntos = puntos + 10;\nconsole.log(puntos);   // 10\npuntos = puntos + 10;\nconsole.log(puntos);   // 20', 'int puntos = 0;\npuntos = puntos + 10;\nSystem.out.println(puntos);   // 10\npuntos = puntos + 10;\nSystem.out.println(puntos);   // 20'),
      },
    ],
    mission: P(
      'En la línea vacía que hay entre los dos print, escribe: vidas = vidas - 1',
      'En la línea vacía que hay entre los dos console.log, escribe: vidas = vidas - 1; (no pongas let otra vez: la variable ya existe).',
      'En la línea vacía que hay entre los dos println, escribe: vidas = vidas - 1; (no pongas int otra vez: la variable ya existe).',
    ),
  },
  'p1-texto': {
    steps: [
      {
        title: 'Los textos se pueden pegar',
        text: 'Con los números, el signo + suma. Con los textos, el signo + pega uno a continuación del otro. El ordenador no añade espacios por su cuenta: si quieres un espacio entre dos palabras, tiene que estar dentro de las comillas.',
        code: P('print("Super" + "nova")    # Supernova\nprint("Hola" + "Ana")      # HolaAna\nprint("Hola " + "Ana")     # Hola Ana', 'console.log("Super" + "nova");    // Supernova\nconsole.log("Hola" + "Ana");      // HolaAna\nconsole.log("Hola " + "Ana");     // Hola Ana', 'System.out.println("Super" + "nova");    // Supernova\nSystem.out.println("Hola" + "Ana");      // HolaAna\nSystem.out.println("Hola " + "Ana");     // Hola Ana'),
      },
      {
        title: 'Texto fijo + texto de una variable',
        text: 'Lo más útil es mezclar un texto fijo con lo que hay en una variable. Así el mismo programa sirve para cualquier persona: basta con cambiar lo que guarda la caja. Es lo que hace una app cuando te saluda por tu nombre.',
        code: P('planeta = "Marte"\nprint("Destino: " + planeta)   # Destino: Marte', 'const planeta = "Marte";\nconsole.log("Destino: " + planeta);   // Destino: Marte', 'String planeta = "Marte";\nSystem.out.println("Destino: " + planeta);   // Destino: Marte'),
      },
    ],
    mission: P(
      'Dentro del print, después de "Hola, ", añade + piloto (sin comillas, porque es una variable): print("Hola, " + piloto)',
      'Dentro del console.log, después de "Hola, ", añade + piloto (sin comillas, porque es una variable): console.log("Hola, " + piloto);',
      'Dentro del println, después de "Hola, ", añade + piloto (sin comillas, porque es una variable): System.out.println("Hola, " + piloto);',
    ),
  },
  'p3-puerta': {
    steps: [
      {
        title: 'Un programa que decide',
        text: 'Con if («si», en inglés) el programa hace una pregunta. Si la respuesta es sí, ejecuta el bloque que va a continuación. Si es no, se lo salta. Es lo que hace un juego cuando comprueba si te queda vida o una app cuando comprueba si tu contraseña es correcta.',
        visual: 'branch',
        code: P('nota = 7\nif nota >= 5:\n    print("Aprobado")', 'const nota = 7;\nif (nota >= 5) {\n  console.log("Aprobado");\n}', 'int nota = 7;\nif (nota >= 5) {\n    System.out.println("Aprobado");\n}'),
      },
      {
        title: 'Las preguntas se hacen comparando',
        text: 'Las preguntas se escriben con comparaciones: > mayor que, < menor que, >= mayor o igual, <= menor o igual, == igual a (con dos signos igual, porque uno solo significa «guarda»).',
      },
      {
        title: 'else: el otro camino',
        text: 'Con else («si no») le dices qué hacer cuando la respuesta es no. Así el programa siempre toma uno de los dos caminos, y nunca los dos a la vez.',
        visual: 'branch',
        code: P('nota = 3\nif nota >= 5:\n    print("Aprobado")\nelse:\n    print("A recuperar")', 'const nota = 3;\nif (nota >= 5) {\n  console.log("Aprobado");\n} else {\n  console.log("A recuperar");\n}', 'int nota = 3;\nif (nota >= 5) {\n    System.out.println("Aprobado");\n} else {\n    System.out.println("A recuperar");\n}'),
      },
    ],
    mission: P(
      'Debajo del if, pegado al margen izquierdo, escribe else: y en la línea siguiente, con cuatro espacios delante, print("Puerta bloqueada").',
      'Justo después de la llave } que cierra el if, escribe else { en la línea siguiente console.log("Puerta bloqueada"); y cierra con }.',
      'Justo después de la llave } que cierra el if, escribe else { en la línea siguiente System.out.println("Puerta bloqueada"); y cierra con }.',
    ),
  },
  'p4-cuenta': {
    steps: [
      {
        title: 'while: mientras se cumpla, repite',
        text: 'Ya conoces el bucle for, que repite un número de veces. El bucle while repite MIENTRAS una condición sea verdadera. Antes de cada vuelta vuelve a hacer la pregunta: si la respuesta es sí, da otra vuelta; si es no, sale del bucle y el programa sigue por debajo.',
        visual: 'loop',
        code: P('bateria = 3\nwhile bateria > 0:\n    print(bateria)\n    bateria = bateria - 1\n# 3, 2, 1', 'let bateria = 3;\nwhile (bateria > 0) {\n  console.log(bateria);\n  bateria = bateria - 1;\n}\n// 3, 2, 1', 'int bateria = 3;\nwhile (bateria > 0) {\n    System.out.println(bateria);\n    bateria = bateria - 1;\n}\n// 3, 2, 1'),
      },
      {
        title: 'Algo tiene que cambiar en cada vuelta',
        text: 'Si dentro del bucle no cambia nada, la condición se cumplirá siempre y el programa se quedará dando vueltas para siempre: es el famoso «bucle infinito». Aquí no pasa nada si te ocurre (el motor lo corta y te avisa), pero fíjate siempre en qué línea hace que el bucle avance hacia su final.',
      },
      {
        title: 'Dentro y fuera del bucle',
        text: 'Las órdenes de dentro del bucle se repiten en cada vuelta. Las que están después, fuera, se ejecutan una sola vez cuando el bucle termina. Para un mensaje final, como «¡Despegue!», el sitio correcto es fuera.',
        code: P('n = 2\nwhile n > 0:\n    print(n)        # dentro: se repite\n    n = n - 1\nprint("Fin")        # fuera: una sola vez', 'let n = 2;\nwhile (n > 0) {\n  console.log(n);   // dentro: se repite\n  n = n - 1;\n}\nconsole.log("Fin"); // fuera: una sola vez', 'int n = 2;\nwhile (n > 0) {\n    System.out.println(n);   // dentro: se repite\n    n = n - 1;\n}\nSystem.out.println("Fin");   // fuera: una sola vez'),
      },
    ],
    mission: P(
      'Cambia n = 3 por n = 5. Después, al final del todo y pegado al margen izquierdo (fuera del bucle), añade print("¡Despegue!").',
      'Cambia let n = 3; por let n = 5;. Después, debajo de la llave } que cierra el while, añade console.log("¡Despegue!");',
      'Cambia int n = 3; por int n = 5;. Después, debajo de la llave } que cierra el while, añade System.out.println("¡Despegue!");',
    ),
  },
  'p5-mochila': {
    steps: [
      {
        title: 'Una lista: muchas cajas en fila',
        text: 'Si tienes que guardar 3 objetos, puedes usar 3 variables. ¿Y si son 300? Una lista guarda muchos datos en orden bajo un solo nombre. Tu lista de reproducción, tus contactos o los mensajes de un chat son listas.',
        visual: 'array',
        code: P('planetas = ["Marte", "Venus", "Júpiter"]', 'const planetas = ["Marte", "Venus", "Júpiter"];', 'String[] planetas = {"Marte", "Venus", "Júpiter"};'),
      },
      {
        title: 'Las posiciones empiezan en 0',
        text: 'Cada elemento tiene un número de posición (se llama índice) y se empieza a contar en 0. Para sacar un elemento, escribe el nombre de la lista y su posición entre corchetes. En una lista de 3 elementos las posiciones son 0, 1 y 2: la posición 3 no existe.',
        code: P('print(planetas[0])   # Marte\nprint(planetas[1])   # Venus\nprint(planetas[2])   # Júpiter', 'console.log(planetas[0]);   // Marte\nconsole.log(planetas[1]);   // Venus\nconsole.log(planetas[2]);   // Júpiter', 'System.out.println(planetas[0]);   // Marte\nSystem.out.println(planetas[1]);   // Venus\nSystem.out.println(planetas[2]);   // Júpiter'),
      },
      {
        title: '¿Cuántos hay?',
        text: 'La lista sabe cuántos elementos tiene, y se lo puedes preguntar. Es mucho mejor que contarlos tú a mano: si mañana la lista crece, el programa seguirá funcionando.',
        code: P('print(len(planetas))   # 3', 'console.log(planetas.length);   // 3', 'System.out.println(planetas.length);   // 3'),
      },
    ],
    mission: P(
      'Añade dos líneas al final: print(mochila[2]) para el último objeto y print(len(mochila)) para saber cuántos hay.',
      'Añade dos líneas al final: console.log(mochila[2]); para el último objeto y console.log(mochila.length); para saber cuántos hay.',
      'Añade dos líneas antes de la llave que cierra main: System.out.println(mochila[2]); para el último objeto y System.out.println(mochila.length); para saber cuántos hay.',
    ),
  },
  'reto-fizzbuzz': {
    steps: [
      {
        title: 'Una prueba de verdad',
        text: 'FizzBuzz es un juego de contar que se convirtió en una pregunta clásica de las entrevistas de trabajo para programadores. Parece fácil, pero hay que pensar con orden. Si la superas, ya sabes hacer algo que se pide en procesos de selección reales.',
      },
      {
        title: 'Más de dos caminos',
        text: 'Cuando hay varios casos, las preguntas se encadenan. El ordenador las prueba en orden, de arriba abajo, y entra SOLO en la primera que se cumple; las demás ya ni las mira.',
        visual: 'branch',
        code: P('if nivel >= 90:\n    print("Oro")\nelif nivel >= 50:\n    print("Plata")\nelse:\n    print("Bronce")', 'if (nivel >= 90) {\n  console.log("Oro");\n} else if (nivel >= 50) {\n  console.log("Plata");\n} else {\n  console.log("Bronce");\n}', 'if (nivel >= 90) {\n    System.out.println("Oro");\n} else if (nivel >= 50) {\n    System.out.println("Plata");\n} else {\n    System.out.println("Bronce");\n}'),
      },
      {
        title: 'El orden importa',
        text: 'El 15 es múltiplo de 3 y también de 5. Si preguntas primero «¿es múltiplo de 3?», el 15 entra ahí, escribe «Fizz» y nunca llega a ser «FizzBuzz». Por eso el caso más exigente (múltiplo de los dos, o sea, de 15) tiene que preguntarse el primero.',
        visual: 'modulo',
      },
    ],
    mission: P(
      'Pon como PRIMERA pregunta if i % 15 == 0: con print("FizzBuzz"). Convierte la de Fizz en elif i % 3 == 0: y añade otra elif i % 5 == 0: con print("Buzz"). El else con print(i) se queda al final.',
      'Pon como PRIMERA pregunta if (i % 15 === 0) con console.log("FizzBuzz"). Después else if (i % 3 === 0) para Fizz, else if (i % 5 === 0) para Buzz y, al final, el else con console.log(i).',
      'Pon como PRIMERA pregunta if (i % 15 == 0) con System.out.println("FizzBuzz"). Después else if (i % 3 == 0) para Fizz, else if (i % 5 == 0) para Buzz y, al final, el else con System.out.println(i).',
    ),
  },
};
