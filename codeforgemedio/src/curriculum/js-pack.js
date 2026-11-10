// Paquete de lenguaje: JavaScript
// El lenguaje de la web: dinámico, un solo tipo de número (double) más BigInt,
// clases con extends y asincronía con async/await y Promise.all.

const missions = {
  'm1-world-laws': {
    starter: `// Las constantes físicas de tu mundo.
// El sensor devuelve la gravedad como texto... ¿puede el motor calcular con ella?
const gravedad = "9.81";
const masaNave = 1200;
const escudosActivos = true;
// TODO: declara nombrePiloto con tu nombre de piloto
`,
    solution: `const gravedad = 9.81;
const masaNave = 1200;
const escudosActivos = true;
const nombrePiloto = "Nova";
`,
    polyglot: 'JavaScript es dinámico: el tipo lo lleva el valor (typeof gravedad). Y convierte por su cuenta: "9.81" * 2 da 19.62, pero "9.81" + 2 da "9.812". Por eso conviene que los números sean números desde el principio.',
  },
  'm1-reactor': {
    starter: `// En JavaScript todos los números son decimales de 64 bits (double).
// Solo son exactos hasta 2^53 = 9.007.199.254.740.992
const baseThrust = 9007199254740992;
const boost = 1;
const totalThrust = baseThrust + boost; // ⚠ ¿suma de verdad?
console.log("Empuje total:", totalThrust);
`,
    solution: `const baseThrust = 9007199254740992n;
const boost = 1n;
const totalThrust = baseThrust + boost;
console.log("Empuje total:", totalThrust);
`,
    polyglot: 'number no desborda como un int: pierde precisión. A partir de Number.MAX_SAFE_INTEGER (2^53 − 1) ya no puede representar todos los enteros. BigInt (con n al final: 10n) es exacto a cualquier tamaño, pero no se mezcla con number sin convertir.',
  },
  'm2-patrol': {
    starter: `// baliza(x, y) añade una baliza a la ruta del dron.
for (let i = 0; i <= 6; i++) {
  baliza(80 + i * 100, 120);
}
`,
    solution: `for (let i = 0; i < 6; i++) {
  baliza(80 + i * 100, 120);
}
`,
    polyglot: 'El for clásico (inicio; condición; incremento). let crea una variable nueva en cada vuelta, la forma moderna; evita var.',
  },
  'm2-zigzag': {
    starter: `for (let i = 0; i < 8; i++) {
  const x = 40 + i * 80;
  const y = 80; // TODO: alterna arriba (pares) y abajo (impares)
  baliza(x, y);
}
`,
    solution: `for (let i = 0; i < 8; i++) {
  const x = 40 + i * 80;
  let y = 80;
  if (i % 2 === 1) {
    y = 280;
  }
  baliza(x, y);
}
`,
    polyglot: 'const no se puede reasignar; let sí. Compara con === (estricto): == convierte tipos por sorpresa. Con ternario: const y = i % 2 === 0 ? 80 : 280;',
  },
  'm3-sort-carga': {
    starter: `function ordenarCarga(carga) {
  const n = carga.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (carga[j] > carga[j + 1]) {
        carga[j] = carga[j + 1]; // ⚠ ¿qué valor se pierde aquí?
        carga[j + 1] = carga[j];
      }
    }
  }
}
`,
    solution: `function ordenarCarga(carga) {
  const n = carga.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (carga[j] > carga[j + 1]) {
        [carga[j], carga[j + 1]] = [carga[j + 1], carga[j]];
      }
    }
  }
}
`,
    polyglot: 'Leer fuera de un array en JavaScript no da error: devuelve undefined, y el fallo aparece más tarde. El intercambio idiomático es la desestructuración: [a, b] = [b, a]. Ojo con sort(): sin función de comparación ordena como texto ([10, 9].sort() da [10, 9]).',
  },
  'm3-inventory': {
    starter: `function countItems(pickups) {
  const counts = {};
  for (const item of pickups) {
    counts[item] = 1; // ⚠ sobrescribe en lugar de contar
  }
  return counts;
}
`,
    solution: `function countItems(pickups) {
  const counts = {};
  for (const item of pickups) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
}
`,
    polyglot: 'Un objeto {} sirve de diccionario de textos; Map admite claves de cualquier tipo y mantiene el orden. Leer una clave ausente da undefined; el operador ?? pone un valor por defecto.',
  },
  'm4-entities': {
    starter: `class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {}
}

class Player extends Entity {
  update() {
    this.x += 2;
  }
}

// TODO: class Enemy extends Entity que patrulle en vertical (this.y += ...)
// TODO: class Obstacle extends Entity que no se mueva
`,
    solution: `class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {}
}

class Player extends Entity {
  update() {
    this.x += 2;
  }
}

class Enemy extends Entity {
  update() {
    this.y += 3;
  }
}

class Obstacle extends Entity {}
`,
    polyglot: 'Las clases de JavaScript son una forma cómoda de escribir prototipos. extends hereda y redefinir un método lo sobrescribe; super.update() llama a la versión del padre.',
  },
  'm5-systems': {
    starter: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scan(sector) {
  await sleep(1000); // el sensor tarda 1 s
  return sector * 10;
}

async function main() {
  const results = [];
  for (let sector = 0; sector < 3; sector++) {
    results.push(await scan(sector)); // ⚠ una detrás de otra
  }
  console.log("Minerales:", results.reduce((a, b) => a + b, 0));
}

main();
`,
    solution: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scan(sector) {
  await sleep(1000);
  return sector * 10;
}

async function main() {
  const results = await Promise.all([scan(0), scan(1), scan(2)]);
  console.log("Minerales:", results.reduce((a, b) => a + b, 0));
}

main();
`,
    polyglot: 'JavaScript tiene un solo hilo con un bucle de eventos: await cede el turno mientras se espera. Promise.all lanza varias promesas a la vez y espera a todas. Como no hay hilos paralelos, no hay carreras al sumar.',
  },
  'boss-swarm': {
    starter: `function hasDuplicate(ids) {
  const n = ids.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (ids[i] === ids[j]) {
        return true;
      }
    }
  }
  return false;
}
`,
    solution: `function hasDuplicate(ids) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
  }
  return false;
}
`,
    polyglot: 'Set guarda valores sin repetir y responde a has() en tiempo constante. En una línea: new Set(ids).size !== ids.length. Cuidado con includes() dentro de un bucle: recorre el array entero cada vez.',
  },
};

