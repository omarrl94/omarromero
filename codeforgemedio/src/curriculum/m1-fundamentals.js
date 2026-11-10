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
  objective: 'Declara gravedad (decimal ≈ 9.81), masaNave (entero 1200), escudosActivos (booleano activo) y nombrePiloto (tu nombre de piloto).',
  concept: {
    title: 'Variables y tipos de datos',
    text: 'Una variable es una caja con nombre; su tipo decide qué cabe dentro y cuánta memoria ocupa. Un entero no guarda decimales y un texto no se puede multiplicar por un tiempo: elegir bien el tipo es elegir bien las leyes de tu mundo.',
  },
  starter: {
    python: `# Módulo 1 · Las leyes del mundo
# El sensor devuelve la gravedad como texto...
# ¿puede el motor físico multiplicar texto por tiempo?
gravedad = "9.81"
masa_nave = 1200
escudos_activos = True
# TODO: declara nombre_piloto con tu nombre de piloto
`,
    java: `public class Main {
    public static void main(String[] args) {
        // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
        int gravedad = 9.81;
        int masaNave = 1200;
        boolean escudosActivos = true;
        // TODO: declara nombrePiloto (texto) con tu nombre de piloto
    }
}
`,
    kotlin: `fun main() {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    val gravedad: Int = 9.81
    val masaNave: Int = 1200
    val escudosActivos: Boolean = true
    // TODO: declara nombrePiloto (String) con tu nombre de piloto
}
`,
    swift: `// Las constantes físicas de tu mundo. ¡Ojo con los tipos!
let gravedad: Int = 9.81
let masaNave: Int = 1200
let escudosActivos: Bool = true
// TODO: declara nombrePiloto (String) con tu nombre de piloto
`,
    c: `#include <stdio.h>
#include <stdbool.h>

int main(void) {
    // Las constantes físicas de tu mundo. ¡Ojo con los tipos!
    int gravedad = 9.81;
    int masaNave = 1200;
    bool escudosActivos = true;
    // TODO: declara nombrePiloto (un array de char: en C no existe string)
    printf("g = %d\\n", gravedad);
    return 0;
}
`,
  },
  solution: {
    python: `gravedad = 9.81
masa_nave = 1200
escudos_activos = True
nombre_piloto = "Nova"
`,
    java: `public class Main {
    public static void main(String[] args) {
        double gravedad = 9.81;
        int masaNave = 1200;
        boolean escudosActivos = true;
        String nombrePiloto = "Nova";
    }
}
`,
    kotlin: `fun main() {
    val gravedad: Double = 9.81
    val masaNave: Int = 1200
    val escudosActivos: Boolean = true
    val nombrePiloto: String = "Nova"
}
`,
    swift: `let gravedad: Double = 9.81
let masaNave: Int = 1200
let escudosActivos: Bool = true
let nombrePiloto: String = "Nova"
`,
    c: `#include <stdio.h>
#include <stdbool.h>

int main(void) {
    double gravedad = 9.81;
    int masaNave = 1200;
    bool escudosActivos = true;
    char nombrePiloto[] = "Nova";
    printf("g = %.2f\\n", gravedad);
    return 0;
}
`,
  },
  polyglot: {
    python: 'Tipado dinámico: el tipo lo lleva el valor, no la variable. "9.81" es str y 9.81 es float; Python solo protesta cuando operas con ellos.',
    java: 'Tipado estático estricto: asignar 9.81 a un int es un error de compilación (posible pérdida de precisión). double es el decimal por defecto.',
    kotlin: 'Inferencia de tipos con seguridad: val g = 9.81 ya es Double. Declarar Int y asignar un decimal no compila.',
    swift: 'Como Kotlin: inferencia + seguridad. Double es el decimal estándar; Swift nunca convierte números implícitamente.',
    c: 'C convierte en silencio: int g = 9.81 compila y guarda 9 (truncado). El compilador confía en ti… y la nave se estrella. Y el texto no es un tipo: es un array de char terminado en \'\\0\'.',
  },
  evaluate({ result, lang }) {
    const g = v(result, 'gravedad', lang);
    const mass = v(result, 'masaNave', lang);
    const sh = v(result, 'escudosActivos', lang);
    const pilot = v(result, 'nombrePiloto', lang);
    const gVal = g ? Number(g.value) : NaN;
    const gIsDecimal = g && g.kind === 'float';
    const massOk = mass && (mass.kind === 'int' || (lang === 'js' && mass.kind === 'float' && Number.isInteger(mass.value))) && Number(mass.value) === 1200;
    const checks = [
      check('gravedad-type', 'gravedad es de tipo decimal', gIsDecimal,
        !g ? 'No encuentro la variable gravedad.' : g.kind === 'str' ? `gravedad es texto (${g.type}): el motor no puede multiplicar texto por tiempo.`
          : g.flags.includes('truncated') ? `Se truncó 9.81 a ${g.value}: un int no guarda decimales.` : `gravedad es ${g.type}: necesitas un tipo con decimales.`),
      check('gravedad-value', 'gravedad ≈ 9.81 m/s²', gIsDecimal && gVal > 9.7 && gVal < 9.9, gIsDecimal ? `Valor actual: ${gVal}` : ''),
      check('mass', 'masaNave es un entero de 1200 kg', massOk, mass ? `${mass.type} = ${mass.value}` : 'Falta masaNave.'),
      check('shields', 'escudosActivos es booleano y está activo', sh && sh.kind === 'bool' && sh.value === true, sh ? `${sh.type} = ${sh.value}` : 'Falta escudosActivos.'),
      check('pilot', 'nombrePiloto es un texto con tu nombre', pilot && pilot.kind === 'str' && String(pilot.value).trim().length > 0, pilot ? '' : 'Declara nombrePiloto.'),
    ];
    return {
      checks,
      scene: {
        gravedad: gIsDecimal ? gVal : g && typeof g.value === 'number' ? g.value : null,
        gravedadBroken: !gIsDecimal,
        mass: mass ? Number(mass.value) : 0,
        shields: sh ? !!sh.value : false,
        pilot: pilot ? String(pilot.value) : '???',
      },
    };
  },
  duck: {
    'gravedad-type': [
      '¿Qué diferencia hay entre el número 9.81 y el texto "9.81" para un ordenador?',
      'Si un tipo entero solo guarda números sin decimales, ¿qué crees que le pasa al .81?',
      '¿Qué tipo de tu lenguaje está pensado para números con decimales?',
    ],
    'gravedad-value': ['¿Cuánto vale la gravedad en la Tierra, aproximadamente?'],
    mass: ['¿La masa de la nave necesita decimales en esta misión? ¿Qué tipo usarías para contar kilos enteros?'],
    shields: ['¿Cuántos valores posibles tiene un interruptor? ¿Qué tipo representa exactamente eso?'],
    pilot: ['¿Cómo se escribe un texto literal en tu lenguaje? ¿Entre qué símbolos va?', 'Mira cómo están declaradas las otras variables: ¿qué patrón siguen?'],
  },
};

export default [worldLaws];
