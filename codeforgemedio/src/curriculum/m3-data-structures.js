// Módulo 3 · Estructuras de datos: la bodega, el inventario y los buffers de la nave.
import { check, entry } from './helpers.js';
import { stripComments } from '../core/transpiler.js';

const CARGO = [42, 7, 93, 15, 68, 23, 81, 4];

const ordenarCarga = {
  id: 'm3-sort-carga',
  module: 3,
  title: 'Ordenar la Bodega',
  codename: 'ARRAY.SORT',
  scene: 'carga',
  xp: 200,
  mode: 'run',
  story: 'La bodega de carga está desequilibrada: los contenedores pesados flotan arriba y la nave cabecea. Escribe ordenarCarga para ordenar los pesos de menor a mayor. Cada intercambio que hagas se ve en directo en la bodega.',
  objective: 'Implementa ordenarCarga(carga) que ordene el array EN SU SITIO, de menor a mayor, con tu propio algoritmo (sin sort() de la librería).',
  concept: {
    title: 'Arrays, índices y ordenación',
    text: 'Un array guarda elementos contiguos accesibles por índice, de 0 a n-1. Bubble sort compara vecinos (j y j+1) e intercambia los desordenados; tras cada pasada el mayor «burbujea» al final. Acceder a carga[n] es salirse del array.',
  },
  starter: {
    python: `def ordenar_carga(carga):
    n = len(carga)
    for i in range(n):
        for j in range(n - i):
            if carga[j] > carga[j + 1]:
                carga[j], carga[j + 1] = carga[j + 1], carga[j]
`,
    java: `public class Main {
    static void ordenarCarga(int[] carga) {
        int n = carga.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - i; j++) {
                if (carga[j] > carga[j + 1]) {
                    int tmp = carga[j];
                    carga[j] = carga[j + 1];
                    carga[j + 1] = tmp;
                }
            }
        }
    }
}
`,
    kotlin: `fun ordenarCarga(carga: IntArray) {
    val n = carga.size
    for (i in 0 until n) {
        for (j in 0 until n - i) {
            if (carga[j] > carga[j + 1]) {
                val tmp = carga[j]
                carga[j] = carga[j + 1]
                carga[j + 1] = tmp
            }
        }
    }
}
`,
    swift: `func ordenarCarga(_ carga: inout [Int]) {
    let n = carga.count
    for i in 0..<n {
        for j in 0..<(n - i) {
            if carga[j] > carga[j + 1] {
                carga.swapAt(j, j + 1)
            }
        }
    }
}
`,
    c: `void ordenarCarga(int carga[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i; j++) {
            if (carga[j] > carga[j + 1]) {
                int tmp = carga[j];
                carga[j] = carga[j + 1];
                carga[j + 1] = tmp;
            }
        }
    }
}
`,
  },
  solution: {
    python: `def ordenar_carga(carga):
    n = len(carga)
    for i in range(n):
        for j in range(n - 1 - i):
            if carga[j] > carga[j + 1]:
                carga[j], carga[j + 1] = carga[j + 1], carga[j]
`,
    java: `public class Main {
    static void ordenarCarga(int[] carga) {
        int n = carga.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - 1 - i; j++) {
                if (carga[j] > carga[j + 1]) {
                    int tmp = carga[j];
                    carga[j] = carga[j + 1];
                    carga[j + 1] = tmp;
                }
            }
        }
    }
}
`,
    kotlin: `fun ordenarCarga(carga: IntArray) {
    val n = carga.size
    for (i in 0 until n) {
        for (j in 0 until n - 1 - i) {
            if (carga[j] > carga[j + 1]) {
                val tmp = carga[j]
                carga[j] = carga[j + 1]
                carga[j + 1] = tmp
            }
        }
    }
}
`,
    swift: `func ordenarCarga(_ carga: inout [Int]) {
    let n = carga.count
    for i in 0..<n {
        for j in 0..<(n - 1 - i) {
            if carga[j] > carga[j + 1] {
                carga.swapAt(j, j + 1)
            }
        }
    }
}
`,
    c: `void ordenarCarga(int carga[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (carga[j] > carga[j + 1]) {
                int tmp = carga[j];
                carga[j] = carga[j + 1];
                carga[j + 1] = tmp;
            }
        }
    }
}
`,
  },
  polyglot: {
    python: 'Las listas son dinámicas y el intercambio es idiomático: a[j], a[j+1] = a[j+1], a[j] (desempaquetado de tuplas). Salirse lanza IndexError.',
    java: 'int[] tiene tamaño fijo (carga.length). Salirse lanza ArrayIndexOutOfBoundsException: la JVM comprueba cada acceso.',
    kotlin: 'IntArray es el int[] de Java sin boxing. carga.size, rangos con until y la misma excepción al salirse.',
    swift: 'Los arrays son value types: para modificar el del llamador hace falta inout y &. swapAt(i, j) intercambia sin variable temporal.',
    c: 'Un array en C no sabe su tamaño: por eso se pasa n aparte. Leer carga[n] NO da error: lee memoria ajena (buffer overread). Origen de bugs como Heartbleed.',
  },
  invoke(ctx) {
    const fn = entry(ctx, 'ordenarCarga');
    const arr = ctx.track([...CARGO], 'carga');
    const ret = fn(arr, CARGO.length);
    const final = Array.isArray(ret) && ret !== arr ? [...ret] : [...arr];
    return { final, returned: Array.isArray(ret) && ret !== arr };
  },
  evaluate({ result, code, lang }) {
    const out = (result && result.value) || { final: [] };
    const sorted = [...CARGO].sort((a, b) => a - b);
    const final = out.final || [];
    const isSorted = final.length === CARGO.length && final.every((x, i) => x === sorted[i]);
    const src = stripComments(code, lang);
    const builtin = /\.sort\(|sorted\(|Arrays\.sort|qsort\(|\.sorted\b|\.sortWith|\.sortBy/.test(src);
    const writes = result && result.state ? result.state.writes : 0;
    const checks = [
      check('sorted', 'La bodega queda ordenada de menor a mayor', isSorted, final.length ? `Resultado: [${final.join(', ')}]` : ''),
      check('inplace', 'Ordena en el sitio (modifica el array recibido)', isSorted && !out.returned && writes > 0),
      check('own', 'Algoritmo propio (sin sort de la librería)', !builtin, builtin ? 'Has usado la ordenación de la librería: aquí la gracia es construirla tú.' : ''),
    ];
    const events = result && result.state ? result.state.events.filter((e) => e.label === 'carga') : [];
    return { checks, scene: { initial: CARGO, events, final } };
  },
  duck: {
    sorted: [
      'Cuando j vale el último índice del bucle interno, ¿a qué posición accede carga[j + 1]?',
      'Si el array tiene 8 elementos, ¿cuál es el índice más alto válido?',
      'Tras la primera pasada, ¿dónde queda el elemento más grande? ¿Hace falta volver a compararlo?',
    ],
    inplace: ['¿Estás modificando el array que te pasan o creando uno nuevo?'],
    own: ['¿Qué hace exactamente la función de ordenación de la librería por dentro? Intenta reproducir esa idea con dos bucles.'],
  },
};

export default [ordenarCarga];
