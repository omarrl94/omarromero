// Módulo 2 · Control de flujo: bucles y condicionales que mueven a los drones.
import { check } from './helpers.js';
import { usesLoop, usesConditional } from '../core/analyzer.js';

const ZONE = { w: 640, h: 360 };

/** API de la escena: cada waypoint(x, y) añade un punto a la ruta del dron. */
const droneApi = (S) => {
  S.route = [];
  return {
    waypoint: (x, y) => {
      if (S.route.length > 200) return;
      S.route.push({ x: Number(x), y: Number(y), line: S.l });
    },
    scan: () => { if (S.route.length) S.route[S.route.length - 1].scan = true; },
  };
};

const patrol = {
  id: 'm2-patrol',
  module: 2,
  title: 'Ruta de Patrulla',
  codename: 'LOOP.PATROL',
  scene: 'drones',
  xp: 140,
  mode: 'run',
  api: droneApi,
  story: 'El dron centinela DX-7 debe recorrer 6 balizas en línea recta, separadas 100 px, empezando en x = 80. El programador anterior dejó un bucle que coloca una baliza de más… fuera de la zona segura.',
  objective: 'Usa un bucle para llamar 6 veces a waypoint(x, y) con x = 80, 180, …, 580 e y = 120.',
  concept: {
    title: 'Bucles y rangos',
    text: 'Un bucle repite un bloque mientras se cumpla una condición. El error más famoso de la informática es el «off-by-one»: contar una vez de más o de menos. Fíjate en si tu rango incluye o excluye el último valor.',
  },
  starter: {
    python: `# waypoint(x, y) añade una baliza a la ruta del dron.
# Necesitamos 6 balizas: x = 80, 180, 280... e y = 120
for i in range(7):
    waypoint(80 + i * 100, 120)
`,
    java: `public class Main {
    public static void main(String[] args) {
        // waypoint(x, y) añade una baliza a la ruta del dron.
        for (int i = 0; i <= 6; i++) {
            waypoint(80 + i * 100, 120);
        }
    }
}
`,
    kotlin: `fun main() {
    // waypoint(x, y) añade una baliza a la ruta del dron.
    for (i in 0..6) {
        waypoint(80 + i * 100, 120)
    }
}
`,
    swift: `// waypoint(x, y) añade una baliza a la ruta del dron.
for i in 0...6 {
    waypoint(80 + i * 100, 120)
}
`,
    c: `#include "drone.h"

int main(void) {
    // waypoint(x, y) añade una baliza a la ruta del dron.
    for (int i = 0; i <= 6; i++) {
        waypoint(80 + i * 100, 120);
    }
    return 0;
}
`,
  },
  solution: {
    python: `for i in range(6):
    waypoint(80 + i * 100, 120)
`,
    java: `public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 6; i++) {
            waypoint(80 + i * 100, 120);
        }
    }
}
`,
    kotlin: `fun main() {
    for (i in 0 until 6) {
        waypoint(80 + i * 100, 120)
    }
}
`,
    swift: `for i in 0..<6 {
    waypoint(80 + i * 100, 120)
}
`,
    c: `#include "drone.h"

int main(void) {
    for (int i = 0; i < 6; i++) {
        waypoint(80 + i * 100, 120);
    }
    return 0;
}
`,
  },
  polyglot: {
    python: 'range(n) va de 0 a n-1: el final se excluye. range(7) produce 7 valores.',
    java: 'El for clásico de C: inicio; condición; incremento. i <= 6 son 7 vueltas; i < 6 son 6.',
    kotlin: '0..6 es un rango CERRADO (incluye el 6). Para excluir el final usa 0 until 6 (o 0..<6 en Kotlin 1.9+).',
    swift: '0...6 es cerrado (7 valores); 0..<6 es semiabierto (6 valores). Swift te obliga a elegir a la vista.',
    c: 'Mismo for que Java; en C el off-by-one además suele escribir fuera del array sin avisar.',
  },
  evaluate({ result, code, lang }) {
    const route = (result && result.state && result.state.route) || [];
    const expected = Array.from({ length: 6 }, (_, i) => ({ x: 80 + i * 100, y: 120 }));
    const exact = route.length === 6 && route.every((p, i) => p.x === expected[i].x && p.y === expected[i].y);
    const outside = route.filter((p) => p.x < 0 || p.x > ZONE.w || p.y < 0 || p.y > ZONE.h);
    const checks = [
      check('loop', 'Usa un bucle (nada de copiar y pegar)', usesLoop(code, lang)),
      check('count', 'Exactamente 6 balizas', route.length === 6, `Balizas colocadas: ${route.length}`),
      check('inside', 'Todas dentro de la zona segura', route.length > 0 && outside.length === 0, outside.length ? `${outside.length} baliza(s) fuera: x = ${outside.map((p) => p.x).join(', ')}` : ''),
      check('positions', 'Posiciones x = 80…580, y = 120', exact),
    ];
    return { checks, scene: { route, expected, zone: ZONE } };
  },
  duck: {
    count: [
      'Cuenta en voz alta: ¿cuántas veces se ejecuta tu bucle? Empieza por el primer valor de i.',
      '¿Tu rango incluye el último número o lo excluye?',
      'Si i empieza en 0, ¿qué valor tiene i en la sexta vuelta?',
    ],
    inside: ['¿Qué x tiene la última baliza? ¿Cabe en una zona de 640 px de ancho?'],
    positions: ['¿Qué fórmula da 80 cuando i = 0 y 180 cuando i = 1?'],
    loop: ['¿Qué estructura repite un bloque de código sin que tengas que escribirlo varias veces?'],
  },
};