const lessonCode = {
  'Una variable es una caja con nombre': 'const gravedad = 9.81;\nconsole.log(gravedad); // 9.81',
  'Cada caja tiene un tipo': 'const masaNave = 1200;      // number\nconst gravedad = 9.81;       // number (también)\nconst escudosActivos = true;     // boolean\nconst nombrePiloto = "Nova";   // string\ntypeof gravedad              // "number"',
  'Con comillas es texto; sin comillas, número': '"9.81" * 2   // 19.62  (JS convierte solo)\n"9.81" + 2   // "9.812" (¡une textos!)\n9.81 + 2     // 11.81  ✓',
  'Un bucle repite un trozo de código': 'for (let i = 0; i < 3; i++) {\n  console.log(i);\n}\n// 0, 1, 2',
  '¿El último número entra o no?': 'i < 6     // 0..5  → 6 vueltas ✅\ni <= 6    // 0..6  → 7 vueltas',
  'if: el programa toma decisiones': 'if (fuel > 50) {\n  console.log("Vamos");\n} else {\n  console.log("Repostar");\n}',
  'El operador % (resto) distingue pares e impares': 'console.log(6 % 2); // 0 → par\nconsole.log(7 % 2); // 1 → impar',
  'Un array es una fila de cajas numeradas': 'const carga = [42, 7, 93];\ncargo[0]       // 42 (el primero)\ncargo[2]       // 93 (el último)\ncargo.length   // 3\ncargo[3]       // undefined (¡sin error!)',
  'Intercambiar dos cajas': '// desestructuración: intercambio en una línea\n[carga[0], carga[1]] = [carga[1], carga[0]];',
  'Un diccionario relaciona etiquetas con valores': 'const counts = {};\ncounts["ore"] = 3;\ncounts["ore"]    // 3\ncounts["chip"]   // undefined',
  'El patrón «contador»': 'for (const color of colores) {\n  votos[color] = (votos[color] ?? 0) + 1;\n}',
  'Una clase es un molde': 'class Entity {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n  }\n}\nconst nave = new Entity(10, 20);',
  'Herencia: «es un tipo de»': 'class Enemy extends Entity {\n  // ya tiene x, y y update()\n}',
  'Sobrescribir: cada uno a su manera': 'class Enemy extends Entity {\n  update() {\n    this.y += 3;   // su propia versión\n  }\n}',
  'Cómo se lanzan tareas en tu lenguaje': '// Promise.all lanza todas y espera a todas\nconst resultados = await Promise.all([tarea(1), tarea(2), tarea(3)]);',
  'Un conjunto recuerda lo que ya viste': 'const vistos = new Set();\nvistos.add(5);\nvistos.has(5)   // true, al instante',
};