const zigzag = {
  id: 'm2-zigzag',
  module: 2,
  title: 'Maniobra Zigzag',
  codename: 'BRANCH.EVADE',
  scene: 'drones',
  xp: 170,
  mode: 'run',
  api: droneApi,
  story: 'Una torreta enemiga apunta a cualquier dron que vuele en línea recta. DX-7 necesita una ruta evasiva: 8 puntos que alternen arriba (y = 80) y abajo (y = 280).',
  objective: 'Genera 8 waypoints con x = 40, 120, …, 600. En los índices pares y = 80; en los impares y = 280. Usa un condicional y el operador módulo (%).',
  concept: {
    title: 'Condicionales y el operador módulo',
    text: 'if / else elige un camino según una condición. El módulo (%) devuelve el resto de una división: i % 2 vale 0 en los pares y 1 en los impares. Es la forma clásica de alternar comportamientos.',
  },
  starter: {
    python: `for i in range(8):
    x = 40 + i * 80
    y = 80   # TODO: alterna arriba (pares) y abajo (impares)
    waypoint(x, y)
`,
    java: `public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 8; i++) {
            int x = 40 + i * 80;
            int y = 80; // TODO: alterna arriba (pares) y abajo (impares)
            waypoint(x, y);
        }
    }
}
`,
    kotlin: `fun main() {
    for (i in 0 until 8) {
        val x = 40 + i * 80
        val y = 80 // TODO: alterna arriba (pares) y abajo (impares)
        waypoint(x, y)
    }
}
`,
    swift: `for i in 0..<8 {
    let x = 40 + i * 80
    let y = 80 // TODO: alterna arriba (pares) y abajo (impares)
    waypoint(x, y)
}
`,
    c: `#include "drone.h"

int main(void) {
    for (int i = 0; i < 8; i++) {
        int x = 40 + i * 80;
        int y = 80; // TODO: alterna arriba (pares) y abajo (impares)
        waypoint(x, y);
    }
    return 0;
}
`,
  },
  solution: {
    python: `for i in range(8):
    x = 40 + i * 80
    if i % 2 == 0:
        y = 80
    else:
        y = 280
    waypoint(x, y)
`,
    java: `public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 8; i++) {
            int x = 40 + i * 80;
            int y;
            if (i % 2 == 0) {
                y = 80;
            } else {
                y = 280;
            }
            waypoint(x, y);
        }
    }
}
`,
    kotlin: `fun main() {
    for (i in 0 until 8) {
        val x = 40 + i * 80
        var y = 80
        if (i % 2 != 0) {
            y = 280
        }
        waypoint(x, y)
    }
}
`,
    swift: `for i in 0..<8 {
    let x = 40 + i * 80
    var y = 80
    if i % 2 == 1 {
        y = 280
    }
    waypoint(x, y)
}
`,
    c: `#include "drone.h"

int main(void) {
    for (int i = 0; i < 8; i++) {
        int x = 40 + i * 80;
        int y = (i % 2 == 0) ? 80 : 280;
        waypoint(x, y);
    }
    return 0;
}
`,
  },
  polyglot: {
    python: 'No hay llaves: el bloque del if lo marca la sangría. Python también tiene expresión condicional: y = 80 if i % 2 == 0 else 280.',
    java: 'if necesita paréntesis y llaves. Existe el ternario: int y = (i % 2 == 0) ? 80 : 280;',
    kotlin: 'En Kotlin if es una EXPRESIÓN que devuelve valor: val y = if (i % 2 == 0) 80 else 280. Por eso no existe el ternario.',
    swift: 'La condición va sin paréntesis pero las llaves son obligatorias. También tiene ternario.',
    c: 'En C cualquier entero distinto de 0 es «verdadero»: if (i % 2) ya significa «si es impar».',
  },
  evaluate({ result, code, lang }) {
    const route = (result && result.state && result.state.route) || [];
    const expected = Array.from({ length: 8 }, (_, i) => ({ x: 40 + i * 80, y: i % 2 === 0 ? 80 : 280 }));
    const alternates = route.length === 8 && route.every((p, i) => p.y === expected[i].y);
    const checks = [
      check('count', 'Exactamente 8 puntos de ruta', route.length === 8, `Puntos: ${route.length}`),
      check('x', 'x = 40, 120, …, 600', route.length === 8 && route.every((p, i) => p.x === expected[i].x)),
      check('alternate', 'Alterna y = 80 (pares) / 280 (impares)', alternates, route.length ? `y = ${route.map((p) => p.y).join(', ')}` : ''),
      check('branch', 'Usa un condicional y el operador %', usesConditional(code, lang) && /%/.test(code)),
    ];
    return { checks, scene: { route, expected, zone: ZONE, turret: true } };
  },
  duck: {
    alternate: [
      '¿Qué tienen en común 0, 2, 4 y 6 que no tengan 1, 3, 5 y 7?',
      '¿Qué devuelve i % 2 cuando i es par? ¿Y cuando es impar?',
      '¿Dónde tienes que decidir el valor de y: antes o después de llamar a waypoint?',
    ],
    branch: ['¿Qué estructura de tu lenguaje ejecuta un bloque solo si se cumple una condición?'],
    count: ['¿Cuántas vueltas da tu bucle?'],
    x: ['¿Qué x obtienes cuando i vale 7? ¿Debería ser 600?'],
  },
};

export default [patrol, zigzag];