const extraSteps = {
  'm1-reactor': [
    {
      after: -1,
      step: {
        title: 'En JavaScript todos los números son decimales',
        text: 'JavaScript no tiene enteros de 32 o 64 bits: todos los números son decimales de 64 bits (double). Eso evita el «desbordamiento» clásico, pero tiene otro límite: a partir de 2^53 (unos 9.000 billones) ya no puede guardar todos los enteros exactos. Si sumas 1 a 2^53, el resultado no cambia.',
        visual: 'odometer',
        code: { js: 'Number.MAX_SAFE_INTEGER        // 9007199254740991\n2 ** 53 + 1 === 2 ** 53        // true 😱 el +1 se pierde' },
      },
    },
    {
      after: 0,
      step: {
        title: 'BigInt: enteros exactos de cualquier tamaño',
        text: 'Para enteros enormes existe BigInt: escribe una n al final del número. Son exactos sin límite de tamaño. Eso sí, no se pueden mezclar con números normales sin convertir: 1n + 1 es un error.',
        visual: 'widths',
        code: { js: 'const grande = 9007199254740992n;\ngrande + 1n            // 9007199254740993n ✓\n// grande + 1          ❌ TypeError: no se mezclan' },
      },
    },
  ],
};

const missionText = {
  'm1-world-laws': 'La línea const gravedad = "9.81" guarda texto. Quita las comillas para que sea un número. Luego, donde está el TODO, añade const nombrePiloto = "tu nombre"; (aquí sí van comillas).',
  'm1-reactor': 'Con number, el +1 se pierde más allá de 2^53. Convierte los dos valores en BigInt añadiendo una n al final: 9007199254740992n y 1n.',
  'm2-patrol': 'i <= 6 da 7 vueltas y la séptima baliza se sale de la zona. Cámbialo por i < 6.',
  'm2-zigzag': 'Cambia const y = 80; por let y = 80; (let permite cambiarla) y añade: if (i % 2 === 1) { y = 280; }',
  'm3-sort-carga': 'Al copiar carga[j + 1] en carga[j] se pierde el valor original de carga[j]. Intercambia los dos a la vez: [carga[j], carga[j + 1]] = [carga[j + 1], carga[j]];',
  'm3-inventory': 'Cambia counts[item] = 1 por counts[item] = (counts[item] ?? 0) + 1; para sumar a lo que ya había.',
  'm4-entities': 'Siguiendo el patrón de Player, crea class Enemy extends Entity con update() { this.y += 3; } y class Obstacle extends Entity {}.',
  'm5-systems': 'El bucle espera cada scan antes de lanzar el siguiente. Sustitúyelo por: const results = await Promise.all([scan(0), scan(1), scan(2)]);',
  'boss-swarm': 'Crea const seen = new Set(); recorre una sola vez con for (const id of ids) y, si seen.has(id), return true; si no, seen.add(id). Al final, return false.',
};

export default {
  lang: 'js',
  missions,
  lessonCode,
  extraLangs: ['Un diccionario relaciona etiquetas con valores', 'Esperar uno a uno o todos a la vez', 'Cómo se lanzan tareas en tu lenguaje'],
  excludeTitles: ['Los números enteros tienen un límite', 'Cajas más grandes para números más grandes'],
  extraSteps,
  missionText,
  objective: {
    'm1-reactor': 'Calcula totalThrust = baseThrust + boost de forma EXACTA: 9.007.199.254.740.993. Con number el +1 se pierde.',
    'm3-inventory': 'countItems(pickups) debe devolver un objeto {objeto: cantidad} con cuántos hay de cada tipo.',
  },
  story: {
    'm1-reactor': 'El reactor cuántico mide el empuje en unidades diminutas: 2^53 por núcleo. El ordenador de a bordo suma un pequeño impulso extra… y no cambia nada. En JavaScript los números son decimales: por encima de 2^53 dejan de ser exactos y las sumas pequeñas desaparecen.',
  },
};
